import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { ProductRepository, RetailerRepository } from "../packages/atlas/index.js";
import { createRetailerDestination, loadRetailerDestinationSource, RETAILER_DESTINATION_MANUAL_REVIEW_SOURCE_TYPE } from "../packages/mercury/index.js";
import { FileCurrentDisplaySnapshotRepository, ManualRetailReviewImportService } from "../packages/mercury/current-display/index.js";

const args = new Map(process.argv.slice(2).map(value => { const index = value.indexOf("="); return index < 0 ? [value, true] : [value.slice(0, index), value.slice(index + 1)]; }));
if (args.get("--confirm") !== "IMPORT-FINAL-SIX-RETAIL-REVIEW") throw new Error("FINAL_SIX_RETAIL_REVIEW_CONFIRMATION_REQUIRED");
const rowsPath = path.resolve(String(args.get("--rows-json") ?? ""));
const sourceWorkbook = path.resolve(String(args.get("--source-workbook") ?? ""));
const reviewedBy = String(args.get("--reviewed-by") ?? "").trim();
const importedAt = String(args.get("--imported-at") ?? "");
if (!rowsPath || !sourceWorkbook || !reviewedBy || !Number.isFinite(Date.parse(importedAt))) throw new Error("FINAL_SIX_RETAIL_REVIEW_AUDIT_REQUIRED");

const readJson = async resource => JSON.parse(await readFile(resource, "utf8"));
const workbook = await readJson(rowsPath);
const rows = workbook.rows ?? [];
const expectedRows = [30, 31, 58, 59, 70, 74];
const expected = new Map([
    [30, ["ram_crucial_ct2k16g56c46u5", "CT2K16G56C46U5", "B0BLTGP2JX", 609.99, "COMPLETED"]],
    [31, ["ram_crucial_ct2k32g56c46s5", "CT2K32G56C46S5", "B0H4QH584J", 1099.99, "COMPLETED"]],
    [58, ["ram_corsair_cmh32gx5m2f6000z36", "CMH32GX5M2F6000Z36", "B0FV3M2PGJ", 535.59, "COMPLETED"]],
    [59, ["ram_corsair_cmh64gx5m2d5600z40", "CMH64GX5M2D5600Z40", null, null, "CONFIRMED_NOT_SOLD_AMAZON"]],
    [70, ["ram_g_skill_f5_6000j3040f16gx2_rs5w", "F5-6000J3040F16GX2-RS5W", null, null, "CONFIRMED_NOT_SOLD_AMAZON"]],
    [74, ["ram_g_skill_f5_6000j3636f32gx2_rs5k", "F5-6000J3636F32GX2-RS5K", "B0C6HWKGWV", 989.99, "COMPLETED"]]
]);
if (workbook.sheet !== "Final Six" || rows.length !== 6 || new Set(rows.map(row => row.sourceRow)).size !== 6 || expectedRows.some((value, index) => rows[index]?.sourceRow !== value)) throw new Error("FINAL_SIX_RETAIL_REVIEW_WORKBOOK_INVALID");
const asinFrom = value => typeof value === "string" ? value.match(/\/dp\/([A-Z0-9]{10})(?:\/|$|\?)/i)?.[1]?.toUpperCase() ?? null : null;
for (const row of rows) {
    const [productId, mpn, asin, price, status] = expected.get(row.sourceRow) ?? [];
    if (row.atlasProductId !== productId || row.mpn !== mpn || row.operatorReviewStatus !== status || row.ddrGeneration !== "DDR5" || !["DIMM", "SO_DIMM"].includes(row.formFactor) || row.applicationClass !== (row.formFactor === "SO_DIMM" ? "LAPTOP" : "DESKTOP")) throw new Error(`FINAL_SIX_RETAIL_REVIEW_BINDING_INVALID:${row.sourceRow}`);
    if (asin === null) {
        if (row.amazonUrlManual !== null || row.amazonPriceManual !== null) throw new Error(`FINAL_SIX_RETAIL_ABSENCE_INVALID:${row.sourceRow}`);
    } else if (asinFrom(row.amazonUrlManual) !== asin || row.amazonPriceManual !== price || !/third[- ]party seller/i.test(row.amazonManualNotes ?? "")) throw new Error(`FINAL_SIX_RETAIL_AMAZON_EVIDENCE_INVALID:${row.sourceRow}`);
}

const products = await new ProductRepository({ readJson }).getAll();
const retailers = await new RetailerRepository({ readJson }).getAll();
const productById = new Map(products.map(product => [product.identity.atlasProductId, product]));
if (products.length !== 103 || rows.some(row => productById.get(row.atlasProductId)?.identity.manufacturerPartNumber !== row.mpn) || !retailers.some(retailer => retailer.id === "RETAILER-0001" && retailer.name === "Amazon")) throw new Error("FINAL_SIX_RETAIL_REVIEW_OWNER_STATE_INVALID");

