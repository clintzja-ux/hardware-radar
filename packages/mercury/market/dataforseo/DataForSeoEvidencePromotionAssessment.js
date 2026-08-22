import { evaluateDataForSeoObservationEligibility } from "./DataForSeoObservationEligibility.js";
import { DATAFORSEO_MERCHANT_RESOLUTION_OUTCOMES } from "./DataForSeoMerchantIdentity.js";
import { DATAFORSEO_RESOLUTION_OUTCOMES } from "../../resolution/dataforseo/DataForSeoAtlasResolver.js";

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

function result({ state, records, reasons, productIdentity = null, merchantIdentity = null, atlasProductId = null }) {
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
        evidence
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
    let allDf003Eligible = true;

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
        if (identity?.outcome === "PROBABLE") review.push(reason("ATLAS_PRODUCT_RESOLUTION_REVIEW_REQUIRED", "productIdentity", record.evidenceId));
        if (merchant.outcome === "DISCOVERED") review.push(reason("MERCHANT_REGISTRATION_REQUIRED", "merchantIdentity", record.evidenceId));

        atlasProductId ??= identity?.atlasProductId ?? null;
        productIdentity ??= identity?.outcome ?? null;
        merchantIdentity ??= merchant.outcome ?? null;
        if (atlasProductId !== (identity?.atlasProductId ?? null)) critical.push(reason("ATLAS_PRODUCT_ID_CONTRADICTION", "productIdentity"));
        if (productIdentity !== identity?.outcome) review.push(reason("PRODUCT_IDENTITY_NOT_STABLE", "productIdentity"));
        if (merchantIdentity !== merchant.outcome) review.push(reason("MERCHANT_IDENTITY_NOT_STABLE", "merchantIdentity"));

        try {
            const recomputed = evaluateDataForSeoObservationEligibility({ candidate, merchantResolution:merchant });
            const retainedMatches = retainedEligibility.status === recomputed.status &&
                retainedEligibility.canonicalObservationEligible === recomputed.canonicalObservationEligible &&
                retainedEligibility.historicalAnalyticsEligible === recomputed.historicalAnalyticsEligible &&
                sameArray(retainedEligibility.reasons, recomputed.reasons);
            if (!retainedMatches) critical.push(reason("DF003_ELIGIBILITY_CONTRADICTION", "df003Eligibility", record.evidenceId));
            if (recomputed.canonicalObservationEligible !== true || recomputed.historicalAnalyticsEligible !== true) {
                allDf003Eligible = false;
                for (const code of recomputed.reasons) review.push(reason(code, "df003Eligibility", record.evidenceId));
            }
        } catch {
            critical.push(reason("DF003_ELIGIBILITY_INVALID", "df003Eligibility", record.evidenceId));
            allDf003Eligible = false;
        }
    }

    if (critical.length > 0) return result({ state:EVIDENCE_PROMOTION_STATES.BLOCKED, records, reasons:critical, atlasProductId, productIdentity, merchantIdentity });
    if (!allDf003Eligible || review.length > 0) return result({ state:EVIDENCE_PROMOTION_STATES.REVIEW_REQUIRED, records, reasons:review, atlasProductId, productIdentity, merchantIdentity });

    return result({
        state:EVIDENCE_PROMOTION_STATES.CANONICAL_ELIGIBLE,
        records,
        reasons:[reason("DF003_HISTORICAL_AND_CANONICAL_GATES_SATISFIED", "df003Eligibility"), reason("PUBLICATION_REQUIRES_CANONICAL_OBSERVATION_WORKFLOW", "publication")],
        atlasProductId,
        productIdentity,
        merchantIdentity
    });
}

export default assessDataForSeoEvidencePromotion;
