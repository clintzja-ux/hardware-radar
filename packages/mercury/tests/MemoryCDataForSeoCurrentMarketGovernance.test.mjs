import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Mercury } from "../Mercury.js";
import adapterRegistry, { AdapterRegistry, DataForSeoGoogleShoppingAdapter, memoryCDataForSeoGoogleShoppingAdapter } from "../adapters/index.js";
import { CurrentMarketObservationQualificationService } from "../current-market/CurrentMarketObservationQualificationService.js";
import { FileProductionFreshnessPolicyRepository } from "../current-market/FileProductionFreshnessPolicyRepository.js";
import { ProductionFreshnessPolicyRepository } from "../current-market/ProductionFreshnessPolicy.js";
import { SourceRightsRegistry, defaultSourceRightsRegistry } from "../rights/SourceRightsRegistry.js";
import { makeObservation } from "./helpers/reviewFixture.mjs";

const observationId = "mer_obs_000000004";
const productId = "ram_crucial_cp2k16g56c46u5";
const retailerId = "RETAILER-0003";
const observedAt = "2026-09-01T18:02:36.223Z";
const policyPath = new URL("../current-market/policies/production-policies.json", import.meta.url);
const policyState = JSON.parse(await readFile(policyPath, "utf8"));
const memoryCPolicy = policyState.policies.find((policy) => policy.policyId === "mer_current_market_dataforseo_memoryc_v1");
const policyRepository = new FileProductionFreshnessPolicyRepository({ statePath: fileURLToPath(policyPath) });
let cases = 0;
const equal = (actual, expected, message) => { cases += 1; assert.equal(actual, expected, message); };
const check = (value, message) => { cases += 1; assert.ok(value, message); };
const has = (result, reason) => { cases += 1; assert.ok(result.reasons.includes(reason), `${reason} missing from ${result.reasons}`); };

function observation({ condition = "UNKNOWN", availability = "IN_STOCK", retailer = retailerId, marketplace = "memoryc.com", source = "DATAFORSEO_GOOGLE_SHOPPING" } = {}) {
    const value = makeObservation(observationId, { sourceMethod: "API", licenseContext: source, observedAt });
    Object.assign(value, { atlasProductId: productId, retailerId: retailer, marketplace });
    Object.assign(value.offer, { price: 663.79, currency: "USD", condition, availability, shipping: { costKnown: false, cost: null, currency: null, notes: null }, affiliate: { isAffiliateLink: false, network: null, trackingCodePresent: false } });
    value.provenance.source = { name: "DataForSEO Google Shopping", uri: value.offer.sourceUrl, marketplace };
    value.provenance.acquisition = { method: "API", retrievedAt: observedAt, retrievedBy: "dataforseo", requestId: "09011802-2304-0183-0000-b27c074679a9", rawPayloadReference: "dataforseo:sellers:09011802-2304-0183-0000-b27c074679a9:item:5" };
    value.provenance.transformation = { adapterId: "mer_adapter_dataforseo_google_shopping", adapterVersion: "1.0.0", normalizedAt: "2026-09-02T02:28:35.338Z" };
    value.compliance = { licenseContext: source, requiredDisclosureShown: false, requiredPriceDisclaimerShown: false, retailerContentDisclaimerShown: false };
    value.metadata = { createdAt: "2026-09-02T02:28:35.338Z", createdBy: "test:b016a", observationHash: null, notes: "Production-shaped MemoryC fixture." };
    return value;
}

const review = { schemaVersion: "1.0", reviewDecisionId: "mer_rev_000000003", sequence: 3, observationId, decision: "REVIEWED", reviewedBy: "operator:fixture", reviewedAt: "2026-09-02T02:38:22.240Z", recordedAt: "2026-09-02T02:38:22.261Z", reasonCodes: [], notes: "", canonicalObservationModified: false };
function service({ current = observation(), reviewDecision = review, policies = policyState.policies, registry = adapterRegistry, rightsRegistry = defaultSourceRightsRegistry, available = true } = {}) {
    const acceptanceRepository = { getByIdReadOnly: async () => available ? structuredClone(current) : null, getById: async () => available ? structuredClone(current) : null, getAuditById: async () => available ? { observationId, storage: { storageClass: "DURABLE", payloadStatus: "ACTIVE", payloadExpiresAt: null } } : null };
    return new CurrentMarketObservationQualificationService({ acceptanceRepository, reviewRepository: { getEffectiveDecision: async () => structuredClone(reviewDecision) }, productRepository: { getById: async () => ({ identity: { atlasProductId: productId } }) }, retailerRepository: { getById: async () => ({ id: current.retailerId, name: "MemoryC" }) }, mercury: new Mercury(), adapterRegistry: registry, freshnessPolicyRepository: new ProductionFreshnessPolicyRepository({ policies }), rightsRegistry });
}

