import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import { collectRakutenProductCatalogFixture, createRakutenNeweggProductFeedAdapter, projectRakutenCatalogState } from "../current-display/index.js";
import { fixtureFeedText, fixtureRow } from "./fixtures/rakuten-newegg/sanitized-feed-fixtures.js";

let cases = 0;
const parse = async (rows, feedProfile) => (await collectRakutenProductCatalogFixture(gzipSync(fixtureFeedText({ rows })), { feedProfile })).filter(item => item.recordType === "PRODUCT");
const fullRecord = overrides => fixtureRow(overrides, { delta: false });
const deltaRecord = overrides => fixtureRow(overrides);
const urlX = "https://click.example.invalid/track?murl=https%3A%2F%2Fwww.newegg.com%2Fp%2FN82E16820000001";
const base = { productUrl: urlX, manufacturerPartNumber: "FIXTURE-MPN-1", currency: "USD", availability: "in-stock" };

const fullDistinct = await parse([
    fullRecord({ ...base, productId: "PRODUCT-A", sku: "SKU-A", retailPrice: "100.00" }),
    fullRecord({ ...base, productId: "PRODUCT-B", sku: "SKU-B", retailPrice: "110.00" })
], "MAIN_FULL");
const r1 = projectRakutenCatalogState({ files: [{ feedProfile: "MAIN_FULL", records: fullDistinct }] });
assert.equal(r1.sourceEntryCount, 2);
assert.deepEqual(r1.entries.map(item => item.record.sku), ["SKU-A", "SKU-B"]);
assert.equal(new Set(r1.entries.map(item => item.record.productUrl)).size, 1); cases++;

const independentlyDistinct = await parse([
    fullRecord({ ...base, productId: "SHARED-PRODUCT", sku: "SKU-A", retailPrice: "100.00" }),
    fullRecord({ ...base, productId: "SHARED-PRODUCT", sku: "SKU-B", retailPrice: "110.00" }),
    fullRecord({ ...base, productId: "OTHER-PRODUCT", sku: "SKU-B", retailPrice: "120.00" })
], "MAIN_FULL");
assert.equal(projectRakutenCatalogState({ files: [{ feedProfile: "MAIN_FULL", records: independentlyDistinct }] }).sourceEntryCount, 3); cases++;

const baseline = await parse([fullRecord({ ...base, productId: "PRODUCT-A", sku: "SKU-A", retailPrice: "90.00" })], "MAIN_FULL");
const repeated = await parse([
    deltaRecord({ ...base, productId: "PRODUCT-A", sku: "SKU-A", retailPrice: "100.00", modification: "U" }),
    deltaRecord({ ...base, productId: "PRODUCT-A", sku: "SKU-A", retailPrice: "120.00", modification: "U" })
], "MAIN_DELTA");
const r2 = projectRakutenCatalogState({ files: [{ feedProfile: "MAIN_FULL", records: baseline }, { feedProfile: "MAIN_DELTA", records: repeated }] });
assert.equal(r2.sourceEntryCount, 1); assert.equal(r2.entries[0].record.retailPrice, "120.00"); cases++;

const interleaved = await parse([
    deltaRecord({ ...base, productId: "PRODUCT-A", sku: "SKU-A", retailPrice: "101.00", modification: "U" }),
    deltaRecord({ ...base, productId: "PRODUCT-B", sku: "SKU-B", retailPrice: "111.00", modification: "I" }),
    deltaRecord({ ...base, productId: "PRODUCT-A", sku: "SKU-A", retailPrice: "121.00", modification: "U" })
], "MAIN_DELTA");
const interleavedState = projectRakutenCatalogState({ files: [{ feedProfile: "MAIN_FULL", records: baseline }, { feedProfile: "MAIN_DELTA", records: interleaved }] });
assert.equal(interleavedState.entries.find(item => item.record.sku === "SKU-A").record.retailPrice, "121.00");
assert.equal(interleavedState.entries.find(item => item.record.sku === "SKU-B").record.retailPrice, "111.00"); cases++;

