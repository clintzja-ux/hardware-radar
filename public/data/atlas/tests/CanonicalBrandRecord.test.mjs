import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { validateBrand } from "../BrandValidator.js";

const schemaUrl = new URL("../schemas/Brand.schema.json", import.meta.url);
const brandUrl = new URL("../brands/corsair.json", import.meta.url);

const schema = JSON.parse(await readFile(fileURLToPath(schemaUrl), "utf8"));
const brand = JSON.parse(await readFile(fileURLToPath(brandUrl), "utf8"));

assert.equal(schema.title, "Atlas Brand");
assert.equal(schema.additionalProperties, false);
assert.equal(schema.required.every((field) => field in brand), true);
assert.equal(Object.keys(brand).every((field) => schema.required.includes(field)), true);

const report = validateBrand(brand);
assert.equal(report.valid, true, JSON.stringify(report.errors, null, 2));
assert.equal(brand.brandId, "BRAND-CORSAIR");
assert.equal(brand.slug, "corsair");
assert.equal(brand.status, "ACTIVE");
assert.equal(brand.provenance.verificationStatus, "VERIFIED");

console.log("Canonical brand record tests passed.");
