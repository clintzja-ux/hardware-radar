import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { evaluatePublicationEligibility } from "../publication/PublicationEligibility.js";

const read = async (url) => JSON.parse(await readFile(fileURLToPath(url), "utf8"));
const observation = await read(new URL("../observations/mer_obs_000000001.json", import.meta.url));
const product = await read(new URL("../../atlas/products/ram/ddr5/HR-RAM-DDR5-000001-corsair-vengeance-32gb-6000-cl30.json", import.meta.url));
const retailer = await read(new URL("../../atlas/retailers/RETAILER-0001-amazon.json", import.meta.url));
const pass = evaluatePublicationEligibility(observation, { product, retailer, freshness: { status: "CURRENT" }, confidence: { status: "HIGH" } });
assert.equal(pass.eligible, true);
const fail = evaluatePublicationEligibility(observation, { product, retailer, freshness: { status: "STALE" }, confidence: { status: "LOW" } });
assert.equal(fail.eligible, false);
assert.ok(fail.reasons.includes("FRESHNESS_NOT_ELIGIBLE"));
assert.ok(fail.reasons.includes("CONFIDENCE_NOT_ELIGIBLE"));
console.log("Publication eligibility tests passed.");
