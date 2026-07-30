import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../../../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const [builder, generator, templates, forgeHtml, adapter, manifest] = await Promise.all([
    read("forge/services/AtlasProductBuilder.js"),
    read("forge/services/ForgeGenerator.js"),
    read("forge/services/ForgeTemplates.js"),
    read("forge/index.html"),
    read("js/atlasAdapter.js"),
    read("data/atlas/atlas-manifest.json").then(JSON.parse)
]);

assert.equal(builder.includes("buildLegacy"), false, "Forge must not generate legacy Atlas records.");
assert.equal(generator.includes("legacyAtlasProduct"), false, "Forge result must expose only the canonical Atlas product.");
assert.equal(templates.includes("createLegacyAtlasTemplate"), false, "Legacy Atlas templates must be removed.");
assert.equal(forgeHtml.includes("BRAND-0001"), false, "Forge must not offer legacy brand identifiers.");
assert.match(forgeHtml, /BRAND-CORSAIR/, "Forge must use canonical Atlas brand identifiers.");
assert.match(adapter, /data\/atlas\/Atlas\.js/, "The website adapter must consume the Atlas facade.");
assert.equal(adapter.includes("ATLAS_FILES"), false, "The website adapter must not maintain a parallel Atlas file map.");
assert.equal(manifest.repositoryStatus, "stable", "Atlas v1.0 manifest must be marked stable.");

console.log("Canonical Atlas target audit tests passed.");
