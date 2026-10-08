import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { reviewAtlasExpansionBatch } from "../AtlasBatchLifecycleReview.js";

const manifest = JSON.parse(await readFile(new URL("../atlas-manifest.json", import.meta.url), "utf8"));
const load = async entries => Promise.all(entries.map(async entry => JSON.parse(await readFile(new URL(`../${entry.path}`, import.meta.url), "utf8"))));
const canonicalProducts = await load(manifest.products);
const brands = await load(manifest.brands);
const cohort = canonicalProducts.filter(product => product.identity.createdBy === "system:atlas-ram-manufacturer-first-cohort-admission-p1");
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
  product.governance.changeReason = "ATLAS_RAM_MANUFACTURER_FIRST_COHORT_ADMISSION_REVIEW_P1 manufacturer-evidence admission; retailer identity and all downstream authority remain separate.";
}

const input = {
  products,
  brands,
  reviewedBy: "human:Clinton_Ramsook",
  reviewedAt: "2026-10-05T00:00:00.000Z",
  reason: "ATLAS_RAM_MANUFACTURER_FIRST_COHORT_LIFECYCLE_REVIEW_AND_ACTIVATION_P1 operator-approved lifecycle review; no retailer, market, destination, publication, or release authority implied.",
  authorizedProductIds,
  sourceSet: "system:atlas-ram-manufacturer-first-cohort-admission-p1",
  expectedCount: 21,
  policyVersion: "ATLAS-RAM-MANUFACTURER-FIRST-COHORT-ACTIVATION-P1-1.0"
};

const result = reviewAtlasExpansionBatch(input);
assert.deepEqual(result, reviewAtlasExpansionBatch(input));
assert.equal(result.decision.decisionId, "atlas_batchreview_8d2b4de16ae6f93f088f495c");
assert.deepEqual(result.decision.counts, { requested: 21, activated: 21, blocked: 0 });
assert.equal(result.outcomes.every(outcome => outcome.product.governance.lifecycleStatus === "ACTIVE" && outcome.product.governance.publicationStatus === "READY"), true);
assert.equal(result.outcomes.every(outcome => outcome.product.governance.humanReviewRequired === false), true);
assert.equal(Object.values(result.decision.downstreamAuthority).every(value => value === false), true);
for (const outcome of result.outcomes) assert.deepEqual(canonicalProducts.find(product => product.identity.atlasProductId === outcome.atlasProductId), outcome.product);

const broken = structuredClone(products);
broken.find(product => product.identity.atlasProductId === authorizedProductIds[0]).extension.data.capacity.capacityGb += 1;
const isolated = reviewAtlasExpansionBatch({ ...input, products: broken });
assert.deepEqual(isolated.decision.counts, { requested: 21, activated: 20, blocked: 1 });
assert.deepEqual(isolated.outcomes.find(outcome => outcome.status === "BLOCKED").blockers, ["CAPACITY_INVARIANT_FAILED"]);
await assert.rejects(async () => reviewAtlasExpansionBatch({ ...input, authorizedProductIds: [...authorizedProductIds, "ram_unrelated"] }), /ATLAS_EXPANSION_REVIEW_SET_INVALID|ATLAS_BATCH_REVIEW_AUTHORITY_INVALID/);

console.log("Atlas RAM manufacturer-first cohort lifecycle review tests passed (21 records). ");
