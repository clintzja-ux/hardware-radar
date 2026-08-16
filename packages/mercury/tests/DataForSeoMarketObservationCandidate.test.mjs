import assert from "node:assert/strict";
import { createDataForSeoMarketObservationCandidate } from "../market/dataforseo/DataForSeoMarketObservationCandidate.js";
import { normalizeDataForSeoSellerEvidence } from "../adapters/dataforseo/DataForSeoSellerNormalizer.js";

const seller = {
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
    product_availability: "in_stock",
    details: "Corsair CMK32GX5M2B6000Z30 VENGEANCE DDR5 32GB2x16GB Memory Kit 6000MT/s"
};

const marketEvidence = normalizeDataForSeoSellerEvidence(seller, {
    sourceTaskId: "08160527-2304-0183-0000-1446c8b7b26b",
    observedAt: "2026-08-16T05:27:00Z",
    productTitle: seller.details,
    dataDocId: "17540895125310173539",
    rawPayloadReference: "fixture:live1-sellers-result"
});

const probable = createDataForSeoMarketObservationCandidate({
    marketEvidence,
    atlasResolution: {
        outcome: "PROBABLE",
        atlasProductId: "ram_corsair_cmk32gx5m2b6000z30",
        externalProductId: null,
        candidateAtlasProductIds: [],
        evidence: [{ field: "capacityGb", status: "MATCH", external: 32, atlas: 32 }],
        automaticMercuryEligible: false
    }
});

assert.equal(probable.identity.outcome, "PROBABLE");
assert.equal(probable.identity.atlasProductId, "ram_corsair_cmk32gx5m2b6000z30");
assert.equal(probable.marketEvidence.pricing.basePrice, 549.99);
assert.equal(probable.marketEvidence.pricing.shippingPrice, 38.260695);
assert.equal(probable.marketEvidence.pricing.tax, null);
assert.equal(probable.marketEvidence.pricing.totalPrice, 588.25);
assert.equal(probable.governance.requiresReview, true);
assert.equal(probable.governance.canonicalObservationEligible, false);
assert.equal(probable.governance.automaticPublicationEligible, false);
assert.equal(Object.hasOwn(probable, "affiliate"), false);
assert.equal(Object.isFrozen(probable), true);
assert.equal(Object.isFrozen(probable.identity), true);

const confirmed = createDataForSeoMarketObservationCandidate({
    marketEvidence,
    atlasResolution: {
        outcome: "CONFIRMED",
        atlasProductId: "ram_corsair_cmk32gx5m2b6000z30",
        externalProductId: "external-1",
        candidateAtlasProductIds: [],
        evidence: [],
        automaticMercuryEligible: true
    }
});
assert.equal(confirmed.governance.requiresReview, false);
assert.equal(confirmed.governance.canonicalObservationEligible, true);
assert.equal(confirmed.governance.automaticPublicationEligible, false);

const ambiguous = createDataForSeoMarketObservationCandidate({
    marketEvidence,
    atlasResolution: {
        outcome: "AMBIGUOUS",
        atlasProductId: null,
        candidateAtlasProductIds: ["ram_a", "ram_b"],
        evidence: [],
        automaticMercuryEligible: false
    }
});
assert.equal(ambiguous.governance.requiresReview, true);
assert.equal(ambiguous.governance.canonicalObservationEligible, false);
assert.deepEqual(ambiguous.identity.candidateAtlasProductIds, ["ram_a", "ram_b"]);

assert.throws(() => createDataForSeoMarketObservationCandidate({ marketEvidence, atlasResolution: { outcome: "PROBABLE", atlasProductId: null } }), /requires atlasProductId/);
assert.throws(() => createDataForSeoMarketObservationCandidate({ marketEvidence, atlasResolution: { outcome: "UNKNOWN" } }), /valid Atlas resolution outcome/);
assert.throws(() => createDataForSeoMarketObservationCandidate({ marketEvidence: { ...marketEvidence, source: "OTHER" }, atlasResolution: { outcome: "REJECTED" } }), /requires normalized DataForSEO/);

console.log("DataForSEO market observation candidate tests passed.");
