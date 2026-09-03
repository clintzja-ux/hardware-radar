import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { validateManifest } from "../ManifestValidator.js";

const manifest = JSON.parse(await readFile(fileURLToPath(new URL("../atlas-manifest.json", import.meta.url)), "utf8"));
const report = validateManifest(manifest);
assert.equal(report.valid, true);
assert.equal(report.errors.length, 0);
assert.equal(Object.isFrozen(report), true);

const brokenCounts = structuredClone(manifest);
brokenCounts.counts.products = 99;
const countReport = validateManifest(brokenCounts);
assert.equal(countReport.valid, false);
assert.equal(countReport.errors.some((error) => error.code === "COUNT_MISMATCH"), true);

const duplicateManifest = structuredClone(manifest);
duplicateManifest.brands.push({ ...duplicateManifest.brands[0] });
duplicateManifest.counts.brands = manifest.counts.brands + 1;
const duplicateReport = validateManifest(duplicateManifest);
assert.equal(duplicateReport.valid, false);
assert.equal(duplicateReport.errors.some((error) => error.code === "DUPLICATE_ENTRY_ID"), true);
assert.equal(duplicateReport.errors.some((error) => error.code === "DUPLICATE_ENTRY_PATH"), true);

console.log("ManifestValidator tests passed.");
