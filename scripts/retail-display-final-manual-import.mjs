import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { ProductRepository, RetailerRepository } from "../packages/atlas/index.js";
import { createRetailerDestination, RETAILER_DESTINATION_MANUAL_REVIEW_SOURCE_TYPE } from "../packages/mercury/index.js";
import { FileCurrentDisplaySnapshotRepository, ManualRetailReviewImportService } from "../packages/mercury/current-display/index.js";

const args = new Map(process.argv.slice(2).map(value => { const index = value.indexOf("="); return index < 0 ? [value, true] : [value.slice(0, index), value.slice(index + 1)]; }));
if (args.get("--confirm") !== "IMPORT-FINAL-MANUAL-RETAIL-REVIEW") throw new Error("FINAL_MANUAL_RETAIL_REVIEW_CONFIRMATION_REQUIRED");
const rowsPath = path.resolve(String(args.get("--rows-json") ?? ""));
const sourceWorkbook = String(args.get("--source-workbook") ?? "");
const reviewedBy = String(args.get("--reviewed-by") ?? "").trim();
const importedAt = String(args.get("--imported-at") ?? "");
if (!rowsPath || !sourceWorkbook || !reviewedBy || !Number.isFinite(Date.parse(importedAt))) throw new Error("FINAL_MANUAL_RETAIL_REVIEW_AUDIT_REQUIRED");

const readJson = async resource => JSON.parse(await readFile(resource, "utf8"));
const workbookData = await readJson(rowsPath);
const expected = ["priority", "atlasProductId", "brand", "family", "series", "mpn", "lifecycle", "amazonUrlCurrent", "amazonPriceCurrent", "amazonStatusCurrent", "amazonUrlManual", "amazonPriceManual", "amazonManualNotes", "neweggUrlCurrent", "neweggPriceCurrent", "neweggStatusCurrent", "neweggUrlManual", "neweggPriceManual", "neweggManualNotes", "manualAction", "searchKey", "operatorReviewStatus", "operatorNotes", "ddrGeneration", "formFactor", "applicationClass"];
if (workbookData.address !== "A1:Z101" || expected.some(column => !workbookData.headers?.includes(column)) || workbookData.rows?.length !== 100) throw new Error("FINAL_MANUAL_RETAIL_REVIEW_WORKBOOK_INVALID");
const rows = workbookData.rows;

const products = await new ProductRepository({ readJson }).getAll();
const retailers = await new RetailerRepository({ readJson }).getAll();
if (products.length !== 103 || !retailers.some(item => item.id === "RETAILER-0001") || !retailers.some(item => item.id === "RETAILER-0004")) throw new Error("FINAL_MANUAL_RETAIL_REVIEW_OWNER_STATE_INVALID");
const destinationPath = path.resolve("packages/mercury/destinations/production-destinations.json");
const snapshotPath = path.resolve(".forge-review/retail-display/current-display-snapshots.json");
const residuePath = path.resolve(".forge-review/retail-discovery/retail-discovery-post-manual-residue.json");
const destinationState = await readJson(destinationPath);
const snapshotRepository = new FileCurrentDisplaySnapshotRepository({ statePath: snapshotPath });
const priorState = await snapshotRepository.getState();

