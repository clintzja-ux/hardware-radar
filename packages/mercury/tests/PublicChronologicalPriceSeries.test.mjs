import assert from "node:assert/strict";
import { createHistoricalObservation, createHistoricalObservationId } from "../historical-admission/HistoricalObservation.js";
import { createPublicChronologicalPriceSeries, validatePublicChronologicalPriceSeries } from "../historical-admission/PublicChronologicalPriceSeries.js";

const product = { atlasProductId: "ram_fixture_a", publicPath: "/ram/fixture-a/" };
const productB = { atlasProductId: "ram_fixture_b", publicPath: "/ram/fixture-b/" };
const catalog = { productCount: 2, products: [product, productB] };
const retailers = [{ id: "RETAILER-0001", name: "Amazon" }, { id: "RETAILER-0004", name: "Newegg" }];
const record = ({ id, productId = product.atlasProductId, time, price, retailerId = "RETAILER-0001", source = "DATAFORSEO_AMAZON", classification = "STANDALONE_COMPARABLE", currency = "USD" }) => createHistoricalObservation({
    factLevel: true, observationId: createHistoricalObservationId(id), atlasProductId: productId, retailerId, marketplace: retailerId === "RETAILER-0004" ? "newegg.com" : "amazon.com", observationTime: time, admittedAt: "2026-09-30T12:00:00Z",
    market: { sellerName: "private seller", sourceUrl: "https://private.example/item", basePrice: price, totalPrice: null, shipping: null, tax: null, currency, condition: "NEW", availability: "in_stock" },
    provenance: { retainedEvidenceId: id, provider: "PRIVATE_PROVIDER", source, rawPayloadReference: `private:${id}`, acquisition: { type: "REUSABLE_IDENTITY_REPEAT", atlasProductId: productId, sourceId: source, operation: "AMAZON_SELLERS", reusableIdentityRecordId: "identity", reusableIdentityDigest: "digest", sourceRightsProfileDigest: "rights", preparedObservationId: "prepared", repeatAuthorizationId: "auth", paidActionIntentId: "intent", acquisitionCycleId: "cycle", observationCycle: "observation-cycle", providerTaskId: "task", canonicalResultId: "result", canonicalResultDigest: "result-digest", lineageBindingDigest: "lineage" } },
    observedMerchant: { resolutionState: "RESOLVED" }, comparability: { classification, standaloneEligible: classification === "STANDALONE_COMPARABLE", reasons: [] }, admittedBy: "private operator", idempotencyKey: id
});

const rows = [
    record({ id: "late", time: "2026-09-03T00:00:00Z", price: 90 }),
    record({ id: "first-amazon", time: "2026-09-01T00:00:00-05:00", price: 100 }),
    record({ id: "first-newegg", time: "2026-09-01T05:00:00Z", price: 95, retailerId: "RETAILER-0004", source: "NEWEGG_MANUAL_PUBLISHER_OBSERVATION" }),
    record({ id: "duplicate-public-a", time: "2026-09-02T00:00:00Z", price: 80, retailerId: null, source: "DATAFORSEO_GOOGLE_SHOPPING" }),
    record({ id: "duplicate-public-b", time: "2026-09-02T00:00:00Z", price: 80, retailerId: null, source: "DATAFORSEO_GOOGLE_SHOPPING" }),
    record({ id: "same-retailer-different-price", time: "2026-09-03T00:00:00Z", price: 91 }),
    record({ id: "unknown", time: "2026-09-04T00:00:00Z", price: 70, classification: "UNKNOWN_COMPARABILITY" }),
    record({ id: "bundle", time: "2026-09-05T00:00:00Z", price: 60, classification: "BUNDLE" }),
    record({ id: "conditional", time: "2026-09-06T00:00:00Z", price: 50, classification: "CONDITIONAL" }),
    record({ id: "currency", time: "2026-09-07T00:00:00Z", price: 40, currency: "EUR" }),
    record({ id: "rakuten", time: "2026-09-08T00:00:00Z", price: 30, source: "RAKUTEN_NEWEGG_PRODUCT_CATALOG" })
];

const create = input => createPublicChronologicalPriceSeries({ catalog, retailers, historicalRepository: { getAll: async () => input } });
const projection = await create(rows);
assert.equal(validatePublicChronologicalPriceSeries(projection), true);
assert.equal(projection.eligibleObservationCount, 6);
assert.equal(projection.timestampGroupCount, 3);
assert.equal(projection.productSeriesCount, 1);
assert.equal(projection.excludedObservationCount, 5);
const series = projection.products.find(value => value.atlasProductId === product.atlasProductId);
assert.deepEqual(series.timestampGroups.map(group => group.observedAt), ["2026-09-01T05:00:00.000Z", "2026-09-02T00:00:00.000Z", "2026-09-03T00:00:00.000Z"]);
assert.equal(series.timestampGroups[0].observations.length, 2, "Equivalent timezone offsets group while distinct retailers remain distinct.");
assert.deepEqual(series.timestampGroups[0].observations.map(value => value.retailerName), ["Amazon", "Newegg"]);
assert.equal(series.timestampGroups[1].observations.length, 1);
assert.equal(series.timestampGroups[1].observations[0].observationCount, 2);
assert.equal(series.timestampGroups[1].observations[0].retailerId, null);
assert.equal(series.timestampGroups[2].observations.length, 2, "Same retailer/time with different prices remains distinct.");
assert.equal(projection.products.find(value => value.atlasProductId === productB.atlasProductId).timestampGroups.length, 0);
const serialized = JSON.stringify(projection);
for (const privateValue of ["private seller", "private.example", "PRIVATE_PROVIDER", "private operator", "providerTaskId", "retainedEvidenceId", "observationId"]) assert.equal(serialized.includes(privateValue), false);
assert.deepEqual(await create([...rows].reverse()), projection, "Canonical input order must not affect public bytes.");
await assert.rejects(create([rows[0], rows[0]]), /PUBLIC_PRICE_SERIES_DUPLICATE_OBSERVATION_ID/);
const unknownProduct = record({ id: "unknown-product", productId: "ram_unknown", time: "2026-09-01T00:00:00Z", price: 1 });
const suppressed = await create([unknownProduct, rows[0]]);
assert.deepEqual(suppressed.suppressedProductIds, ["ram_unknown"]);
console.log("Mercury public chronological price-series contract passed.");
