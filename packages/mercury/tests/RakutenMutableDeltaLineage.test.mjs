import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import {
    collectRakutenProductCatalogFixture,
    createRakutenNeweggProductFeedAdapter,
    normalizeRakutenRemoteEntry,
    projectRakutenCatalogState,
    selectRakutenNeweggAuthoritativeLineage
} from "../current-display/index.js";
import { fixtureFeedText, fixtureRow } from "./fixtures/rakuten-newegg/sanitized-feed-fixtures.js";

let cases = 0;
const family = "RAKUTEN_MAIN:44583:4746097";
const fullDigest = "a".repeat(64), deltaDigest = "b".repeat(64), nextDigest = "c".repeat(64);
const fullAt = "2026-10-01T00:00:00.000Z", deltaAt = "2026-10-02T00:00:00.000Z";
const url = sku => `https://click.example.invalid/track?murl=${encodeURIComponent(`https://www.newegg.com/p/${sku}`)}`;
const row = (sku, overrides = {}, delta = false) => fixtureRow({ productId: `PRODUCT-${sku}`, sku, productUrl: url(sku), manufacturerPartNumber: sku === "N82E16820236839" ? "CMK64GX5M2B5200C40" : `MPN-${sku}`, retailPrice: "100.00", currency: "USD", availability: "in-stock", ...overrides }, { delta });
const parse = async (rows, feedProfile) => (await collectRakutenProductCatalogFixture(gzipSync(fixtureFeedText({ rows })), { feedProfile })).filter(value => value.recordType === "PRODUCT");
const fullRecords = await parse([row("N82E16820236839"), row("N82E16820000002")], "MAIN_FULL");
const updateRecords = await parse([row("N82E16820236839", { retailPrice: "994.99", modification: "U" }, true)], "MAIN_DELTA");
const insertRecords = await parse([row("N82E16820000003", { modification: "I" }, true)], "MAIN_DELTA");
const deleteRecords = await parse([row("N82E16820236839", { modification: "D" }, true)], "MAIN_DELTA");
const artifact = (feedProfile, records, overrides = {}) => ({ feedProfile, records, feedFamilyKey: family, filename: feedProfile === "MAIN_FULL" ? "44583_4746097_mp.txt.gz" : "44583_4746097_mp_delta.txt.gz", artifactDigest: feedProfile === "MAIN_FULL" ? fullDigest : deltaDigest, headerTimestamp: feedProfile === "MAIN_FULL" ? fullAt : deltaAt, remoteModifiedAt: feedProfile === "MAIN_FULL" ? "2026-10-03T00:00:00.000Z" : "2026-09-30T00:00:00.000Z", ...overrides });

// Mutable root DELTA is selected even when its transport mtime is older.
const remote = (filename, modifiedAt) => normalizeRakutenRemoteEntry({ filename, modifiedAt, size: 1, isFile: true, isDirectory: false }, "/");
const selected = selectRakutenNeweggAuthoritativeLineage([
    remote("44583_4746097_mp.txt.gz", "2026-10-03T00:00:00.000Z"),
    remote("44583_4746097_mp_delta.txt.gz", "2026-09-30T00:00:00.000Z"),
    normalizeRakutenRemoteEntry({ filename: "44583", modifiedAt: null, size: null, isFile: false, isDirectory: true }, "/")
]);
assert.deepEqual(selected.files.map(value => value.feedFamily), ["FULL", "DELTA"]);
assert.equal(selected.feedFamilyKey, family); cases += 2;

const state = projectRakutenCatalogState({ files: [artifact("MAIN_FULL", fullRecords), artifact("MAIN_DELTA", updateRecords)], requireLineage: true });
assert.equal(state.schemaVersion, "1.1");
assert.equal(state.entries.length, 2);
assert.equal(state.currentCandidates.length, 1);
assert.equal(state.currentCandidates[0].record.retailPrice, "994.99");
assert.equal(state.currentCandidates[0].evidence.observedAt, deltaAt);
assert.equal(state.entries.find(value => value.record.sku === "N82E16820000002").evidence.observedAt, fullAt);
assert.equal(state.filesApplied[1].parentCatalogStateId, state.filesApplied[0].catalogStateId);
assert.equal(state.catalogStateId, state.filesApplied[1].catalogStateId); cases += 8;

// Same content digest is an idempotent replay; changed content under the same mutable name is new.
const replay = projectRakutenCatalogState({ files: [artifact("MAIN_FULL", fullRecords), artifact("MAIN_DELTA", updateRecords), artifact("MAIN_DELTA", updateRecords)], requireLineage: true });
assert.equal(replay.filesApplied[2].outcome, "REPLAY_NO_CHANGE");
assert.equal(replay.catalogStateId, replay.filesApplied[1].catalogStateId); cases += 2;
assert.equal(replay.currentCandidates.length, 0); cases++;
const changed = projectRakutenCatalogState({ files: [artifact("MAIN_FULL", fullRecords), artifact("MAIN_DELTA", updateRecords), artifact("MAIN_DELTA", insertRecords, { artifactDigest: nextDigest, headerTimestamp: "2026-10-03T00:00:00.000Z" })], requireLineage: true });
assert.equal(changed.filesApplied[2].outcome, "APPLIED");
assert.equal(changed.currentCandidates[0].record.modification, "I"); cases += 2;

