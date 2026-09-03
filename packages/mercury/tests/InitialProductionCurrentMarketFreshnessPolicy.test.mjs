import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Mercury } from "../Mercury.js";
import { FreshnessEngine } from "../FreshnessEngine.js";
import adapterRegistry from "../adapters/index.js";
import { CurrentMarketObservationQualificationService } from "../current-market/CurrentMarketObservationQualificationService.js";
import { FileProductionFreshnessPolicyRepository } from "../current-market/FileProductionFreshnessPolicyRepository.js";
import { ProductionFreshnessPolicyRepository } from "../current-market/ProductionFreshnessPolicy.js";
import { makeObservation } from "./helpers/reviewFixture.mjs";

const productId = "ram_corsair_cmk32gx5m2b6000z30", observationId = "mer_obs_000000999", observedAt = "2026-08-30T00:00:00.000Z";
const policyPath = new URL("../current-market/policies/production-policies.json", import.meta.url);
const state = JSON.parse(await readFile(policyPath, "utf8")), policy = state.policies[0];
const scope = { provider: "DATAFORSEO", sourceId: "DATAFORSEO_GOOGLE_SHOPPING", retailerId: "RETAILER-0002", marketplace: "platinummicro.com", atlasProductId: productId };
let cases = 0;
const equal = (actual, expected, message) => { cases += 1; assert.equal(actual, expected, message); };
const check = (value, message) => { cases += 1; assert.ok(value, message); };

const fileRepository = new FileProductionFreshnessPolicyRepository({ statePath: fileURLToPath(policyPath) });
const exact = await fileRepository.resolve(scope);
equal(exact.status, "RESOLVED"); equal(exact.policy.policyId, "mer_current_market_dataforseo_platinummicro_v1"); equal(exact.policy.version, "1.0.0"); equal(exact.policy.status, "PROVISIONAL");
equal(exact.policy.provider, "DATAFORSEO"); equal(exact.policy.sourceId, "DATAFORSEO_GOOGLE_SHOPPING"); equal(exact.policy.retailerId, "RETAILER-0002"); equal(exact.policy.marketplace, "platinummicro.com");
equal(exact.policy.freshnessPolicy.currentUntilMs, 6 * 60 * 60 * 1000); equal(exact.policy.freshnessPolicy.staleAfterMs, 24 * 60 * 60 * 1000);
equal(exact.policy.approvalBasis, "EXPLICIT_OPERATOR_APPROVAL_DF004_E2S.1"); equal(exact.policy.metadata.refreshCadenceIndependent, true);
check(exact.policy.metadata.economicRationale.includes("paid independent-acquisition economics")); check(exact.policy.metadata.shopperClaimRationale.includes("24 hours")); check(exact.policy.metadata.coverageRationale.includes("does not require continuous current coverage")); check(exact.policy.metadata.reassessmentBasis.includes("Provisional"));

for (const [field, value] of [["retailerId","RETAILER-0001"],["marketplace","other.example"],["provider","OTHER_PROVIDER"],["sourceId","OTHER_SOURCE"]]) {
    const result = await fileRepository.resolve({ ...scope, [field]: value }); equal(result.status, "SCOPE_MISMATCH", field); equal(result.reasons[0], "PRODUCTION_FRESHNESS_POLICY_SCOPE_MISMATCH");
}
const duplicate = structuredClone(policy); duplicate.policyId = "duplicate"; duplicate.freshnessPolicy.policyId = "duplicate";
equal(new ProductionFreshnessPolicyRepository({ policies: [policy, duplicate] }).resolve(scope).status, "AMBIGUOUS");
const malformed = structuredClone(policy); malformed.freshnessPolicy.staleAfterMs = 0;
equal(new ProductionFreshnessPolicyRepository({ policies: [malformed] }).resolve(scope).status, "MALFORMED");
const unsupported = structuredClone(policy); unsupported.schemaVersion = "2.0";
equal(new ProductionFreshnessPolicyRepository({ policies: [unsupported] }).resolve(scope).status, "UNSUPPORTED");
equal(new ProductionFreshnessPolicyRepository().resolve(scope).status, "MISSING");

const temporalObservation = { observationTime: observedAt, expiresAt: null };
const freshness = new FreshnessEngine();
const at = milliseconds => new Date(Date.parse(observedAt) + milliseconds).toISOString();
equal(freshness.evaluate(temporalObservation, { evaluatedAt: at(6 * 60 * 60 * 1000 - 1), policy: policy.freshnessPolicy }).status, "CURRENT");
equal(freshness.evaluate(temporalObservation, { evaluatedAt: at(6 * 60 * 60 * 1000), policy: policy.freshnessPolicy }).status, "CURRENT");
equal(freshness.evaluate(temporalObservation, { evaluatedAt: at(6 * 60 * 60 * 1000 + 1), policy: policy.freshnessPolicy }).status, "AGING");
equal(freshness.evaluate(temporalObservation, { evaluatedAt: at(24 * 60 * 60 * 1000 - 1), policy: policy.freshnessPolicy }).status, "AGING");
equal(freshness.evaluate(temporalObservation, { evaluatedAt: at(24 * 60 * 60 * 1000), policy: policy.freshnessPolicy }).status, "STALE");
equal(freshness.evaluate(temporalObservation, { evaluatedAt: at(24 * 60 * 60 * 1000 + 1), policy: policy.freshnessPolicy }).status, "STALE");
const expires = { ...temporalObservation, expiresAt: at(60 * 60 * 1000) };
const expired = freshness.evaluate(expires, { evaluatedAt: at(2 * 60 * 60 * 1000), policy: policy.freshnessPolicy }); equal(expired.status, "STALE"); equal(expired.reason, "EXPLICIT_EXPIRY_REACHED");

