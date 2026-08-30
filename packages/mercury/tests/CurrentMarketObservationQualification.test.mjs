import assert from "node:assert/strict";
import { Mercury } from "../Mercury.js";
import adapterRegistry, { dataForSeoGoogleShoppingAdapter } from "../adapters/index.js";
import { normalizeDataForSeoSellerEvidence } from "../adapters/dataforseo/DataForSeoSellerNormalizer.js";
import { CurrentMarketObservationQualificationService, CURRENT_MARKET_QUALIFICATION_STATUSES } from "../current-market/CurrentMarketObservationQualificationService.js";
import { createProductionFreshnessPolicy, ProductionFreshnessPolicyRepository } from "../current-market/ProductionFreshnessPolicy.js";
import { SourceRightsRegistry, defaultSourceRightsRegistry } from "../rights/SourceRightsRegistry.js";
import { makeObservation } from "./helpers/reviewFixture.mjs";
import { PublicationWorkflowService } from "../publication/PublicationWorkflowService.js";

const observationId = "mer_obs_000000001", observedAt = "2026-08-30T12:00:00Z", evaluatedAt = "2026-08-30T12:20:00Z";
function observation(overrides = {}) {
    const value = makeObservation(observationId, { sourceMethod: "API", licenseContext: "DATAFORSEO_GOOGLE_SHOPPING", observedAt });
    Object.assign(value, { retailerId: "RETAILER-0002", marketplace: "platinummicro.com" }, overrides);
    value.provenance.source = { name: "DataForSEO Google Shopping", uri: value.offer.sourceUrl, marketplace: value.marketplace };
    value.provenance.acquisition = { method: value.sourceMethod, retrievedAt: value.observationTime, retrievedBy: "dataforseo", requestId: "task-fixture", rawPayloadReference: "fixture:item:0" };
    value.provenance.transformation = { adapterId: "mer_adapter_dataforseo_google_shopping", adapterVersion: "1.0.0", normalizedAt: value.observationTime };
    value.offer.shipping = { costKnown: false, cost: null, currency: null, notes: null };
    value.offer.affiliate = { isAffiliateLink: false, network: null, trackingCodePresent: false };
    value.compliance = { licenseContext: "DATAFORSEO_GOOGLE_SHOPPING", requiredDisclosureShown: false, requiredPriceDisclaimerShown: false, retailerContentDisclaimerShown: false };
    value.metadata = { createdAt: value.observationTime, createdBy: "test:e2s", observationHash: null, notes: "fixture" };
    return value;
}
const reviewed = { schemaVersion: "1.0", reviewDecisionId: "mer_rev_fixture", sequence: 1, observationId, decision: "REVIEWED", reviewedBy: "operator:test", reviewedAt: evaluatedAt, recordedAt: evaluatedAt, reasonCodes: [], notes: "fixture", canonicalObservationModified: false };
const product = { identity: { atlasProductId: "ram_corsair_cmk32gx5m2b6000z30" } }, retailer = { id: "RETAILER-0002", name: "Platinummicro" };
const policy = (overrides = {}) => createProductionFreshnessPolicy({ policyId: "fixture-current-market", version: "1.0.0", sourceId: "DATAFORSEO_GOOGLE_SHOPPING", retailerId: "RETAILER-0002", atlasProductIds: [product.identity.atlasProductId], currentUntilMs: 30 * 60_000, staleAfterMs: 120 * 60_000, ...overrides });

function service({ current = observation(), review = reviewed, policies = [policy()], registry = adapterRegistry, rightsRegistry = defaultSourceRightsRegistry, productValue = product, retailerValue = retailer } = {}) {
    const acceptanceRepository = { getByIdReadOnly: async id => id === observationId ? structuredClone(current) : null, getById: async id => id === observationId ? structuredClone(current) : null, getAuditById: async id => id === observationId ? { observationId, atlasProductId: current.atlasProductId, retailerId: current.retailerId, storage: { storageClass: "DURABLE", payloadStatus: "ACTIVE", payloadExpiresAt: null } } : null };
    return new CurrentMarketObservationQualificationService({ acceptanceRepository, reviewRepository: { getEffectiveDecision: async () => structuredClone(review) }, productRepository: { getById: async () => structuredClone(productValue) }, retailerRepository: { getById: async () => structuredClone(retailerValue) }, mercury: new Mercury(), adapterRegistry: registry, freshnessPolicyRepository: new ProductionFreshnessPolicyRepository({ policies }), rightsRegistry });
}

