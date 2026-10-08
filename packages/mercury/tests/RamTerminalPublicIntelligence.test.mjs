import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { createHistoricalObservation, createHistoricalObservationId, createPublicChronologicalPriceSeries, createRamTerminalPublicIntelligence, EffectiveHistoricalObservationRepository, FileHistoricalComparabilityReassessmentRepository, FileHistoricalObservationRepository, validateRamTerminalPublicIntelligence } from "../index.js";

const catalog = JSON.parse(await readFile("public/data/ram-catalog.json", "utf8"));
const rawHistory = new FileHistoricalObservationRepository({ statePath: ".forge-review/mercury/historical-observations.json" });
const history = new EffectiveHistoricalObservationRepository({ historicalRepository: rawHistory, reassessmentRepository: new FileHistoricalComparabilityReassessmentRepository({ statePath: ".forge-review/mercury/historical-comparability-reassessments.json" }) });
const currentState = JSON.parse(await readFile(".forge-review/retail-display/current-display-snapshots.json", "utf8"));
const { ProductRepository, RetailerRepository } = await import("../../atlas/index.js");
const { loadRetailerDestinationSource, createPublicRetailerDestinationProjection } = await import("../destinations/RetailerDestinationSource.js");
const { createPublicCurrentRetailProjection } = await import("../current-display/PublicCurrentRetailProjection.js");
const { deriveCurrentDisplayPublicationEligibleSnapshot, deriveLegacySingleOfferPublicationCompatibilitySnapshot } = await import("../publication/CurrentDisplayPublication.js");
const { defaultSourceRightsRegistry } = await import("../rights/SourceRightsRegistry.js");
const readJson = async path => JSON.parse(await readFile(path, "utf8"));
const { loadStaticPublicationContinuityProjection } = await import("../../../scripts/static-publication-release-runtime.mjs");
const products = await new ProductRepository({ readJson }).getAll(), retailers = await new RetailerRepository({ readJson }).getAll();
const source = await loadRetailerDestinationSource({ sourcePath: "packages/mercury/destinations/production-destinations.json", products, retailers });
const destinations = createPublicRetailerDestinationProjection({ source, retailers });
const eligible = deriveCurrentDisplayPublicationEligibleSnapshot({ snapshot: { ...currentState.current, offers: currentState.current.offers.filter(offer => offer?.sourceIdentity?.sourceId) }, rightsRegistry: defaultSourceRightsRegistry });
const publishedProjection = (await loadStaticPublicationContinuityProjection({ manifestPath: "config/publication-release.json" })).projection;
const continuityTransitions = [];
for (const file of await readdir(".forge-review/mercury/rakuten-full-current-refresh")) {
    if (!file.startsWith("mer_rakutenfullprep_") || !file.endsWith(".json")) continue;
    const preparation = JSON.parse(await readFile(`.forge-review/mercury/rakuten-full-current-refresh/${file}`, "utf8"));
    for (const member of preparation.members ?? []) if (member?.priorOffer && member?.offer) continuityTransitions.push({ priorOffer: member.priorOffer, offer: member.offer });
}
const publicationSnapshot = deriveLegacySingleOfferPublicationCompatibilitySnapshot({ eligibleSnapshot: eligible, predecessorSnapshot: currentState.previous, publishedProjection, continuityTransitions });
const asOf = "2026-10-05T01:30:00.000Z";
const currentRetail = createPublicCurrentRetailProjection({ products, retailers, destinations, currentSnapshot: publicationSnapshot, asOf });
const projection = await createRamTerminalPublicIntelligence({ catalog, currentRetail, historicalRepository: history, asOf, currentSnapshotId: currentState.current.snapshotId });
const chronology = await createPublicChronologicalPriceSeries({ catalog, retailers, historicalRepository: history });
const canonicalHistory = await history.getAll();
const catalogProductIds = new Set(catalog.products.map(product => product.atlasProductId));
const terminalSourceEligible = record => typeof record?.provenance?.source === "string" && (record.provenance.source.startsWith("DATAFORSEO_") || record.provenance.source.endsWith("_MANUAL_PUBLISHER_OBSERVATION") || record.provenance.acquisition?.type === "RETAINED_COMMERCE_FEED");
const terminalAdmitted = canonicalHistory.filter(record => catalogProductIds.has(record.atlasProductId) && terminalSourceEligible(record));
const currentlyPricedProducts = currentRetail.products.filter(product => (product.offers ?? []).some(offer => offer.comparisonEligible === true && offer.currency === "USD" && Number.isFinite(offer.itemPriceUsd))).length;
assert.equal(validateRamTerminalPublicIntelligence(projection).valid, true);
const trackedByLens = {
    ALL_RAM: catalog.products.length,
    DDR5: catalog.products.filter(product => product.memoryType === "DDR5" && product.formFactor === "DIMM").length,
    DDR4: catalog.products.filter(product => product.memoryType === "DDR4" && product.formFactor === "DIMM").length,
    LAPTOP_SODIMM: catalog.products.filter(product => product.formFactor === "SO_DIMM").length
};
assert.deepEqual(Object.fromEntries(Object.entries(projection.lenses).map(([key, lens]) => [key, lens.coverage.productsTracked])), trackedByLens);
assert.equal(projection.lenses.ALL_RAM.historyCoverage.totalAdmittedObservationCount, terminalAdmitted.length);
assert.equal(projection.lenses.ALL_RAM.historyCoverage.comparableObservationCount, chronology.eligibleObservationCount);
assert.equal(projection.lenses.ALL_RAM.historyCoverage.productsWithComparableHistory, chronology.productSeriesCount);
assert.equal(projection.lenses.ALL_RAM.coverage.productsCurrentlyPriced, currentlyPricedProducts);
assert.equal(projection.lenses.LAPTOP_SODIMM.productRows.every(row => row.formFactor === "SO_DIMM"), true);
assert.equal(projection.lenses.LAPTOP_SODIMM.productRows.some(row => row.memoryType === "DDR4"), true);
assert.doesNotMatch(JSON.stringify(projection), /destinationUrl|sourceUrl|rawPayload|providerTask|evidenceId|affiliate/i);
assert.deepEqual(await createRamTerminalPublicIntelligence({ catalog, currentRetail, historicalRepository: history, asOf, currentSnapshotId: currentState.current.snapshotId }), projection);
const movementDirection = amount => amount > 0 ? "UP" : amount < 0 ? "DOWN" : "FLAT";
for (const lens of Object.values(projection.lenses)) {
    const movements = lens.productRows.filter(row => row.history.changeFromPreviousAmount !== undefined);
    for (const row of movements) {
        const expected = Math.round((row.history.latestComparableObservation.itemPriceUsd - row.history.previousComparableObservation.itemPriceUsd) * 100) / 100;
        assert.equal(row.history.changeFromPreviousAmount, expected);
        assert.equal(row.history.movement, movementDirection(expected));
    }
    assert.equal(lens.signalSummary.productsDownFromPrevious, movements.filter(row => row.history.movement === "DOWN").length);
    assert.equal(lens.signalSummary.productsUpFromPrevious, movements.filter(row => row.history.movement === "UP").length);
    assert.equal(lens.signalSummary.productsFlatFromPrevious, movements.filter(row => row.history.movement === "FLAT").length);
    assert.equal(lens.signalSummary.productsAtObservedLow, lens.productRows.filter(row => row.history.atObservedLow === true).length);
    for (const row of lens.productRows.filter(row => row.history.observedMinimumItemPrice !== undefined)) assert.equal(row.history.observedMinimumItemPrice <= row.history.observedMaximumItemPrice, true);
    for (const row of lens.productRows.filter(row => row.history.atObservedLow === true)) assert.equal(row.history.latestComparableObservation.itemPriceUsd, row.history.observedMinimumItemPrice);
}

