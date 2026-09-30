import assert from "node:assert/strict";
import { createCurrentDisplaySnapshot } from "../current-display/CurrentDisplaySnapshot.js";
import { createRamMarketSnapshotProjection, freezeRamMarketSnapshotInputs, validateRamMarketSnapshotProjection } from "../historical-admission/RamMarketSnapshotProjection.js";
import { createHistoricalObservation, createHistoricalObservationId } from "../historical-admission/HistoricalObservation.js";

const asOf = "2026-09-30T17:00:00.000Z", cutoff = "2026-09-30T23:59:59.999Z";
const products = Array.from({ length: 6 }, (_, index) => ({ atlasProductId: `ram_fixture_${index}`, publicPath: `/ram/fixture-${index}/`, brand: "Fixture", displayName: `Fixture ${index}`, memoryType: "DDR5", formFactor: "DIMM", capacityGb: 16, moduleCount: 2, capacityPerModuleGb: 8, dataRateMtps: 6000 }));
const catalog = { schemaVersion: "1.0", productCount: products.length, products };
const currentSnapshot = createCurrentDisplaySnapshot({ observedAt: asOf, importedAt: asOf, source: { workbook: "fixture", sheet: "fixture", digest: "a".repeat(64) }, offers: products.slice(0, 5).map((product, index) => ({ atlasProductId: product.atlasProductId, retailer: "AMAZON", retailerId: "RETAILER-0001", destinationId: null, marketplace: "amazon.com", priceUsd: 100 + index, currency: "USD", availability: "AVAILABLE", condition: "NEW", shippingUsd: null, feesUsd: null, matchStatus: "EXACT", researchUrl: null, sourceRow: index + 1, comparisonEligible: true, comparisonReasons: [] })) });
const currentRetail = { state: "AVAILABLE", products: products.slice(0, 5).map((product, index) => ({ atlasProductId: product.atlasProductId, offers: [{ atlasProductId: product.atlasProductId, retailerId: "RETAILER-0001", itemPriceUsd: 100 + index, currency: "USD", comparisonEligible: true }] })) };
const history = ({ id, product = 0, observedAt, admittedAt = observedAt, price = 100, comparable = true }) => createHistoricalObservation({ factLevel: true, observationId: createHistoricalObservationId(id), atlasProductId: `ram_fixture_${product}`, retailerId: null, marketplace: "amazon.com", observationTime: observedAt, admittedAt, market: { sellerName: null, sourceUrl: "https://example.com", basePrice: price, totalPrice: null, shipping: null, tax: null, currency: "USD", condition: "NEW", availability: "in_stock" }, provenance: { retainedEvidenceId: id, provider: "DATAFORSEO", source: "DATAFORSEO_AMAZON", rawPayloadReference: `fixture:${id}`, acquisition: { type: "REUSABLE_IDENTITY_REPEAT", atlasProductId: `ram_fixture_${product}`, sourceId: "DATAFORSEO_AMAZON", operation: "AMAZON_SELLERS", reusableIdentityRecordId: "identity", reusableIdentityDigest: "digest", sourceRightsProfileDigest: "rights", preparedObservationId: "prepared", repeatAuthorizationId: "auth", paidActionIntentId: "intent", acquisitionCycleId: "cycle", observationCycle: "obs-cycle", providerTaskId: "task", canonicalResultId: "result", canonicalResultDigest: "result-digest", lineageBindingDigest: "lineage" } }, observedMerchant: { resolutionState: "UNRESOLVED" }, comparability: { classification: comparable ? "STANDALONE_COMPARABLE" : "UNKNOWN_COMPARABILITY", standaloneEligible: comparable, reasons: [] }, admittedBy: "fixture", idempotencyKey: id });
const rows = [history({ id: "h1", observedAt: "2026-09-01T00:00:00Z", price: 110 }), history({ id: "h2", observedAt: "2026-09-20T00:00:00Z", price: 100 }), history({ id: "h3", product: 1, observedAt: "2026-09-10T00:00:00Z", price: 120 })];

