import crypto from "node:crypto";
import { canonicalAdmissionMaterialHash } from "../canonical-admission/CanonicalObservationAdmissionPolicy.js";
import { validateObservation } from "../ObservationValidator.js";
import { assessAdapterCompatibility } from "../ConfidenceEvidence.js";
import defaultConfidencePolicy from "../confidence/policies/default-policy.js";
import defaultLiveMarketPolicy from "../live/LiveMarketPolicy.js";
import { evaluateLiveMarketEligibility } from "../live/LiveMarketEligibility.js";
import { defaultSourceRightsRegistry } from "../rights/SourceRightsRegistry.js";
import { ProductionFreshnessPolicyRepository, PRODUCTION_FRESHNESS_RESOLUTION } from "./ProductionFreshnessPolicy.js";

export const CURRENT_MARKET_QUALIFICATION_POLICY_VERSION = "DF004-E2S-1.0";
export const CURRENT_MARKET_QUALIFICATION_STATUSES = Object.freeze({ QUALIFIED: "CURRENT_MARKET_QUALIFIED", NOT_QUALIFIED: "CURRENT_MARKET_NOT_QUALIFIED", BLOCKED: "BLOCKED" });
const stable = value => { if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`; if (value && typeof value === "object") return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`; return JSON.stringify(value); };
const hash = value => crypto.createHash("sha256").update(stable(value)).digest("hex");
const freeze = value => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; };
const separation = { publicationEligible: false, publicationAuthority: false, published: false, currentPriceAuthority: false, livePriceAuthority: false, publicPriceAuthority: false, cheapestAuthority: false, pickAuthority: false, rankingAuthority: false, recommendationAuthority: false, mutationAuthorized: false, networkOperation: "NONE", paidTaskCreated: false, actualSpendUsd: 0 };

function assessment({ observationId, evaluatedAt, status, binding = null, reasons = [], freshness = null, confidence = null, adapterCompatibility = null, rights = null, reviewDecision = null, product = null, retailer = null, freshnessPolicy = null, liveMarketPolicy = defaultLiveMarketPolicy }) {
    const unique = [...new Set(reasons)];
    const bindingDigest = binding ? hash(binding) : null;
    return freeze({ schemaVersion: "1.0", assessmentType: "CURRENT_MARKET_OBSERVATION_QUALIFICATION", assessmentId: `mer_cmqual_${hash({ policyVersion: CURRENT_MARKET_QUALIFICATION_POLICY_VERSION, observationId, evaluatedAt, status, bindingDigest, reasons: unique }).slice(0,24)}`, policyVersion: CURRENT_MARKET_QUALIFICATION_POLICY_VERSION, observationId, evaluatedAt, status, qualified: status === CURRENT_MARKET_QUALIFICATION_STATUSES.QUALIFIED, binding, bindingDigest, reviewDecision, atlasProduct: product ? { atlasProductId: product.identity?.atlasProductId ?? null } : null, atlasRetailer: retailer ? { retailerId: retailer.id ?? null } : null, rights, adapterCompatibility, freshnessPolicy, freshness, confidencePolicy: { policyId: defaultConfidencePolicy.policyId, version: defaultConfidencePolicy.version }, confidence, liveMarketPolicy: { policyId: liveMarketPolicy.policyId, version: liveMarketPolicy.version }, condition: binding?.condition ?? null, availability: binding?.availability ?? null, reasons: unique, blockers: status === CURRENT_MARKET_QUALIFICATION_STATUSES.QUALIFIED ? [] : unique, ...separation });
}

export class CurrentMarketObservationQualificationService {
    constructor({ acceptanceRepository, reviewRepository, productRepository, retailerRepository, mercury, adapterRegistry, freshnessPolicyRepository = new ProductionFreshnessPolicyRepository(), rightsRegistry = defaultSourceRightsRegistry, liveMarketPolicy = defaultLiveMarketPolicy } = {}) {
        if (!acceptanceRepository?.getById || !acceptanceRepository?.getAuditById || !reviewRepository?.getEffectiveDecision || !productRepository?.getById || !retailerRepository?.getById || !mercury?.evaluateFreshness || !mercury?.evaluateConfidence || !adapterRegistry?.get || !freshnessPolicyRepository?.resolve || !rightsRegistry?.get) throw new TypeError("CURRENT_MARKET_QUALIFICATION_DEPENDENCY_REQUIRED");
        Object.assign(this, { acceptanceRepository, reviewRepository, productRepository, retailerRepository, mercury, adapterRegistry, freshnessPolicyRepository, rightsRegistry, liveMarketPolicy });
    }

