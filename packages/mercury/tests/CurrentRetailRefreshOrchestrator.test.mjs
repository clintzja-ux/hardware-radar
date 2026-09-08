import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
    createCurrentDisplaySnapshot,
    createCurrentRetailRefreshPortfolio,
    createPublicCurrentRetailProjection,
    CurrentRetailRefreshOrchestrator,
    FileCurrentDisplaySnapshotRepository,
    ManualRetailReviewImportService
} from "../current-display/index.js";

let cases = 0;
const asOf = "2026-09-08T12:00:00.000Z";
const product = (id, memoryType, formFactor = "DIMM", lifecycleStatus = "ACTIVE") => ({ identity: { productType: "ram", atlasProductId: id, manufacturerPartNumber: id.toUpperCase(), brand: "Fixture", displayName: id }, governance: { lifecycleStatus, publicationStatus: lifecycleStatus === "ACTIVE" ? "READY" : "PENDING" }, extension: { data: { classification: { memoryType, formFactor }, capacity: { capacityGb: 32, moduleCount: 2, capacityPerModuleGb: 16 }, performance: { dataRateMtps: 6000, casLatency: 30 } } } });
const products = [product("ram_fixture_ddr5", "DDR5"), product("ram_fixture_ddr4", "DDR4"), product("ram_fixture_laptop", "DDR5", "SO_DIMM"), product("ram_fixture_draft", "DDR5", "DIMM", "DRAFT")];
const retailers = [{ id: "RETAILER-0001", name: "Amazon", status: "active" }, { id: "RETAILER-0004", name: "Newegg", status: "active" }];
const destination = (suffix, atlasProductId, retailerId, marketplace) => ({ destinationId: `mer_dest_${suffix.repeat(24)}`, atlasProductId, retailerId, marketplace, destinationUrl: `https://${marketplace}/p/${atlasProductId}`, retailerListingId: `${atlasProductId}-listing`, status: "ACTIVE" });
const destinations = [destination("a", "ram_fixture_ddr5", "RETAILER-0004", "newegg.com"), destination("b", "ram_fixture_ddr4", "RETAILER-0001", "amazon.com"), destination("c", "ram_fixture_laptop", "RETAILER-0004", "newegg.com"), destination("d", "ram_fixture_draft", "RETAILER-0004", "newegg.com")];
const rights = Object.freeze({ profileId: "FIXTURE_CURRENT_RETAIL", acquisitionAllowed: true, ephemeralRetentionAllowed: true, publicDisplayAllowed: true, comparisonAllowed: true, historicalRetentionAllowed: false, ttlSeconds: 129600 });
const fixtureAdapter = ({ adapterId = "mer_adapter_fixture_primary", mode = "AUTOMATED_PRIMARY", retailerIds = ["RETAILER-0004"], results = {}, tracker = null, delay = 0 } = {}) => ({
    adapterId, mode, rights,
    supports: item => retailerIds.includes(item.retailerId),
    refresh: async item => { if (tracker) { tracker.active += 1; tracker.max = Math.max(tracker.max, tracker.active); } if (delay) await new Promise(resolve => setTimeout(resolve, delay)); if (tracker) tracker.active -= 1; const result = results[item.destinationId]; if (result instanceof Error) throw result; return structuredClone(result ?? { type: "OUTCOME", status: "SOURCE_UNAVAILABLE" }); }
});
const observation = (item, overrides = {}) => ({ type: "OBSERVATION", atlasProductId: item.atlasProductId, retailerId: item.retailerId, destinationId: item.destinationId, destinationUrl: item.destinationUrl, retailer: item.retailerId === "RETAILER-0001" ? "AMAZON" : "NEWEGG", marketplace: item.marketplace, itemPriceUsd: 100, currency: "USD", condition: "NEW", availability: "AVAILABLE", sellerType: null, sellerName: null, shippingUsd: null, feesUsd: null, sourceId: "FIXTURE_SOURCE", observedAt: "2026-09-08T11:00:00.000Z", ...overrides });

const primarySeed = fixtureAdapter();
const alternate = fixtureAdapter({ adapterId: "mer_adapter_fixture_alternate", mode: "AUTOMATED_ALTERNATE", retailerIds: ["RETAILER-0001", "RETAILER-0004"] });
const portfolio = createCurrentRetailRefreshPortfolio({ products, destinations, retailers, adapters: [alternate, primarySeed], asOf });
assert.equal(portfolio.items.length, 3);
assert.equal(portfolio.excluded.some(item => item.reason === "ATLAS_OR_DESTINATION_NOT_ACTIVE_READY"), true);
assert.equal(portfolio.items.find(item => item.retailerId === "RETAILER-0004").sourceAdapterId, primarySeed.adapterId);
assert.equal(portfolio.items.find(item => item.retailerId === "RETAILER-0001").sourceAdapterId, alternate.adapterId);
assert.deepEqual(createCurrentRetailRefreshPortfolio({ products, destinations: [...destinations].reverse(), retailers, adapters: [primarySeed, alternate], asOf }), portfolio);
assert.equal(portfolio.affiliateStateUsed, false); cases += 1;

