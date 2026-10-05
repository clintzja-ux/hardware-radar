import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { reviewAtlasExpansionBatch } from "../AtlasBatchLifecycleReview.js";

const manifest = JSON.parse(await readFile(new URL("../atlas-manifest.json", import.meta.url), "utf8"));
const load = async entries => Promise.all(entries.map(async entry => JSON.parse(await readFile(new URL(`../${entry.path}`, import.meta.url), "utf8"))));
const canonicalProducts = await load(manifest.products);
const brands = await load(manifest.brands);
const cohort = canonicalProducts.filter(product => product.identity.createdBy === "system:atlas-ram-coverage-expansion-batch-a-p1");
const authorizedProductIds = cohort.map(product => product.identity.atlasProductId);
const products = structuredClone(canonicalProducts);
for (const product of products.filter(item => authorizedProductIds.includes(item.identity.atlasProductId))) {
  product.identity.recordRevision -= 1;
  product.identity.updatedAt = product.identity.createdAt;
  product.identity.updatedBy = product.identity.createdBy;
  product.governance.lifecycleStatus = "DRAFT";
  product.governance.publicationStatus = "PENDING";
  product.governance.humanReviewRequired = true;
  product.governance.reviewedBy = null;
  product.governance.reviewedAt = null;
}
const input = { products, brands, reviewedBy:"human:Clinton_Ramsook", reviewedAt:"2026-10-05T00:04:19.402Z", reason:"ATLAS_RAM_COVERAGE_EXPANSION_BATCH_A_LIFECYCLE_REVIEW_AND_ACTIVATION_P1 operator-approved lifecycle review; no acquisition, market, destination, publication, or release authority implied.", authorizedProductIds, sourceSet:"system:atlas-ram-coverage-expansion-batch-a-p1", expectedCount:25, policyVersion:"ATLAS-RAM-COVERAGE-EXPANSION-BATCH-A-ACTIVATION-P1-1.0" };
const result = reviewAtlasExpansionBatch(input);

assert.deepEqual(result, reviewAtlasExpansionBatch(input));
assert.deepEqual(result.decision.counts, { requested:25, activated:25, blocked:0 });
assert.equal(result.outcomes.every(outcome => outcome.product.governance.lifecycleStatus === "ACTIVE" && outcome.product.governance.publicationStatus === "READY"), true);
assert.equal(result.outcomes.every(outcome => outcome.product.governance.humanReviewRequired === false), true);
assert.equal(Object.values(result.decision.downstreamAuthority).every(value => value === false), true);
for (const outcome of result.outcomes) assert.deepEqual(canonicalProducts.find(product => product.identity.atlasProductId === outcome.atlasProductId), outcome.product);

const broken = structuredClone(products);
broken.find(product => product.identity.atlasProductId === authorizedProductIds[0]).extension.data.capacity.capacityGb += 1;
const isolated = reviewAtlasExpansionBatch({ ...input, products:broken });
assert.deepEqual(isolated.decision.counts, { requested:25, activated:24, blocked:1 });
assert.deepEqual(isolated.outcomes.find(outcome => outcome.status === "BLOCKED").blockers, ["CAPACITY_INVARIANT_FAILED"]);

await assert.rejects(async () => reviewAtlasExpansionBatch({ ...input, authorizedProductIds:[...authorizedProductIds,"ram_unrelated"] }), /ATLAS_EXPANSION_REVIEW_SET_INVALID|ATLAS_BATCH_REVIEW_AUTHORITY_INVALID/);
console.log("ATLAS RAM coverage expansion Batch A lifecycle review tests passed (25 records).");
