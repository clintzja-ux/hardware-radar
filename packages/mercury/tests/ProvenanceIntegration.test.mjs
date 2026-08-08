import assert from "node:assert/strict";
import amazonAdapter from "../adapters/amazon/AmazonAdapter.js";
import { validateObservation } from "../ObservationValidator.js";

const observation = amazonAdapter.normalize({
    price: 99.99,
    currency: "USD",
    availability: "IN_STOCK",
    condition: "NEW",
    sellerType: "RETAILER",
    sourceUrl: "https://www.amazon.com/dp/B0TEST0001",
    shipping: { costKnown: false, cost: null, currency: null, notes: null },
    discount: null,
    affiliate: { isAffiliateLink: false, network: null, trackingCodePresent: false }
}, {
    observationId: "mer_obs_000000002",
    atlasProductId: "ram_corsair_cmk32gx5m2b6000z30",
    marketplace: "amazon.com",
    observationTime: "2026-08-08T17:00:00Z",
    sourceMethod: "MANUAL",
    retrievedBy: "human:test",
    createdBy: "test:provenance"
});

assert.equal(observation.schemaVersion, "1.1");
assert.equal(observation.provenance.source.uri, "https://www.amazon.com/dp/B0TEST0001");
assert.equal(observation.provenance.acquisition.retrievedAt, observation.observationTime);
assert.equal(observation.provenance.transformation.adapterId, "mer_adapter_amazon_us");
assert.equal(validateObservation(observation).valid, true);

console.log("Provenance integration tests passed.");
