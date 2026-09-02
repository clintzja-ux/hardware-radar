import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createSupplementalConditionEvidence, canonicalizeOfferUrl, normalizeExplicitCondition, supplementalConditionStableHash } from "../condition-evidence/SupplementalConditionEvidence.js";
import { FileSupplementalConditionEvidenceRepository } from "../condition-evidence/FileSupplementalConditionEvidenceRepository.js";
import { validateSupplementalOfferBinding } from "../condition-evidence/OfferConditionBinding.js";
import { ConditionTemporalPolicyRepository, createConditionTemporalPolicy } from "../condition-evidence/ConditionTemporalPolicy.js";
import { EffectiveConditionAssessmentService } from "../condition-evidence/EffectiveConditionAssessmentService.js";
import { SourceRightsRegistry } from "../rights/SourceRightsRegistry.js";
import { RIGHTS_STATES } from "../rights/SourceRightsPolicy.js";

let cases = 0;
const equal = (actual, expected, message) => { cases += 1; assert.equal(actual, expected, message); };
const check = (value, message) => { cases += 1; assert.ok(value, message); };
const has = (values, value) => { cases += 1; assert.ok(values.includes(value), `${value} missing from ${values}`); };
const observationId = "mer_obs_000000004", evidenceId = "dfev_bb40abbb467a6497b88a3e2d", productId = "ram_crucial_cp2k16g56c46u5", retailerId = "RETAILER-0003";
const observedAt = "2026-09-01T18:02:36.223Z", evaluatedAt = "2026-09-01T20:02:36.223Z";
const url = "https://www.memoryc.com/319001-32gb-crucial-ddr5-5600mhz-desktop-memory-kit.html?fc=US";
const sourceProfile = { sourceId: "FIXTURE_RETAILER_FEED", schemaVersion: "1.0", acquisition: { api: RIGHTS_STATES.ALLOWED, manual: RIGHTS_STATES.BLOCKED, import: RIGHTS_STATES.ALLOWED }, live: { currentObservation: RIGHTS_STATES.ALLOWED, publicDisplay: RIGHTS_STATES.BLOCKED, comparison: RIGHTS_STATES.BLOCKED }, retention: { storageClass: "TEST_ONLY", contentTtlMs: null, historical: RIGHTS_STATES.ALLOWED, durableAuditMetadata: RIGHTS_STATES.ALLOWED }, derivation: { analytics: RIGHTS_STATES.BLOCKED, offerCondition: RIGHTS_STATES.ALLOWED, historicalAnalytics: RIGHTS_STATES.BLOCKED }, presentation: { attribution: RIGHTS_STATES.CONDITIONAL }, status: "FIXTURE_ONLY" };
const rightsRegistry = new SourceRightsRegistry({ sourceProfiles: { FIXTURE_RETAILER_FEED: sourceProfile } });
const policy = createConditionTemporalPolicy({ policyId: "mer_condition_memoryc_fixture_v1", sourceId: sourceProfile.sourceId, retailerId, marketplace: "memoryc.com", primaryCurrentUntilMs: 6 * 3600000, supplementalCurrentUntilMs: 6 * 3600000, maxObservationSkewMs: 3600000 });
const temporalPolicyRepository = new ConditionTemporalPolicyRepository({ policies: [policy] });
const canonicalObservation = { observationId, atlasProductId: productId, retailerId, marketplace: "memoryc.com", observationTime: observedAt, offer: { sourceUrl: url, condition: "UNKNOWN" } };
const primaryEvidence = { evidenceId, candidate: { identity: { atlasProductId: productId }, marketEvidence: { seller: { name: "MemoryC.com", domain: "www.memoryc.com", url } } } };
const atlasProduct = { identity: { atlasProductId: productId, manufacturerPartNumber: "CP2K16G56C46U5" } };
const primaryOfferIdentity = { retailerListingId: "FD3190001", sourceListingId: "dataforseo:item:5", variantClass: "STANDARD", bundleClass: "STANDALONE" };
const input = (overrides = {}) => ({ product: { atlasProductId: productId, manufacturerPartNumber: "CP2K16G56C46U5" }, merchant: { retailerId, marketplace: "memoryc.com", sellerName: "MemoryC.com" }, offer: { url: `${url}&utm_source=test`, ...primaryOfferIdentity }, condition: { rawAssertion: "Brand New" }, temporal: { observedAt: "2026-09-01T18:32:36.223Z", retrievedAt: "2026-09-01T18:33:36.223Z" }, source: { sourceId: sourceProfile.sourceId, sourceType: "RETAILER_FEED" }, provenance: { rawReference: "fixture:condition:1", collectorId: "fixture:b017a", adapterId: "mer_adapter_fixture_condition", adapterVersion: "1.0.0" }, rights: { sourceRightsId: sourceProfile.sourceId, profileHash: supplementalConditionStableHash(sourceProfile) }, binding: { primaryEvidenceId: evidenceId, canonicalObservationId: observationId }, validation: { status: "PASS", validatorVersion: "B-017A-1.0" }, lifecycle: {}, audit: { createdAt: "2026-09-01T18:34:36.223Z", createdBy: "operator:fixture" }, ...overrides });
const record = createSupplementalConditionEvidence(input());

