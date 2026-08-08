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
const freshnessPolicy = createFreshnessPolicy({
    policyId: "confidence-integration-freshness",
    version: "1.0.0",
    currentUntilMs: 60 * 60 * 1000,
    staleAfterMs: 24 * 60 * 60 * 1000
});
const mercury = new Mercury({ observations: repository, freshness: new FreshnessEngine({ defaultPolicy: freshnessPolicy }) });
const result = await mercury.evaluateObservationConfidence("mer_obs_000000001", {
    evaluatedAt: "2026-07-15T21:00:00Z"
});
assert.equal(result.status, "HIGH");
assert.equal(result.evidence.freshness.status, "CURRENT");
assert.equal(result.evidence.adapterRegistration.status, "REGISTERED");
await assert.rejects(
    () => mercury.evaluateObservationConfidence("mer_obs_999999999", { evaluatedAt: "2026-07-15T21:00:00Z" }),
    /Mercury observation not found/
);

console.log("Confidence integration tests passed.");