function canonical({ condition = "NEW", observationTime = observedAt, expiresAt = null } = {}) {
    const value = makeObservation(observationId, { sourceMethod: "API", licenseContext: "DATAFORSEO_GOOGLE_SHOPPING", observedAt: observationTime });
    Object.assign(value, { retailerId: "RETAILER-0002", marketplace: "platinummicro.com", expiresAt });
    Object.assign(value.offer, { condition, availability: "IN_STOCK", shipping: { costKnown: false, cost: null, currency: null, notes: null }, affiliate: { isAffiliateLink: false, network: null, trackingCodePresent: false } });
    value.provenance.source = { name: "DataForSEO Google Shopping", uri: value.offer.sourceUrl, marketplace: value.marketplace };
    value.provenance.acquisition = { method: "API", retrievedAt: observationTime, retrievedBy: "dataforseo", requestId: "task-policy", rawPayloadReference: "fixture:policy" };
    value.provenance.transformation = { adapterId: "mer_adapter_dataforseo_google_shopping", adapterVersion: "1.0.0", normalizedAt: observationTime };
    value.compliance = { licenseContext: "DATAFORSEO_GOOGLE_SHOPPING", requiredDisclosureShown: false, requiredPriceDisclaimerShown: false, retailerContentDisclaimerShown: false };
    value.metadata = { createdAt: observationTime, createdBy: "test:e2s1", observationHash: null, notes: "fixture" };
    return value;
}
const review = { reviewDecisionId: "mer_rev_policy", observationId, decision: "REVIEWED", reviewedBy: "operator:test", reviewedAt: at(1), recordedAt: at(1), reasonCodes: [], notes: "", canonicalObservationModified: false };
function service(current) {
    const acceptanceRepository = { getByIdReadOnly: async () => structuredClone(current), getById: async () => structuredClone(current), getAuditById: async () => ({ observationId, storage: { storageClass: "DURABLE", payloadStatus: "ACTIVE", payloadExpiresAt: null } }) };
    return new CurrentMarketObservationQualificationService({ acceptanceRepository, reviewRepository: { getEffectiveDecision: async () => structuredClone(review) }, productRepository: { getById: async () => ({ identity: { atlasProductId: productId } }) }, retailerRepository: { getById: async () => ({ id: "RETAILER-0002", name: "Platinummicro" }) }, mercury: new Mercury(), adapterRegistry, freshnessPolicyRepository: fileRepository });
}
const boundaryTime = at(6 * 60 * 60 * 1000), qualified = await service(canonical()).assess({ observationId, evaluatedAt: boundaryTime });
equal(qualified.status, "CURRENT_MARKET_QUALIFIED"); equal(qualified.freshness.status, "CURRENT"); equal(qualified.confidence.status, "HIGH"); equal(qualified.freshnessPolicy.status, "PROVISIONAL");
const replay = await service(canonical()).assess({ observationId, evaluatedAt: boundaryTime }); assert.deepEqual(replay, qualified); cases += 1;
const afterBoundary = await service(canonical()).assess({ observationId, evaluatedAt: at(6 * 60 * 60 * 1000 + 1) }); equal(afterBoundary.status, "CURRENT_MARKET_NOT_QUALIFIED"); equal(afterBoundary.freshness.status, "AGING"); equal(afterBoundary.confidence.status, "MEDIUM");
const unknown = await service(canonical({ condition: "UNKNOWN" })).assess({ observationId, evaluatedAt: at(60 * 60 * 1000) }); equal(unknown.confidence.status, "HIGH"); check(unknown.reasons.includes("CONDITION_NOT_ELIGIBLE"));
for (const key of ["publicationAuthority","published","currentPriceAuthority","livePriceAuthority","publicPriceAuthority","cheapestAuthority","pickAuthority","rankingAuthority","recommendationAuthority","mutationAuthorized","paidTaskCreated"]) equal(qualified[key], false, key);
equal(qualified.networkOperation, "NONE"); equal(qualified.actualSpendUsd, 0); equal(policy.metadata.refreshCadenceIndependent, true); check(!("refreshIntervalMs" in policy));
const before = canonical(); await service(before).assess({ observationId, evaluatedAt: boundaryTime }); equal(JSON.stringify(before), JSON.stringify(canonical()));

console.log(`Initial provisional production current-market freshness policy tests passed (${cases} cases).`);
