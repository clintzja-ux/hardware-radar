import assert from "node:assert/strict";
import defaultConfidencePolicy from "../confidence/policies/default-policy.js";
import { validateConfidenceEvidence, validateConfidenceEvaluation } from "../ConfidenceValidator.js";

const evidence = {
    observationValidation: { status: "PASS" },
    provenanceValidation: { status: "PASS" },
    adapterRegistration: { status: "REGISTERED" },
    freshness: { status: "CURRENT", evaluatedAt: "2026-08-08T17:00:00Z" },
    declaredValidationStatus: "PASS"
};
assert.equal(validateConfidenceEvidence(evidence).valid, true);
assert.equal(validateConfidenceEvaluation(evidence, { policy: defaultConfidencePolicy }).valid, true);
assert.equal(validateConfidenceEvidence({ ...evidence, freshness: { status: "UNKNOWN", evaluatedAt: "bad" } }).valid, false);

console.log("Confidence validator tests passed.");
