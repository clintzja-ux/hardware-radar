import assert from "node:assert/strict";
import { normalizeDataForSeoSellerEvidence } from "../adapters/dataforseo/DataForSeoSellerNormalizer.js";

const liveSellerFixture = {
    type: "shops_list",
    seller_name: "Central Computers",
    title: "Central Computers",
    domain: "www.centralcomputer.com",
    url: "https://www.centralcomputer.com/corsair-cmk32gx5m2b6000z30.html",
    base_price: 549.99,
    tax: null,
    shipping_price: 38.260695,
    total_price: 588.25,
    currency: "USD",
    product_condition: null,
    details: "Corsair CMK32GX5M2B6000Z30 VENGEANCE DDR5 32GB2x16GB Memory Kit 6000MT/s 30-36-36-76 Std PMIC AMD EXPO 1.4V Black"
};

const context = {
    sourceTaskId: "08160527-2304-0183-0000-1446c8b7b26b",
    observedAt: "2026-08-16T05:27:00Z",
    productTitle: liveSellerFixture.details,
    dataDocId: "17540895125310173539",
    rawPayloadReference: "fixture:live1-sellers-result"
};

const evidence = normalizeDataForSeoSellerEvidence(liveSellerFixture, context);
assert.equal(evidence.provider, "DATAFORSEO");
assert.equal(evidence.source, "DATAFORSEO_GOOGLE_SHOPPING");
assert.equal(evidence.sourceMethod, "API");
assert.equal(evidence.seller.name, "Central Computers");
assert.equal(evidence.seller.domain, "www.centralcomputer.com");
assert.equal(evidence.pricing.basePrice, 549.99);
assert.equal(evidence.pricing.shippingPrice, 38.260695);
assert.equal(evidence.pricing.tax, null);
assert.equal(evidence.pricing.totalPrice, 588.25);
assert.equal(evidence.pricing.currency, "USD");
assert.equal(evidence.offer.condition, null);
assert.equal(evidence.productEvidence.dataDocId, "17540895125310173539");
assert.equal(evidence.provenance.sourceTaskId, context.sourceTaskId);
assert.equal(Object.hasOwn(evidence, "affiliate"), false);
assert.equal(Object.isFrozen(evidence), true);
assert.equal(Object.isFrozen(evidence.pricing), true);

assert.throws(() => normalizeDataForSeoSellerEvidence({ ...liveSellerFixture, type: "product_seller" }, context), /type shops_list/);
assert.throws(() => normalizeDataForSeoSellerEvidence({ ...liveSellerFixture, url: null }, context), /requires url/);
assert.throws(() => normalizeDataForSeoSellerEvidence({ ...liveSellerFixture, base_price: null }, context), /positive base_price/);
assert.throws(() => normalizeDataForSeoSellerEvidence({ ...liveSellerFixture, currency: null }, context), /requires currency/);
assert.throws(() => normalizeDataForSeoSellerEvidence({ ...liveSellerFixture, shipping_price: -1 }, context), /non-negative shipping_price/);
assert.throws(() => normalizeDataForSeoSellerEvidence(liveSellerFixture, { ...context, sourceTaskId: null }), /sourceTaskId/);

console.log("DataForSEO seller normalizer tests passed.");
