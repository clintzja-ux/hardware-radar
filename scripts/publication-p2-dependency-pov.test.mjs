import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { planRamPublicationDependencies, compareRamPublicationPlan } from "./lib/ram-publication-dependency-plan.mjs";
import { classifyPublicationArtifactChange } from "../packages/sentinel/publication/PublicationReliabilityP2.js";

const sha = value => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const product = { atlasProductId: "ram_g_skill_f4_3200c16d_32gvk", publicPath: "/ram/g-skill-ripjaws-v-f4-3200c16d-32gvk/", atlasSourcePath: "packages/atlas/products/ram/ddr4/HR-RAM-DDR4-000011-g-skill-ripjaws-v-f4-3200c16d-32gvk.json" };
const plan = (changeType, identity, extra = {}) => planRamPublicationDependencies({ changeType, ...product, inputIdentity: identity, inputDigest: sha({ changeType, identity }), ...extra });

const atlas = plan("ATLAS_SPECIFICATION", "atlas:ram_g_skill_f4_3200c16d_32gvk:revision-4");
assert.deepEqual(atlas.artifactFamilies, ["ATLAS_SOURCE_RECORD", "RAM_CATALOG", "RAM_PRODUCT_PAGE", "SITEMAP"]);
assert.equal(compareRamPublicationPlan({ plan: atlas, actualChangedPaths: atlas.artifactPaths, comparisonComplete: true }).status, "DEPENDENCY_MATCH");

const current = plan("MERCURY_CURRENT", "mercury-current:fixture-offer:2026-11-21T16:00:00Z", { sitemapLastmodAdvances: false });
assert.deepEqual(current.artifactFamilies, ["RAM_CURRENT_RETAIL", "RAM_TERMINAL", "RAM_TERMINAL_PAGE", "RAM_PRODUCT_PAGE"]);
assert.equal(compareRamPublicationPlan({ plan: current, actualChangedPaths: current.artifactPaths, comparisonComplete: true }).status, "DEPENDENCY_MATCH");

const unexpected = compareRamPublicationPlan({ plan: atlas, actualChangedPaths: [...atlas.artifactPaths, "public/forge/index.html"], comparisonComplete: true });
assert.deepEqual(unexpected.unexpectedPaths, ["public/forge/index.html"]);
assert.equal(unexpected.status, "DEPENDENCY_MISMATCH");
const missing = compareRamPublicationPlan({ plan: current, actualChangedPaths: current.artifactPaths.filter(path => path !== "public/ram/terminal/index.html"), comparisonComplete: true });
assert.deepEqual(missing.missingPaths, ["public/ram/terminal/index.html"]);
assert.throws(() => planRamPublicationDependencies({ changeType: "ATLAS_SPECIFICATION", ...product, inputIdentity: "atlas", inputDigest: null }), /INPUT_DIGEST_REQUIRED/);
assert.throws(() => compareRamPublicationPlan({ plan: atlas, actualChangedPaths: atlas.artifactPaths }), /COMPARISON_INCOMPLETE/);
assert.equal(compareRamPublicationPlan({ plan: current, actualChangedPaths: current.artifactPaths, comparisonComplete: true }).replayDigest, compareRamPublicationPlan({ plan: current, actualChangedPaths: [...current.artifactPaths].reverse(), comparisonComplete: true }).replayDigest);
assert.equal(atlas.mutationAuthorized, false);

// Production-generator rehearsal: one synthetic voltage/update timestamp change produced exactly these four paths.
const atlasRehearsal = [
  "public/data/atlas/products/ram/ddr4/HR-RAM-DDR4-000011-g-skill-ripjaws-v-f4-3200c16d-32gvk.json",
  "public/data/ram-catalog.json",
  "public/ram/g-skill-ripjaws-v-f4-3200c16d-32gvk/index.html",
  "public/sitemap.xml"
];
assert.equal(compareRamPublicationPlan({ plan: atlas, actualChangedPaths: atlasRehearsal, comparisonComplete: true }).status, "DEPENDENCY_MATCH");

// The production-shaped preview adds three explicitly preview-only artifacts. The planner identifies them;
// P2's byte-delta classifier can only say that some meaningful change occurred.
const currentCore = current.artifactPaths;
const previewOnly = ["public/data/ram-market-snapshot-2026-09-30.json", "public/development-preview.json", "public/ram/market-snapshots/2026-09-30/index.html"];
const currentRehearsal = [...currentCore, ...previewOnly];
assert.equal(classifyPublicationArtifactChange({ changedPaths: currentRehearsal, comparisonComplete: true }).status, "MEANINGFUL_CHANGE");
assert.deepEqual(compareRamPublicationPlan({ plan: current, actualChangedPaths: currentRehearsal, comparisonComplete: true }).unexpectedPaths, previewOnly.sort());
console.log("P2 dependency proof-of-value tests passed: 13 cases.");