const unavailablePrimary = fixtureAdapter({ retailerIds: [] });
const alternatePortfolio = createCurrentRetailRefreshPortfolio({ products, destinations: [destinations[0]], retailers, adapters: [unavailablePrimary, alternate], asOf });
assert.equal(alternatePortfolio.items[0].sourceAdapterId, alternate.adapterId);
assert.equal(alternatePortfolio.items[0].sourceMode, "AUTOMATED_ALTERNATE"); cases += 1;

const invalidDestinationPortfolio = createCurrentRetailRefreshPortfolio({ products, destinations: [{ ...destinations[0], destinationUrl: "http://newegg.com/not-secure" }], retailers, adapters: [primarySeed], asOf });
assert.equal(invalidDestinationPortfolio.items.length, 0); assert.equal(invalidDestinationPortfolio.excluded[0].reason, "DESTINATION_INVALID"); cases += 1;

assert.throws(() => createCurrentRetailRefreshPortfolio({ products, destinations, adapters: [{ ...primarySeed, rights: { ...rights, historicalRetentionAllowed: true } }], asOf }), /CURRENT_RETAIL_SOURCE_RIGHTS_INVALID/); cases += 1;

const preparedResults = Object.fromEntries(portfolio.items.map((item, index) => [item.destinationId, observation(item, { itemPriceUsd: [80, 70, 60][index] })]));
const adapters = [fixtureAdapter({ results: preparedResults }), fixtureAdapter({ adapterId: alternate.adapterId, mode: alternate.mode, retailerIds: ["RETAILER-0001", "RETAILER-0004"], results: preparedResults })];
const run = await new CurrentRetailRefreshOrchestrator({ adapters, concurrency: 3 }).run({ portfolio });
assert.equal(run.counts.attempted, 3); assert.equal(run.counts.refreshed, 3); assert.equal(run.counts.itemPriceEligibleOffers, 3);
assert.deepEqual({ network: run.externalOperations, tasks: run.providerTasks, spend: run.actualSpendUsd, history: run.historicalObservationsCreated, canonical: run.canonicalObservationsCreated, reviews: run.reviewDecisionsCreated, publications: run.publicationDecisionsCreated }, { network: 0, tasks: 0, spend: 0, history: 0, canonical: 0, reviews: 0, publications: 0 });
assert.deepEqual(await new CurrentRetailRefreshOrchestrator({ adapters, concurrency: 3 }).run({ portfolio }), run); cases += 1;

const isolatedResults = { ...preparedResults, [portfolio.items[0].destinationId]: Object.assign(new Error("fixture provider error"), { code: "PROVIDER_ERROR" }) };
const isolatedAdapters = [fixtureAdapter({ results: isolatedResults }), fixtureAdapter({ adapterId: alternate.adapterId, mode: alternate.mode, retailerIds: ["RETAILER-0001", "RETAILER-0004"], results: isolatedResults })];
const isolatedRun = await new CurrentRetailRefreshOrchestrator({ adapters: isolatedAdapters, concurrency: 3 }).run({ portfolio });
assert.equal(isolatedRun.outcomes.filter(item => item.status === "PROVIDER_ERROR").length, 1);
assert.equal(isolatedRun.snapshot.offers.length, 2); cases += 1;

const unknownItem = portfolio.items.find(item => item.destinationId === destinations[0].destinationId);
const unknownAdapter = fixtureAdapter({ results: { [unknownItem.destinationId]: observation(unknownItem, { condition: null, availability: null }) } });
const unknownPortfolio = createCurrentRetailRefreshPortfolio({ products, destinations: [destinations[0]], retailers, adapters: [unknownAdapter], asOf });
const unknownRun = await new CurrentRetailRefreshOrchestrator({ adapters: [unknownAdapter] }).run({ portfolio: unknownPortfolio });
assert.equal(unknownRun.outcomes[0].status, "AVAILABILITY_UNKNOWN");
assert.equal(unknownRun.snapshot.offers[0].condition, null); assert.equal(unknownRun.snapshot.offers[0].availability, "UNKNOWN"); assert.equal(unknownRun.snapshot.offers[0].itemPriceEligible, false); cases += 1;

const marketAdapter = fixtureAdapter({ results: { [unknownItem.destinationId]: observation(unknownItem, { availability: "AVAILABLE_MARKETPLACE", sellerType: "THIRD_PARTY", sellerName: null }) } });
const marketRun = await new CurrentRetailRefreshOrchestrator({ adapters: [marketAdapter] }).run({ portfolio: createCurrentRetailRefreshPortfolio({ products, destinations: [destinations[0]], adapters: [marketAdapter], asOf }) });
assert.equal(marketRun.outcomes[0].status, "MARKETPLACE_ONLY"); assert.equal(marketRun.snapshot.offers[0].itemPriceEligible, false); cases += 1;

