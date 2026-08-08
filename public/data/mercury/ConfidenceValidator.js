import { CONFIDENCE_POLICY_SCHEMA_VERSION } from "./ConfidencePolicy.js";

const CONFIDENCE_VALIDATOR_VERSION = "mercury-confidence-validator-1.0.0";
const CONFIDENCE_STATUSES = Object.freeze(["HIGH", "MEDIUM", "LOW"]);
const PASS_FAIL = Object.freeze(["PASS", "FAIL"]);
const ADAPTER_STATES = Object.freeze(["REGISTERED", "UNREGISTERED"]);
const FRESHNESS_STATES = Object.freeze(["CURRENT", "AGING", "STALE"]);
const DECLARED_STATES = Object.freeze(["PASS", "WARN", "FAIL"]);

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

function validateClassification(name, classification, errors) {
    const path = `classifications.${name}`;
    if (!classification || typeof classification !== "object" || Array.isArray(classification)) {
        errors.push(issue("INVALID_CONFIDENCE_CLASSIFICATION", path, `${name} classification must be an object.`));
        return;
    }
    if (!PASS_FAIL.includes(classification.observationValidation)) errors.push(issue("INVALID_OBSERVATION_VALIDATION_REQUIREMENT", `${path}.observationValidation`, "Expected PASS or FAIL."));
    if (!PASS_FAIL.includes(classification.provenanceValidation)) errors.push(issue("INVALID_PROVENANCE_VALIDATION_REQUIREMENT", `${path}.provenanceValidation`, "Expected PASS or FAIL."));
    if (!ADAPTER_STATES.includes(classification.adapterRegistration)) errors.push(issue("INVALID_ADAPTER_REQUIREMENT", `${path}.adapterRegistration`, "Expected REGISTERED or UNREGISTERED."));
    if (!Array.isArray(classification.freshnessStatuses) || classification.freshnessStatuses.length === 0 || classification.freshnessStatuses.some((value) => !FRESHNESS_STATES.includes(value))) {
        errors.push(issue("INVALID_FRESHNESS_REQUIREMENT", `${path}.freshnessStatuses`, "Expected a non-empty array of canonical freshness statuses."));
    }
    if (!Array.isArray(classification.declaredValidationStatuses) || classification.declaredValidationStatuses.length === 0 || classification.declaredValidationStatuses.some((value) => !DECLARED_STATES.includes(value))) {
        errors.push(issue("INVALID_DECLARED_VALIDATION_REQUIREMENT", `${path}.declaredValidationStatuses`, "Expected a non-empty array of PASS, WARN, or FAIL."));
    }
}

export function validateConfidencePolicy(policy) {
    const errors = [];
    if (!policy || typeof policy !== "object" || Array.isArray(policy)) {
        errors.push(issue("INVALID_CONFIDENCE_POLICY", "$", "Confidence policy must be an object."));
    } else {
        if (policy.schemaVersion !== CONFIDENCE_POLICY_SCHEMA_VERSION) errors.push(issue("INVALID_CONFIDENCE_POLICY_SCHEMA", "schemaVersion", `Expected ${CONFIDENCE_POLICY_SCHEMA_VERSION}.`));
        if (!isNonEmptyString(policy.policyId)) errors.push(issue("MISSING_POLICY_ID", "policyId", "policyId must be a non-empty string."));
        if (!isNonEmptyString(policy.version)) errors.push(issue("MISSING_POLICY_VERSION", "version", "version must be a non-empty string."));
        if (policy.defaultStatus !== "LOW") errors.push(issue("INVALID_DEFAULT_CONFIDENCE", "defaultStatus", "M005 requires LOW as the fail-closed default confidence state."));
        validateClassification("HIGH", policy.classifications?.HIGH, errors);
        validateClassification("MEDIUM", policy.classifications?.MEDIUM, errors);
    }
    return deepFreeze({ valid: errors.length === 0, errors, validatorVersion: CONFIDENCE_VALIDATOR_VERSION });
}

export function validateConfidenceEvidence(evidence) {
    const errors = [];
    if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) {
        errors.push(issue("INVALID_CONFIDENCE_EVIDENCE", "$", "Confidence evidence must be an object."));
    } else {
        if (!PASS_FAIL.includes(evidence.observationValidation?.status)) errors.push(issue("INVALID_OBSERVATION_VALIDATION_EVIDENCE", "observationValidation.status", "Expected PASS or FAIL."));
        if (!PASS_FAIL.includes(evidence.provenanceValidation?.status)) errors.push(issue("INVALID_PROVENANCE_VALIDATION_EVIDENCE", "provenanceValidation.status", "Expected PASS or FAIL."));
        if (!ADAPTER_STATES.includes(evidence.adapterRegistration?.status)) errors.push(issue("INVALID_ADAPTER_EVIDENCE", "adapterRegistration.status", "Expected REGISTERED or UNREGISTERED."));
        if (!FRESHNESS_STATES.includes(evidence.freshness?.status)) errors.push(issue("INVALID_FRESHNESS_EVIDENCE", "freshness.status", "Expected CURRENT, AGING, or STALE."));
        if (!isIsoDateTime(evidence.freshness?.evaluatedAt)) errors.push(issue("INVALID_CONFIDENCE_EVALUATED_AT", "freshness.evaluatedAt", "Freshness evidence must include an explicit ISO 8601 evaluatedAt."));
        if (!DECLARED_STATES.includes(evidence.declaredValidationStatus)) errors.push(issue("INVALID_DECLARED_VALIDATION_EVIDENCE", "declaredValidationStatus", "Expected PASS, WARN, or FAIL."));
    }
    return deepFreeze({ valid: errors.length === 0, errors, validatorVersion: CONFIDENCE_VALIDATOR_VERSION });
}

export function validateConfidenceEvaluation(evidence, { policy } = {}) {
    const policyReport = validateConfidencePolicy(policy);
    const evidenceReport = validateConfidenceEvidence(evidence);
    return deepFreeze({
        valid: policyReport.valid && evidenceReport.valid,
        errors: [...policyReport.errors, ...evidenceReport.errors],
        validatorVersion: CONFIDENCE_VALIDATOR_VERSION
    });
}

export { CONFIDENCE_VALIDATOR_VERSION, CONFIDENCE_STATUSES };
