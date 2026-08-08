import defaultConfidencePolicy from "./confidence/policies/default-policy.js";
import { validateConfidenceEvaluation } from "./ConfidenceValidator.js";

const CONFIDENCE_ENGINE_VERSION = "mercury-confidence-engine-1.0.0";

function deepFreeze(value) {
    if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
    return value;
}

function matches(evidence, classification) {
    return evidence.observationValidation.status === classification.observationValidation &&
        evidence.provenanceValidation.status === classification.provenanceValidation &&
        evidence.adapterRegistration.status === classification.adapterRegistration &&
        classification.freshnessStatuses.includes(evidence.freshness.status) &&
        classification.declaredValidationStatuses.includes(evidence.declaredValidationStatus);
}

function reasonsFor(evidence) {
    return [
        {
            code: evidence.observationValidation.status === "PASS" ? "CONF_OBSERVATION_VALID" : "CONF_OBSERVATION_INVALID",
            signal: "observationValidation",
            outcome: evidence.observationValidation.status,
            message: evidence.observationValidation.status === "PASS" ? "Observation passed canonical structural validation." : "Observation failed canonical structural validation."
        },
        {
            code: evidence.provenanceValidation.status === "PASS" ? "CONF_PROVENANCE_VALID" : "CONF_PROVENANCE_INVALID",
            signal: "provenanceValidation",
            outcome: evidence.provenanceValidation.status,
            message: evidence.provenanceValidation.status === "PASS" ? "Provenance lineage passed validation." : "Provenance lineage failed validation."
        },
        {
            code: evidence.adapterRegistration.status === "REGISTERED" ? "CONF_ADAPTER_REGISTERED" : "CONF_ADAPTER_UNREGISTERED",
            signal: "adapterRegistration",
            outcome: evidence.adapterRegistration.status,
            message: evidence.adapterRegistration.status === "REGISTERED" ? "Observation transformation adapter is registered." : "Observation transformation adapter is not registered."
        },
        {
            code: `CONF_FRESHNESS_${evidence.freshness.status}`,
            signal: "freshness",
            outcome: evidence.freshness.status,
            message: `Observation freshness is ${evidence.freshness.status}.`
        },
        {
            code: `CONF_DECLARED_VALIDATION_${evidence.declaredValidationStatus}`,
            signal: "declaredValidationStatus",
            outcome: evidence.declaredValidationStatus,
            message: `Observation declares validation status ${evidence.declaredValidationStatus}.`
        }
    ].map((entry) => deepFreeze(entry));
}

export class ConfidenceEngine {
    constructor({ defaultPolicy = defaultConfidencePolicy } = {}) {
        this.defaultPolicy = defaultPolicy;
    }

    evaluate(evidence, { policy = this.defaultPolicy } = {}) {
        const validation = validateConfidenceEvaluation(evidence, { policy });
        if (!validation.valid) {
            const error = new Error("Confidence evaluation failed validation.");
            error.name = "ConfidenceEvaluationError";
            error.issues = validation.errors;
            throw error;
        }

        let status = policy.defaultStatus;
        if (matches(evidence, policy.classifications.HIGH)) status = "HIGH";
        else if (matches(evidence, policy.classifications.MEDIUM)) status = "MEDIUM";

        return deepFreeze({
            status,
            policyId: policy.policyId,
            policyVersion: policy.version,
            evaluatedAt: evidence.freshness.evaluatedAt,
            evidence,
            reasons: reasonsFor(evidence),
            engineVersion: CONFIDENCE_ENGINE_VERSION
        });
    }
}

export { CONFIDENCE_ENGINE_VERSION };
export default new ConfidenceEngine();