let cases = 0;
const check = (condition, message) => { cases += 1; assert.ok(condition, message); };
const equal = (actual, expected, message) => { cases += 1; assert.equal(actual, expected, message); };
const has = (result, reason) => { cases += 1; assert.ok(result.reasons.includes(reason), `${reason} missing from ${result.reasons}`); };

const qualified = await service().assess({ observationId, evaluatedAt });
equal(qualified.status, CURRENT_MARKET_QUALIFICATION_STATUSES.QUALIFIED);
equal(qualified.freshness.status, "CURRENT"); equal(qualified.confidence.status, "HIGH");
equal(qualified.adapterCompatibility.status, "REGISTERED"); equal(qualified.adapterCompatibility.metadata.retailerId, "RETAILER-0002");
check(qualified.bindingDigest?.length === 64); check(qualified.assessmentId.startsWith("mer_cmqual_"));
for (const key of ["publicationEligible","publicationAuthority","published","currentPriceAuthority","livePriceAuthority","publicPriceAuthority","cheapestAuthority","pickAuthority","rankingAuthority","recommendationAuthority","mutationAuthorized","paidTaskCreated"]) equal(qualified[key], false, key);
equal(qualified.networkOperation, "NONE"); equal(qualified.actualSpendUsd, 0);

const replay = await service().assess({ observationId, evaluatedAt });
assert.deepEqual(replay, qualified); cases += 1;
const later = await service().assess({ observationId, evaluatedAt: "2026-08-30T15:00:00Z" });
equal(later.status, CURRENT_MARKET_QUALIFICATION_STATUSES.NOT_QUALIFIED); equal(later.freshness.status, "STALE"); check(later.assessmentId !== qualified.assessmentId);

has(await service({ policies: [] }).assess({ observationId, evaluatedAt }), "PRODUCTION_FRESHNESS_POLICY_MISSING");
has(await service({ policies: [policy(), policy({ policyId: "fixture-duplicate" })] }).assess({ observationId, evaluatedAt }), "PRODUCTION_FRESHNESS_POLICY_AMBIGUOUS");
has(await service({ policies: [policy({ retailerId: "RETAILER-0001" })] }).assess({ observationId, evaluatedAt }), "PRODUCTION_FRESHNESS_POLICY_SCOPE_MISMATCH");
const malformed = structuredClone(policy()); malformed.freshnessPolicy.currentUntilMs = -1;
has(await service({ policies: [malformed] }).assess({ observationId, evaluatedAt }), "PRODUCTION_FRESHNESS_POLICY_MALFORMED");
const unsupported = structuredClone(policy()); unsupported.schemaVersion = "9.9";
has(await service({ policies: [unsupported] }).assess({ observationId, evaluatedAt }), "PRODUCTION_FRESHNESS_POLICY_UNSUPPORTED");

has(await service({ review: null }).assess({ observationId, evaluatedAt }), "CURRENT_MARKET_REVIEW_REQUIRED");
has(await service({ review: { ...reviewed, decision: "HOLD" } }).assess({ observationId, evaluatedAt }), "CURRENT_MARKET_REVIEW_HOLD");
has(await service({ review: { ...reviewed, decision: "REJECTED" } }).assess({ observationId, evaluatedAt }), "CURRENT_MARKET_REVIEW_REJECTED");

const aging = await service().assess({ observationId, evaluatedAt: "2026-08-30T12:45:00Z" }); equal(aging.freshness.status, "AGING"); has(aging, "FRESHNESS_NOT_ELIGIBLE");
const expiredObservation = observation({ expiresAt: "2026-08-30T12:10:00Z" });
const expired = await service({ current: expiredObservation }).assess({ observationId, evaluatedAt }); equal(expired.freshness.status, "STALE"); equal(expired.freshness.reason, "EXPLICIT_EXPIRY_REACHED");

