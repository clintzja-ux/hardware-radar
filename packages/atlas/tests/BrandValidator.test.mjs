import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
    BRAND_VALIDATOR_VERSION,
    validateBrand,
    validateBrandRepository
} from "../BrandValidator.js";

const brandUrl = new URL("../brands/corsair.json", import.meta.url);
const canonicalBrand = JSON.parse(await readFile(fileURLToPath(brandUrl), "utf8"));

const validReport = validateBrand(canonicalBrand);
assert.equal(validReport.valid, true);
assert.equal(validReport.errors.length, 0);
assert.equal(validReport.validatorVersion, BRAND_VALIDATOR_VERSION);

const invalidUrlBrand = structuredClone(canonicalBrand);
invalidUrlBrand.website = "http://example.com";
const invalidUrlReport = validateBrand(invalidUrlBrand);
assert.equal(invalidUrlReport.valid, false);
assert.equal(
    invalidUrlReport.errors.some((entry) => entry.code === "INVALID_HTTPS_URL"),
    true
);

const duplicateAliasBrand = structuredClone(canonicalBrand);
duplicateAliasBrand.aliases = ["Corsair Memory", "corsair memory"];
const duplicateAliasReport = validateBrand(duplicateAliasBrand);
assert.equal(duplicateAliasReport.valid, false);
assert.equal(
    duplicateAliasReport.errors.some((entry) => entry.code === "DUPLICATE_ARRAY_ENTRY"),
    true
);

const secondBrand = structuredClone(canonicalBrand);
secondBrand.brandId = "BRAND-SECOND";
secondBrand.slug = "second";
secondBrand.displayName = "Second Brand";
secondBrand.legalName = "Second Brand, Inc.";
secondBrand.aliases = ["Corsair"];

const repositoryReport = validateBrandRepository([canonicalBrand, secondBrand]);
assert.equal(repositoryReport.valid, false);
assert.equal(
    repositoryReport.errors.some(
        (entry) => entry.code === "DUPLICATE_REPOSITORY_IDENTITY" &&
            entry.path.includes("nameOrAlias")
    ),
    true
);

assert.throws(() => validateBrandRepository({}), /brands must be an array/);

console.log("BrandValidator tests passed.");