const frozen = freezeRamMarketSnapshotInputs({ catalog, currentSnapshot, currentRetail, effectiveHistory: rows, asOf, historyKnowledgeCutoff: cutoff, generatedAt: "2026-10-01T01:00:00Z" });
const projection = await createRamMarketSnapshotProjection({ frozenInput: frozen });
assert.equal(validateRamMarketSnapshotProjection(projection).valid, true);
assert.equal(projection.snapshotType, "POINT_IN_TIME_MARKET_SNAPSHOT");
assert.equal(projection.asOf, asOf);
assert.equal(projection.generatedAt, "2026-10-01T01:00:00Z");
assert.equal(projection.coverage.productsTracked, 6);
assert.equal(projection.currentMarket.medianCurrentItemPrice, 102);
assert.equal(projection.historyMaturity.h1, 1);
assert.equal(projection.historyMaturity.h2, 1);

const replay = await createRamMarketSnapshotProjection({ frozenInput: frozen });
assert.deepEqual(replay, projection);
const regeneratedAtAnotherTime = freezeRamMarketSnapshotInputs({ catalog, currentSnapshot, currentRetail, effectiveHistory: rows, asOf, historyKnowledgeCutoff: cutoff, generatedAt: "2026-10-02T01:00:00Z" });
assert.equal((await createRamMarketSnapshotProjection({ frozenInput: regeneratedAtAnotherTime })).snapshotId, projection.snapshotId);

const lateOldObservation = history({ id: "late", product: 2, observedAt: "2026-09-15T00:00:00Z", admittedAt: "2026-10-01T00:00:00Z", price: 80 });
const lateFrozen = freezeRamMarketSnapshotInputs({ catalog, currentSnapshot, currentRetail, effectiveHistory: [...rows, lateOldObservation], asOf, historyKnowledgeCutoff: cutoff, generatedAt: "2026-10-01T01:00:00Z" });
assert.equal((await createRamMarketSnapshotProjection({ frozenInput: lateFrozen })).snapshotId, projection.snapshotId);
assert.equal(lateFrozen.inputs.effectiveHistory.length, rows.length);

const reassessedRows = structuredClone(rows); reassessedRows[2].comparability = { classification: "UNKNOWN_COMPARABILITY", standaloneEligible: false, reasons: ["LATER_REASSESSMENT"] };
assert.deepEqual(await createRamMarketSnapshotProjection({ frozenInput: frozen }), projection);
const corrected = freezeRamMarketSnapshotInputs({ catalog, currentSnapshot, currentRetail, effectiveHistory: reassessedRows, asOf, historyKnowledgeCutoff: cutoff, generatedAt: "2026-10-02T01:00:00Z" });
assert.notEqual((await createRamMarketSnapshotProjection({ frozenInput: corrected })).snapshotId, projection.snapshotId);

const nextCurrent = createCurrentDisplaySnapshot({ observedAt: "2026-10-01T17:00:00Z", importedAt: "2026-10-01T17:00:00Z", source: { workbook: "fixture-next", sheet: "fixture", digest: "b".repeat(64) }, offers: [] });
assert.deepEqual(await createRamMarketSnapshotProjection({ frozenInput: frozen }), projection);
assert.throws(() => freezeRamMarketSnapshotInputs({ catalog, currentSnapshot: nextCurrent, currentRetail, effectiveHistory: rows, asOf, historyKnowledgeCutoff: cutoff, generatedAt: "2026-10-01T01:00:00Z" }), /CURRENT_AS_OF_MISMATCH/);

const tampered = structuredClone(frozen); tampered.inputs.catalog.products[0].displayName = "Changed";
await assert.rejects(() => createRamMarketSnapshotProjection({ frozenInput: tampered }), /ATLAS_DIGEST_MISMATCH/);
const tamperedCurrent = structuredClone(frozen); tamperedCurrent.inputs.currentRetail.products[0].offers[0].itemPriceUsd = 1;
await assert.rejects(() => createRamMarketSnapshotProjection({ frozenInput: tamperedCurrent }), /CURRENT_DIGEST_MISMATCH/);
assert.doesNotMatch(JSON.stringify(projection), /providerTask|retainedEvidence|authorizationId|rawPayload|researchUrl|affiliate|rightsProfile|sellerName/i);
console.log("Mercury RAM Market Snapshot projection contract passed.");
