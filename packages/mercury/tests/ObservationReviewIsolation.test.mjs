import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createReviewDecision } from "../review/ObservationReviewDecision.js";

const repoRoot = path.resolve(fileURLToPath(new URL("../../../", import.meta.url)));
const before = { observationId: "mer_obs_000000123", offer: { price: 88.5 }, validationStatus: "PASS" };
const snapshot = structuredClone(before);
createReviewDecision({ observationId: before.observationId, decision: "REVIEWED", reviewedBy: "operator:test", reviewedAt: "2026-08-10T05:30:00Z" });
assert.deepEqual(before, snapshot);

const panel = await readFile(path.join(repoRoot, "apps", "forge", "components", "ObservationReviewPanel.js"), "utf8");
assert.equal(panel.includes("canonicalObservationModified: false"), true);
assert.equal(panel.includes("PUBLISH"), false);
assert.equal(panel.includes("fetch("), false);
console.log("Observation review isolation tests passed.");