const first = new ManualRetailReviewImportService({ products, destinations: destinationState.records }).importRows({ rows, sourceWorkbook, importedAt, priorSnapshot: priorState.current });
const additions = [];
for (const outcome of first.outcomes.filter(item => item.status === "NEW_EXACT_DESTINATION_ADMITTED")) {
    const row = rows[outcome.sourceRow - 2];
    additions.push(createRetailerDestination({
        atlasProductId: row.atlasProductId,
        retailerId: outcome.retailer === "AMAZON" ? "RETAILER-0001" : "RETAILER-0004",
        marketplace: outcome.retailer === "AMAZON" ? "amazon.com" : "newegg.com",
        destinationType: "PRODUCT_PAGE",
        destinationUrl: outcome.destinationUrl,
        retailerListingId: outcome.retailerListingId,
        binding: { manufacturerPartNumber: row.mpn, method: "OPERATOR_EXACT_PRODUCT_REVIEW", scope: "EXACT_STANDALONE_PRODUCT", evidenceReferences: [`operator:retail-display-008:${path.basename(sourceWorkbook)}:manual-pass:row-${outcome.sourceRow}:${outcome.retailer.toLowerCase()}:${outcome.retailerListingId}`] },
        provenance: { sourceType: RETAILER_DESTINATION_MANUAL_REVIEW_SOURCE_TYPE },
        reviewedBy, reviewedAt: importedAt, status: "ACTIVE", supersedesDestinationId: null, retirementReason: null, createdAt: importedAt, createdBy: reviewedBy
    }));
}
const destinations = [...destinationState.records, ...additions];
const second = new ManualRetailReviewImportService({ products, destinations }).importRows({ rows, sourceWorkbook, importedAt, priorSnapshot: priorState.current });
if (additions.length) {
    const temporary = `${destinationPath}.${process.pid}.tmp`;
    await writeFile(temporary, `${JSON.stringify({ ...destinationState, records: destinations }, null, 2)}\n`, "utf8");
    await rename(temporary, destinationPath);
}
const replacement = await snapshotRepository.replace(second.snapshot);

const finalDestinationKeys = new Set(destinations.filter(item => item.status === "ACTIVE").map(item => `${item.atlasProductId}|${item.retailerId}`));
const offerByKey = new Map(second.snapshot.offers.map(offer => [`${offer.atlasProductId}|${offer.retailerId}`, offer]));
const statusByProduct = new Map(rows.map(row => [row.atlasProductId, row.operatorReviewStatus]));
const categories = {};
const researchCounts = { COMPLETE_BOTH_RETAILERS: 0, CONFIRMED_SINGLE_RETAILER: 0, PARTIAL_RETAIL_COVERAGE: 0, COMPLETELY_UNVERIFIED: 0, UNRESOLVED_AFTER_MANUAL_REVIEW: 0 };
for (const product of products) {
    const id = product.identity.atlasProductId;
    const amazon = finalDestinationKeys.has(`${id}|RETAILER-0001`), newegg = finalDestinationKeys.has(`${id}|RETAILER-0004`);
    const offers = [offerByKey.get(`${id}|RETAILER-0001`), offerByKey.get(`${id}|RETAILER-0004`)].filter(Boolean);
    const status = statusByProduct.get(id);
    const researchState = status === "UNRESOLVED_AFTER_MANUAL_REVIEW" ? "UNRESOLVED_AFTER_MANUAL_REVIEW"
        : amazon && newegg ? "COMPLETE_BOTH_RETAILERS"
            : amazon || newegg ? (/CONFIRMED_NOT_SOLD/.test(status ?? "") ? "CONFIRMED_SINGLE_RETAILER" : "PARTIAL_RETAIL_COVERAGE")
                : "COMPLETELY_UNVERIFIED";
    researchCounts[researchState] += 1;
    const c = product.extension.data.classification;
    const key = `${c.memoryType} ${c.applicationClass}`;
    categories[key] ??= { productCount: 0, amazonExactDestination: 0, neweggExactDestination: 0, atLeastOneDestination: 0, numericCurrentPrice: 0, itemPriceEligible: 0, unresolvedProducts: 0 };
    categories[key].productCount += 1;
    categories[key].amazonExactDestination += Number(amazon);
    categories[key].neweggExactDestination += Number(newegg);
    categories[key].atLeastOneDestination += Number(amazon || newegg);
    categories[key].numericCurrentPrice += Number(offers.some(offer => Number.isFinite(offer.priceUsd)));
    categories[key].itemPriceEligible += Number(offers.some(offer => offer.itemPriceEligible));
    categories[key].unresolvedProducts += Number(researchState === "COMPLETELY_UNVERIFIED" || researchState === "UNRESOLVED_AFTER_MANUAL_REVIEW");
}
const rejected = second.outcomes.filter(item => ["ROW_REJECTED", "ROW_RETAILER_REJECTED", "SEARCH_URL_REJECTED", "DESTINATION_CONFLICT", "LIFECYCLE_BLOCKED"].includes(item.status));
const residue = {
    schemaVersion: "1.0", source: { workbook: sourceWorkbook, sheet: "Manual Pass" }, generatedAt: importedAt,
    pending: second.outcomes.filter(item => item.status === "PENDING_IGNORED"),
    unresolved: second.outcomes.filter(item => item.status === "UNRESOLVED_AFTER_MANUAL_REVIEW"),
    failures: rejected,
    missingDestinations: products.flatMap(product => ["RETAILER-0001", "RETAILER-0004"].filter(id => !finalDestinationKeys.has(`${product.identity.atlasProductId}|${id}`)).map(id => ({ atlasProductId: product.identity.atlasProductId, retailerId: id }))),
    missingPrices: destinations.filter(item => !offerByKey.has(`${item.atlasProductId}|${item.retailerId}`)).map(item => ({ atlasProductId: item.atlasProductId, retailerId: item.retailerId, destinationId: item.destinationId }))
};
if (residue.pending.length || residue.unresolved.length || residue.failures.length || residue.missingDestinations.length || residue.missingPrices.length) await writeFile(residuePath, `${JSON.stringify(residue, null, 2)}\n`, "utf8");

