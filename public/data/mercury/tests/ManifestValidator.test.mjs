import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { validateMercuryManifest } from "../ManifestValidator.js";

const manifest = JSON.parse(await readFile(fileURLToPath(new URL("../mercury-manifest.json", import.meta.url)), "utf8"));
const report = validateMercuryManifest(manifest);
assert.equal(report.valid, true, JSON.stringify(report.errors, null, 2));
assert.equal(Object.isFrozen(report), true);

const brokenCount = structuredClone(manifest);
brokenCount.counts.observations = 99;
assert.equal(validateMercuryManifest(brokenCount).errors.some((error) => error.code === "COUNT_MISMATCH"), true);

const duplicate = structuredClone(manifest);
duplicate.observations.push({ ...duplicate.observations[0] });
duplicate.counts.observations = 2;
const duplicateReport = validateMercuryManifest(duplicate);
assert.equal(duplicateReport.errors.some((error) => error.code === "DUPLICATE_ENTRY_ID"), true);
assert.equal(duplicateReport.errors.some((error) => error.code === "DUPLICATE_ENTRY_PATH"), true);

console.log("Mercury ManifestValidator tests passed.");
