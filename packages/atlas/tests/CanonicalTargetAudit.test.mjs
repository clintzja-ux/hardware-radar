import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../../../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const [builder, generator, templates, forgeHtml, marketData, main, manifest] = await Promise.all([
    read("apps/forge/services/AtlasProductBuilder.js"),
    read("apps/forge/services/ForgeGenerator.js"),
    read("apps/forge/services/ForgeTemplates.js"),
    read("apps/forge/index.html"),
    read("public/js/modules/marketData.js"),
    read("public/js/main.js"),
    read("packages/atlas/atlas-manifest.json").then(JSON.parse)
]);

assert.equal(builder.includes("buildLegacy"), false, "Forge must not generate legacy Atlas records.");
assert.equal(generator.includes("legacyAtlasProduct"), false, "Forge result must expose only the canonical Atlas product.");
assert.equal(templates.includes("createLegacyAtlasTemplate"), false, "Legacy Atlas templates must be removed.");
assert.equal(forgeHtml.includes("BRAND-0001"), false, "Forge must not offer legacy brand identifiers.");
assert.match(forgeHtml, /BRAND-CORSAIR/, "Forge must use canonical Atlas brand identifiers.");
assert.match(marketData, /market-snapshot\.json/, "Hardware Radar must consume the published intelligence artifact.");
assert.equal(main.includes("data/atlas/Atlas.js"), false, "Hardware Radar must not execute Atlas directly in the browser.");
assert.equal(manifest.repositoryStatus, "stable", "Atlas v1.0 manifest must be marked stable.");

console.log("Canonical Atlas target audit tests passed.");
