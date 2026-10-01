import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { reviewAtlasExpansionBatch } from "../AtlasBatchLifecycleReview.js";

const manifest = JSON.parse(await readFile(new URL("../atlas-manifest.json", import.meta.url), "utf8"));
const load = async entries => Promise.all(entries.map(async entry => JSON.parse(await readFile(new URL(`../${entry.path}`, import.meta.url), "utf8"))));
const canonicalProducts = await load(manifest.products);
const brands = await load(manifest.brands);
const audit = JSON.parse(await readFile(new URL("../reviews/atlas-activation-001.json", import.meta.url), "utf8"));
const products = structuredClone(canonicalProducts);
for (const product of products.filter(item => item.identity.createdBy === "system:atlas-ram-expansion-002")) {
    product.identity.recordRevision -= 1;
    product.identity.updatedAt = product.identity.createdAt;
    product.identity.updatedBy = product.identity.createdBy;
    product.governance.lifecycleStatus = "DRAFT";
    product.governance.publicationStatus = "PENDING";
    product.governance.humanReviewRequired = true;
    product.governance.reviewedBy = null;
    product.governance.reviewedAt = null;
    product.governance.changeReason = "ATLAS-RAM-EXPANSION-002 manufacturer-verified workbook admission; lifecycle activation requires separate review.";
}
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
