import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { validateObservation, createObservationIdentityTuple } from "../ObservationValidator.js";

const observationUrl = new URL("../observations/mer_obs_000000001.json", import.meta.url);
const observation = JSON.parse(await readFile(fileURLToPath(observationUrl), "utf8"));
const report = validateObservation(observation);

assert.equal(report.valid, true, JSON.stringify(report.errors, null, 2));
assert.equal(observation.observationId, "mer_obs_000000001");
assert.equal(observation.atlasProductId, "ram_corsair_cmk32gx5m2b6000z30");
assert.equal(observation.retailerId, "RETAILER-0001");
assert.equal(
    createObservationIdentityTuple(observation),
    "ram_corsair_cmk32gx5m2b6000z30|retailer-0001|amazon.com|2026-07-15t20:30:00z|manual"
);

console.log("Canonical Mercury observation tests passed.");
