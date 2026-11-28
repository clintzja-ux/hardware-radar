import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { BrandRepository } from "../BrandRepository.js";

async function readJson(resource) {
    return JSON.parse(await readFile(fileURLToPath(resource), "utf8"));
}

const repository = new BrandRepository({
    manifestUrl: new URL("../atlas-manifest.json", import.meta.url),
    readJson
});

const entries = await repository.listBrandEntries();
assert.equal(entries.length, 14);
assert.deepEqual(entries.map(({ brandId }) => brandId), [
    "BRAND-CORSAIR",
    "BRAND-CRUCIAL",
    "BRAND-GSKILL",
    "BRAND-KINGSTON",
    "BRAND-KLEVV",
    "BRAND-LEXAR",
    "BRAND-PATRIOT",
    "BRAND-PNY",
    "BRAND-SILICON-POWER",
    "BRAND-TEAMGROUP",
    "BRAND-TRANSCEND",
    "BRAND-TIMETEC",
    "BRAND-XPG",
    "BRAND-AGI"
]);
assert.equal(Object.isFrozen(entries), true);
assert.equal(Object.isFrozen(entries[0]), true);

const brand = await repository.loadBrand("BRAND-CORSAIR");
assert.equal(brand.displayName, "Corsair");
assert.equal(Object.isFrozen(brand), true);
assert.equal(Object.isFrozen(brand.provenance), true);
assert.equal(Object.isFrozen(brand.aliases), true);

const sameBrand = await repository.getById("BRAND-CORSAIR");
assert.equal(sameBrand, brand);

const allBrands = await repository.load();
assert.equal(allBrands.length, entries.length);
assert.equal(allBrands[0], brand);
assert.equal(Object.isFrozen(allBrands), true);

assert.equal(await repository.getBySlug("CORSAIR"), brand);
assert.equal(await repository.getByDisplayName("corsair"), brand);
const xpg = await repository.getByDisplayName("XPG");
assert.equal(xpg.brandId, "BRAND-XPG");
assert.equal(await repository.getByDisplayName(" adata "), xpg);
assert.equal(await repository.getByDisplayName("missing brand"), null);
assert.equal(await repository.exists("brand-corsair"), true);
assert.equal(await repository.exists("BRAND-MISSING"), false);

const searchResults = await repository.search("sair");
assert.equal(searchResults.length, 1);
assert.equal(searchResults[0], brand);
assert.equal(Object.isFrozen(searchResults), true);

const validationReport = await repository.validate();
assert.equal(validationReport.valid, true);

const reloadedBrands = await repository.reload();
assert.equal(reloadedBrands.length, entries.length);
assert.notEqual(reloadedBrands, allBrands);

await assert.rejects(
    repository.loadBrand("BRAND-MISSING"),
    /Atlas brand not found/
);

await assert.rejects(repository.getBySlug(""), /slug must be a non-empty string/);

const ambiguousManifestUrl = new URL("https://atlas.example/atlas-manifest.json");
const ambiguousRecords = new Map([
    [ambiguousManifestUrl.href, { brands: [
        { brandId: "BRAND-ONE", path: "brands/one.json" },
        { brandId: "BRAND-TWO", path: "brands/two.json" }
    ] }],
    ["https://atlas.example/brands/one.json", { brandId: "BRAND-ONE", displayName: "One", aliases: ["Shared"] }],
    ["https://atlas.example/brands/two.json", { brandId: "BRAND-TWO", displayName: "Two", aliases: ["shared"] }]
]);
const ambiguousRepository = new BrandRepository({
    manifestUrl: ambiguousManifestUrl,
    readJson: async (resource) => structuredClone(ambiguousRecords.get(resource.href))
});
await assert.rejects(ambiguousRepository.getByDisplayName("SHARED"), /display name is ambiguous/);

console.log("BrandRepository tests passed.");
