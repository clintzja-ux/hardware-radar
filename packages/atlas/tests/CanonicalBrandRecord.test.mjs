import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { validateBrand } from "../BrandValidator.js";

const schemaUrl = new URL("../schemas/Brand.schema.json", import.meta.url);
const brandPaths = ["corsair.json", "crucial.json", "gskill.json", "kingston.json", "teamgroup.json"];

const schema = JSON.parse(await readFile(fileURLToPath(schemaUrl), "utf8"));
const brands = await Promise.all(brandPaths.map(async (path) =>
    JSON.parse(await readFile(fileURLToPath(new URL(`../brands/${path}`, import.meta.url)), "utf8"))
));

assert.equal(schema.title, "Atlas Brand");
assert.equal(schema.additionalProperties, false);
for (const brand of brands) {
    assert.equal(schema.required.every((field) => field in brand), true);
    assert.equal(Object.keys(brand).every((field) => schema.required.includes(field)), true);
    const report = validateBrand(brand);
    assert.equal(report.valid, true, JSON.stringify(report.errors, null, 2));
    assert.equal(brand.status, "ACTIVE");
    assert.equal(brand.provenance.verificationStatus, "VERIFIED");
}
assert.equal(brands[0].brandId, "BRAND-CORSAIR");
assert.equal(brands[0].slug, "corsair");
assert.equal(brands[2].displayName, "G.SKILL");

console.log("Canonical brand record tests passed.");
