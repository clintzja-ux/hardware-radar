import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { validateObservation, validateObservationRepository } from "../ObservationValidator.js";

const observation = JSON.parse(await readFile(fileURLToPath(new URL("../observations/mer_obs_000000001.json", import.meta.url)), "utf8"));

const report = validateObservation(observation);
assert.equal(report.valid, true, JSON.stringify(report.errors, null, 2));
assert.equal(Object.isFrozen(report), true);

const invalid = structuredClone(observation);
delete invalid.atlasProductId;
const invalidReport = validateObservation(invalid);
assert.equal(invalidReport.valid, false);
assert.equal(invalidReport.errors.some((error) => error.path === "atlasProductId"), true);

const invalidExpiry = structuredClone(observation);
invalidExpiry.expiresAt = "2026-07-15T19:30:00Z";
const expiryReport = validateObservation(invalidExpiry);
assert.equal(expiryReport.errors.some((error) => error.code === "INVALID_DATE_ORDER"), true);

const duplicateId = structuredClone(observation);
const duplicateIdReport = validateObservationRepository([observation, duplicateId]);
assert.equal(duplicateIdReport.valid, false);
assert.equal(duplicateIdReport.errors.some((error) => error.code === "DUPLICATE_OBSERVATION_ID"), true);
assert.equal(duplicateIdReport.errors.some((error) => error.code === "DUPLICATE_OBSERVATION_TUPLE"), true);

const duplicateTuple = structuredClone(observation);
duplicateTuple.observationId = "mer_obs_000000002";
const duplicateTupleReport = validateObservationRepository([observation, duplicateTuple]);
assert.equal(duplicateTupleReport.errors.some((error) => error.code === "DUPLICATE_OBSERVATION_TUPLE"), true);

const missingReferences = validateObservationRepository([observation], {
    atlasProductIds: new Set(),
    retailerIds: new Set()
});
assert.equal(missingReferences.errors.some((error) => error.code === "UNKNOWN_ATLAS_PRODUCT"), true);
assert.equal(missingReferences.errors.some((error) => error.code === "UNKNOWN_RETAILER"), true);

console.log("ObservationValidator tests passed.");