const miniProducts = Array.from({ length: 6 }, (_, index) => ({ atlasProductId: `ram_fixture_${index}`, publicPath: `/ram/fixture-${index}/`, brand: "Fixture", displayName: `Fixture ${index}`, memoryType: "DDR5", formFactor: "DIMM", capacityGb: 16, moduleCount: 2, capacityPerModuleGb: 8, dataRateMtps: 6000 }));
const miniCatalog = { products: miniProducts };
const offer = (index, price, retailerId = "RETAILER-0001") => ({ atlasProductId: `ram_fixture_${index}`, status: "CURRENT_PRICE_AVAILABLE", eligibleOfferCount: 1, lowerCurrentItemPrice: null, offers: [{ atlasProductId: `ram_fixture_${index}`, retailerId, itemPriceUsd: price, currency: "USD", comparisonEligible: true }] });
const odd = await createRamTerminalPublicIntelligence({ catalog: { products: miniProducts.slice(0, 5) }, currentRetail: { state: "AVAILABLE", products: [10, 20, 30, 40, 50].map((price, index) => offer(index, price)) }, historicalRepository: { getAll: async () => [] }, asOf });
assert.equal(odd.lenses.ALL_RAM.currentMarket.medianCurrentItemPrice, 30);
const even = await createRamTerminalPublicIntelligence({ catalog: miniCatalog, currentRetail: { state: "AVAILABLE", products: [10, 20, 30, 40, 50, 60].map((price, index) => offer(index, price)) }, historicalRepository: { getAll: async () => [] }, asOf });
assert.equal(even.lenses.ALL_RAM.currentMarket.medianCurrentItemPrice, 35);
assert.equal(even.lenses.ALL_RAM.currentMarket.currentItemPriceMinimum, 10);
assert.equal(even.lenses.ALL_RAM.currentMarket.currentItemPriceMaximum, 60);
const sparse = await createRamTerminalPublicIntelligence({ catalog: miniCatalog, currentRetail: { state: "AVAILABLE", products: [offer(0, 10)] }, historicalRepository: { getAll: async () => [] }, asOf });
assert.equal(sparse.lenses.ALL_RAM.currentMarket.state, "INSUFFICIENT_MARKET_COHORT");
assert.equal(sparse.lenses.ALL_RAM.currentMarket.medianCurrentItemPrice, null);
assert.equal(sparse.lenses.ALL_RAM.currentMarket.lowestCurrentItemPrice, 10);

