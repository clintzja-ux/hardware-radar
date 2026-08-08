import assert from "node:assert/strict";
import { createFreshnessPolicy } from "../FreshnessPolicy.js";
import { validateFreshnessPolicy } from "../FreshnessValidator.js";
import defaultFreshnessPolicy from "../freshness/policies/default-policy.js";

assert.equal(validateFreshnessPolicy(defaultFreshnessPolicy).valid, true);
assert.equal(Object.isFrozen(defaultFreshnessPolicy), true);

const invalid = createFreshnessPolicy({
    policyId: "bad",
    version: "1.0.0",
    currentUntilMs: 1000,
    staleAfterMs: 1000
});
const report = validateFreshnessPolicy(invalid);
assert.equal(report.valid, false);
assert.equal(report.errors.some((entry) => entry.code === "INVALID_THRESHOLD_ORDER"), true);

console.log("Freshness policy tests passed.");
