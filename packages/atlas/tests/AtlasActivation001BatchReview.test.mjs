import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { reviewAtlasExpansionBatch } from "../AtlasBatchLifecycleReview.js";
import { loadHistoricalAtlasSnapshot } from "./fixtures/HistoricalAtlasGitFixtures.mjs";

const beforeActivation = loadHistoricalAtlasSnapshot("0f6b3631ea82743b06c545b125e7c9fb4953e8c8");
const afterActivation = loadHistoricalAtlasSnapshot("6a5a41b25534ddc075a67145efd8f19f2a1c4175");
const canonicalProducts = afterActivation.products;
const brands = beforeActivation.brands;
const audit = JSON.parse(await readFile(new URL("../reviews/atlas-activation-001.json", import.meta.url), "utf8"));
const products = structuredClone(beforeActivation.products);
const before = structuredClone(products);
const input = { products, brands, reviewedBy: "human:Clinton_Ramsook", reviewedAt: "2026-09-04T18:00:00.000Z", reason: "ATLAS-ACTIVATION-001 authorized manufacturer-verified batch lifecycle review; no acquisition, market, price, or publication authority implied." };
const result = reviewAtlasExpansionBatch(input);

assert.deepEqual(result, reviewAtlasExpansionBatch(input));
assert.deepEqual(products, before);
assert.equal(result.decision.counts.requested, 77);
assert.equal(result.decision.counts.activated, 77);
assert.equal(result.decision.counts.blocked, 0);
assert.equal(result.outcomes.every(item => item.product.governance.lifecycleStatus === "ACTIVE" && item.product.governance.publicationStatus === "READY"), true);
assert.equal(result.outcomes.every(item => item.product.governance.humanReviewRequired === false && item.product.governance.reviewedBy === input.reviewedBy), true);
assert.equal(Object.values(result.decision.downstreamAuthority).every(value => value === false), true);
assert.equal(result.decision.providerOperations, 0);
assert.equal(result.decision.actualSpendUsd, 0);
assert.equal(result.outcomes.some(item => item.atlasProductId === "ram_corsair_cmk32gx5m2b6000z30"), false);
assert.deepEqual(audit, result.decision);
for (const outcome of result.outcomes) assert.deepEqual(canonicalProducts.find(product => product.identity.atlasProductId === outcome.atlasProductId), outcome.product);

const broken = structuredClone(products);
const target = broken.find(product => product.identity.createdBy === "system:atlas-ram-expansion-002");
target.extension.data.capacity.capacityGb += 1;
const isolated = reviewAtlasExpansionBatch({ ...input, products: broken });
assert.equal(isolated.decision.counts.activated, 76);
assert.equal(isolated.decision.counts.blocked, 1);
assert.deepEqual(isolated.outcomes.find(item => item.atlasProductId === target.identity.atlasProductId).blockers, ["CAPACITY_INVARIANT_FAILED"]);

console.log("ATLAS-ACTIVATION-001 batch lifecycle review tests passed (12 cases).");
