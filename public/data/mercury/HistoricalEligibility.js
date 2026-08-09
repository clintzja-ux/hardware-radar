export const HISTORICAL_ELIGIBILITY_POLICY_VERSION = "1.0.0";

export function evaluateHistoricalEligibility(observation) {
    const reasons = [];
    if (!observation || typeof observation !== "object") reasons.push("INVALID_OBSERVATION");
    else {
        if (observation.validationStatus !== "PASS") reasons.push("VALIDATION_NOT_PASS");
        if (!Number.isFinite(observation.offer?.price) || observation.offer.price < 0) reasons.push("INVALID_PRICE");
        if (typeof observation.offer?.currency !== "string" || !/^[A-Z]{3}$/.test(observation.offer.currency)) reasons.push("INVALID_CURRENCY");
        if (typeof observation.offer?.condition !== "string" || observation.offer.condition.length === 0) reasons.push("MISSING_CONDITION");
        if (typeof observation.atlasProductId !== "string" || observation.atlasProductId.length === 0) reasons.push("MISSING_PRODUCT_ID");
        if (!Number.isFinite(Date.parse(observation.observationTime))) reasons.push("INVALID_OBSERVATION_TIME");
    }
    return Object.freeze({ eligible: reasons.length === 0, reasons: Object.freeze(reasons), policyVersion: HISTORICAL_ELIGIBILITY_POLICY_VERSION });
}
