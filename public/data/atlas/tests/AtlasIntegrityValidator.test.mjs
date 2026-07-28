import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Atlas } from "../Atlas.js";
import { BrandRepository } from "../BrandRepository.js";
import { CategoryRepository } from "../CategoryRepository.js";
import { ProductRepository } from "../ProductRepository.js";
import { RetailerRepository } from "../RetailerRepository.js";
import { formatAtlasHealthReport, validateAtlasIntegrity } from "../AtlasIntegrityValidator.js";

async function readJson(resource) {
    return JSON.parse(await readFile(fileURLToPath(resource), "utf8"));
}

const options = { manifestUrl: new URL("../atlas-manifest.json", import.meta.url), readJson };
const atlas = new Atlas({
    brands: new BrandRepository(options),
    categories: new CategoryRepository(options),
    products: new ProductRepository(options),
    retailers: new RetailerRepository(options)
});

const report = await atlas.validateIntegrity();
assert.equal(report.valid, true);
assert.equal(report.status, "PASS");
assert.equal(report.brokenReferences, 0);
assert.equal(report.duplicateIdentities, 0);
assert.deepEqual(report.counts, { products: 1, brands: 1, categories: 1, retailers: 1 });
assert.equal(Object.isFrozen(report), true);

const text = await atlas.getHealthReport();
assert.match(text, /Atlas Repository Health/);
assert.match(text, /Repository Status: PASS/);
assert.equal(text, formatAtlasHealthReport(report));

const manifest = await atlas.getManifest();
const repositories = await atlas.loadRepositories();

const brokenBrandProduct = structuredClone(repositories.products[0]);
brokenBrandProduct.identity.brand = "Missing Brand";
const brokenBrandReport = validateAtlasIntegrity({
    manifest,
    ...repositories,
    products: [brokenBrandProduct]
});
assert.equal(brokenBrandReport.valid, false);
assert.equal(brokenBrandReport.errors.some((error) => error.code === "MISSING_BRAND_REFERENCE"), true);

const brokenCategoryProduct = structuredClone(repositories.products[0]);
brokenCategoryProduct.identity.productType = "gpu";
const brokenCategoryReport = validateAtlasIntegrity({
    manifest,
    ...repositories,
    products: [brokenCategoryProduct]
});
assert.equal(brokenCategoryReport.errors.some((error) => error.code === "MISSING_CATEGORY_REFERENCE"), true);

const duplicateReport = validateAtlasIntegrity({
    manifest,
    ...repositories,
    products: [repositories.products[0], structuredClone(repositories.products[0])]
});
assert.equal(duplicateReport.errors.some((error) => error.code === "DUPLICATE_REPOSITORY_IDENTITY"), true);

console.log("Atlas integrity validator tests passed.");
