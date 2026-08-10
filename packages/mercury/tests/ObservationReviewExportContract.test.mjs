import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(fileURLToPath(new URL("../../../", import.meta.url)));
const script = await readFile(path.join(repoRoot, "scripts", "export-observation-review.mjs"), "utf8");
const pkg = JSON.parse(await readFile(path.join(repoRoot, "package.json"), "utf8"));
assert.equal(script.includes("FileObservationAcceptanceRepository"), true);
assert.equal(script.includes("ObservationReviewService"), true);
assert.equal(pkg.scripts["review:export"], "node scripts/export-observation-review.mjs");
console.log("Observation review export contract tests passed.");
