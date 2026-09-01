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
assert.equal(entries.length, 5);
assert.deepEqual(entries.map(({ brandId }) => brandId), [
    "BRAND-CORSAIR",
    "BRAND-CRUCIAL",
    "BRAND-GSKILL",
    "BRAND-KINGSTON",
    "BRAND-TEAMGROUP"
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
assert.equal(allBrands.length, 5);
assert.equal(allBrands[0], brand);
assert.equal(Object.isFrozen(allBrands), true);

assert.equal(await repository.getBySlug("CORSAIR"), brand);
assert.equal(await repository.getByDisplayName("corsair"), brand);
assert.equal(await repository.exists("brand-corsair"), true);
assert.equal(await repository.exists("BRAND-MISSING"), false);

const searchResults = await repository.search("sair");
assert.equal(searchResults.length, 1);
assert.equal(searchResults[0], brand);
assert.equal(Object.isFrozen(searchResults), true);

const validationReport = await repository.validate();
assert.equal(validationReport.valid, true);

const reloadedBrands = await repository.reload();
assert.equal(reloadedBrands.length, 5);
assert.notEqual(reloadedBrands, allBrands);

await assert.rejects(
    repository.loadBrand("BRAND-MISSING"),
    /Atlas brand not found/
);

await assert.rejects(repository.getBySlug(""), /slug must be a non-empty string/);

console.log("BrandRepository tests passed.");
