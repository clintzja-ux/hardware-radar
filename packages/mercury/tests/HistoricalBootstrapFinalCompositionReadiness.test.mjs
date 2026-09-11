import assert from "node:assert/strict";
import {
  createDirectProductsSellersProposal,
  createProductsIdentityProgressionOwner
} from "../index.js";

const atlasProduct = {
  identity: {
    atlasProductId: "ram_fixture_generic",
    manufacturerPartNumber: "CMK32GX5M2B6000Z30",
    brand: "Corsair"
  },
  governance: { lifecycleStatus: "ACTIVE", publicationStatus: "READY" },
  extension: { data: {
    classification: { memoryType: "DDR5" },
    capacity: { capacityGb: 32, moduleCount: 2, capacityPerModuleGb: 16 },
    performance: { dataRateMtps: 6000, casLatency: 30 },
    physical: { color: "BLACK", rgbLighting: false }
  } }
};

const progression = await createProductsIdentityProgressionOwner().resolve({
  atlasProduct,
  providerTaskId: "fixture-products-task",
  providerResult: { result: [{ items: [{
    title: "Corsair 32GB (2x16GB) DDR5 6000 CL30 CMK32GX5M2B6000Z30 Black",
    data_docid: "fixture-document"
  }] }] }
});

assert.equal(progression.status, "STRONG_UNIQUE");
assert.equal(progression.routing.executableRoute, "READY_FOR_SELLERS");
assert.equal(progression.prepared.atlasProductId, atlasProduct.identity.atlasProductId);
assert.equal(progression.prepared.sourceTaskId, "fixture-products-task");
assert.equal(progression.prepared.resolution.recommendationStatus, "RECOMMENDED");
assert.equal(progression.prepared.reviewId, undefined);
assert.equal(progression.prepared.materialDigest, undefined);
assert.equal(progression.prepared.sourceRightsDigest, undefined);
assert.equal(progression.prepared.identityState, undefined);
assert.throws(
  () => createDirectProductsSellersProposal({
    atlasProduct,
    productsReview: progression.prepared,
    sourceRightsDigest: "fixture-rights-digest"
  }),
  /DIRECT_SELLERS_PRODUCTS_REVIEW_INVALID/
);

console.log("Historical bootstrap final-composition readiness tests passed (10 cases).");
