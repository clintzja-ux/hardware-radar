import defaultFreshnessPolicy from "./freshness/policies/default-policy.js";
import { validateFreshnessEvaluation } from "./FreshnessValidator.js";

const FRESHNESS_ENGINE_VERSION = "mercury-freshness-engine-1.0.0";
const FRESHNESS_STATUSES = Object.freeze(["CURRENT", "AGING", "STALE"]);

function deepFreeze(value) {
    if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
    return value;
}

function parseOrThrow(value, name) {
    const timestamp = Date.parse(value);
    if (!Number.isFinite(timestamp)) throw new TypeError(`${name} must be a valid ISO 8601 date-time.`);
    return timestamp;
}

export class FreshnessEngine {
    constructor({ defaultPolicy = defaultFreshnessPolicy } = {}) {
        this.defaultPolicy = defaultPolicy;
    }

    evaluate(observation, { evaluatedAt, policy = this.defaultPolicy } = {}) {
        const validation = validateFreshnessEvaluation(observation, { evaluatedAt, policy });
        if (!validation.valid) {
            const error = new Error("Freshness evaluation failed validation.");
            error.name = "FreshnessEvaluationError";
            error.issues = validation.errors;
            throw error;
        }

        const observedMs = parseOrThrow(observation.observationTime, "observationTime");
        const evaluatedMs = parseOrThrow(evaluatedAt, "evaluatedAt");
        const ageMs = evaluatedMs - observedMs;
        const ageMinutes = ageMs / 60000;

        const expiresAt = observation.expiresAt ?? null;
        const expired = expiresAt !== null && evaluatedMs >= parseOrThrow(expiresAt, "expiresAt");

        let status;
        let reason;

        if (expired) {
            status = "STALE";
            reason = "EXPLICIT_EXPIRY_REACHED";
        } else if (ageMs <= policy.currentUntilMs) {
            status = "CURRENT";
            reason = "WITHIN_CURRENT_WINDOW";
        } else if (ageMs < policy.staleAfterMs) {
            status = "AGING";
            reason = "BETWEEN_CURRENT_AND_STALE_THRESHOLDS";
        } else {
            status = "STALE";
            reason = "STALE_THRESHOLD_REACHED";
        }

        return deepFreeze({
            status,
            ageMs,
            ageMinutes,
            policyId: policy.policyId,
            policyVersion: policy.version,
            evaluatedAt,
            expiresAt,
            expired,
            reason,
            engineVersion: FRESHNESS_ENGINE_VERSION
        });
    }
}

export { FRESHNESS_ENGINE_VERSION, FRESHNESS_STATUSES };
export default new FreshnessEngine();
