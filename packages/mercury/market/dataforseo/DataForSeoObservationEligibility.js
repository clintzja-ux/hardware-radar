import { DATAFORSEO_MERCHANT_RESOLUTION_OUTCOMES } from "./DataForSeoMerchantIdentity.js";

export const DATAFORSEO_OBSERVATION_ELIGIBILITY = Object.freeze({
    ELIGIBLE: "ELIGIBLE",
    REVIEW_REQUIRED: "REVIEW_REQUIRED",
    BLOCKED: "BLOCKED"
});

function requireObject(value, field) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new TypeError(`${field} must be an object.`);
    }
    return value;
}

function freeze(value) {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
        Object.freeze(value);
        for (const child of Object.values(value)) freeze(child);
    }
    return value;
}

/**
 * Decide whether a pre-canonical DataForSEO candidate has enough resolved
 * identity to cross into the canonical Mercury observation builder.
 *
 * Durable source evidence is preserved independently; this gate controls the
 * canonical observation boundary, not whether licensed raw evidence may be
 * retained for later review/resolution.
 */
export function evaluateDataForSeoObservationEligibility({ candidate, merchantResolution } = {}) {
    requireObject(candidate, "candidate");
    requireObject(merchantResolution, "merchantResolution");

    if (candidate.candidateType !== "MERCURY_MARKET_OBSERVATION") {
        throw new TypeError("Eligibility requires a Mercury market observation candidate.");
    }

    const merchantOutcome = merchantResolution.outcome;
    if (!Object.values(DATAFORSEO_MERCHANT_RESOLUTION_OUTCOMES).includes(merchantOutcome)) {
        throw new TypeError("Eligibility requires a valid merchant resolution outcome.");
    }

    if (merchantOutcome === DATAFORSEO_MERCHANT_RESOLUTION_OUTCOMES.CONFLICT) {
        return freeze({
            eligibilityVersion: "1.0",
            status: DATAFORSEO_OBSERVATION_ELIGIBILITY.BLOCKED,
            canonicalObservationEligible: false,
            rawEvidenceRetentionEligible: true,
            historicalAnalyticsEligible: false,
            retailerId: null,
            requiresReview: true,
            reasons: [merchantResolution.reason ?? "MERCHANT_IDENTITY_CONFLICT"]
        });
    }

    if (merchantOutcome === DATAFORSEO_MERCHANT_RESOLUTION_OUTCOMES.DISCOVERED) {
        return freeze({
            eligibilityVersion: "1.0",
            status: DATAFORSEO_OBSERVATION_ELIGIBILITY.REVIEW_REQUIRED,
            canonicalObservationEligible: false,
            rawEvidenceRetentionEligible: true,
            historicalAnalyticsEligible: false,
            retailerId: null,
            requiresReview: true,
            reasons: ["MERCHANT_REGISTRATION_REQUIRED"]
        });
    }

    if (candidate.governance?.canonicalObservationEligible !== true) {
        return freeze({
            eligibilityVersion: "1.0",
            status: DATAFORSEO_OBSERVATION_ELIGIBILITY.REVIEW_REQUIRED,
            canonicalObservationEligible: false,
            rawEvidenceRetentionEligible: true,
            historicalAnalyticsEligible: false,
            retailerId: merchantResolution.retailerId,
            requiresReview: true,
            reasons: ["ATLAS_PRODUCT_RESOLUTION_REVIEW_REQUIRED"]
        });
    }

    return freeze({
        eligibilityVersion: "1.0",
        status: DATAFORSEO_OBSERVATION_ELIGIBILITY.ELIGIBLE,
        canonicalObservationEligible: true,
        rawEvidenceRetentionEligible: true,
        historicalAnalyticsEligible: true,
        retailerId: merchantResolution.retailerId,
        requiresReview: false,
        reasons: []
    });
}
