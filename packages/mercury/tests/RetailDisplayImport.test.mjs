import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
    createCurrentDisplaySnapshot,
    classifyRetailDiscoveryGaps,
    deriveCurrentDisplayComparison,
    FileCurrentDisplaySnapshotRepository,
    deriveCurrentDisplayDeliveredCost,
    RetailDisplayImportService,
    assessStandardRetailNewCondition,
    validateCurrentDisplaySnapshot
} from "../current-display/index.js";

let cases = 0;
const product = (id, mpn, lifecycleStatus = "ACTIVE", publicationStatus = "READY") => ({ identity: { atlasProductId: id, manufacturerPartNumber: mpn }, governance: { lifecycleStatus, publicationStatus } });
const products = [product("ram_fixture_one", "FIX-ONE"), product("ram_fixture_two", "FIX-TWO"), product("ram_fixture_draft", "FIX-DRAFT", "DRAFT", "PENDING")];
const destination = { destinationId: "mer_dest_aaaaaaaaaaaaaaaaaaaaaaaa", atlasProductId: "ram_fixture_one", retailerId: "RETAILER-0001", retailerListingId: "B000000001" };
const neweggDestination = { destinationId: "mer_dest_bbbbbbbbbbbbbbbbbbbbbbbb", atlasProductId: "ram_fixture_one", retailerId: "RETAILER-0004", retailerListingId: "N82E16800000001" };
const row = overrides => ({
    atlasProductId: "ram_fixture_one", manufacturerPartNumber: "FIX-ONE", observedAt: 46269.25,
    amazonUrl: "https://www.amazon.com/dp/B000000001", amazonObservedPriceUsd: 100, amazonAvailability: "AVAILABLE", amazonMatchStatus: "EXACT_PRODUCT_PAGE",
    neweggUrl: "https://www.newegg.com/fixture/p/N82E16800000001", neweggObservedPriceUsd: 90, neweggAvailability: "AVAILABLE", neweggMatchStatus: "EXACT_PRODUCT_PAGE",
    ...overrides
});
const service = new RetailDisplayImportService({ products, destinations: [destination, neweggDestination] });
const imported = service.importRows({ rows: [row()], sourceWorkbook: "fixture.xlsx", sourceSheet: "RAM Retail Discovery", importedAt: "2026-09-04T12:00:00Z" });
assert.equal(validateCurrentDisplaySnapshot(imported.snapshot).valid, true);
assert.equal(imported.snapshot.offers.length, 2);
assert.equal(imported.snapshot.offers.every(offer => offer.observedAt === "2026-09-04T06:00:00.000Z"), true);
assert.equal(imported.snapshot.offers.every(offer => offer.condition === "NEW" && offer.itemPriceEligible === true && offer.comparisonEligible === true), true);
assert.equal(imported.snapshot.offers.every(offer => offer.deliveredCostEligible === false && offer.deliveredCostReasons.includes("SHIPPING_COST_UNKNOWN")), true);
assert.equal(imported.outcomes.some(item => item.status === "DESTINATION_REUSED"), true);
assert.equal(imported.outcomes.filter(item => item.status === "DESTINATION_REUSED").length, 2);
assert.deepEqual({ network: imported.networkOperations, tasks: imported.providerTasks, spend: imported.actualSpendUsd, history: imported.historicalObservationsCreated }, { network: 0, tasks: 0, spend: 0, history: 0 }); cases += 1;

const search = service.importRows({ rows: [row({ neweggUrl: "https://www.newegg.com/p/pl?d=FIX-ONE", neweggMatchStatus: "EXACT_MPN_SEARCH_RESULT" })], sourceWorkbook: "fixture.xlsx", sourceSheet: "RAM Retail Discovery", importedAt: "2026-09-04T12:00:00Z" });
assert.equal(search.outcomes.some(item => item.status === "SEARCH_URL_ONLY"), true);
assert.equal(search.outcomes.some(item => item.retailer === "NEWEGG" && item.status === "PRICE_OBSERVED_DESTINATION_UNRESOLVED"), true); cases += 1;

const unavailable = service.importRows({ rows: [row({ neweggObservedPriceUsd: null, neweggAvailability: "PAGE_FOUND_PRICE_NOT_EXPOSED" })], sourceWorkbook: "fixture.xlsx", sourceSheet: "RAM Retail Discovery", importedAt: "2026-09-04T12:00:00Z" });
assert.equal(unavailable.snapshot.offers.length, 1);
assert.equal(unavailable.outcomes.some(item => item.retailer === "NEWEGG" && item.status === "NO_CURRENT_PRICE"), true); cases += 1;