equal(normalizeExplicitCondition("Brand New"), "NEW"); equal(normalizeExplicitCondition("used"), "USED"); equal(normalizeExplicitCondition("open-box"), "OPEN_BOX"); equal(normalizeExplicitCondition("factory refurbished"), "MANUFACTURER_REFURBISHED"); equal(normalizeExplicitCondition("generic retailer claim"), "UNKNOWN"); equal(normalizeExplicitCondition(null), "UNKNOWN");
equal(canonicalizeOfferUrl(`${url}&utm_campaign=x#frag`), "https://memoryc.com/319001-32gb-crucial-ddr5-5600mhz-desktop-memory-kit.html");
equal(record.condition.normalized, "NEW"); equal(record.offer.canonicalUrl, "https://memoryc.com/319001-32gb-crucial-ddr5-5600mhz-desktop-memory-kit.html"); equal(Object.isFrozen(record), true);
equal(createSupplementalConditionEvidence(input({ condition: { rawAssertion: " " }, provenance: { ...input().provenance, rawReference: "fixture:blank" } })).condition.normalized, "UNKNOWN");
assert.throws(() => createSupplementalConditionEvidence(input({ provenance: { ...input().provenance, rawReference: "" } })), /PROVENANCE_INVALID/); cases += 1;

const dir = await mkdtemp(join(tmpdir(), "b017a-")), statePath = join(dir, "condition.json"), repository = new FileSupplementalConditionEvidenceRepository({ statePath });
equal((await repository.retain(record)).status, "RETAINED"); equal((await repository.retain(record)).status, "DUPLICATE"); equal((await repository.getAll()).length, 1); equal((await repository.getByCanonicalObservation(observationId)).length, 1); equal((await repository.getByPrimaryEvidence(evidenceId)).length, 1); equal((await repository.getByProductRetailer(productId, retailerId)).length, 1);
const persistedBefore = await readFile(statePath, "utf8");
const conflicting = structuredClone(record); conflicting.condition.rawAssertion = "used"; conflicting.condition.normalized = "USED"; conflicting.materialFingerprint = (await import("../condition-evidence/SupplementalConditionEvidence.js")).supplementalConditionMaterialFingerprint(conflicting);
await assert.rejects(repository.retain(conflicting), /EVIDENCE_CONFLICT/); cases += 1; equal(await readFile(statePath, "utf8"), persistedBefore);

const binding = validateSupplementalOfferBinding({ record, canonicalObservation, primaryEvidence, atlasProduct, primaryOfferIdentity }); equal(binding.valid, true); check(binding.bindingDigest.length === 64);
for (const [path, value, reason] of [["product", { ...record.product, atlasProductId: "ram_other" }, "SUPPLEMENTAL_OFFER_PRODUCT_MISMATCH"], ["product", { ...record.product, manufacturerPartNumber: "WRONG-MPN" }, "SUPPLEMENTAL_OFFER_MPN_MISMATCH"], ["merchant", { ...record.merchant, retailerId: "RETAILER-0002" }, "SUPPLEMENTAL_OFFER_RETAILER_MISMATCH"], ["merchant", { ...record.merchant, marketplace: "lookalike.example" }, "SUPPLEMENTAL_OFFER_MARKETPLACE_MISMATCH"], ["merchant", { ...record.merchant, sellerName: "Other" }, "SUPPLEMENTAL_OFFER_SELLER_MISMATCH"], ["offer", { ...record.offer, canonicalUrl: "https://memoryc.com/different-product" }, "SUPPLEMENTAL_OFFER_URL_MISMATCH"], ["offer", { ...record.offer, retailerListingId: "WRONG-LISTING" }, "SUPPLEMENTAL_OFFER_RETAILER_LISTING_MISMATCH"], ["offer", { ...record.offer, variantClass: "OTHER" }, "SUPPLEMENTAL_OFFER_VARIANT_MISMATCH"], ["offer", { ...record.offer, bundleClass: "BUNDLE" }, "SUPPLEMENTAL_OFFER_BUNDLE_MISMATCH"]]) { const changed = structuredClone(record); changed[path] = value; has(validateSupplementalOfferBinding({ record: changed, canonicalObservation, primaryEvidence, atlasProduct, primaryOfferIdentity }).reasons, reason); }

