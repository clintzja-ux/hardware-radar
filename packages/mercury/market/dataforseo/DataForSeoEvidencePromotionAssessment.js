import { evaluateDataForSeoObservationEligibility } from "./DataForSeoObservationEligibility.js";
import { DATAFORSEO_MERCHANT_RESOLUTION_OUTCOMES } from "./DataForSeoMerchantIdentity.js";
import { DATAFORSEO_RESOLUTION_OUTCOMES } from "../../resolution/dataforseo/DataForSeoAtlasResolver.js";
import { createDataForSeoMarketObservationCandidate } from "./DataForSeoMarketObservationCandidate.js";
import { projectIdentityReviewState } from "../../identity-review/IdentityReviewProjection.js";
import { resolveGovernedIdentityReuseLineage } from "../../identity-review/GovernedIdentityReuseLineage.js";
import { canonicalEvidencePromotionPolicy, evaluateEvidencePromotionPolicy } from "../../promotion/EvidencePromotionPolicy.js";

export const EVIDENCE_PROMOTION_STATES = Object.freeze({
    EVIDENCE_ONLY: "EVIDENCE_ONLY",
    REVIEW_REQUIRED: "REVIEW_REQUIRED",
    HISTORICAL_ELIGIBLE: "HISTORICAL_ELIGIBLE",
    CANONICAL_ELIGIBLE: "CANONICAL_ELIGIBLE",
    PUBLICATION_ELIGIBLE: "PUBLICATION_ELIGIBLE",
    BLOCKED: "BLOCKED"
});

const PRODUCT_OUTCOMES = new Set(Object.values(DATAFORSEO_RESOLUTION_OUTCOMES));
const MERCHANT_OUTCOMES = new Set(Object.values(DATAFORSEO_MERCHANT_RESOLUTION_OUTCOMES));

function freeze(value) {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
        Object.freeze(value);
        for (const child of Object.values(value)) freeze(child);
    }
    return value;
}
function reason(code, dimension, detail = null) { return { code, dimension, detail }; }
function validDate(value) { return typeof value === "string" && Number.isFinite(Date.parse(value)); }
function sameArray(left, right) {
    return JSON.stringify(left ?? []) === JSON.stringify(right ?? []);
}

function result({ state, records, reasons, productIdentity = null, merchantIdentity = null, atlasProductId = null, identityProjections = [] }) {
    const evidence = records.filter((record) => record && typeof record === "object").map((record) => ({
        evidenceId: record.evidenceId ?? null,
        provider: record.candidate?.marketEvidence?.provider ?? null,
        source: record.candidate?.marketEvidence?.source ?? null,
        sourceTaskId: record.candidate?.marketEvidence?.provenance?.sourceTaskId ?? null,
        observedAt: record.candidate?.marketEvidence?.provenance?.observedAt ?? null
    }));
    const providerIdentities = [...new Set(evidence.map((entry) => entry.provider).filter(Boolean))].sort();
    const acquisitionCycles = new Set(evidence.map((entry) => entry.sourceTaskId).filter(Boolean)).size;
    const observationTimes = evidence.map((entry) => entry.observedAt).filter(validDate).sort();
    return freeze({
        assessmentVersion: "1.0",
        state,
        atlasProductId,
        productIdentity,
        merchantIdentity,
        evidenceCount: records.length,
        independentAcquisitionCycles: acquisitionCycles,
        providerIdentities,
        stableProviderIdentity: providerIdentities.length === 1,
        latestObservationAt: observationTimes.at(-1) ?? null,
        historicalEligible: state === EVIDENCE_PROMOTION_STATES.HISTORICAL_ELIGIBLE || state === EVIDENCE_PROMOTION_STATES.CANONICAL_ELIGIBLE || state === EVIDENCE_PROMOTION_STATES.PUBLICATION_ELIGIBLE,
        canonicalEligible: state === EVIDENCE_PROMOTION_STATES.CANONICAL_ELIGIBLE || state === EVIDENCE_PROMOTION_STATES.PUBLICATION_ELIGIBLE,
        publicationEligible: state === EVIDENCE_PROMOTION_STATES.PUBLICATION_ELIGIBLE,
        reasons,
        evidence,
        identityProjections
    });
}

/**
 * Assess retained DF003 evidence without modifying it or creating canonical data.
 * Existing DF003 eligibility is both recomputed and cross-checked; unknown and
 * contradictory input cannot become positive evidence.
 */
