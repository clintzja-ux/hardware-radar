import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { ProductRepository, RetailerRepository } from "../packages/atlas/index.js";
import { createRetailerDestination } from "../packages/mercury/index.js";
import { FileCurrentDisplaySnapshotRepository, RetailDisplayImportService } from "../packages/mercury/current-display/index.js";

const args = new Map(process.argv.slice(2).map(value => { const index = value.indexOf("="); return index < 0 ? [value, true] : [value.slice(0, index), value.slice(index + 1)]; }));
if (args.get("--confirm") !== "IMPORT-RETAIL-DISPLAY-PASS2") throw new Error("RETAIL_DISPLAY_PASS2_CONFIRMATION_REQUIRED");
const rowsPath = path.resolve(String(args.get("--rows-json") ?? ""));
const reviewedAt = String(args.get("--reviewed-at") ?? "");
const reviewedBy = String(args.get("--reviewed-by") ?? "");
const importedAt = String(args.get("--imported-at") ?? "");
if (!rowsPath || !reviewedBy.trim() || !Number.isFinite(Date.parse(reviewedAt)) || !Number.isFinite(Date.parse(importedAt))) throw new Error("RETAIL_DISPLAY_PASS2_AUDIT_REQUIRED");

const destinationPath = path.resolve("packages/mercury/destinations/production-destinations.json");
const snapshotPath = path.resolve(".forge-review/retail-display/current-display-snapshots.json");
const rows = JSON.parse(await readFile(rowsPath, "utf8"));
if (!Array.isArray(rows) || rows.length !== 103 || new Set(rows.map(row => row.atlasProductId)).size !== 103) throw new Error("RETAIL_DISPLAY_PASS2_ROW_SET_INVALID");

const readJson = async resource => JSON.parse(await readFile(resource, "utf8"));
const products = await new ProductRepository({ readJson }).getAll();
const retailers = await new RetailerRepository({ readJson }).getAll();
const productById = new Map(products.map(product => [product.identity.atlasProductId, product]));
const retailerById = new Map(retailers.map(retailer => [retailer.id, retailer]));
const identityFailures = rows.filter(row => productById.get(row.atlasProductId)?.identity.manufacturerPartNumber !== row.manufacturerPartNumber);
if (identityFailures.length) throw new Error("RETAIL_DISPLAY_PASS2_ATLAS_BINDING_INVALID");

const destinationState = JSON.parse(await readFile(destinationPath, "utf8"));
const snapshotRepository = new FileCurrentDisplaySnapshotRepository({ statePath: snapshotPath });
const priorSnapshotState = await snapshotRepository.getState();
const sourceWorkbook = "atlas-ram-retail-discovery-103-live-sweep-pass2.xlsx";
const sourceSheet = "RAM Retail Discovery";
const firstPass = new RetailDisplayImportService({ products, destinations: destinationState.records }).importRows({ rows, sourceWorkbook, sourceSheet, importedAt, priorSnapshot: priorSnapshotState.current });
const additions = [];
const admissionFailures = [];

