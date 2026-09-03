import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const schema = JSON.parse(await readFile(fileURLToPath(new URL("../schemas/observation.schema.json", import.meta.url)), "utf8"));
const required = new Set(schema.required);
for (const field of [
    "observationId", "atlasProductId", "retailerId", "observationTime", "sourceMethod",
    "lifecycleStatus", "validationStatus", "offer", "provenance", "compliance", "metadata"
]) {
    assert.equal(required.has(field), true, `Schema must require ${field}.`);
}
assert.equal(schema.properties.observationId.pattern, "^mer_obs_[0-9]{9}$");
assert.equal(schema.additionalProperties, false);
assert.equal(schema.properties.offer.properties.condition.enum.includes("UNKNOWN"), true, "Schema must support explicit UNKNOWN offer condition.");

console.log("Mercury schema contract tests passed.");
