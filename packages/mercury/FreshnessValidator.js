const FRESHNESS_VALIDATOR_VERSION = "mercury-freshness-validator-1.0.0";

function deepFreeze(value) {
    if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
    return value;
}

function issue(code, path, message) {
    return Object.freeze({ code, path, message });
}

function isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
}

function isIsoDateTime(value) {
    return isNonEmptyString(value) && Number.isFinite(Date.parse(value)) && value.includes("T");
}

export function validateFreshnessPolicy(policy) {
    const errors = [];

    if (!policy || typeof policy !== "object" || Array.isArray(policy)) {
        errors.push(issue("INVALID_FRESHNESS_POLICY", "$", "Freshness policy must be an object."));
    } else {
        if (!isNonEmptyString(policy.policyId)) errors.push(issue("MISSING_POLICY_ID", "policyId", "policyId must be a non-empty string."));
        if (!isNonEmptyString(policy.version)) errors.push(issue("MISSING_POLICY_VERSION", "version", "version must be a non-empty string."));
        if (!Number.isFinite(policy.currentUntilMs) || policy.currentUntilMs < 0) {
            errors.push(issue("INVALID_CURRENT_THRESHOLD", "currentUntilMs", "currentUntilMs must be a non-negative finite number."));
        }
        if (!Number.isFinite(policy.staleAfterMs) || policy.staleAfterMs <= 0) {
            errors.push(issue("INVALID_STALE_THRESHOLD", "staleAfterMs", "staleAfterMs must be a positive finite number."));
        }
        if (Number.isFinite(policy.currentUntilMs) && Number.isFinite(policy.staleAfterMs) && policy.staleAfterMs <= policy.currentUntilMs) {
            errors.push(issue("INVALID_THRESHOLD_ORDER", "staleAfterMs", "staleAfterMs must be greater than currentUntilMs."));
        }
    }

    return deepFreeze({
        valid: errors.length === 0,
        errors,
        validatorVersion: FRESHNESS_VALIDATOR_VERSION
    });
}

export function validateFreshnessEvaluation(observation, { evaluatedAt, policy } = {}) {
    const errors = [...validateFreshnessPolicy(policy).errors];

    if (!observation || typeof observation !== "object" || Array.isArray(observation)) {
        errors.push(issue("INVALID_OBSERVATION", "observation", "Observation must be an object."));
    } else {
        if (!isIsoDateTime(observation.observationTime)) {
            errors.push(issue("INVALID_OBSERVATION_TIME", "observation.observationTime", "observationTime must be an ISO 8601 date-time."));
        }
        if (observation.expiresAt !== null && observation.expiresAt !== undefined && !isIsoDateTime(observation.expiresAt)) {
            errors.push(issue("INVALID_EXPIRY_TIME", "observation.expiresAt", "expiresAt must be null or an ISO 8601 date-time."));
        }
    }

    if (!isIsoDateTime(evaluatedAt)) {
        errors.push(issue("INVALID_EVALUATION_TIME", "evaluatedAt", "evaluatedAt must be an explicit ISO 8601 date-time."));
    }

    if (
        observation &&
        isIsoDateTime(observation.observationTime) &&
        isIsoDateTime(evaluatedAt) &&
        Date.parse(evaluatedAt) < Date.parse(observation.observationTime)
    ) {
        errors.push(issue("EVALUATION_PRECEDES_OBSERVATION", "evaluatedAt", "evaluatedAt must not precede observationTime."));
    }

    return deepFreeze({
        valid: errors.length === 0,
        errors,
        validatorVersion: FRESHNESS_VALIDATOR_VERSION
    });
}

export { FRESHNESS_VALIDATOR_VERSION };