const prior = createCurrentDisplaySnapshot({ observedAt: "2026-09-07T00:00:00.000Z", importedAt: "2026-09-07T00:00:00.000Z", source: { workbook: "fixture.xlsx", sheet: "fixture", digest: "a".repeat(64) }, offers: [{ ...observation(unknownItem, { observedAt: "2026-09-07T00:00:00.000Z" }), priceUsd: 99, itemPriceUsd: undefined, type: undefined, destinationUrl: undefined, sourceId: undefined, retailer: "NEWEGG", availability: "AVAILABLE", matchStatus: "EXACT_PRODUCT_PAGE", sourceRow: 1, itemPriceEligible: true, deliveredCostEligible: false, deliveredCostReasons: ["SHIPPING_COST_UNKNOWN", "FEES_UNKNOWN"], comparisonEligible: true, comparisonReasons: [], researchUrl: unknownItem.destinationUrl }] });
const outcomes = ["TIMEOUT", "SOURCE_UNAVAILABLE", "RATE_LIMITED", "PROVIDER_ERROR"];
for (const status of outcomes) {
    const adapter = fixtureAdapter({ results: { [unknownItem.destinationId]: { type: "OUTCOME", status } } });
    const result = await new CurrentRetailRefreshOrchestrator({ adapters: [adapter] }).run({ portfolio: createCurrentRetailRefreshPortfolio({ products, destinations: [destinations[0]], adapters: [adapter], asOf }), priorSnapshot: prior });
    assert.equal(result.snapshot.offers[0].observedAt, "2026-09-07T00:00:00.000Z"); assert.equal(result.outcomes[0].status, status);
} cases += 1;

for (const status of ["OUT_OF_STOCK", "PRICE_NOT_EXPOSED"]) {
    const adapter = fixtureAdapter({ results: { [unknownItem.destinationId]: { type: "OUTCOME", status } } });
    const result = await new CurrentRetailRefreshOrchestrator({ adapters: [adapter] }).run({ portfolio: createCurrentRetailRefreshPortfolio({ products, destinations: [destinations[0]], adapters: [adapter], asOf }), priorSnapshot: prior });
    assert.equal(result.snapshot.offers.length, 0); assert.equal(result.outcomes[0].status, status);
} cases += 1;

const malformedAdapter = fixtureAdapter({ results: { [unknownItem.destinationId]: { type: "OBSERVATION", itemPriceUsd: -1 } } });
const malformed = await new CurrentRetailRefreshOrchestrator({ adapters: [malformedAdapter] }).run({ portfolio: createCurrentRetailRefreshPortfolio({ products, destinations: [destinations[0]], adapters: [malformedAdapter], asOf }), priorSnapshot: prior });
assert.equal(malformed.outcomes[0].status, "INVALID_SOURCE_RESULT"); assert.equal(malformed.snapshot.offers[0].observedAt, prior.offers[0].observedAt); cases += 1;

const tracker = { active: 0, max: 0 };
const concurrent = fixtureAdapter({ retailerIds: ["RETAILER-0001", "RETAILER-0004"], results: preparedResults, tracker, delay: 10 });
const concurrentPortfolio = createCurrentRetailRefreshPortfolio({ products, destinations: destinations.slice(0, 3), adapters: [concurrent], asOf });
await new CurrentRetailRefreshOrchestrator({ adapters: [concurrent], concurrency: 3 }).run({ portfolio: concurrentPortfolio });
assert.ok(tracker.max > 1); cases += 1;

const temp = await mkdtemp(path.join(os.tmpdir(), "hardware-radar-current-refresh-"));
try {
    const statePath = path.join(temp, "current.json");
    const repository = new FileCurrentDisplaySnapshotRepository({ statePath });
    const persisted = await new CurrentRetailRefreshOrchestrator({ adapters, snapshotRepository: repository }).run({ portfolio });
    const replay = await new CurrentRetailRefreshOrchestrator({ adapters, snapshotRepository: repository }).run({ portfolio });
    assert.equal(persisted.persistence.status, "REPLACED"); assert.equal(replay.persistence.status, "DUPLICATE");
    const state = await repository.getState(); assert.equal(state.current.snapshotId, run.snapshot.snapshotId); assert.equal(state.previous, null);
    assert.equal((await readFile(statePath, "utf8")).includes("previous"), true);
} finally { await rm(temp, { recursive: true, force: true }); } cases += 1;

const projection = createPublicCurrentRetailProjection({ products, retailers, destinations, currentSnapshot: run.snapshot, asOf });
assert.equal(projection.winners.overall.itemPriceUsd, 60); assert.ok(projection.winners.ddr5); assert.ok(projection.winners.ddr4); assert.ok(projection.winners.laptop); cases += 1;
const staleProjection = createPublicCurrentRetailProjection({ products, retailers, destinations, currentSnapshot: run.snapshot, asOf: "2026-09-10T12:00:00.000Z" });
assert.equal(staleProjection.winners.overall, null); cases += 1;

const preview = await new CurrentRetailRefreshOrchestrator({ adapters }).run({ portfolio, dryRun: true });
assert.deepEqual({ status: preview.status, mutations: preview.mutations, network: preview.externalOperations, spend: preview.actualSpendUsd }, { status: "PREVIEW", mutations: 0, network: 0, spend: 0 }); cases += 1;
assert.equal(typeof ManualRetailReviewImportService, "function"); cases += 1;

console.log(`Current retail refresh orchestrator tests passed: ${cases} cases.`);
