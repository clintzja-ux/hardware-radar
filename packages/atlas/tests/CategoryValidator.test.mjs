import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
    CATEGORY_VALIDATOR_VERSION,
    validateCategory,
    validateCategoryRepository
} from "../CategoryValidator.js";

const category = JSON.parse(await readFile(fileURLToPath(new URL("../categories/ram.json", import.meta.url)), "utf8"));
const report = validateCategory(category);
assert.equal(report.valid, true);
assert.equal(report.errors.length, 0);
assert.equal(report.validatorVersion, CATEGORY_VALIDATOR_VERSION);

const invalid = structuredClone(category);
invalid.slug = "Memory RAM";
assert.equal(validateCategory(invalid).errors.some((entry) => entry.code === "INVALID_SLUG"), true);

const duplicate = structuredClone(category);
duplicate.categoryId = "CAT-MEMORY";
duplicate.slug = "memory";
duplicate.displayName = "Memory";
duplicate.shortName = "Memory";
duplicate.aliases = ["RAM"];
const repositoryReport = validateCategoryRepository([category, duplicate]);
assert.equal(repositoryReport.valid, false);
assert.equal(repositoryReport.errors.some((entry) => entry.code === "DUPLICATE_REPOSITORY_IDENTITY"), true);

const orphan = structuredClone(category);
orphan.categoryId = "CAT-CHILD";
orphan.slug = "child";
orphan.displayName = "Child";
orphan.shortName = "Child";
orphan.aliases = [];
orphan.parentCategoryId = "CAT-MISSING";
assert.equal(validateCategoryRepository([category, orphan]).errors.some((entry) => entry.code === "MISSING_PARENT_CATEGORY"), true);

assert.throws(() => validateCategoryRepository({}), /categories must be an array/);
console.log("CategoryValidator tests passed.");
