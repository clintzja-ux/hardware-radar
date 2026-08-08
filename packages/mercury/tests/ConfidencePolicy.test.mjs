import assert from "node:assert/strict";
import defaultConfidencePolicy from "../confidence/policies/default-policy.js";
import { createConfidencePolicy } from "../ConfidencePolicy.js";
import { validateConfidencePolicy } from "../ConfidenceValidator.js";

assert.equal(validateConfidencePolicy(defaultConfidencePolicy).valid, true);
assert.equal(Object.isFrozen(defaultConfidencePolicy), true);

const invalid = createConfidencePolicy({
    policyId: "broken",
    version: "1.0.0",
    high: {},
    medium: {},
    defaultStatus: "HIGH"
});
assert.equal(validateConfidencePolicy(invalid).valid, false);

console.log("Confidence policy tests passed.");
