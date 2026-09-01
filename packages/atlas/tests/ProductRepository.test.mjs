import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { ProductRepository } from "../ProductRepository.js";

async function readJson(resource) {
    return JSON.parse(await readFile(fileURLToPath(resource), "utf8"));
}

const repository = new ProductRepository({
    manifestUrl: new URL("../atlas-manifest.json", import.meta.url),
    readJson
});

const entries = await repository.listProductEntries();
assert.equal(entries.length, 22);
assert.equal(entries[0].atlasProductId, "ram_corsair_cmk32gx5m2b6000z30");
assert.equal(Object.isFrozen(entries), true);
assert.equal(Object.isFrozen(entries[0]), true);

const product = await repository.loadProduct("RAM_CORSAIR_CMK32GX5M2B6000Z30");
assert.equal(product.identity.manufacturerPartNumber, "CMK32GX5M2B6000Z30");
assert.equal(Object.isFrozen(product), true);
assert.equal(Object.isFrozen(product.extension.data.performance), true);

assert.equal(await repository.getById("ram_corsair_cmk32gx5m2b6000z30"), product);
assert.equal(await repository.getBySlug("corsair-vengeance-ddr5-32gb-6000-cl30-grey"), product);
assert.equal(await repository.getByManufacturerPartNumber("cmk32gx5m2b6000z30"), product);
assert.equal(await repository.exists("RAM_CORSAIR_CMK32GX5M2B6000Z30"), true);
assert.equal(await repository.exists("ram_missing_fixture"), false);

const allProducts = await repository.load();
assert.equal(allProducts.length, 22);
assert.equal(allProducts[0], product);
assert.equal(Object.isFrozen(allProducts), true);

const filteredProducts = await repository.getAll({ productType: "RAM" });
assert.equal(filteredProducts.length, 22);
assert.equal(filteredProducts[0], product);
assert.equal(Object.isFrozen(filteredProducts), true);

const searchResults = await repository.search("vengeance");
assert.equal(searchResults.length, 4);
assert.equal(searchResults[0], product);
assert.equal(Object.isFrozen(searchResults), true);

const validationReport = await repository.validate();
assert.equal(validationReport.valid, true);

const reloadedProducts = await repository.reload();
assert.equal(reloadedProducts.length, 22);
assert.notEqual(reloadedProducts, allProducts);

await assert.rejects(repository.loadProduct("ram_missing_fixture"), /Atlas product not found/);
await assert.rejects(repository.getBySlug(""), /slug must be a non-empty string/);

console.log("ProductRepository tests passed.");