const historical = ({ id, time, price, comparable = true, source = "DATAFORSEO_AMAZON", condition = "NEW" }) => createHistoricalObservation({ factLevel: true, observationId: createHistoricalObservationId(id), atlasProductId: "ram_fixture_0", retailerId: "RETAILER-0001", marketplace: "amazon.com", observationTime: time, admittedAt: time, market: { sellerName: "Amazon", sourceUrl: "https://example.com", basePrice: price, totalPrice: null, shipping: null, tax: null, currency: "USD", condition, availability: "in_stock" }, provenance: { retainedEvidenceId: id, provider: "DATAFORSEO", source, rawPayloadReference: `fixture:${id}`, acquisition: { type: "REUSABLE_IDENTITY_REPEAT", atlasProductId: "ram_fixture_0", sourceId: source, operation: "AMAZON_SELLERS", reusableIdentityRecordId: "identity", reusableIdentityDigest: "digest", sourceRightsProfileDigest: "rights", preparedObservationId: "prepared", repeatAuthorizationId: "auth", paidActionIntentId: "intent", acquisitionCycleId: "cycle", observationCycle: "obs-cycle", providerTaskId: "task", canonicalResultId: "result", canonicalResultDigest: "result-digest", lineageBindingDigest: "lineage" } }, observedMerchant: { resolutionState: "RESOLVED" }, comparability: { classification: comparable ? "STANDALONE_COMPARABLE" : "UNKNOWN_COMPARABILITY", standaloneEligible: comparable, reasons: comparable ? [] : ["UNKNOWN"] }, admittedBy: "test", idempotencyKey: id });
const historyRows = [historical({ id: "h1", time: "2026-09-01T00:00:00Z", price: 100 }), historical({ id: "h2", time: "2026-09-02T00:00:00Z", price: 90 }), historical({ id: "h3", time: "2026-09-02T00:00:00Z", price: 80 }), historical({ id: "h4", time: "2026-09-03T00:00:00Z", price: 70, comparable: false }), historical({ id: "rakuten", time: "2026-09-04T00:00:00Z", price: 1, source: "RAKUTEN_SAMPLE_RESEARCH" })];
const signals = await createRamTerminalPublicIntelligence({ catalog: { products: miniProducts.slice(0, 1) }, currentRetail: { state: "NO_QUALIFYING_CURRENT_PRICE", products: [] }, historicalRepository: { getAll: async () => historyRows }, asOf });
const signal = signals.lenses.ALL_RAM.productRows[0].history;
assert.equal(signal.admittedObservationCount, 4);
assert.equal(signal.comparableObservationCount, 3);
assert.equal(signal.distinctComparableTimestampCount, 2);
assert.equal(signal.movement, "DOWN");
assert.equal(signal.previousComparableObservation.itemPriceUsd, 100);
assert.equal(signal.latestComparableObservation.itemPriceUsd, 90);
assert.equal(signal.observedMinimumItemPrice, 80);
assert.equal(signal.atObservedLow, false);
const independentCurrent = await createRamTerminalPublicIntelligence({ catalog: { products: miniProducts.slice(0, 1) }, currentRetail: { state: "AVAILABLE", products: [offer(0, 60)] }, historicalRepository: { getAll: async () => historyRows }, asOf });
const independentRow = independentCurrent.lenses.ALL_RAM.productRows[0];
assert.equal(independentRow.current.itemPriceUsd, 60);
assert.equal(independentRow.history.latestComparableObservation.itemPriceUsd, 90);
assert.equal(independentRow.history.previousComparableObservation.itemPriceUsd, 100);
assert.equal(independentRow.history.changeFromPreviousAmount, -10);
assert.equal(independentRow.history.movement, "DOWN");
assert.equal(independentRow.current.itemPriceUsd < independentRow.history.observedMinimumItemPrice, true);
console.log(`Mercury RAM Terminal public intelligence contract passed: ${terminalAdmitted.length} admitted, ${chronology.eligibleObservationCount} comparable, ${currentlyPricedProducts} currently priced.`);
