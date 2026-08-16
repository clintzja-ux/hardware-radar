import { DATAFORSEO_RESOLUTION_OUTCOMES } from "../../resolution/dataforseo/DataForSeoAtlasResolver.js";

const ALLOWED_OUTCOMES = new Set(Object.values(DATAFORSEO_RESOLUTION_OUTCOMES));

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
 * Attach Atlas resolution state to normalized DataForSEO market evidence.
 *
 * This object is intentionally pre-canonical. It preserves useful market
 * evidence even when identity is only PROBABLE, while preventing that evidence
 * from silently crossing the canonical Mercury ingestion boundary.
 */
export function createDataForSeoMarketObservationCandidate({ marketEvidence, atlasResolution } = {}) {
    requireObject(marketEvidence, "marketEvidence");
    requireObject(atlasResolution, "atlasResolution");

    if (marketEvidence.provider !== "DATAFORSEO" || marketEvidence.source !== "DATAFORSEO_GOOGLE_SHOPPING") {
        throw new TypeError("DF003-B requires normalized DataForSEO Google Shopping market evidence.");
    }

    const outcome = atlasResolution.outcome;
    if (!ALLOWED_OUTCOMES.has(outcome)) {
        throw new TypeError("DF003-B requires a valid Atlas resolution outcome.");
    }

    const atlasProductId = atlasResolution.atlasProductId ?? null;
    if ((outcome === DATAFORSEO_RESOLUTION_OUTCOMES.CONFIRMED || outcome === DATAFORSEO_RESOLUTION_OUTCOMES.PROBABLE) && !atlasProductId) {
        throw new TypeError(`${outcome} Atlas resolution requires atlasProductId.`);
    }

    const canonicalObservationEligible =
        outcome === DATAFORSEO_RESOLUTION_OUTCOMES.CONFIRMED &&
        atlasResolution.automaticMercuryEligible === true;

    return freeze({
        candidateVersion: "1.0",
        candidateType: "MERCURY_MARKET_OBSERVATION",
        marketEvidence,
        identity: {
            outcome,
            atlasProductId,
            externalProductId: atlasResolution.externalProductId ?? null,
            candidateAtlasProductIds: Array.isArray(atlasResolution.candidateAtlasProductIds)
                ? [...atlasResolution.candidateAtlasProductIds]
                : [],
            evidence: Array.isArray(atlasResolution.evidence)
                ? [...atlasResolution.evidence]
                : []
        },
        governance: {
            requiresReview: outcome !== DATAFORSEO_RESOLUTION_OUTCOMES.CONFIRMED,
            canonicalObservationEligible,
            automaticPublicationEligible: false
        }
    });
}

export default createDataForSeoMarketObservationCandidate;
