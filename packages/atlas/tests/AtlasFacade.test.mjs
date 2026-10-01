import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Atlas } from "../Atlas.js";
import { BrandRepository } from "../BrandRepository.js";
import { CategoryRepository } from "../CategoryRepository.js";
import { ProductRepository } from "../ProductRepository.js";
import { RetailerRepository } from "../RetailerRepository.js";

async function readJson(resource) {
    return JSON.parse(await readFile(fileURLToPath(resource), "utf8"));
}

const options = {
    manifestUrl: new URL("../atlas-manifest.json", import.meta.url),
    readJson
};

const atlas = new Atlas({
    brands: new BrandRepository(options),
    categories: new CategoryRepository(options),
    products: new ProductRepository(options),
    retailers: new RetailerRepository(options)
});

assert.equal((await atlas.getBrand("brand-corsair")).displayName, "Corsair");
assert.equal((await atlas.getCategory("cat-ram")).shortName, "RAM");
assert.equal((await atlas.getProduct("RAM_CORSAIR_CMK32GX5M2B6000Z30")).identity.brand, "Corsair");
assert.equal((await atlas.getRetailer("retailer-0001")).name, "Amazon");
assert.equal((await atlas.getRetailer("retailer-0003")).name, "MemoryC");
assert.equal((await atlas.getRetailer("retailer-0004")).name, "Newegg");

const repositories = await atlas.loadRepositories();
assert.equal(repositories.brands.length, 5);
assert.equal(repositories.categories.length, 1);
assert.equal(repositories.products.length, 103);
assert.equal(repositories.retailers.length, 4);
assert.equal(Object.isFrozen(repositories), true);

const manifestReport = await atlas.validateManifest();
assert.equal(manifestReport.valid, true);

atlas.clearCaches();
console.log("Atlas facade tests passed.");