check(memoryCPolicy, "MemoryC policy must be registered.");
equal(memoryCPolicy.retailerId, retailerId);
equal(memoryCPolicy.marketplace, "memoryc.com");
equal(memoryCPolicy.provider, "DATAFORSEO");
equal(memoryCPolicy.sourceId, "DATAFORSEO_GOOGLE_SHOPPING");
equal(memoryCPolicy.freshnessPolicy.currentUntilMs, 6 * 60 * 60 * 1000);
equal(memoryCPolicy.freshnessPolicy.staleAfterMs, 24 * 60 * 60 * 1000);
equal(memoryCPolicy.metadata.refreshCadenceIndependent, true);

const scope = { provider: "DATAFORSEO", sourceId: "DATAFORSEO_GOOGLE_SHOPPING", retailerId, marketplace: "memoryc.com", atlasProductId: productId };
const resolved = await policyRepository.resolve(scope);
equal(resolved.status, "RESOLVED"); equal(resolved.policy.policyId, memoryCPolicy.policyId);
for (const [field, value] of [["retailerId", "RETAILER-0002"], ["marketplace", "www.memoryc.com"], ["marketplace", "memoryc.example"], ["sourceId", "OTHER_SOURCE"], ["provider", "OTHER_PROVIDER"]]) {
    equal((await policyRepository.resolve({ ...scope, [field]: value })).status, "SCOPE_MISMATCH", field);
}

equal(adapterRegistry.getByRetailerId(retailerId).length, 1);
equal(adapterRegistry.get("mer_adapter_dataforseo_google_shopping", { retailerId, marketplace: "memoryc.com" }), memoryCDataForSeoGoogleShoppingAdapter);
equal(memoryCDataForSeoGoogleShoppingAdapter.supportsMarketplace("memoryc.com"), true);
equal(memoryCDataForSeoGoogleShoppingAdapter.supportsMarketplace("MEMORYC.COM"), true);
equal(memoryCDataForSeoGoogleShoppingAdapter.supportsMarketplace("www.memoryc.com"), false);
equal(memoryCDataForSeoGoogleShoppingAdapter.supportsMarketplace("lookalike-memoryc.com"), false);
assert.throws(() => new AdapterRegistry([memoryCDataForSeoGoogleShoppingAdapter, memoryCDataForSeoGoogleShoppingAdapter]), /Duplicate adapter registration/); cases += 1;

const at = milliseconds => new Date(Date.parse(observedAt) + milliseconds).toISOString();
const current = await service().assess({ observationId, evaluatedAt: at(60 * 60 * 1000) });
equal(current.adapterCompatibility.status, "REGISTERED");
equal(current.adapterCompatibility.metadata.retailerId, retailerId);
equal(current.freshness.status, "CURRENT");
equal(current.confidence.status, "HIGH");
equal(current.condition, "UNKNOWN");
equal(current.availability, "IN_STOCK");
equal(current.status, "CURRENT_MARKET_NOT_QUALIFIED");
assert.deepEqual(current.reasons, ["CONDITION_NOT_ELIGIBLE"]); cases += 1;
equal(current.rights.status, "WRITTEN_PROVIDER_AUTHORIZATION_2026_08");
equal(current.binding.rightsProfileHash, "1bbbfb12fa8621e424a473b1e599d0e510717fdcca4a928bdda448791ce0ca57");
equal(current.binding.freshnessPolicyId, memoryCPolicy.policyId);
equal(current.binding.providerTaskId, "09011802-2304-0183-0000-b27c074679a9");
equal(current.binding.adapterId, "mer_adapter_dataforseo_google_shopping");
equal(current.binding.adapterVersion, "1.0.0");
equal(current.publicationAuthority, false); equal(current.currentPriceAuthority, false); equal(current.cheapestAuthority, false); equal(current.pickAuthority, false);
equal(current.networkOperation, "NONE"); equal(current.paidTaskCreated, false); equal(current.actualSpendUsd, 0);
assert.deepEqual(await service().assess({ observationId, evaluatedAt: at(60 * 60 * 1000) }), current); cases += 1;