const residuePath = path.resolve(".forge-review/retail-discovery/retail-discovery-post-manual-residue.json");
const priorResidue = await readJson(residuePath);
if (priorResidue.actionable?.length !== 6 || expectedRows.some((value, index) => priorResidue.actionable[index]?.sourceRow !== value)) throw new Error("FINAL_SIX_RETAIL_RESIDUE_BINDING_INVALID");
const destinationPath = path.resolve("packages/mercury/destinations/production-destinations.json");
const snapshotPath = path.resolve(".forge-review/retail-display/current-display-snapshots.json");
const destinationState = await readJson(destinationPath);
const destinationSource = await loadRetailerDestinationSource({ sourcePath: destinationPath, products, retailers });
const snapshotRepository = new FileCurrentDisplaySnapshotRepository({ statePath: snapshotPath });
const priorSnapshotState = await snapshotRepository.getState();
const service = new ManualRetailReviewImportService({ products, destinations: destinationSource.effective });
const first = service.importRows({ rows, sourceWorkbook, sourceSheet: "Final Six", importedAt, priorSnapshot: priorSnapshotState.current });
const rejectedStatuses = new Set(["ROW_REJECTED", "ROW_RETAILER_REJECTED", "SEARCH_URL_REJECTED", "DESTINATION_CONFLICT", "LIFECYCLE_BLOCKED", "UNRESOLVED_AFTER_MANUAL_REVIEW", "PENDING_IGNORED"]);
const rejected = first.outcomes.filter(outcome => rejectedStatuses.has(outcome.status));
const admissions = first.outcomes.filter(outcome => outcome.status === "NEW_EXACT_DESTINATION_ADMITTED");
if (rejected.length || admissions.length !== 4 || admissions.some(outcome => outcome.retailer !== "AMAZON")) throw new Error("FINAL_SIX_RETAIL_REVIEW_ASSESSMENT_FAILED");

const rowBySource = new Map(rows.map(row => [row.sourceRow, row]));
const additions = admissions.map(outcome => {
    const row = rowBySource.get(outcome.sourceRow);
    return createRetailerDestination({
        atlasProductId: row.atlasProductId, retailerId: "RETAILER-0001", marketplace: "amazon.com", destinationType: "PRODUCT_PAGE",
        destinationUrl: outcome.destinationUrl, retailerListingId: outcome.retailerListingId,
        binding: { manufacturerPartNumber: row.mpn, method: "OPERATOR_EXACT_PRODUCT_REVIEW", scope: "EXACT_STANDALONE_PRODUCT", evidenceReferences: [`operator:retail-display-011:${path.basename(sourceWorkbook)}:final-six:row-${outcome.sourceRow}:amazon:${outcome.retailerListingId}`] },
        provenance: { sourceType: RETAILER_DESTINATION_MANUAL_REVIEW_SOURCE_TYPE }, reviewedBy, reviewedAt: importedAt,
        status: "ACTIVE", supersedesDestinationId: null, retirementReason: null, createdAt: importedAt, createdBy: reviewedBy
    });
});
const records = [...destinationState.records, ...additions];
const finalService = new ManualRetailReviewImportService({ products, destinations: [...destinationSource.effective, ...additions] });
const result = finalService.importRows({ rows, sourceWorkbook, sourceSheet: "Final Six", importedAt, priorSnapshot: priorSnapshotState.current });
if (result.outcomes.some(outcome => rejectedStatuses.has(outcome.status)) || result.outcomes.filter(outcome => outcome.status === "EXISTING_DESTINATION_REUSED" && outcome.retailer === "AMAZON").length !== 4) throw new Error("FINAL_SIX_RETAIL_REVIEW_FINAL_VALIDATION_FAILED");

const temporary = `${destinationPath}.${process.pid}.tmp`;
await writeFile(temporary, `${JSON.stringify({ ...destinationState, records }, null, 2)}\n`, "utf8");
await rename(temporary, destinationPath);
const replacement = await snapshotRepository.replace(result.snapshot);
await writeFile(residuePath, `${JSON.stringify({ schemaVersion: "1.2", source: { workbook: sourceWorkbook, sheet: "Final Six" }, generatedAt: importedAt, state: "RETAIL_RESEARCH_CYCLE_COMPLETE", actionable: [] }, null, 2)}\n`, "utf8");

