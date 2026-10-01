import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { ProductRepository, RetailerRepository } from "../packages/atlas/index.js";
import { createRetailerDestination } from "../packages/mercury/index.js";
import { RetailDisplayImportService, FileCurrentDisplaySnapshotRepository } from "../packages/mercury/current-display/index.js";

const args = new Map(process.argv.slice(2).map(value => { const index = value.indexOf("="); return index < 0 ? [value, true] : [value.slice(0, index), value.slice(index + 1)]; }));
if (args.get("--confirm") !== "REASSESS-ATLAS-ACTIVATION-DESTINATIONS") throw new Error("ATLAS_ACTIVATION_DESTINATION_CONFIRMATION_REQUIRED");
const rowsPath = path.resolve(String(args.get("--rows-json") ?? ""));
const reviewedAt = String(args.get("--reviewed-at") ?? "");
const reviewedBy = String(args.get("--reviewed-by") ?? "");
const importedAt = String(args.get("--imported-at") ?? "");
const destinationPath = path.resolve("packages/mercury/destinations/production-destinations.json");
const snapshotPath = path.resolve(".forge-review/retail-display/current-display-snapshots.json");
const rows = JSON.parse(await readFile(rowsPath, "utf8"));
const readJson = async resource => JSON.parse(await readFile(resource, "utf8"));
const products = await new ProductRepository({ readJson }).getAll();
const retailers = await new RetailerRepository({ readJson }).getAll();
const productById = new Map(products.map(product => [product.identity.atlasProductId, product]));
const retailerById = new Map(retailers.map(retailer => [retailer.id, retailer]));
const destinationState = JSON.parse(await readFile(destinationPath, "utf8"));
const firstPass = new RetailDisplayImportService({ products, destinations: destinationState.records }).importRows({ rows, sourceWorkbook: "atlas-ram-retail-discovery-103-initial-live-sweep.xlsx", sourceSheet: "RAM Retail Discovery", importedAt });
const additions = [];
for (const outcome of firstPass.outcomes.filter(item => item.status === "DESTINATION_ADMISSION_REQUIRED")) {
    const row = rows[outcome.sourceRow - 5];
    const retailer = outcome.retailer === "AMAZON"
        ? { id: "RETAILER-0001", marketplace: "amazon.com", url: row.amazonUrl }
        : { id: "RETAILER-0004", marketplace: "newegg.com", url: row.neweggUrl };
    const listingId = outcome.retailer === "AMAZON" ? retailer.url?.match(/\/dp\/([A-Z0-9]{10})(?:\/|$|\?)/i)?.[1]?.toUpperCase() : retailer.url?.match(/\/p\/([A-Z0-9-]+)(?:\/|$|\?)/i)?.[1]?.toUpperCase();
    if (!listingId || !productById.has(row.atlasProductId) || !retailerById.has(retailer.id)) throw new Error("ATLAS_ACTIVATION_DESTINATION_BINDING_INVALID");
    additions.push(createRetailerDestination({
        atlasProductId: row.atlasProductId,
        retailerId: retailer.id,
        marketplace: retailer.marketplace,
        destinationType: "PRODUCT_PAGE",
        destinationUrl: retailer.url,
        retailerListingId: listingId,
        binding: { manufacturerPartNumber: row.manufacturerPartNumber, method: "OPERATOR_EXACT_PRODUCT_REVIEW", scope: "EXACT_STANDALONE_PRODUCT", evidenceReferences: [`operator:retail-display-001:workbook-row:${outcome.sourceRow}:${outcome.retailer.toLowerCase()}:${listingId}`] },
        provenance: { sourceType: "OPERATOR_INSPECTED_PUBLIC_PAGE" },
        reviewedBy,
        reviewedAt,
        status: "ACTIVE",
        supersedesDestinationId: null,
        retirementReason: null,
        createdAt: reviewedAt,
        createdBy: reviewedBy
    }));
}
const allDestinations = [...destinationState.records, ...additions];
const secondPass = new RetailDisplayImportService({ products, destinations: allDestinations }).importRows({ rows, sourceWorkbook: "atlas-ram-retail-discovery-103-initial-live-sweep.xlsx", sourceSheet: "RAM Retail Discovery", importedAt });
const destinationTemporary = `${destinationPath}.${process.pid}.tmp`;
await writeFile(destinationTemporary, `${JSON.stringify({ ...destinationState, records: allDestinations }, null, 2)}\n`, "utf8");
await rename(destinationTemporary, destinationPath);
const snapshotRepository = new FileCurrentDisplaySnapshotRepository({ statePath: snapshotPath });
await snapshotRepository.replace(secondPass.snapshot);
console.log("ATLAS ACTIVATION RETAIL REASSESSMENT\n");
console.log("Destinations admitted:", additions.length);
console.log("Search URLs excluded: ", firstPass.outcomes.filter(item => item.status === "SEARCH_URL_ONLY").length);
console.log("Item-price eligible:  ", secondPass.snapshot.offers.filter(offer => offer.itemPriceEligible).length);
console.log("Delivered eligible:   ", secondPass.snapshot.offers.filter(offer => offer.deliveredCostEligible).length);
console.log("Snapshot:             ", secondPass.snapshot.snapshotId);
console.log("Provider operations:   0");
console.log("Actual spend:        $0.000");
