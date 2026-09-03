import assert from "node:assert/strict";
import { createReviewDecision, REVIEW_DECISIONS, validateReviewDecision } from "../review/ObservationReviewDecision.js";

const decision = createReviewDecision({ observationId: "mer_obs_000000123", decision: REVIEW_DECISIONS.HOLD, reviewedBy: "operator:clinton", reviewedAt: "2026-08-10T05:30:00Z", reasonCodes: ["NEEDS_SOURCE_REVIEW"], notes: "Verify source context." });
assert.equal(decision.decision, "HOLD");
assert.equal(decision.canonicalObservationModified, false);
assert.equal(Object.isFrozen(decision), true);
assert.equal(validateReviewDecision(decision).valid, true);
assert.equal(validateReviewDecision({ ...decision, decision: "PUBLISH" }).valid, false);
console.log("Observation review decision tests passed.");
