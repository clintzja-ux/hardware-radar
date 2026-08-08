import assert from "node:assert/strict";
import { validateFreshnessEvaluation } from "../FreshnessValidator.js";
import defaultFreshnessPolicy from "../freshness/policies/default-policy.js";

const observation = {
    observationTime: "2026-08-08T12:00:00Z",
    expiresAt: null
};

assert.equal(validateFreshnessEvaluation(observation, {
    evaluatedAt: "2026-08-08T12:15:00Z",
    policy: defaultFreshnessPolicy
}).valid, true);

const futureReport = validateFreshnessEvaluation(observation, {
    evaluatedAt: "2026-08-08T11:59:59Z",
    policy: defaultFreshnessPolicy
});
assert.equal(futureReport.valid, false);
assert.equal(futureReport.errors.some((entry) => entry.code === "EVALUATION_PRECEDES_OBSERVATION"), true);

const missingClock = validateFreshnessEvaluation(observation, {
    policy: defaultFreshnessPolicy
});
assert.equal(missingClock.valid, false);
assert.equal(missingClock.errors.some((entry) => entry.code === "INVALID_EVALUATION_TIME"), true);

console.log("Freshness validator tests passed.");
