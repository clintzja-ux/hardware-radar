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
assert.equal(entries.length, 1);
assert.equal(entries[0].atlasProductId, "ram_corsair_cmk32gx5m2b6000z30");

const product = await repository.loadProduct("ram_corsair_cmk32gx5m2b6000z30");
assert.equal(product.identity.manufacturerPartNumber, "CMK32GX5M2B6000Z30");
assert.equal(Object.isFrozen(product), true);
assert.equal(Object.isFrozen(product.extension.data.performance), true);

const sameProduct = await repository.loadProduct("ram_corsair_cmk32gx5m2b6000z30");
assert.equal(sameProduct, product);

const products = await repository.loadAllProducts({ productType: "ram" });
assert.equal(products.length, 1);
assert.equal(products[0], product);

await assert.rejects(
    repository.loadProduct("ram_missing_fixture"),
    /Atlas product not found/
);

console.log("ProductRepository tests passed.");