export function assessDataForSeoEvidencePromotion(input = {}) {
    const records = Array.isArray(input?.records) ? input.records : [];
    if (!input || typeof input !== "object" || Array.isArray(input) || !Array.isArray(input.records) || records.length === 0) {
        return result({ state:EVIDENCE_PROMOTION_STATES.EVIDENCE_ONLY, records, reasons:[reason("PROMOTION_EVIDENCE_INCOMPLETE", "evidence")] });
    }

    const critical = [];
    const review = [];
    let atlasProductId = null;
    let productIdentity = null;
    let merchantIdentity = null;
    const effectiveProductIdentities = new Set();
    const effectiveMerchantIdentities = new Set();
    const effectiveRetailerIds = new Set();
    let allDf003Eligible = true;
    let allPolicyEligible = true;
    const canonicalPolicyReasons = [];
    const identityReviewDecisions = Array.isArray(input.identityReviewDecisions) ? input.identityReviewDecisions : [];
    const identityReviewRemediations = Array.isArray(input.identityReviewRemediations) ? input.identityReviewRemediations : [];
    const atlasRetailers = Array.isArray(input.atlasRetailers) ? input.atlasRetailers : [];
    const identityReuseAssessments = Array.isArray(input.identityReuseAssessments) ? input.identityReuseAssessments : [];
    const identityLineageEvidenceRecords = Array.isArray(input.identityLineageEvidenceRecords) ? input.identityLineageEvidenceRecords : records;
    const historicalObservations = Array.isArray(input.historicalObservations) ? input.historicalObservations : [];
    const identityProjections = [];
    const promotionPolicy = input.promotionPolicy === undefined ? canonicalEvidencePromotionPolicy : input.promotionPolicy;

    for (const record of records) {
        if (!record || typeof record !== "object" || Array.isArray(record)) {
            critical.push(reason("INVALID_EVIDENCE_RECORD", "evidence"));
            continue;
        }
        const candidate = record.candidate;
        const merchant = record.merchantResolution;
        const retainedEligibility = record.eligibilityAtRetention;
        const marketEvidence = candidate?.marketEvidence;
        const provenance = marketEvidence?.provenance;
        const identity = candidate?.identity;
        if (!record.evidenceId || !validDate(record.retainedAt) || !candidate || !merchant || !retainedEligibility || !marketEvidence || !provenance) {
            critical.push(reason("MALFORMED_RETAINED_EVIDENCE", "provenance", record.evidenceId ?? null));
            continue;
        }
        if (candidate.candidateType !== "MERCURY_MARKET_OBSERVATION" || marketEvidence.provider !== "DATAFORSEO" || marketEvidence.source !== "DATAFORSEO_GOOGLE_SHOPPING" || !provenance.sourceTaskId || !validDate(provenance.observedAt)) {
            critical.push(reason("UNSUPPORTED_OR_INCOMPLETE_PROVENANCE", "provenance", record.evidenceId));
        }
        if (!PRODUCT_OUTCOMES.has(identity?.outcome)) critical.push(reason("UNKNOWN_PRODUCT_IDENTITY", "productIdentity", identity?.outcome ?? null));
        if (!MERCHANT_OUTCOMES.has(merchant.outcome)) critical.push(reason("UNKNOWN_MERCHANT_IDENTITY", "merchantIdentity", merchant.outcome ?? null));
        if (identity?.outcome === "AMBIGUOUS" || identity?.outcome === "REJECTED") critical.push(reason("PRODUCT_IDENTITY_CONTRADICTION", "productIdentity", identity.outcome));
        if (merchant.outcome === "CONFLICT") critical.push(reason(merchant.reason ?? "MERCHANT_IDENTITY_CONFLICT", "merchantIdentity"));

        atlasProductId ??= identity?.atlasProductId ?? null;
        if (atlasProductId !== (identity?.atlasProductId ?? null)) critical.push(reason("ATLAS_PRODUCT_ID_CONTRADICTION", "productIdentity"));

        try {
            const recomputed = evaluateDataForSeoObservationEligibility({ candidate, merchantResolution:merchant });
            const retainedMatches = retainedEligibility.status === recomputed.status &&
                retainedEligibility.canonicalObservationEligible === recomputed.canonicalObservationEligible &&
                retainedEligibility.historicalAnalyticsEligible === recomputed.historicalAnalyticsEligible &&
                sameArray(retainedEligibility.reasons, recomputed.reasons);
            if (!retainedMatches) critical.push(reason("DF003_ELIGIBILITY_CONTRADICTION", "df003Eligibility", record.evidenceId));
            let projection;try{projection=projectIdentityReviewState({record,decisions:identityReviewDecisions,remediations:identityReviewRemediations,atlasRetailers,identityReuseAssessments});}catch(error){const matches=identityReuseAssessments.filter(value=>value?.targetEvidenceId===record.evidenceId);if(error?.message!=="IDENTITY_REUSE_PRODUCT_DECISION_BINDING_INVALID"||matches.length!==1)throw error;projection=resolveGovernedIdentityReuseLineage({record,reuse:matches[0],historicalObservations,evidenceRecords:identityLineageEvidenceRecords,decisions:identityReviewDecisions,remediations:identityReviewRemediations,atlasRetailers}).projection;}identityProjections.push(projection);
            effectiveProductIdentities.add(projection.product.state);effectiveMerchantIdentities.add(projection.merchant.state);if(projection.merchant.merchantId)effectiveRetailerIds.add(projection.merchant.merchantId);
            const projectedCandidate = projection.product.state === "VERIFIED" ? createDataForSeoMarketObservationCandidate({marketEvidence,atlasResolution:{outcome:"CONFIRMED",atlasProductId:identity.atlasProductId,externalProductId:identity.externalProductId,evidence:identity.evidence,automaticMercuryEligible:true}}) : candidate;
            const projectedMerchant = projection.merchant.state === "REGISTERED" ? projection.merchant.atlasResolution : merchant;
            const currentEligibility = evaluateDataForSeoObservationEligibility({candidate:projectedCandidate,merchantResolution:projectedMerchant});
            const policyResult=evaluateEvidencePromotionPolicy({projection,df003Eligibility:currentEligibility,provenanceComplete:Boolean(provenance.sourceTaskId&&validDate(provenance.observedAt)),policy:promotionPolicy});
            if(policyResult.blocked)critical.push(...policyResult.reasons.map(code=>reason(code,"promotionPolicy",record.evidenceId)));
            for(const code of policyResult.canonicalReasons??[])canonicalPolicyReasons.push(reason(code,"canonicalPromotionPolicy",record.evidenceId));
            if(!policyResult.historicalEligible){allPolicyEligible=false;for(const code of policyResult.historicalReasons??policyResult.reasons)review.push(reason(code,"promotionPolicy",record.evidenceId));}
            if (currentEligibility.canonicalObservationEligible !== true || currentEligibility.historicalAnalyticsEligible !== true) {
                allDf003Eligible = false;
                for (const code of currentEligibility.reasons) review.push(reason(code, "df003Eligibility", record.evidenceId));
            }
        } catch (error) {
            const atlasFailure = /^(ATLAS_|MERCHANT_REVIEW_)/.test(error?.message ?? "");
            critical.push(reason(atlasFailure ? "ATLAS_RETAILER_RESOLUTION_INVALID" : "DF003_ELIGIBILITY_INVALID", atlasFailure ? "merchantIdentity" : "df003Eligibility", record.evidenceId));
            allDf003Eligible = false;
        }
    }

    productIdentity=effectiveProductIdentities.size===1?[...effectiveProductIdentities][0]:effectiveProductIdentities.size?"MIXED":null;merchantIdentity=effectiveMerchantIdentities.size===1?[...effectiveMerchantIdentities][0]:effectiveMerchantIdentities.size?"MIXED":null;if(effectiveProductIdentities.size>1)review.push(reason("PRODUCT_IDENTITY_NOT_STABLE","productIdentity"));if(effectiveMerchantIdentities.size>1||effectiveRetailerIds.size>1)review.push(reason("MERCHANT_IDENTITY_NOT_STABLE","merchantIdentity"));

    if (critical.length > 0) return result({ state:EVIDENCE_PROMOTION_STATES.BLOCKED, records, reasons:critical, atlasProductId, productIdentity, merchantIdentity, identityProjections });
    if (!allDf003Eligible || !allPolicyEligible || review.length > 0) return result({ state:EVIDENCE_PROMOTION_STATES.REVIEW_REQUIRED, records, reasons:review, atlasProductId, productIdentity, merchantIdentity, identityProjections });

    return result({
        state:EVIDENCE_PROMOTION_STATES.HISTORICAL_ELIGIBLE,
        records,
        reasons:[reason("E2H_HISTORICAL_GATES_SATISFIED", "historicalPromotionPolicy"), ...canonicalPolicyReasons, reason("PUBLICATION_REQUIRES_SEPARATE_POLICY", "publication")],
        atlasProductId,
        productIdentity,
        merchantIdentity,
        identityProjections
    });
}

export default assessDataForSeoEvidencePromotion;