assert.throws(() => projectRakutenCatalogState({ files: [artifact("MAIN_DELTA", updateRecords)], requireLineage: true }), /RAKUTEN_CATALOG_BASELINE_REQUIRED/); cases++;
assert.throws(() => projectRakutenCatalogState({ files: [artifact("MAIN_FULL", fullRecords), artifact("MAIN_DELTA", updateRecords, { feedFamilyKey: "RAKUTEN_MAIN:44583:OTHER" })], requireLineage: true }), /RAKUTEN_CATALOG_FAMILY_MISMATCH/); cases++;
assert.throws(() => projectRakutenCatalogState({ files: [artifact("MAIN_FULL", fullRecords), artifact("MAIN_DELTA", updateRecords, { headerTimestamp: fullAt })], requireLineage: true }), /RAKUTEN_DELTA_ORDER_AMBIGUOUS/); cases++;

const inserted = projectRakutenCatalogState({ files: [artifact("MAIN_FULL", fullRecords), artifact("MAIN_DELTA", insertRecords)], requireLineage: true });
assert.equal(inserted.entries.some(value => value.record.sku === "N82E16820000003"), true); cases++;
const deleted = projectRakutenCatalogState({ files: [artifact("MAIN_FULL", fullRecords), artifact("MAIN_DELTA", deleteRecords)], requireLineage: true });
assert.equal(deleted.entries.some(value => value.record.sku === "N82E16820236839"), false);
assert.equal(deleted.withdrawals.length, 1);
assert.equal(deleted.currentCandidates[0].record.modification, "D"); cases += 3;

// Provider semantics are already certified as physical-order upsert: U without a baseline and I over a key are safe upserts.
const updateWithoutBaseline = await parse([row("N82E16820000004", { modification: "U" }, true)], "MAIN_DELTA");
assert.equal(projectRakutenCatalogState({ files: [artifact("MAIN_FULL", fullRecords), artifact("MAIN_DELTA", updateWithoutBaseline)], requireLineage: true }).entries.some(value => value.record.sku === "N82E16820000004"), true); cases++;
const duplicateInsert = await parse([row("N82E16820236839", { retailPrice: "105.00", modification: "I" }, true)], "MAIN_DELTA");
assert.equal(projectRakutenCatalogState({ files: [artifact("MAIN_FULL", fullRecords), artifact("MAIN_DELTA", duplicateInsert)], requireLineage: true }).entries.find(value => value.record.sku === "N82E16820236839").record.retailPrice, "105.00"); cases++;

const destination = { destinationId: `mer_dest_${"d".repeat(24)}`, atlasProductId: "ram_corsair_cmk64gx5m2b5200c40", retailerId: "RETAILER-0004", marketplace: "newegg.com", destinationUrl: "https://www.newegg.com/p/N82E16820236839", retailerListingId: "N82E16820236839", status: "ACTIVE", binding: { manufacturerPartNumber: "CMK64GX5M2B5200C40" } };
const rights = { profileId: "RAKUTEN_NEWEGG_PRODUCT_CATALOG", acquisitionAllowed: true, ephemeralRetentionAllowed: true, publicDisplayAllowed: true, comparisonAllowed: true, historicalRetentionAllowed: false, ttlSeconds: 36 * 60 * 60 };
const adapter = createRakutenNeweggProductFeedAdapter({ catalogFiles: [artifact("MAIN_FULL", fullRecords), artifact("MAIN_DELTA", updateRecords)], destinations: [destination], feedTimestamp: "2030-01-01T00:00:00.000Z", rights });
const fresh = await adapter.refresh({ ...destination, retailer: "NEWEGG", asOf: "2026-10-02T12:00:00.000Z" });
assert.equal(fresh.type, "OBSERVATION");
assert.equal(fresh.observedAt, deltaAt);
assert.equal(fresh.sourceEvidence.sourceArtifactDigest, deltaDigest);
assert.equal(fresh.sourceEvidence.sourceModification, "U"); cases += 4;
assert.deepEqual(await adapter.refresh({ ...destination, retailer: "NEWEGG", asOf: "2026-10-04T00:00:00.000Z" }), { type: "OUTCOME", status: "SOURCE_STALE" }); cases++;

const absentDestination = { ...destination, destinationId: `mer_dest_${"e".repeat(24)}`, retailerListingId: "N82E16820000002", destinationUrl: "https://www.newegg.com/p/N82E16820000002", binding: { manufacturerPartNumber: "MPN-N82E16820000002" } };
const absentAdapter = createRakutenNeweggProductFeedAdapter({ catalogFiles: [artifact("MAIN_FULL", fullRecords), artifact("MAIN_DELTA", updateRecords)], destinations: [absentDestination], feedTimestamp: deltaAt, rights });
assert.deepEqual(await absentAdapter.refresh({ ...absentDestination, retailer: "NEWEGG", asOf: "2026-10-02T12:00:00.000Z" }), { type: "OUTCOME", status: "SOURCE_UNAVAILABLE" }); cases++;
const deleteAdapter = createRakutenNeweggProductFeedAdapter({ catalogFiles: [artifact("MAIN_FULL", fullRecords), artifact("MAIN_DELTA", deleteRecords)], destinations: [destination], feedTimestamp: deltaAt, rights });
assert.deepEqual(await deleteAdapter.refresh({ ...destination, retailer: "NEWEGG", asOf: "2026-10-02T12:00:00.000Z" }), { type: "OUTCOME", status: "SOURCE_WITHDRAWN" }); cases++;

const protectedState = { history: [{ id: "history" }], destinations: [destination], affiliateUrl: "https://affiliate.example.invalid/operator-value" };
const before = structuredClone(protectedState);
projectRakutenCatalogState({ files: [artifact("MAIN_FULL", fullRecords), artifact("MAIN_DELTA", updateRecords)], requireLineage: true });
assert.deepEqual(protectedState, before); cases++;

console.log(`Rakuten mutable DELTA lineage tests passed: ${cases} cases.`);
