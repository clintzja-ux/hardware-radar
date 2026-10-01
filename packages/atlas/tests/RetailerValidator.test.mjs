import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
    RETAILER_VALIDATOR_VERSION,
    validateRetailer,
    validateRetailerRepository
} from "../RetailerValidator.js";

const retailer = JSON.parse(await readFile(fileURLToPath(new URL("../retailers/RETAILER-0001-amazon.json", import.meta.url)), "utf8"));
const report = validateRetailer(retailer);
assert.equal(report.valid, true);
assert.equal(report.errors.length, 0);
assert.equal(report.validatorVersion, RETAILER_VALIDATOR_VERSION);

const platinummicro = JSON.parse(await readFile(fileURLToPath(new URL("../retailers/RETAILER-0002-platinummicro.json", import.meta.url)), "utf8"));
const platinummicroReport = validateRetailer(platinummicro);
assert.equal(platinummicroReport.valid, true);
assert.equal(platinummicro.id, "RETAILER-0002");
assert.equal(platinummicro.name, "Platinummicro");
assert.equal(new URL(platinummicro.websiteUrl).hostname, "platinummicro.com");
const memoryc = JSON.parse(await readFile(fileURLToPath(new URL("../retailers/RETAILER-0003-memoryc.json", import.meta.url)), "utf8"));
const memorycReport = validateRetailer(memoryc);
assert.equal(memorycReport.valid, true);
assert.equal(memoryc.id, "RETAILER-0003");
assert.equal(memoryc.name, "MemoryC");
assert.equal(new URL(memoryc.websiteUrl).hostname, "www.memoryc.com");
assert.equal(memoryc.affiliateProgram.available, false);
assert.equal(memoryc.affiliateProgram.status, "unknown");
assert.equal(validateRetailerRepository([retailer, platinummicro, memoryc]).valid, true);
const newegg = JSON.parse(await readFile(fileURLToPath(new URL("../retailers/RETAILER-0004-newegg.json", import.meta.url)), "utf8"));
assert.equal(validateRetailer(newegg).valid, true);
assert.equal(newegg.id, "RETAILER-0004");
assert.equal(newegg.affiliateProgram.status, "unknown");
assert.equal(validateRetailerRepository([retailer, platinummicro, memoryc, newegg]).valid, true);

const invalid = structuredClone(retailer);
invalid.websiteUrl = "http://amazon.com";
assert.equal(validateRetailer(invalid).errors.some((entry) => entry.code === "INVALID_HTTPS_URL"), true);

const duplicate = structuredClone(retailer);
duplicate.id = "RETAILER-0002";
duplicate.slug = "amazon-two";
duplicate.name = "Amazon Two";
const repositoryReport = validateRetailerRepository([retailer, duplicate]);
assert.equal(repositoryReport.valid, false);
assert.equal(repositoryReport.errors.some((entry) => entry.code === "DUPLICATE_REPOSITORY_IDENTITY" && entry.path.includes("websiteUrl")), true);

assert.throws(() => validateRetailerRepository({}), /retailers must be an array/);
console.log("RetailerValidator tests passed.");