const effective = [...destinationSource.effective, ...additions];
const keys = new Set(effective.map(item => `${item.atlasProductId}|${item.retailerId}`));
const amazonDestinations = effective.filter(item => item.retailerId === "RETAILER-0001").length;
const neweggDestinations = effective.filter(item => item.retailerId === "RETAILER-0004").length;
const priorReviewRows = (await readJson(path.resolve(".forge-review/retail-discovery/final-manual-pass-inspection.json"))).rows;
const reviewStatusByProduct = new Map([...priorReviewRows, ...rows].map(row => [row.atlasProductId, row.operatorReviewStatus]));
const lifecycleHeld = await readJson(path.resolve(".forge-review/retail-discovery/retail-discovery-lifecycle-held.json"));
const lifecycleHeldProducts = new Set(lifecycleHeld.findings.map(item => item.atlasProductId));
const researchCounts = { BOTH_RETAILERS_RESOLVED: 0, AMAZON_RESOLVED_NEWEGG_ABSENT: 0, NEWEGG_RESOLVED_AMAZON_ABSENT: 0, BOTH_RETAILERS_CONFIRMED_ABSENT: 0, SINGLE_RETAILER_RESOLVED_OTHER_UNRESOLVED: 0, RETAIL_EVIDENCE_LIFECYCLE_BLOCKED: 0, TRUE_RESEARCH_UNRESOLVED: 0 };
const categories = {};
const offerByProduct = new Map();
for (const offer of result.snapshot.offers) { if (!offerByProduct.has(offer.atlasProductId)) offerByProduct.set(offer.atlasProductId, []); offerByProduct.get(offer.atlasProductId).push(offer); }
for (const product of products) {
    const id = product.identity.atlasProductId;
    const status = reviewStatusByProduct.get(id);
    const amazonAbsent = ["CONFIRMED_NOT_SOLD_AMAZON", "CONFIRMED_NOT_SOLD_BOTH"].includes(status);
    const neweggAbsent = ["CONFIRMED_NOT_SOLD_NEWEGG", "CONFIRMED_NOT_SOLD_BOTH"].includes(status);
    const amazonResolved = keys.has(`${id}|RETAILER-0001`) || amazonAbsent;
    const neweggResolved = keys.has(`${id}|RETAILER-0004`) || neweggAbsent;
    const researchClass = lifecycleHeldProducts.has(id) ? "RETAIL_EVIDENCE_LIFECYCLE_BLOCKED"
        : amazonAbsent && neweggAbsent ? "BOTH_RETAILERS_CONFIRMED_ABSENT"
            : amazonAbsent && neweggResolved ? "NEWEGG_RESOLVED_AMAZON_ABSENT"
                : neweggAbsent && amazonResolved ? "AMAZON_RESOLVED_NEWEGG_ABSENT"
                    : amazonResolved && neweggResolved ? "BOTH_RETAILERS_RESOLVED"
                        : amazonResolved || neweggResolved ? "SINGLE_RETAILER_RESOLVED_OTHER_UNRESOLVED" : "TRUE_RESEARCH_UNRESOLVED";
    researchCounts[researchClass] += 1;
    const classification = product.extension.data.classification;
    const category = `${classification.memoryType} ${classification.applicationClass}`;
    categories[category] ??= { total: 0, researchResolved: 0, trueUnresolved: 0, destinationBacked: 0, numericCurrentProducts: 0, itemPriceEligibleProducts: 0, lifecycleHeld: 0 };
    const offers = offerByProduct.get(id) ?? [];
    categories[category].total += 1;
    categories[category].researchResolved += Number(researchClass !== "TRUE_RESEARCH_UNRESOLVED");
    categories[category].trueUnresolved += Number(researchClass === "TRUE_RESEARCH_UNRESOLVED");
    categories[category].destinationBacked += Number(keys.has(`${id}|RETAILER-0001`) || keys.has(`${id}|RETAILER-0004`));
    categories[category].numericCurrentProducts += Number(offers.some(offer => Number.isFinite(offer.priceUsd)));
    categories[category].itemPriceEligibleProducts += Number(offers.some(offer => offer.itemPriceEligible));
    categories[category].lifecycleHeld += Number(lifecycleHeldProducts.has(id));
}
if (Object.values(researchCounts).reduce((sum, count) => sum + count, 0) !== 103 || researchCounts.TRUE_RESEARCH_UNRESOLVED !== 0 || lifecycleHeld.findings.length !== 22 || lifecycleHeldProducts.size !== 14) throw new Error("FINAL_SIX_RETAIL_RESEARCH_CLOSURE_INVALID");
const summary = {
    workbookRows: rows.length,
    statusCounts: { COMPLETED: rows.filter(row => row.operatorReviewStatus === "COMPLETED").length, CONFIRMED_NOT_SOLD_AMAZON: rows.filter(row => row.operatorReviewStatus === "CONFIRMED_NOT_SOLD_AMAZON").length },
    asinBindings: rows.filter(row => row.amazonUrlManual).map(row => ({ sourceRow: row.sourceRow, asin: asinFrom(row.amazonUrlManual) })),
    destinationsAdmitted: additions.length, destinationAuditRecords: records.length, effectiveDestinations: effective.length,
    amazonDestinations, neweggDestinations, productsWithDestination: new Set(effective.map(item => item.atlasProductId)).size,
    numericCurrentOffers: result.snapshot.offers.length, itemPriceEligible: result.snapshot.offers.filter(item => item.itemPriceEligible).length,
    marketplaceOffersImported: rows.filter(row => /third[- ]party seller/i.test(row.amazonManualNotes ?? "") && Number.isFinite(row.amazonPriceManual)).length,
    historicalObservationsCreated: result.historicalObservationsCreated, activeResidue: 0,
    researchCounts, categories,
    snapshotId: result.snapshot.snapshotId, previousSnapshotId: replacement.previousSnapshotId, snapshotStatus: replacement.status,
    providerOperations: result.networkOperations, paidTasks: result.providerTasks, actualSpendUsd: result.actualSpendUsd
};
console.log(JSON.stringify(summary, null, 2));
