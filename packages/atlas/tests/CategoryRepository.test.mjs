import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { CategoryRepository } from "../CategoryRepository.js";

async function readJson(resource) {
    return JSON.parse(await readFile(fileURLToPath(resource), "utf8"));
}

const repository = new CategoryRepository({
    manifestUrl: new URL("../atlas-manifest.json", import.meta.url),
    readJson
});

const entries = await repository.listCategoryEntries();
assert.equal(entries.length, 1);
assert.equal(entries[0].categoryId, "CAT-RAM");
assert.equal(Object.isFrozen(entries), true);
assert.equal(Object.isFrozen(entries[0]), true);

const category = await repository.loadCategory("CAT-RAM");
assert.equal(category.shortName, "RAM");
assert.equal(Object.isFrozen(category), true);
assert.equal(Object.isFrozen(category.provenance), true);
assert.equal(Object.isFrozen(category.aliases), true);

assert.equal(await repository.getById("cat-ram"), category);
assert.equal(await repository.getBySlug("RAM"), category);
assert.equal(await repository.getByProductType("RAM"), category);
assert.equal(await repository.exists("CAT-RAM"), true);
assert.equal(await repository.exists("CAT-MISSING"), false);

const searchResults = await repository.search("memory");
assert.equal(searchResults.length, 1);
assert.equal(searchResults[0], category);
assert.equal(Object.isFrozen(searchResults), true);

const validationReport = await repository.validate();
assert.equal(validationReport.valid, true);

const firstLoad = await repository.getAll();
const reloaded = await repository.reload();
assert.equal(reloaded.length, 1);
assert.notEqual(reloaded, firstLoad);

await assert.rejects(repository.loadCategory("CAT-MISSING"), /Atlas category not found/);
await assert.rejects(repository.getBySlug(""), /slug must be a non-empty string/);

console.log("CategoryRepository tests passed.");
