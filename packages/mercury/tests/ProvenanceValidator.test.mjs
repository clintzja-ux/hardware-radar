import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { validateProvenance } from "../ProvenanceValidator.js";

const observation = JSON.parse(await readFile(fileURLToPath(new URL("../observations/mer_obs_000000001.json", import.meta.url)), "utf8"));
const report = validateProvenance(observation.provenance, {
    observationTime: observation.observationTime,
    sourceMethod: observation.sourceMethod,
    marketplace: observation.marketplace
});
assert.equal(report.valid, true, JSON.stringify(report.errors, null, 2));

const mismatch = structuredClone(observation.provenance);
mismatch.source.marketplace = "amazon.co.uk";
const mismatchReport = validateProvenance(mismatch, { marketplace: "amazon.com" });
assert.equal(mismatchReport.errors.some((error) => error.code === "PROVENANCE_MARKETPLACE_MISMATCH"), true);

const badOrder = structuredClone(observation.provenance);
badOrder.transformation.normalizedAt = "2026-07-15T19:00:00Z";
const orderReport = validateProvenance(badOrder);
assert.equal(orderReport.errors.some((error) => error.code === "PROVENANCE_DATE_ORDER"), true);

console.log("Provenance validator tests passed.");
