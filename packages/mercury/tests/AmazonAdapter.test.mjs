import assert from "node:assert/strict";
import amazonAdapter from "../adapters/amazon/AmazonAdapter.js";
import { validateObservation } from "../ObservationValidator.js";

const input = {
    price: 509.99,
    currency: "USD",
    availability: "IN_STOCK",
    condition: "NEW",
    sellerType: "RETAILER",
    sourceUrl: "https://www.amazon.com/dp/B0CBRJ63RT",
    shipping: { costKnown: true, cost: 0, currency: "USD", notes: "Prime delivery" },
    discount: { originalPrice: 588.99, amount: 79, percentage: 13, label: "13% off" },
    affiliate: { isAffiliateLink: false, network: null, trackingCodePresent: false }
};
const context = {
    observationId: "mer_obs_000000002",
    atlasProductId: "ram_corsair_cmk32gx5m2b6000z30",
    marketplace: "amazon.com",
    observationTime: "2026-08-08T15:00:00Z",
    sourceMethod: "MANUAL",
    retrievedBy: "human:test",
    createdBy: "test:amazon-adapter"
};

const observation = amazonAdapter.normalize(input, context);
assert.equal(observation.retailerId, "RETAILER-0001");
assert.equal(observation.marketplace, "amazon.com");
assert.equal(observation.provenance.transformation.adapterVersion, "mer_adapter_amazon_us@1.1.0");
assert.equal(validateObservation(observation).valid, true);
assert.equal(amazonAdapter.supportsMarketplace("amazon.com"), true);
assert.equal(amazonAdapter.supportsMarketplace("amazon.co.uk"), false);
assert.equal(amazonAdapter.supportsSourceMethod("MANUAL"), true);
assert.equal(amazonAdapter.supportsSourceMethod("API"), true);
assert.throws(() => amazonAdapter.normalize(input, { ...context, marketplace: "amazon.co.uk" }), /does not support marketplace/);


console.log("AmazonAdapter tests passed.");