for (const outcome of firstPass.outcomes.filter(item => item.status === "DESTINATION_ADMISSION_REQUIRED")) {
    const row = rows[outcome.sourceRow - 5];
    const retailer = outcome.retailer === "AMAZON"
        ? { id: "RETAILER-0001", marketplace: "amazon.com", url: row.amazonUrl }
        : { id: "RETAILER-0004", marketplace: "newegg.com", url: row.neweggUrl };
    const listingId = outcome.retailer === "AMAZON"
        ? retailer.url?.match(/\/dp\/([A-Z0-9]{10})(?:\/|$|\?)/i)?.[1]?.toUpperCase()
        : retailer.url?.match(/\/p\/([A-Z0-9-]+)(?:\/|$|\?)/i)?.[1]?.toUpperCase();
    try {
        if (!listingId || !retailerById.has(retailer.id)) throw new Error("DESTINATION_BINDING_INVALID");
        additions.push(createRetailerDestination({
            atlasProductId: row.atlasProductId,
            retailerId: retailer.id,
            marketplace: retailer.marketplace,
            destinationType: "PRODUCT_PAGE",
            destinationUrl: retailer.url,
            retailerListingId: listingId,
            binding: {
                manufacturerPartNumber: row.manufacturerPartNumber,
                method: "OPERATOR_EXACT_PRODUCT_REVIEW",
                scope: "EXACT_STANDALONE_PRODUCT",
                evidenceReferences: [`operator:retail-display-003:workbook-row:${outcome.sourceRow}:${outcome.retailer.toLowerCase()}:${listingId}`]
            },
            provenance: { sourceType: "OPERATOR_INSPECTED_PUBLIC_PAGE" },
            reviewedBy,
            reviewedAt,
            status: "ACTIVE",
            supersedesDestinationId: null,
            retirementReason: null,
            createdAt: reviewedAt,
            createdBy: reviewedBy
        }));
    } catch (error) {
        admissionFailures.push({ atlasProductId: row.atlasProductId, retailer: outcome.retailer, reason: error.message });
    }
}

const allDestinations = [...destinationState.records, ...additions];
const secondPass = new RetailDisplayImportService({ products, destinations: allDestinations }).importRows({ rows, sourceWorkbook, sourceSheet, importedAt, priorSnapshot: priorSnapshotState.current });
if (additions.length) {
    const destinationTemporary = `${destinationPath}.${process.pid}.tmp`;
    await writeFile(destinationTemporary, `${JSON.stringify({ ...destinationState, records: allDestinations }, null, 2)}\n`, "utf8");
    await rename(destinationTemporary, destinationPath);
}
const replacement = await snapshotRepository.replace(secondPass.snapshot);

const count = status => firstPass.outcomes.filter(item => item.status === status).length;
const eligible = secondPass.snapshot.offers.filter(offer => offer.itemPriceEligible);
const eligibleByProduct = new Map();
for (const offer of eligible) eligibleByProduct.set(offer.atlasProductId, (eligibleByProduct.get(offer.atlasProductId) ?? 0) + 1);
const summary = {
    workbookRows: rows.length,
    verifiedProducts: rows.filter(row => row.amazonUrl || row.neweggUrl || Number.isFinite(row.amazonObservedPriceUsd) || Number.isFinite(row.neweggObservedPriceUsd)).length,
    destinationsBefore: destinationState.records.length,
    destinationsAdmitted: additions.length,
    destinationsReused: count("DESTINATION_REUSED"),
    destinationConflicts: count("DESTINATION_REVIEW_REQUIRED") + admissionFailures.length,
    lifecycleBlocked: count("DESTINATION_BLOCKED_ATLAS_NOT_ACTIVE_READY"),
    searchOnly: count("SEARCH_URL_ONLY"),
    numericPricesImported: secondPass.snapshot.offers.length,
    priceOnlyDestinationUnresolved: secondPass.outcomes.filter(item => item.status === "PRICE_OBSERVED_DESTINATION_UNRESOLVED").length,
    itemPriceEligible: eligible.length,
    itemPriceBlocked: secondPass.snapshot.offers.length - eligible.length,
    twoRetailerProducts: [...eligibleByProduct.values()].filter(value => value >= 2).length,
    singleRetailerProducts: [...eligibleByProduct.values()].filter(value => value === 1).length,
    deliveredCostEligible: secondPass.snapshot.offers.filter(offer => offer.deliveredCostEligible).length,
    stillUnverifiedProducts: secondPass.outcomes.filter(item => item.status === "UNVERIFIED").length,
    snapshotId: secondPass.snapshot.snapshotId,
    previousSnapshotId: replacement.previousSnapshotId,
    snapshotStatus: replacement.status,
    providerOperations: 0,
    paidTasks: 0,
    actualSpendUsd: 0
};
console.log("RETAIL DISPLAY PASS-2 IMPORT\n");
console.log(JSON.stringify(summary, null, 2));