const summary = {
    workbookRows: rows.length, processedRows: second.research.length,
    statusCounts: Object.fromEntries([...new Set(rows.map(row => row.operatorReviewStatus))].sort().map(status => [status, rows.filter(row => row.operatorReviewStatus === status).length])),
    rowFailures: rejected.length, destinationsBefore: destinationState.records.length, destinationsAdmitted: additions.length,
    destinationsReused: second.outcomes.filter(item => item.status === "EXISTING_DESTINATION_REUSED").length,
    destinationsAfter: destinations.length, productsWithDestination: new Set(destinations.map(item => item.atlasProductId)).size,
    amazonDestinations: destinations.filter(item => item.retailerId === "RETAILER-0001").length,
    neweggDestinations: destinations.filter(item => item.retailerId === "RETAILER-0004").length,
    numericCurrentOffers: second.snapshot.offers.length,
    numericManualPrices: rows.reduce((count, row) => count + Number(row.amazonPriceManual !== null && row.amazonPriceManual !== "") + Number(row.neweggPriceManual !== null && row.neweggPriceManual !== ""), 0),
    itemPriceEligible: second.snapshot.offers.filter(item => item.itemPriceEligible).length,
    itemPriceBlocked: second.snapshot.offers.filter(item => !item.itemPriceEligible).length,
    deliveredCostEligible: second.snapshot.offers.filter(item => item.deliveredCostEligible).length,
    twoRetailerDestinationProducts: products.filter(product => finalDestinationKeys.has(`${product.identity.atlasProductId}|RETAILER-0001`) && finalDestinationKeys.has(`${product.identity.atlasProductId}|RETAILER-0004`)).length,
    singleRetailerDestinationProducts: products.filter(product => Number(finalDestinationKeys.has(`${product.identity.atlasProductId}|RETAILER-0001`)) + Number(finalDestinationKeys.has(`${product.identity.atlasProductId}|RETAILER-0004`)) === 1).length,
    researchCounts, categories, remaining: { pending: residue.pending.length, unresolved: residue.unresolved.length, failures: residue.failures.length, missingDestinations: residue.missingDestinations.length, missingPrices: residue.missingPrices.length },
    snapshotId: second.snapshot.snapshotId, previousSnapshotId: replacement.previousSnapshotId, snapshotStatus: replacement.status,
    providerOperations: 0, paidTasks: 0, actualSpendUsd: 0, historicalObservationsCreated: 0
};
console.log("FINAL MANUAL RETAIL REVIEW IMPORT\n");
console.log(JSON.stringify(summary, null, 2));