const volatile = service.importRows({ rows: [row({ neweggObservedPriceUsd: 91, neweggAvailability: "PRICE_VOLATILE_REFRESH_REQUIRED" })], sourceWorkbook: "fixture.xlsx", sourceSheet: "RAM Retail Discovery", importedAt: "2026-09-04T12:00:00Z" });
assert.equal(volatile.snapshot.offers.length, 1); cases += 1;

const unverified = service.importRows({ rows: [row({ amazonUrl: null, amazonObservedPriceUsd: null, amazonAvailability: null, amazonMatchStatus: "NOT_VERIFIED_IN_INITIAL_SWEEP", neweggUrl: null, neweggObservedPriceUsd: null, neweggAvailability: null, neweggMatchStatus: "NOT_VERIFIED_IN_INITIAL_SWEEP" })], sourceWorkbook: "fixture.xlsx", sourceSheet: "RAM Retail Discovery", importedAt: "2026-09-04T12:00:00Z" });
assert.equal(unverified.outcomes[0].status, "UNVERIFIED"); assert.equal(unverified.snapshot.offers.length, 0); cases += 1;

const isolated = service.importRows({ rows: [row({ atlasProductId: "ram_wrong", manufacturerPartNumber: "WRONG" }), row({ atlasProductId: "ram_fixture_two", manufacturerPartNumber: "FIX-TWO", amazonUrl: null, amazonObservedPriceUsd: 80, amazonMatchStatus: "EXACT_MPN_SECONDARY_PRICE", amazonAvailability: "AVAILABLE_URL_NOT_CAPTURED", neweggUrl: null, neweggObservedPriceUsd: null, neweggAvailability: null, neweggMatchStatus: null })], sourceWorkbook: "fixture.xlsx", sourceSheet: "RAM Retail Discovery", importedAt: "2026-09-04T12:00:00Z" });
assert.equal(isolated.outcomes.some(item => item.status === "REJECTED_IDENTITY_MISMATCH"), true); assert.equal(isolated.snapshot.offers.length, 1); cases += 1;

const draft = service.importRows({ rows: [row({ atlasProductId: "ram_fixture_draft", manufacturerPartNumber: "FIX-DRAFT" })], sourceWorkbook: "fixture.xlsx", sourceSheet: "RAM Retail Discovery", importedAt: "2026-09-04T12:00:00Z" });
assert.equal(draft.outcomes.some(item => item.retailer === "AMAZON" && item.status === "DESTINATION_BLOCKED_ATLAS_NOT_ACTIVE_READY"), true); cases += 1;

const admission = service.importRows({ rows: [row({ atlasProductId: "ram_fixture_two", manufacturerPartNumber: "FIX-TWO", amazonUrl: "https://www.amazon.com/dp/B000000002", neweggUrl: null, neweggObservedPriceUsd: null })], sourceWorkbook: "fixture.xlsx", sourceSheet: "RAM Retail Discovery", importedAt: "2026-09-04T12:00:00Z" });
assert.equal(admission.outcomes.some(item => item.retailer === "AMAZON" && item.status === "DESTINATION_ADMISSION_REQUIRED"), true); cases += 1;

const conflict = service.importRows({ rows: [row({ amazonUrl: "https://www.amazon.com/dp/B000000099" })], sourceWorkbook: "fixture.xlsx", sourceSheet: "RAM Retail Discovery", importedAt: "2026-09-04T12:00:00Z" });
assert.equal(conflict.outcomes.some(item => item.retailer === "AMAZON" && item.status === "DESTINATION_REVIEW_REQUIRED"), true);
assert.equal(conflict.snapshot.offers.find(offer => offer.retailer === "AMAZON").itemPriceEligible, false); cases += 1;

const outOfStock = service.importRows({ rows: [row({ neweggAvailability: "OUT_OF_STOCK" })], sourceWorkbook: "fixture.xlsx", sourceSheet: "RAM Retail Discovery", importedAt: "2026-09-04T12:00:00Z" });
assert.equal(outOfStock.outcomes.some(item => item.retailer === "NEWEGG" && item.status === "DESTINATION_REUSED"), true);
assert.equal(outOfStock.snapshot.offers.find(offer => offer.retailer === "NEWEGG").itemPriceEligible, false); cases += 1;