const service = new EffectiveConditionAssessmentService({ evidenceRepository: repository, rightsRegistry, temporalPolicyRepository });
const args = { canonicalObservation, primaryEvidence, atlasProduct, primaryOfferIdentity, evaluatedAt };
const confirmed = await service.assess(args); equal(confirmed.outcome, "CONFIRMED_NEW"); equal(confirmed.effectiveCondition, "NEW"); equal(confirmed.publicationAuthority, false); equal(confirmed.currentPriceAuthority, false); equal(confirmed.networkOperation, "NONE"); equal(confirmed.actualSpendUsd, 0); assert.deepEqual(await service.assess(args), confirmed); cases += 1;
const deniedProfile = structuredClone(sourceProfile); deniedProfile.derivation.offerCondition = RIGHTS_STATES.BLOCKED;
const denied = await new EffectiveConditionAssessmentService({ evidenceRepository: repository, rightsRegistry: new SourceRightsRegistry({ sourceProfiles: { FIXTURE_RETAILER_FEED: deniedProfile } }), temporalPolicyRepository }).assess(args); equal(denied.outcome, "UNKNOWN"); has(denied.reasons, "SUPPLEMENTAL_CONDITION_RIGHTS_NOT_ALLOWED");
const stale = await service.assess({ ...args, evaluatedAt: "2026-09-02T02:02:36.224Z" }); equal(stale.outcome, "UNKNOWN"); has(stale.reasons, "SUPPLEMENTAL_CONDITION_PRIMARY_NOT_CURRENT");
const noPolicy = await new EffectiveConditionAssessmentService({ evidenceRepository: repository, rightsRegistry, temporalPolicyRepository: new ConditionTemporalPolicyRepository() }).assess(args); equal(noPolicy.outcome, "UNKNOWN"); has(noPolicy.reasons, "SUPPLEMENTAL_CONDITION_TEMPORAL_POLICY_MISSING");
const assessOnly = async (only, registry = rightsRegistry, policies = temporalPolicyRepository) => new EffectiveConditionAssessmentService({ evidenceRepository: { getByCanonicalObservation: async () => [only] }, rightsRegistry: registry, temporalPolicyRepository: policies }).assess(args);
const nonNewRecord = createSupplementalConditionEvidence(input({ condition: { rawAssertion: "open box" }, provenance: { ...input().provenance, rawReference: "fixture:nonnew" } })); const nonNew = await assessOnly(nonNewRecord); equal(nonNew.outcome, "CONFIRMED_NON_NEW"); equal(nonNew.effectiveCondition, "OPEN_BOX");
const genericRecord = createSupplementalConditionEvidence(input({ condition: { rawAssertion: "standard retailer product" }, provenance: { ...input().provenance, rawReference: "fixture:generic" } })); const generic = await assessOnly(genericRecord); equal(generic.outcome, "UNKNOWN"); has(generic.reasons, "SUPPLEMENTAL_CONDITION_ASSERTION_UNKNOWN");
const futureRecord = createSupplementalConditionEvidence(input({ temporal: { observedAt: "2026-09-01T21:02:36.223Z", retrievedAt: "2026-09-01T21:03:36.223Z" }, provenance: { ...input().provenance, rawReference: "fixture:future" } })); const future = await assessOnly(futureRecord); equal(future.outcome, "UNKNOWN"); has(future.reasons, "SUPPLEMENTAL_CONDITION_FUTURE_EVIDENCE");
const curatedProfile = { ...structuredClone(sourceProfile), sourceId: "FIXTURE_OPERATOR_CURATED" }, curatedRegistry = new SourceRightsRegistry({ sourceProfiles: { FIXTURE_OPERATOR_CURATED: curatedProfile } });
const curatedRecord = createSupplementalConditionEvidence(input({ source: { sourceId: curatedProfile.sourceId, sourceType: "OPERATOR_CURATED" }, provenance: { ...input().provenance, rawReference: "fixture:curated" }, rights: { sourceRightsId: curatedProfile.sourceId, profileHash: supplementalConditionStableHash(curatedProfile) } }));
const curatedPolicy = new ConditionTemporalPolicyRepository({ policies: [{ ...policy, sourceId: curatedProfile.sourceId }] }); equal((await assessOnly(curatedRecord, curatedRegistry, curatedPolicy)).outcome, "CONFIRMED_NEW");

const second = createSupplementalConditionEvidence(input({ condition: { rawAssertion: "open box" }, provenance: { ...input().provenance, rawReference: "fixture:condition:2" } })); await repository.retain(second);
const conflict = await service.assess(args); equal(conflict.outcome, "CONFLICT"); has(conflict.reasons, "SUPPLEMENTAL_CONDITION_CONFLICT");
const successor = createSupplementalConditionEvidence(input({ provenance: { ...input().provenance, rawReference: "fixture:condition:3" }, lifecycle: { supersedesEvidenceId: second.supplementalEvidenceId } })); await repository.retain(successor);
const superseded = await service.assess(args); equal(superseded.outcome, "CONFIRMED_NEW"); has(superseded.reasons, "SUPPLEMENTAL_CONDITION_EVIDENCE_SUPERSEDED");
const primaryBefore = structuredClone(primaryEvidence), observationBefore = structuredClone(canonicalObservation); await service.assess(args); assert.deepEqual(primaryEvidence, primaryBefore); cases += 1; assert.deepEqual(canonicalObservation, observationBefore); cases += 1;
console.log(`Supplemental offer condition evidence tests passed (${cases} cases).`);
