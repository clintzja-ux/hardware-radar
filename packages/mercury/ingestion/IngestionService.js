import { createHash } from "node:crypto";
import atlasDefault from "../../atlas/Atlas.js";
import adapterRegistryDefault from "../adapters/index.js";
import { validateObservation } from "../ObservationValidator.js";
import { validateIngestionRequest } from "./IngestionRequestValidator.js";
import { INGESTION_STATUSES, ingestionResult } from "./IngestionResult.js";
import InMemoryObservationAcceptanceStore from "./InMemoryObservationAcceptanceStore.js";
import { evaluateAcquisitionRight } from "../rights/SourceRightsEvaluator.js";
import defaultSourceRightsRegistry from "../rights/SourceRightsRegistry.js";

function norm(v) { return String(v).trim(); }
function amazonBlocked(request) {
  if (request.retailerId !== "RETAILER-0001") return null;
  const method = request.sourceMethod.toUpperCase();
  if (["MANUAL", "IMPORT", "AUTOMATED_CHECK", "FEED"].includes(method)) return "Amazon production ingestion requires an approved Amazon acquisition mechanism.";
  if (method === "API" && request.licenseContext !== "AMAZON_CREATORS_API") return "Amazon API ingestion requires the AMAZON_CREATORS_API license context.";
  return null;
}
function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonicalJson(value[k])}`).join(",")}}`;
  return JSON.stringify(value);
}
function idempotencyKey(request) {
  const payload = canonicalJson(request.sourcePayload);
  return createHash("sha256").update([request.retailerId, request.marketplace, request.sourceMethod, request.retrievedAt, request.requestId ?? "", payload].join("|")).digest("hex");
}
export class IngestionService {
  constructor({ atlas = atlasDefault, adapterRegistry = adapterRegistryDefault, acceptanceStore = new InMemoryObservationAcceptanceStore(), rightsRegistry = defaultSourceRightsRegistry, now = () => new Date().toISOString() } = {}) {
    this.atlas = atlas; this.adapterRegistry = adapterRegistry; this.acceptanceStore = acceptanceStore; this.rightsRegistry = rightsRegistry; this.now = now;
  }
  async ingest(request) {
    const report = validateIngestionRequest(request);
    if (!report.valid) return ingestionResult(INGESTION_STATUSES.INVALID_INPUT, { errors: report.errors });
    const normalized = { ...request, sourceMethod: request.sourceMethod.trim().toUpperCase() };
    const block = amazonBlocked(normalized);
    if (block) return ingestionResult(INGESTION_STATUSES.BLOCKED_SOURCE_METHOD, { reason: block });
    const acquisitionRight = evaluateAcquisitionRight(normalized, { registry: this.rightsRegistry });
    if (!acquisitionRight.allowed) return ingestionResult(INGESTION_STATUSES.BLOCKED_SOURCE_METHOD, { reason: acquisitionRight.reason, rightsState: acquisitionRight.state });
    const product = await this.atlas.getProduct(normalized.atlasProductId).catch(() => null);
    const retailer = await this.atlas.getRetailer(normalized.retailerId).catch(() => null);
    if (!product || !retailer) return ingestionResult(INGESTION_STATUSES.IDENTITY_FAILURE, { reason: !product ? "ATLAS_PRODUCT_UNRESOLVED" : "ATLAS_RETAILER_UNRESOLVED" });
    const adapters = this.adapterRegistry.getByRetailerId(normalized.retailerId).filter(a => a.supportsMarketplace(normalized.marketplace) && a.supportsSourceMethod(normalized.sourceMethod));
    if (adapters.length !== 1) return ingestionResult(INGESTION_STATUSES.ADAPTER_FAILURE, { reason: adapters.length ? "AMBIGUOUS_ADAPTER" : "ADAPTER_NOT_FOUND" });
    const key = idempotencyKey(normalized);
    const duplicate = await this.acceptanceStore.findByIdempotencyKey(key);
    if (duplicate) return ingestionResult(INGESTION_STATUSES.DUPLICATE, { observationId: duplicate.observationId, idempotencyKey: key });
    const observationId = await this.acceptanceStore.allocateObservationId();
    let candidate;
    try {
      candidate = adapters[0].normalize(normalized.sourcePayload, {
        observationId, atlasProductId: normalized.atlasProductId, marketplace: normalized.marketplace,
        observationTime: normalized.retrievedAt, sourceMethod: normalized.sourceMethod, retrievedBy: normalized.retrievedBy,
        requestId: normalized.requestId ?? null, rawPayloadReference: normalized.rawPayloadReference ?? null,
        retrievalSource: normalized.retrievalSource, sourceUri: normalized.sourceUri,
        licenseContext: normalized.licenseContext ?? "UNSPECIFIED", createdAt: this.now(), createdBy: "mercury:ingestion-service",
        lifecycleStatus: "RETRIEVED", validationStatus: "PASS"
      });
    } catch (error) { return ingestionResult(INGESTION_STATUSES.ADAPTER_FAILURE, { reason: error.message }); }
    const validation = validateObservation(candidate);
    if (!validation.valid) return ingestionResult(INGESTION_STATUSES.VALIDATION_FAILURE, { errors: validation.errors });
    const accepted = Object.freeze(structuredClone(candidate));
    let acceptance;
    try {
      acceptance = await this.acceptanceStore.accept(accepted, key);
    } catch (error) {
      return ingestionResult(INGESTION_STATUSES.ACCEPTANCE_FAILURE, { reason: error.message });
    }
    if (acceptance?.status === "DUPLICATE") {
      return ingestionResult(INGESTION_STATUSES.DUPLICATE, { observationId: acceptance.observationId, idempotencyKey: key });
    }
    return ingestionResult(INGESTION_STATUSES.ACCEPTED, { observationId, idempotencyKey: key, observation: accepted, storage: acceptance?.storage ?? null });
  }
}
export default IngestionService;
