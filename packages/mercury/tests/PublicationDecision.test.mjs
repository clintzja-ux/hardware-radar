import assert from "node:assert/strict";
import { createPublicationDecision, validatePublicationDecision } from "../publication/PublicationDecision.js";
const decision = createPublicationDecision({ observationId: "mer_obs_000000001", action: "PUBLISH", reviewDecisionId: "mer_rev_000000001", authorizedBy: "operator:test", authorizedAt: "2026-08-10T15:30:00Z" });
assert.equal(decision.action, "PUBLISH");
assert.equal(decision.canonicalObservationModified, false);
assert.equal(validatePublicationDecision(decision).valid, true);
assert.throws(() => createPublicationDecision({ observationId: "mer_obs_1", action: "PUBLISH", authorizedBy: "x", authorizedAt: "2026-08-10T15:30:00Z" }), /reviewDecisionId/);
console.log("Publication decision tests passed.");