for (const [offset, expected] of [[60 * 60 * 1000, "CURRENT"], [6 * 60 * 60 * 1000, "CURRENT"], [6 * 60 * 60 * 1000 + 1, "AGING"], [24 * 60 * 60 * 1000, "STALE"], [25 * 60 * 60 * 1000, "STALE"]]) {
    equal((await service().assess({ observationId, evaluatedAt: at(offset) })).freshness.status, expected);
}
equal((await service().assess({ observationId, evaluatedAt: at(6 * 60 * 60 * 1000 + 1) })).confidence.status, "MEDIUM");
has(await service().assess({ observationId, evaluatedAt: at(24 * 60 * 60 * 1000) }), "FRESHNESS_NOT_ELIGIBLE");
has(await service({ policies: [] }).assess({ observationId, evaluatedAt: at(1) }), "PRODUCTION_FRESHNESS_POLICY_MISSING");
has(await service({ policies: [policyState.policies[0]] }).assess({ observationId, evaluatedAt: at(1) }), "PRODUCTION_FRESHNESS_POLICY_SCOPE_MISMATCH");
equal((await service().assess({ observationId, evaluatedAt: at(-1) })).status, "BLOCKED");
has(await service().assess({ observationId, evaluatedAt: at(-1) }), "CURRENT_MARKET_DERIVED_EVALUATION_FAILED");

const malformed = structuredClone(memoryCPolicy); malformed.freshnessPolicy.currentUntilMs = -1;
has(await service({ policies: [malformed] }).assess({ observationId, evaluatedAt: at(1) }), "PRODUCTION_FRESHNESS_POLICY_MALFORMED");
has(await service({ available: false }).assess({ observationId, evaluatedAt: at(1) }), "CURRENT_MARKET_CANONICAL_OBSERVATION_UNAVAILABLE");
has(await service({ reviewDecision: { ...review, decision: "HOLD" } }).assess({ observationId, evaluatedAt: at(1) }), "CURRENT_MARKET_REVIEW_HOLD");
for (const condition of ["UNKNOWN", "USED", "OPEN_BOX", "MANUFACTURER_REFURBISHED", "SELLER_REFURBISHED"]) has(await service({ current: observation({ condition }) }).assess({ observationId, evaluatedAt: at(1) }), "CONDITION_NOT_ELIGIBLE");
has(await service({ current: observation({ availability: "OUT_OF_STOCK", condition: "NEW" }) }).assess({ observationId, evaluatedAt: at(1) }), "AVAILABILITY_NOT_ELIGIBLE");

const inactiveManifest = { ...memoryCDataForSeoGoogleShoppingAdapter.getMetadata(), status: "DISABLED" };
const inactiveRegistry = new AdapterRegistry([new DataForSeoGoogleShoppingAdapter({ manifest: inactiveManifest })]);
has(await service({ registry: inactiveRegistry }).assess({ observationId, evaluatedAt: at(1) }), "ADAPTER_NOT_ACTIVE");
has(await service({ current: observation({ marketplace: "www.memoryc.com" }), policies: [{ ...memoryCPolicy, marketplace: "www.memoryc.com" }] }).assess({ observationId, evaluatedAt: at(1) }), "ADAPTER_MARKETPLACE_UNSUPPORTED");
has(await service({ current: observation({ retailer: "RETAILER-0002" }), policies: [{ ...memoryCPolicy, retailerId: "RETAILER-0002" }] }).assess({ observationId, evaluatedAt: at(1) }), "ADAPTER_MARKETPLACE_UNSUPPORTED");
has(await service({ current: observation({ source: "OTHER_SOURCE" }) }).assess({ observationId, evaluatedAt: at(1) }), "PRODUCTION_FRESHNESS_POLICY_SCOPE_MISMATCH");

const blockedProfile = structuredClone(defaultSourceRightsRegistry.require("DATAFORSEO_GOOGLE_SHOPPING")); blockedProfile.live.publicDisplay = "BLOCKED";
const blockedRights = new SourceRightsRegistry({ sourceProfiles: { DATAFORSEO_GOOGLE_SHOPPING: blockedProfile } });
has(await service({ rightsRegistry: blockedRights, current: observation({ condition: "NEW" }) }).assess({ observationId, evaluatedAt: at(1) }), "SOURCE_RIGHT_BLOCKED");

const eligible = await service({ current: observation({ condition: "NEW" }) }).assess({ observationId, evaluatedAt: at(1) });
equal(eligible.status, "CURRENT_MARKET_QUALIFIED"); equal(eligible.confidence.status, "HIGH"); equal(eligible.publicationAuthority, false); equal(eligible.currentPriceAuthority, false);
const before = observation(); await service({ current: before }).assess({ observationId, evaluatedAt: at(1) }); assert.deepEqual(before, observation()); cases += 1;
equal(current.binding.condition, "UNKNOWN");
check(!("shipping" in current.liveMarketPolicy), "Shipping must not become an E2S gate.");

console.log(`MemoryC DataForSEO current-market governance tests passed (${cases} cases).`);