for (const evidenceText of ["refurbished", "used", "open-box", "renewed", "pre-owned", "marketplace ambiguity"]) {
    const condition = assessStandardRetailNewCondition({ retailer: "NEWEGG", researchUrl: "https://www.newegg.com/fixture/p/N82E16800000001", matchStatus: "EXACT_PRODUCT_PAGE", evidenceText });
    assert.equal(condition.eligible, false);
    assert.equal(condition.condition, null);
}
assert.equal(assessStandardRetailNewCondition({ retailer: "AMAZON", researchUrl: "https://www.amazon.com/dp/B000000001", matchStatus: "EXACT_PRODUCT_PAGE" }).condition, "NEW");
assert.equal(assessStandardRetailNewCondition({ retailer: "NEWEGG", researchUrl: "https://www.newegg.com/fixture/p/N82E16800000001", matchStatus: "EXACT_PRODUCT_PAGE", evidenceText: "sold/shipped by Newegg" }).condition, "NEW");
assert.equal(assessStandardRetailNewCondition({ retailer: "NEWEGG", researchUrl: "https://www.newegg.com/fixture/p/N82E16800000001", matchStatus: "EXACT_PRODUCT_PAGE", evidenceText: "marketplace seller" }).eligible, false);
assert.equal(assessStandardRetailNewCondition({ retailer: "NEWEGG", researchUrl: "https://www.newegg.com/p/pl?d=FIX", matchStatus: "EXACT_MPN_SEARCH_RESULT" }).eligible, false); cases += 1;

const eligibleOffer = (atlasProductId, retailer, priceUsd) => ({ atlasProductId, retailer, retailerId: retailer === "AMAZON" ? "RETAILER-0001" : "RETAILER-0004", marketplace: retailer === "AMAZON" ? "amazon.com" : "newegg.com", priceUsd, currency: "USD", availability: "AVAILABLE", condition: "NEW", shippingUsd: null, feesUsd: null, researchUrl: null, destinationId: retailer === "AMAZON" ? "mer_dest_aaaaaaaaaaaaaaaaaaaaaaaa" : "mer_dest_bbbbbbbbbbbbbbbbbbbbbbbb", matchStatus: "EXACT_PRODUCT_PAGE", sourceRow: 5, itemPriceEligible: true, deliveredCostEligible: false, deliveredCostReasons: ["SHIPPING_COST_UNKNOWN", "FEES_UNKNOWN"], comparisonEligible: true, comparisonReasons: [] });
const comparable = createCurrentDisplaySnapshot({ observedAt: "2026-09-04T06:00:00Z", importedAt: "2026-09-04T12:00:00Z", source: { workbook: "fixture.xlsx", sheet: "RAM Retail Discovery", digest: "a".repeat(64) }, offers: [eligibleOffer("ram_fixture_one", "AMAZON", 100), eligibleOffer("ram_fixture_one", "NEWEGG", 90), eligibleOffer("ram_fixture_two", "AMAZON", 80)] });
assert.equal(deriveCurrentDisplayComparison(comparable, "ram_fixture_one").cheapest.retailer, "NEWEGG");
assert.equal(deriveCurrentDisplayComparison(comparable, "ram_fixture_two").cheapest.retailer, "AMAZON");
assert.equal(deriveCurrentDisplayComparison(comparable, "ram_fixture_one").cheapest.retailer, "NEWEGG"); cases += 1;
assert.equal(deriveCurrentDisplayDeliveredCost(comparable, "ram_fixture_one").status, "UNAVAILABLE"); cases += 1;

const temporary = await mkdtemp(path.join(os.tmpdir(), "retail-display-"));
try {
    const statePath = path.join(temporary, "state.json");
    const repository = new FileCurrentDisplaySnapshotRepository({ statePath });
    assert.equal((await repository.replace(imported.snapshot)).status, "REPLACED");
    assert.equal((await repository.replace(imported.snapshot)).status, "DUPLICATE");
    const next = createCurrentDisplaySnapshot({ ...comparable, importedAt: "2026-09-04T13:00:00Z" });
    const replacement = await repository.replace(next);
    assert.equal(replacement.previousSnapshotId, imported.snapshot.snapshotId);
    const state = await repository.getState();
    assert.equal(state.current.snapshotId, next.snapshotId);
    assert.equal(state.previous.snapshotId, imported.snapshot.snapshotId);
    assert.equal(Object.keys(state).sort().join(","), "current,previous,version");
    assert.equal((await readFile(statePath, "utf8")).includes("history"), false);
} finally { await rm(temporary, { recursive: true, force: true }); }
cases += 1;

