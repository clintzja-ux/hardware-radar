import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { ProductRepository } from "../packages/atlas/index.js";
import { createRetailerDestination, RETAILER_DESTINATION_MANUAL_REVIEW_SOURCE_TYPE } from "../packages/mercury/index.js";
import { createCurrentDisplaySnapshot, FileCurrentDisplaySnapshotRepository } from "../packages/mercury/current-display/index.js";

const args = new Map(process.argv.slice(2).map(value => { const index = value.indexOf("="); return index < 0 ? [value, true] : [value.slice(0, index), value.slice(index + 1)]; }));
if (args.get("--confirm") !== "RECONCILE-POST-MANUAL-RETAIL-RESIDUE") throw new Error("POST_MANUAL_RETAIL_RESIDUE_CONFIRMATION_REQUIRED");
const reconciledAt = String(args.get("--reconciled-at") ?? "");
const reviewedBy = String(args.get("--reviewed-by") ?? "").trim();
if (!Number.isFinite(Date.parse(reconciledAt)) || !reviewedBy) throw new Error("POST_MANUAL_RETAIL_RESIDUE_AUDIT_REQUIRED");
const readJson = async resource => JSON.parse(await readFile(resource, "utf8"));
const workbookPath = path.resolve(".forge-review/retail-discovery/final-manual-pass-inspection.json");
const residuePath = path.resolve(".forge-review/retail-discovery/retail-discovery-post-manual-residue.json");
const holdPath = path.resolve(".forge-review/retail-discovery/retail-discovery-lifecycle-held.json");
const destinationPath = path.resolve("packages/mercury/destinations/production-destinations.json");
const snapshotPath = path.resolve(".forge-review/retail-display/current-display-snapshots.json");
const workbook = await readJson(workbookPath);
const priorResidue = await readJson(residuePath);
const destinationState = await readJson(destinationPath);
const products = await new ProductRepository({ readJson }).getAll();
const productById = new Map(products.map(product => [product.identity.atlasProductId, product]));
const rowAt = number => workbook.rows[number - 2];
if (priorResidue.failures.length !== 31 || products.length !== 103 || ![24, 34, 52, 59, 70, 74].every(number => rowAt(number))) throw new Error("POST_MANUAL_RETAIL_RESIDUE_BASELINE_INVALID");

const predecessor = destinationState.records.find(item => item.atlasProductId === rowAt(34).atlasProductId && item.retailerId === "RETAILER-0004");
if (!predecessor || predecessor.retailerListingId !== "N82E16820156421") throw new Error("POST_MANUAL_RETAIL_RESIDUE_PREDECESSOR_INVALID");
const create = ({ rowNumber, retailerId, url, listingId, supersedesDestinationId = null }) => {
    const row = rowAt(rowNumber);
    return createRetailerDestination({ atlasProductId: row.atlasProductId, retailerId, marketplace: retailerId === "RETAILER-0001" ? "amazon.com" : "newegg.com", destinationType: "PRODUCT_PAGE", destinationUrl: url, retailerListingId: listingId,
        binding: { manufacturerPartNumber: row.mpn, method: "OPERATOR_EXACT_PRODUCT_REVIEW", scope: "EXACT_STANDALONE_PRODUCT", evidenceReferences: [`operator:retail-display-009:manual-pass:row-${rowNumber}:${retailerId.toLowerCase()}:${listingId}`] },
        provenance: { sourceType: RETAILER_DESTINATION_MANUAL_REVIEW_SOURCE_TYPE }, reviewedBy, reviewedAt: reconciledAt, status: "ACTIVE", supersedesDestinationId, retirementReason: null, createdAt: reconciledAt, createdBy: reviewedBy });
};
const replacements = [
    create({ rowNumber: 34, retailerId: "RETAILER-0004", url: rowAt(34).neweggUrlManual, listingId: "N82E16820156419", supersedesDestinationId: predecessor.destinationId }),
    create({ rowNumber: 52, retailerId: "RETAILER-0001", url: rowAt(52).amazonUrlManual, listingId: "B0CBRJ63RT" })
];
const records = [...destinationState.records, ...replacements];
const temporary = `${destinationPath}.${process.pid}.tmp`;
await writeFile(temporary, `${JSON.stringify({ ...destinationState, records }, null, 2)}\n`, "utf8");
await rename(temporary, destinationPath);

