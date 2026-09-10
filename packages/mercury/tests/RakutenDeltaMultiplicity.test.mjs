import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import { collectRakutenProductCatalogFixture, createRakutenNeweggProductFeedAdapter } from "../current-display/index.js";
import { fixtureFeedText, fixtureRow } from "./fixtures/rakuten-newegg/sanitized-feed-fixtures.js";

let cases = 0;
const destination = { destinationId: `mer_dest_${"a".repeat(24)}`, atlasProductId: "ram_fixture_multiplicity", retailerId: "RETAILER-0004", marketplace: "newegg.com", destinationUrl: "https://newegg.com/p/N82E16820000001", retailerListingId: "N82E16820000001", status: "ACTIVE", binding: { manufacturerPartNumber: "FIXTURE-MPN-1" } };
const target = "https://click.example.invalid/track?murl=https%3A%2F%2Fwww.newegg.com%2Fp%2FN82E16820000001";
const sourceRows = [
  fixtureRow({ productId: "provider-product-a", sku: "provider-sku-a", productUrl: target, manufacturerPartNumber: "FIXTURE-MPN-1", upc: "000000000001", retailPrice: "100.00", salePrice: "", shipping: "0.00", modification: "U" }),
  fixtureRow({ productId: "provider-product-b", sku: "provider-sku-b", productUrl: target, manufacturerPartNumber: "FIXTURE-MPN-1", upc: "000000000001", retailPrice: "110.00", salePrice: "", shipping: "5.00", modification: "U" })
];
const records = (await collectRakutenProductCatalogFixture(gzipSync(fixtureFeedText({ rows: sourceRows })), { feedProfile: "MAIN_DELTA" })).filter(x => x.recordType === "PRODUCT");
assert.equal(records.length, 2); assert.notEqual(records[0].productId, records[1].productId); assert.notEqual(records[0].sku, records[1].sku); cases++;
const before = structuredClone(records);
const adapter = createRakutenNeweggProductFeedAdapter({ records, destinations: [destination], feedTimestamp: "2026-09-10T01:21:21.000Z" });
const result = await adapter.refresh({ atlasProductId: destination.atlasProductId, retailerId: destination.retailerId, retailer: "NEWEGG", destinationId: destination.destinationId, destinationUrl: destination.destinationUrl, retailerListingId: destination.retailerListingId, marketplace: destination.marketplace, asOf: "2026-09-10T02:00:00.000Z" });
assert.deepEqual(result, { type: "OUTCOME", status: "INVALID_SOURCE_RESULT" }); cases++;
assert.deepEqual(records, before); assert.equal(adapter.rights.publicDisplayAllowed, false); assert.equal(adapter.rights.comparisonAllowed, false); assert.equal(adapter.rights.historicalRetentionAllowed, false); cases++;

console.log(`RAKUTEN-NEWEGG-016 delta multiplicity fail-closed tests passed: ${cases} cases.`);