const passOne = service.importRows({ rows: [row()], sourceWorkbook: "pass1.xlsx", sourceSheet: "RAM Retail Discovery", importedAt: "2026-09-04T12:00:00Z" });
const passTwo = service.importRows({
    rows: [row({ amazonUrl: null, amazonObservedPriceUsd: null, amazonAvailability: null, amazonMatchStatus: "NOT_VERIFIED_IN_INITIAL_SWEEP", neweggObservedPriceUsd: 85, observedAt: "2026-09-04 13:48:00" })],
    sourceWorkbook: "pass2.xlsx",
    sourceSheet: "RAM Retail Discovery",
    importedAt: "2026-09-04T14:00:00Z",
    priorSnapshot: passOne.snapshot
});
assert.equal(passTwo.snapshot.offers.length, 2);
assert.equal(passTwo.snapshot.offers.find(offer => offer.retailer === "AMAZON").priceUsd, 100);
assert.equal(passTwo.snapshot.offers.find(offer => offer.retailer === "AMAZON").observedAt, "2026-09-04T06:00:00.000Z");
assert.equal(passTwo.snapshot.offers.find(offer => offer.retailer === "NEWEGG").priceUsd, 85);
assert.equal(passTwo.snapshot.offers.find(offer => offer.retailer === "NEWEGG").observedAt, "2026-09-04T13:48:00.000Z");
assert.equal(passTwo.snapshot.observedAt, "2026-09-04T13:48:00.000Z"); cases += 1;

const olderPass = service.importRows({
    rows: [row({ neweggObservedPriceUsd: 70, observedAt: "2026-09-04 05:00:00" })],
    sourceWorkbook: "older.xlsx", sourceSheet: "RAM Retail Discovery", importedAt: "2026-09-04T15:00:00Z", priorSnapshot: passTwo.snapshot
});
assert.equal(olderPass.snapshot.offers.find(offer => offer.retailer === "NEWEGG").priceUsd, 85);
assert.equal(olderPass.outcomes.some(item => item.retailer === "NEWEGG" && item.status === "NO_NEW_EVIDENCE"), true); cases += 1;

const conflictingPass = service.importRows({
    rows: [row({ neweggObservedPriceUsd: 84, observedAt: "2026-09-04 13:48:00" })],
    sourceWorkbook: "conflict.xlsx", sourceSheet: "RAM Retail Discovery", importedAt: "2026-09-04T15:00:00Z", priorSnapshot: passTwo.snapshot
});
assert.equal(conflictingPass.snapshot.offers.find(offer => offer.retailer === "NEWEGG").priceUsd, 85);
assert.equal(conflictingPass.outcomes.some(item => item.retailer === "NEWEGG" && item.status === "CONFLICTING_FINDING"), true); cases += 1;

const gaps = classifyRetailDiscoveryGaps([
    row({ canonicalBrand: "Fixture", family: "One", series: null, exactMpnSearchKey: "FIX-ONE", amazonUrl: null, amazonObservedPriceUsd: null, amazonAvailability: null, amazonMatchStatus: null, neweggUrl: null, neweggObservedPriceUsd: null, neweggAvailability: null, neweggMatchStatus: null }),
    row({ atlasProductId: "ram_fixture_two", manufacturerPartNumber: "FIX-TWO", canonicalBrand: "Fixture", family: "Two", series: null, exactMpnSearchKey: "FIX-TWO", amazonUrl: null, amazonObservedPriceUsd: null, neweggUrl: "https://www.newegg.com/p/pl?d=FIX-TWO", neweggObservedPriceUsd: 75, neweggMatchStatus: "EXACT_MPN_SEARCH_RESULT" })
], products);
assert.deepEqual(gaps[0].classifications, ["COMPLETELY_UNVERIFIED"]);
assert.equal(gaps[1].classifications.includes("NEWEGG_ONLY"), true);
assert.equal(gaps[1].classifications.includes("SEARCH_RESULT_ONLY"), true);
assert.equal(gaps[1].classifications.includes("PRICE_ONLY_DESTINATION_UNRESOLVED"), true); cases += 1;

const passFourGaps = classifyRetailDiscoveryGaps([
    row({ neweggObservedPriceUsd: null, neweggAvailability: "PRICE_VOLATILE_REFRESH_REQUIRED", researchNotes: "price volatile" }),
    row({ atlasProductId: "ram_fixture_two", manufacturerPartNumber: "FIX-TWO", neweggUrl: null, neweggObservedPriceUsd: null, neweggAvailability: "NO_CLEAN_RETAILER_EXACT_PAGE", neweggMatchStatus: "NO_CLEAN_RETAILER_EXACT_PAGE" })
], products);
assert.equal(passFourGaps[0].classifications.includes("MANUAL_PRICE_REFRESH"), true);
assert.equal(passFourGaps[0].recommendedNextResearchAction, "REFRESH_VOLATILE_PRICE");
assert.equal(passFourGaps[1].classifications.includes("CONFIRM_NOT_SOLD"), true); cases += 1;

console.log(`Retail display import tests passed: ${cases} cases.`);
