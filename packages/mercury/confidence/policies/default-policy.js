import { createConfidencePolicy } from "../../ConfidencePolicy.js";

export const defaultConfidencePolicy = createConfidencePolicy({
    policyId: "mercury-default-confidence",
    version: "1.0.0",
    high: {
        observationValidation: "PASS",
        provenanceValidation: "PASS",
        adapterRegistration: "REGISTERED",
        freshnessStatuses: ["CURRENT"],
        declaredValidationStatuses: ["PASS"]
    },
    medium: {
        observationValidation: "PASS",
        provenanceValidation: "PASS",
        adapterRegistration: "REGISTERED",
        freshnessStatuses: ["CURRENT", "AGING"],
        declaredValidationStatuses: ["PASS", "WARN"]
    },
    defaultStatus: "LOW",
    description: "Development policy for explainable categorical confidence. No numeric score is assigned."
});

export default defaultConfidencePolicy;
