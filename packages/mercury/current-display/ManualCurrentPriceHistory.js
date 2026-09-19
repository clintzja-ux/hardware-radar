import { RIGHTS_STATES } from "../rights/SourceRightsPolicy.js";
import { createHistoricalObservation, createHistoricalObservationId } from "../historical-admission/HistoricalObservation.js";
import { manualCurrentPriceDigest } from "./ManualCurrentPricePreparation.js";

export const MANUAL_CURRENT_PRICE_HISTORY_POLICY_VERSION = "PRACTICAL-CURRENT-ITEM-PRICE-COMPARISON-MANUAL-HISTORY-P1-1.0";
const freeze = value => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; };
const nonBlank = value => typeof value === "string" && value.trim().length > 0;

export function assessManualCurrentPriceHistoricalEligibility({ preparation, product, retailer, destination, rightsProfile } = {}) {
  const reasons = [];
  const binding = preparation?.binding;
  if (!binding || preparation.bindingDigest !== manualCurrentPriceDigest(binding)) reasons.push("MANUAL_PREPARATION_BINDING_INVALID");
  if (product?.identity?.atlasProductId !== binding?.atlasProductId) reasons.push("ATLAS_PRODUCT_BINDING_INVALID");
  if (retailer?.id !== binding?.retailerId || retailer?.status !== "active") reasons.push("RETAILER_BINDING_INVALID");
  if (destination?.destinationId !== binding?.destinationId || destination?.atlasProductId !== binding?.atlasProductId || destination?.retailerId !== binding?.retailerId || destination?.materialFingerprint !== binding?.destinationBindingDigest || destination?.binding?.scope !== "EXACT_STANDALONE_PRODUCT" || destination?.status !== "ACTIVE") reasons.push("DESTINATION_BINDING_INVALID");
  if (rightsProfile?.sourceId !== binding?.sourceId || manualCurrentPriceDigest(rightsProfile) !== binding?.sourceRightsProfileDigest || rightsProfile?.acquisition?.manual !== RIGHTS_STATES.ALLOWED || rightsProfile?.retention?.historical !== RIGHTS_STATES.ALLOWED || rightsProfile?.derivation?.historicalAnalytics !== RIGHTS_STATES.ALLOWED) reasons.push("SOURCE_RIGHTS_HISTORICAL_RETENTION_NOT_ALLOWED");
  if (!nonBlank(binding?.observedBy) || !nonBlank(binding?.evidenceReference)) reasons.push("OPERATOR_PROVENANCE_REQUIRED");
  if (!Number.isFinite(binding?.itemPriceUsd) || binding.itemPriceUsd <= 0 || binding?.currency !== "USD") reasons.push("ITEM_PRICE_INVALID");
  return freeze({ eligible: reasons.length === 0, reasons: [...new Set(reasons)], policyVersion: MANUAL_CURRENT_PRICE_HISTORY_POLICY_VERSION });
}

export function createManualCurrentPriceHistoricalObservation({ preparation, product, retailer, destination, rightsProfile, admittedAt, admittedBy } = {}) {
  const assessment = assessManualCurrentPriceHistoricalEligibility({ preparation, product, retailer, destination, rightsProfile });
  if (!assessment.eligible) throw new Error(`MANUAL_CURRENT_PRICE_HISTORY_BLOCKED:${assessment.reasons.join(",")}`);
  const binding = preparation.binding;
  return createHistoricalObservation({
    factLevel: true,
    observationId: createHistoricalObservationId(preparation.preparationId),
    atlasProductId: binding.atlasProductId,
    retailerId: binding.retailerId,
    marketplace: binding.marketplace,
    observationTime: binding.observedAt,
    admittedAt,
    market: { basePrice: binding.itemPriceUsd, totalPrice: null, shipping: null, tax: null, currency: binding.currency, condition: null, availability: binding.availability, sourceUrl: destination.destinationUrl, sellerName: null },
    provenance: {
      retainedEvidenceId: preparation.preparationId,
      provider: "OPERATOR_MANUAL",
      source: binding.sourceId,
      rawPayloadReference: binding.evidenceReference,
      acquisition: { type: "MANUAL_PUBLISHER_OBSERVATION", preparationId: preparation.preparationId, preparationDigest: preparation.bindingDigest, sourceId: binding.sourceId, sourceRightsProfileDigest: binding.sourceRightsProfileDigest, destinationId: binding.destinationId, destinationBindingDigest: binding.destinationBindingDigest, evidenceReference: binding.evidenceReference, observedBy: binding.observedBy }
    },
    observedMerchant: { sellerName: null, suppliedDomain: binding.marketplace, resolutionState: "CANONICAL_RETAILER_DESTINATION", canonicalRetailerId: retailer.id },
    comparability: { classification: "STANDALONE_COMPARABLE", standaloneEligible: true, reasons: [], policyVersion: MANUAL_CURRENT_PRICE_HISTORY_POLICY_VERSION },
    admittedBy,
    idempotencyKey: `manual-current-price-history:${preparation.preparationId}`
  });
}

export class ManualCurrentPriceHistoryService {
  constructor({ historicalRepository, rightsRegistry, now = () => new Date().toISOString() } = {}) {
    if (!historicalRepository?.accept || !historicalRepository?.findByIdempotencyKey || !rightsRegistry?.require) throw new TypeError("MANUAL_CURRENT_PRICE_HISTORY_DEPENDENCY_REQUIRED");
    Object.assign(this, { historicalRepository, rightsRegistry, now });
  }
  assess(input = {}) {
    return assessManualCurrentPriceHistoricalEligibility({ ...input, rightsProfile: this.rightsRegistry.require(input.preparation?.binding?.sourceId) });
  }
  async admit(input = {}) {
    const key = `manual-current-price-history:${input.preparation?.preparationId}`;
    const existing = await this.historicalRepository.findByIdempotencyKey(key);
    if (existing) return freeze({ status: "DUPLICATE", observationId: existing.observationId });
    const record = createManualCurrentPriceHistoricalObservation({ ...input, rightsProfile: this.rightsRegistry.require(input.preparation?.binding?.sourceId), admittedAt: input.admittedAt ?? this.now() });
    return this.historicalRepository.accept(record, key);
  }
}
