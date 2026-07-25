import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
    validateProduct,
    validateRepository
} from "../ProductValidator.js";

const productUrl = new URL(
    "../products/ram/ddr5/HR-RAM-DDR5-000001-corsair-vengeance-32gb-6000-cl30.json",
    import.meta.url
);
const product = JSON.parse(await readFile(fileURLToPath(productUrl), "utf8"));

const report = validateProduct(product);
assert.equal(report.valid, true, JSON.stringify(report.errors, null, 2));
assert.equal(report.errors.length, 0);
assert.equal(Object.isFrozen(report), true);

const invalid = structuredClone(product);
delete invalid.identity.slug;
const invalidReport = validateProduct(invalid);
assert.equal(invalidReport.valid, false);
assert.equal(invalidReport.errors.some((error) => error.path === "identity.slug"), true);

const duplicate = structuredClone(product);
duplicate.identity.atlasProductId = "ram_corsair_duplicate_fixture";
const repositoryReport = validateRepository([product, duplicate]);
assert.equal(repositoryReport.valid, false);
assert.equal(
    repositoryReport.errors.some((error) => error.code === "DUPLICATE_REPOSITORY_IDENTITY"),
    true
);

console.log("ProductValidator tests passed.");
