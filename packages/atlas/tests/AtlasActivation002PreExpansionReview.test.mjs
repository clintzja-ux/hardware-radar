import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { ATLAS_PRE_EXPANSION_PRODUCT_IDS, reviewAtlasPreExpansionBatch } from "../AtlasPreExpansionLifecycleReview.js";
import { loadHistoricalAtlasSnapshot } from "./fixtures/HistoricalAtlasGitFixtures.mjs";

const beforeActivation = loadHistoricalAtlasSnapshot("67861da70f042ed71396f3a6b0794266cdfc6dba");
const afterActivation = loadHistoricalAtlasSnapshot("149d4fa44f2adf586379cd03e785b781ea193d8d");
const canonicalProducts = afterActivation.products;
const brands = beforeActivation.brands;
const audit = JSON.parse(await readFile(new URL("../reviews/atlas-activation-002.json", import.meta.url), "utf8"));
const products = structuredClone(beforeActivation.products);
const before = structuredClone(products);
const input = { products, brands, reviewedBy: "human:Clinton_Ramsook", reviewedAt: "2026-09-08T05:58:28.556Z", reason: "ATLAS-ACTIVATION-002 authorized pre-expansion RAM lifecycle review; no retail, acquisition, market, price, or publication authority implied." };
const result = reviewAtlasPreExpansionBatch(input);

assert.deepEqual(result, reviewAtlasPreExpansionBatch(input));
assert.deepEqual(products, before);
assert.deepEqual(result.decision.authorizedProductIds, ATLAS_PRE_EXPANSION_PRODUCT_IDS);
assert.deepEqual(result.decision.counts, { requested: 15, activated: 15, blocked: 0 });
assert.equal(result.outcomes.every(item => item.product.governance.lifecycleStatus === "ACTIVE" && item.product.governance.publicationStatus === "READY"), true);
assert.equal(result.outcomes.every(item => item.product.governance.humanReviewRequired === false && item.product.identity.recordRevision === 2), true);
assert.equal(result.outcomes.every(item => item.product.identity.createdBy === "system:d002-fixture-certification"), true);
assert.equal(Object.values(result.decision.downstreamAuthority).every(value => value === false), true);
assert.equal(result.decision.providerOperations, 0);
assert.equal(result.decision.actualSpendUsd, 0);
assert.deepEqual(audit, result.decision);
for (const outcome of result.outcomes) assert.deepEqual(canonicalProducts.find(product => product.identity.atlasProductId === outcome.atlasProductId), outcome.product);
assert.equal(ATLAS_PRE_EXPANSION_PRODUCT_IDS.every(atlasProductId => {
    const product = canonicalProducts.find(item => item.identity.atlasProductId === atlasProductId);
    return product?.governance.lifecycleStatus === "ACTIVE" && product?.governance.publicationStatus === "READY";
}), true);

const broken = structuredClone(products);
broken.find(product => product.identity.atlasProductId === ATLAS_PRE_EXPANSION_PRODUCT_IDS[0]).extension.data.capacity.capacityGb += 1;
const isolated = reviewAtlasPreExpansionBatch({ ...input, products: broken });
assert.deepEqual(isolated.decision.counts, { requested: 15, activated: 14, blocked: 1 });
assert.deepEqual(isolated.outcomes[0].blockers, ["CAPACITY_INVARIANT_FAILED"]);

const unverified = structuredClone(products);
Object.values(unverified.find(product => product.identity.atlasProductId === ATLAS_PRE_EXPANSION_PRODUCT_IDS[1]).provenance.fieldSources)[0][0].verificationStatus = "PENDING";
assert.equal(reviewAtlasPreExpansionBatch({ ...input, products: unverified }).outcomes[1].blockers.includes("MANUFACTURER_EVIDENCE_NOT_VERIFIED"), true);

console.log("ATLAS-ACTIVATION-002 pre-expansion lifecycle review tests passed (15 cases).");
