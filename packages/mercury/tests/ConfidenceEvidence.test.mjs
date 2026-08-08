import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { deriveConfidenceEvidence } from "../ConfidenceEvidence.js";
import adapterRegistry from "../adapters/index.js";

const observation = JSON.parse(await readFile(fileURLToPath(new URL("../observations/mer_obs_000000001.json", import.meta.url)), "utf8"));
const freshnessResult = Object.freeze({
    status: "CURRENT",
    expired: false,
    evaluatedAt: "2026-07-15T21:00:00Z",
    reason: "WITHIN_CURRENT_WINDOW",
    policyId: "test",
    policyVersion: "1.0.0"
});
const evidence = deriveConfidenceEvidence(observation, { freshnessResult, adapterRegistry });
assert.equal(evidence.observationValidation.status, "PASS");
assert.equal(evidence.provenanceValidation.status, "PASS");
assert.equal(evidence.adapterRegistration.status, "REGISTERED");
assert.equal(evidence.freshness.status, "CURRENT");
assert.equal(evidence.declaredValidationStatus, "PASS");
assert.equal(Object.isFrozen(evidence), true);

console.log("Confidence evidence tests passed.");