    async assess({ observationId, evaluatedAt } = {}) {
        if (typeof observationId !== "string" || !observationId.trim() || typeof evaluatedAt !== "string" || !Number.isFinite(Date.parse(evaluatedAt))) return assessment({ observationId, evaluatedAt, status: CURRENT_MARKET_QUALIFICATION_STATUSES.BLOCKED, reasons: ["CURRENT_MARKET_QUALIFICATION_INPUT_INVALID"] });
        const readObservation = this.acceptanceRepository.getByIdReadOnly ? this.acceptanceRepository.getByIdReadOnly(observationId) : this.acceptanceRepository.getById(observationId, { asOf: evaluatedAt });
        const [observation, audit, reviewDecision] = await Promise.all([readObservation, this.acceptanceRepository.getAuditById(observationId), this.reviewRepository.getEffectiveDecision(observationId)]);
        if (!observation || !audit) return assessment({ observationId, evaluatedAt, status: CURRENT_MARKET_QUALIFICATION_STATUSES.BLOCKED, reasons: ["CURRENT_MARKET_CANONICAL_OBSERVATION_UNAVAILABLE"] });
        if (!reviewDecision || reviewDecision.decision !== "REVIEWED") return assessment({ observationId, evaluatedAt, status: CURRENT_MARKET_QUALIFICATION_STATUSES.BLOCKED, reasons: [reviewDecision ? `CURRENT_MARKET_REVIEW_${reviewDecision.decision}` : "CURRENT_MARKET_REVIEW_REQUIRED"], reviewDecision });
        let product = null, retailer = null;
        try { [product, retailer] = await Promise.all([this.productRepository.getById(observation.atlasProductId), this.retailerRepository.getById(observation.retailerId)]); } catch { /* fail closed below */ }
        if (product?.identity?.atlasProductId !== observation.atlasProductId || retailer?.id !== observation.retailerId) return assessment({ observationId, evaluatedAt, status: CURRENT_MARKET_QUALIFICATION_STATUSES.BLOCKED, reasons: ["CURRENT_MARKET_ATLAS_BINDING_INVALID"], reviewDecision, product, retailer });
        const adapterCompatibility = assessAdapterCompatibility(observation, this.adapterRegistry);
        const sourceId = observation.compliance?.licenseContext ?? null;
        const rightsProfile = this.rightsRegistry.get(sourceId);
        const rights = rightsProfile ? { sourceId, schemaVersion: rightsProfile.schemaVersion, status: rightsProfile.status, profileHash: hash(rightsProfile), requiredRights: [...this.liveMarketPolicy.requiredRights] } : null;
        const baseBinding = freeze({ observationId, observationDigest: canonicalAdmissionMaterialHash(observation), auditDigest: canonicalAdmissionMaterialHash(audit), reviewDecisionId: reviewDecision.reviewDecisionId, reviewDecisionDigest: canonicalAdmissionMaterialHash(reviewDecision), atlasProductId: observation.atlasProductId, atlasProductDigest: canonicalAdmissionMaterialHash(product), retailerId: observation.retailerId, atlasRetailerDigest: canonicalAdmissionMaterialHash(retailer), provider: observation.provenance?.source?.name ?? null, sourceId, providerTaskId: observation.provenance?.acquisition?.requestId ?? null, rawPayloadReference: observation.provenance?.acquisition?.rawPayloadReference ?? null, provenanceDigest: canonicalAdmissionMaterialHash(observation.provenance), rightsProfileHash: rights?.profileHash ?? null, adapterId: adapterCompatibility.adapterId, adapterVersion: adapterCompatibility.adapterVersion, adapterMetadataDigest: adapterCompatibility.metadata ? canonicalAdmissionMaterialHash(adapterCompatibility.metadata) : null, evaluatedAt, freshnessPolicyId: null, freshnessPolicyVersion: null, freshnessPolicyDigest: null, confidencePolicyId: defaultConfidencePolicy.policyId, confidencePolicyVersion: defaultConfidencePolicy.version, liveMarketPolicyId: this.liveMarketPolicy.policyId, liveMarketPolicyVersion: this.liveMarketPolicy.version, condition: observation.offer?.condition ?? null, availability: observation.offer?.availability ?? null });
        const resolution = await this.freshnessPolicyRepository.resolve({ sourceId, retailerId: observation.retailerId, atlasProductId: observation.atlasProductId });
        if (resolution.status !== PRODUCTION_FRESHNESS_RESOLUTION.RESOLVED) return assessment({ observationId, evaluatedAt, status: CURRENT_MARKET_QUALIFICATION_STATUSES.BLOCKED, binding: baseBinding, reasons: resolution.reasons, reviewDecision, product, retailer, adapterCompatibility, rights });
        if (!rightsProfile) return assessment({ observationId, evaluatedAt, status: CURRENT_MARKET_QUALIFICATION_STATUSES.BLOCKED, binding: baseBinding, reasons: ["CURRENT_MARKET_RIGHTS_PROFILE_MISSING"], reviewDecision, product, retailer, adapterCompatibility, freshnessPolicy: resolution.policy });
        let freshness, confidence;
        try {
            freshness = this.mercury.evaluateFreshness(observation, { evaluatedAt, policy: resolution.policy.freshnessPolicy });
            confidence = this.mercury.evaluateConfidence(observation, { evaluatedAt, freshnessPolicy: resolution.policy.freshnessPolicy, adapterRegistry: this.adapterRegistry });
        } catch {
            return assessment({ observationId, evaluatedAt, status: CURRENT_MARKET_QUALIFICATION_STATUSES.BLOCKED, reasons: ["CURRENT_MARKET_DERIVED_EVALUATION_FAILED"], reviewDecision, product, retailer, adapterCompatibility, freshnessPolicy: resolution.policy });
        }
        const live = evaluateLiveMarketEligibility(observation, { product, retailer, freshness, confidence, storage: audit.storage, evaluatedAt, policy: this.liveMarketPolicy, rightsRegistry: this.rightsRegistry });
        const reasons = [...adapterCompatibility.reasons, ...live.reasons];
        if (!validateObservation(observation).valid) reasons.push("OBSERVATION_INVALID");
        const binding = freeze({ ...baseBinding, freshnessPolicyId: resolution.policy.policyId, freshnessPolicyVersion: resolution.policy.version, freshnessPolicyDigest: canonicalAdmissionMaterialHash(resolution.policy) });
        const status = reasons.length === 0 ? CURRENT_MARKET_QUALIFICATION_STATUSES.QUALIFIED : CURRENT_MARKET_QUALIFICATION_STATUSES.NOT_QUALIFIED;
        return assessment({ observationId, evaluatedAt, status, binding, reasons, freshness, confidence, adapterCompatibility, rights, reviewDecision, product, retailer, freshnessPolicy: resolution.policy, liveMarketPolicy: this.liveMarketPolicy });
    }
}