const beforeReplacement = await parse([
    deltaRecord({ ...base, productId: "PRODUCT-C", sku: "SKU-C", retailPrice: "130.00", modification: "I" })
], "MAIN_DELTA");
const full2 = await parse([
    fullRecord({ ...base, productId: "PRODUCT-B", sku: "SKU-B", retailPrice: "115.00" }),
    fullRecord({ ...base, productId: "PRODUCT-C", sku: "SKU-C", retailPrice: "135.00" })
], "MAIN_FULL");
const r3 = projectRakutenCatalogState({ files: [
    { feedProfile: "MAIN_FULL", records: fullDistinct },
    { feedProfile: "MAIN_DELTA", records: beforeReplacement },
    { feedProfile: "MAIN_FULL", records: full2 }
] });
assert.deepEqual(r3.entries.map(item => item.record.sku), ["SKU-B", "SKU-C"]); cases++;

const delta3 = await parse([
    deltaRecord({ ...base, productId: "PRODUCT-B", sku: "SKU-B", retailPrice: "116.00", modification: "U" }),
    deltaRecord({ ...base, productId: "PRODUCT-D", sku: "SKU-D", retailPrice: "140.00", modification: "I" }),
    deltaRecord({ ...base, productId: "PRODUCT-C", sku: "SKU-C", retailPrice: "135.00", modification: "D" })
], "MAIN_DELTA");
const r3Delta = projectRakutenCatalogState({ files: [
    { feedProfile: "MAIN_FULL", records: fullDistinct },
    { feedProfile: "MAIN_FULL", records: full2 },
    { feedProfile: "MAIN_DELTA", records: delta3 }
] });
assert.deepEqual(r3Delta.entries.map(item => item.record.sku), ["SKU-B", "SKU-D"]);
assert.equal(r3Delta.entries[0].record.retailPrice, "116.00"); cases++;

const atlasProducts = [{ identity: { atlasProductId: "ram_fixture", manufacturerPartNumber: "FIXTURE-MPN-1" } }];
const retainedEvidence = [{ evidenceId: "dfev_fixture" }];
const history = [{ observationId: "mer_hist_fixture" }];
const protectedBefore = structuredClone({ atlasProducts, retainedEvidence, history });
projectRakutenCatalogState({ files: [{ feedProfile: "MAIN_FULL", records: fullDistinct }, { feedProfile: "MAIN_FULL", records: full2 }] });
assert.deepEqual({ atlasProducts, retainedEvidence, history }, protectedBefore); cases++;

const replay = projectRakutenCatalogState({ files: [{ feedProfile: "MAIN_FULL", records: full2 }, { feedProfile: "MAIN_DELTA", records: delta3 }] });
const replayAgain = projectRakutenCatalogState({ files: [{ feedProfile: "MAIN_FULL", records: full2 }, { feedProfile: "MAIN_DELTA", records: delta3 }] });
assert.deepEqual(replayAgain, replay); assert.equal(replayAgain.bindingDigest, replay.bindingDigest); cases++;

const destination = { destinationId: `mer_dest_${"a".repeat(24)}`, atlasProductId: "ram_fixture", retailerId: "RETAILER-0004", marketplace: "newegg.com", destinationUrl: "https://newegg.com/p/N82E16820000001", retailerListingId: "N82E16820000001", status: "ACTIVE", binding: { manufacturerPartNumber: "FIXTURE-MPN-1" } };
const adapter = createRakutenNeweggProductFeedAdapter({ catalogFiles: [{ feedProfile: "MAIN_FULL", records: fullDistinct }, { feedProfile: "MAIN_FULL", records: full2 }, { feedProfile: "MAIN_DELTA", records: delta3 }], destinations: [destination], feedProfile: "MAIN_FULL", feedTimestamp: "2026-09-15T00:00:00.000Z" });
assert.deepEqual(await adapter.refresh({ ...destination, retailer: "NEWEGG", asOf: "2026-09-15T01:00:00.000Z" }), { type: "OUTCOME", status: "INVALID_SOURCE_RESULT" });
assert.equal(adapter.rights.profileId, "RAKUTEN_NEWEGG_PRODUCT_CATALOG"); assert.equal(adapter.rights.publicDisplayAllowed, true); assert.equal(adapter.rights.comparisonAllowed, true); assert.equal(adapter.rights.historicalRetentionAllowed, false); cases++;

await assert.rejects(async () => projectRakutenCatalogState({ files: [{ feedProfile: "MAIN_FULL", records: [...baseline, ...baseline] }] }), /RAKUTEN_FULL_SOURCE_ENTRY_DUPLICATE/); cases++;

console.log(`Rakuten catalog-state projection tests passed: ${cases} cases.`);