const wrongRetailerObservation = observation({ retailerId: "RETAILER-0001" });
const wrongRetailer = await service({ current: wrongRetailerObservation, policies: [policy({ retailerId: "RETAILER-0001" })], retailerValue: { id: "RETAILER-0001" } }).assess({ observationId, evaluatedAt }); has(wrongRetailer, "ADAPTER_RETAILER_MISMATCH"); equal(wrongRetailer.confidence.status, "LOW");
const wrongMarketplaceObservation = observation({ marketplace: "other.example" });
has(await service({ current: wrongMarketplaceObservation }).assess({ observationId, evaluatedAt }), "ADAPTER_MARKETPLACE_UNSUPPORTED");
const wrongMethodObservation = observation({ sourceMethod: "IMPORT" });
has(await service({ current: wrongMethodObservation }).assess({ observationId, evaluatedAt }), "ADAPTER_SOURCE_METHOD_UNSUPPORTED");
const wrongVersionObservation = observation(); wrongVersionObservation.provenance.transformation.adapterVersion = "2.0.0";
const wrongVersion = await service({ current: wrongVersionObservation }).assess({ observationId, evaluatedAt }); has(wrongVersion, "ADAPTER_VERSION_INCOMPATIBLE"); equal(wrongVersion.confidence.status, "LOW");
const presenceOnly = { get: () => ({ getMetadata: () => ({ ...dataForSeoGoogleShoppingAdapter.getMetadata(), retailerId: "RETAILER-9999" }), supportsMarketplace: () => true, supportsSourceMethod: () => true }) };
has(await service({ registry: presenceOnly }).assess({ observationId, evaluatedAt }), "ADAPTER_RETAILER_MISMATCH");

for (const condition of ["UNKNOWN", "USED", "OPEN_BOX", "MANUFACTURER_REFURBISHED", "SELLER_REFURBISHED"]) {
    const current = observation(); current.offer.condition = condition;
    has(await service({ current }).assess({ observationId, evaluatedAt }), "CONDITION_NOT_ELIGIBLE");
}
const normalizedNull = dataForSeoGoogleShoppingAdapter.normalize({ type: "shops_list", seller_name: "Platinummicro", domain: "platinummicro.com", url: "https://platinummicro.com/item", base_price: 10, shipping_price: null, tax: null, total_price: 10, currency: "USD", product_condition: null, product_availability: "in_stock" }, { marketplace: "platinummicro.com", sourceMethod: "API", sourceTaskId: "task", observedAt, rawPayloadReference: "fixture:item" });
equal(normalizedNull.offer.condition, null); equal(observation().offer.condition, "NEW");
const normalizedNew = normalizeDataForSeoSellerEvidence({ type: "shops_list", seller_name: "Platinummicro", domain: "platinummicro.com", url: "https://platinummicro.com/item", base_price: 10, currency: "USD", product_condition: "new", product_availability: "in_stock" }, { sourceTaskId: "task", observedAt }); equal(normalizedNew.offer.condition, "new");

const blockedProfile = structuredClone(defaultSourceRightsRegistry.require("DATAFORSEO_GOOGLE_SHOPPING")); blockedProfile.live.publicDisplay = "BLOCKED";
const rightsRegistry = new SourceRightsRegistry({ sourceProfiles: { DATAFORSEO_GOOGLE_SHOPPING: blockedProfile } });
has(await service({ rightsRegistry }).assess({ observationId, evaluatedAt }), "SOURCE_RIGHT_BLOCKED");

const inputObservation = observation(), before = structuredClone(inputObservation);
await service({ current: inputObservation }).assess({ observationId, evaluatedAt }); assert.deepEqual(inputObservation, before); cases += 1;
equal(qualified.reviewDecision.decision, "REVIEWED"); equal(qualified.condition, "NEW"); equal(qualified.availability, "IN_STOCK");

const publicationAcceptance = { getById: async () => observation(), getAuditById: async () => ({ storage: { storageClass: "DURABLE", payloadStatus: "ACTIVE", payloadExpiresAt: null } }) };
const publicationBase = { acceptanceRepository: publicationAcceptance, reviewRepository: { getEffectiveDecision: async () => reviewed }, publicationRepository: { getHistoryForObservation: async () => [], getEffectiveDecision: async () => null }, mercury: new Mercury(), atlas: { getProduct: async () => product, getRetailer: async () => retailer } };
const gated = new PublicationWorkflowService({ ...publicationBase, currentMarketQualificationService: { assess: async () => ({ qualified: false, reasons: ["PRODUCTION_FRESHNESS_POLICY_MISSING"] }) } });
const gatedResult = await gated.evaluate(observationId, { asOf: evaluatedAt }); has(gatedResult, "CURRENT_MARKET_QUALIFICATION_REQUIRED"); has(gatedResult, "PRODUCTION_FRESHNESS_POLICY_MISSING");
const admitted = new PublicationWorkflowService({ ...publicationBase, currentMarketQualificationService: { assess: async () => qualified } });
equal((await admitted.evaluate(observationId, { asOf: evaluatedAt })).currentMarketQualification.assessmentId, qualified.assessmentId);

console.log(`Current-market observation qualification tests passed (${cases} cases).`);
