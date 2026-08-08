import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Mercury } from "../Mercury.js";
import { ObservationRepository } from "../ObservationRepository.js";
import { FreshnessEngine } from "../FreshnessEngine.js";
import { createFreshnessPolicy } from "../FreshnessPolicy.js";

async function readJson(resource) {
    return JSON.parse(await readFile(fileURLToPath(resource), "utf8"));
}

const repository = new ObservationRepository({
    manifestUrl: new URL("../mercury-manifest.json", import.meta.url),
    readJson
});
const policy = createFreshnessPolicy({
    policyId: "integration-policy",
    version: "1.0.0",
    currentUntilMs: 60 * 60 * 1000,
    staleAfterMs: 24 * 60 * 60 * 1000
});
const mercury = new Mercury({ observations: repository, freshness: new FreshnessEngine({ defaultPolicy: policy }) });

const result = await mercury.evaluateObservationFreshness("mer_obs_000000001", {
    evaluatedAt: "2026-07-15T21:00:00Z"
});
assert.equal(result.status, "CURRENT");
assert.equal(result.ageMinutes, 30);
assert.equal(result.policyId, "integration-policy");


console.log("Freshness integration tests passed.");