const snapshotRepository = new FileCurrentDisplaySnapshotRepository({ statePath: snapshotPath });
const snapshotState = await snapshotRepository.getState();
const offers = snapshotState.current.offers.map(offer => offer.atlasProductId === rowAt(34).atlasProductId && offer.retailer === "NEWEGG" ? { ...offer, destinationId: replacements[0].destinationId } : structuredClone(offer));
offers.push({ atlasProductId: rowAt(52).atlasProductId, retailer: "AMAZON", retailerId: "RETAILER-0001", marketplace: "amazon.com", priceUsd: 509.99, currency: "USD", availability: "AVAILABLE", condition: null, shippingUsd: null, feesUsd: null, researchUrl: rowAt(52).amazonUrlManual, destinationId: replacements[1].destinationId, matchStatus: "EXACT_PRODUCT_PAGE", sourceRow: 52, observedAt: reconciledAt,
    manualReviewProvenance: { sourceType: "OPERATOR_CURATED_RETAIL_REVIEW", workbook: priorResidue.source.workbook, sheet: "Manual Pass", operatorReviewStatus: rowAt(52).operatorReviewStatus, operatorNotes: rowAt(52).operatorNotes ?? null, retailerNotes: rowAt(52).amazonManualNotes, manufacturerPartNumber: rowAt(52).mpn }, itemPriceEligible: false, deliveredCostEligible: false, deliveredCostReasons: ["CONDITION_NOT_ELIGIBLE"], comparisonEligible: false, comparisonReasons: ["CONDITION_NOT_ELIGIBLE"] });
const snapshot = createCurrentDisplaySnapshot({ observedAt: reconciledAt, importedAt: reconciledAt, source: { workbook: priorResidue.source.workbook, sheet: "Manual Pass / RETAIL-DISPLAY-009 residue correction", digest: priorResidue.source.workbook ? replacements.map(item => item.materialFingerprint).join("").slice(0, 64) : "" }, offers });
const replacement = await snapshotRepository.replace(snapshot);

const lifecycleHeld = priorResidue.failures.filter(item => item.status === "LIFECYCLE_BLOCKED").map(item => ({ ...item, disposition: "LIFECYCLE_BLOCK_ONLY", manufacturerPartNumber: productById.get(item.atlasProductId).identity.manufacturerPartNumber }));
await writeFile(holdPath, `${JSON.stringify({ schemaVersion: "1.0", source: priorResidue.source, generatedAt: reconciledAt, findings: lifecycleHeld }, null, 2)}\n`, "utf8");
const actionable = priorResidue.failures.filter(item => item.status === "SEARCH_URL_REJECTED" || [59, 70, 74].includes(item.sourceRow)).map(item => ({ ...item, disposition: "REQUIRES_MANUAL_RESEARCH", manufacturerPartNumber: productById.get(item.atlasProductId).identity.manufacturerPartNumber, sourceWorkbookRow: rowAt(item.sourceRow) }));
await writeFile(residuePath, `${JSON.stringify({ schemaVersion: "1.1", source: priorResidue.source, generatedAt: reconciledAt, actionable }, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ localCorrections: replacements.length, actionableResidue: actionable.length, lifecycleHeldFindings: lifecycleHeld.length, lifecycleHeldProducts: new Set(lifecycleHeld.map(item => item.atlasProductId)).size, destinationRecords: records.length, currentOffers: snapshot.offers.length, itemPriceEligible: snapshot.offers.filter(item => item.itemPriceEligible).length, snapshotId: snapshot.snapshotId, previousSnapshotId: replacement.previousSnapshotId, providerOperations: 0, actualSpendUsd: 0 }, null, 2));
