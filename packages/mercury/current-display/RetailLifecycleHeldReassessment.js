import crypto from "node:crypto";
import { createRetailerDestination, RETAILER_DESTINATION_MANUAL_REVIEW_SOURCE_TYPE } from "../destinations/RetailerDestination.js";
import { createCurrentDisplaySnapshot } from "./CurrentDisplaySnapshot.js";
import { assessCurrentDisplayItemPriceEligibility } from "./CurrentDisplayEligibility.js";

export const RETAIL_LIFECYCLE_REASSESS_POLICY_VERSION = "RETAIL-LIFECYCLE-REASSESS-001-1.0";
const digest = value => crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
const nonBlank = value => typeof value === "string" && value.trim() !== "";
const listingFromUrl = (retailer, value) => retailer === "AMAZON" ? value?.match(/\/dp\/([A-Z0-9]{10})(?:\/|$|\?)/i)?.[1]?.toUpperCase() ?? null : value?.match(/\/p\/([A-Z0-9-]+)(?:\/|$|\?)/i)?.[1]?.toUpperCase() ?? null;
const retailerId = retailer => retailer === "AMAZON" ? "RETAILER-0001" : "RETAILER-0004";
const marketplace = retailer => retailer === "AMAZON" ? "amazon.com" : "newegg.com";
const rowValue = (row, retailer, field) => row[`${retailer === "AMAZON" ? "amazon" : "newegg"}${field}`];

export function reassessLifecycleHeldRetailEvidence({ heldArtifact, rows, products, retailers, destinations, currentSnapshot, reviewedBy, reassessedAt } = {}) {
    if (heldArtifact?.schemaVersion !== "1.0" || !Array.isArray(heldArtifact.findings) || heldArtifact.findings.length !== 22 || new Set(heldArtifact.findings.map(item => item.atlasProductId)).size !== 14 || !Array.isArray(rows) || !Array.isArray(products) || !Array.isArray(retailers) || !Array.isArray(destinations) || !currentSnapshot || !nonBlank(reviewedBy) || !Number.isFinite(Date.parse(reassessedAt ?? ""))) throw new TypeError("RETAIL_LIFECYCLE_REASSESS_INPUT_INVALID");
    const productById = new Map(products.map(product => [product.identity?.atlasProductId, product]));
    const retailerById = new Map(retailers.map(retailer => [retailer.id, retailer]));
    const activeDestinations = destinations.filter(item => item.status === "ACTIVE");
    const destinationByKey = new Map(activeDestinations.map(item => [`${item.atlasProductId}|${item.retailerId}`, item]));
    const listingOwners = new Map(activeDestinations.filter(item => item.retailerListingId).map(item => [`${item.retailerId}|${item.retailerListingId}`, item.atlasProductId]));
    const seen = new Set();
    const additions = [];
    const outcomes = [];
    const nextOffers = currentSnapshot.offers.map(offer => structuredClone(offer));

    for (const finding of heldArtifact.findings) {
        const key = `${finding.atlasProductId}|${finding.retailer}`;
        if (seen.has(key)) throw new Error("RETAIL_LIFECYCLE_REASSESS_DUPLICATE_FINDING");
        seen.add(key);
        const product = productById.get(finding.atlasProductId);
        const id = retailerId(finding.retailer);
        const retailer = retailerById.get(id);
        const row = rows[finding.sourceRow - 2];
        const blockers = [];
        if (finding.status !== "LIFECYCLE_BLOCKED" || finding.disposition !== "LIFECYCLE_BLOCK_ONLY") blockers.push("HELD_FINDING_STATE_INVALID");
        if (!product || product.identity?.manufacturerPartNumber !== finding.manufacturerPartNumber) blockers.push("ATLAS_PRODUCT_BINDING_INVALID");
        if (product && (product.governance?.lifecycleStatus !== "ACTIVE" || product.governance?.publicationStatus !== "READY")) blockers.push("ATLAS_PRODUCT_NOT_ACTIVE_READY");
        if (!retailer || retailer.status !== "active") blockers.push("CANONICAL_RETAILER_INVALID");
        if (!row || row.atlasProductId !== finding.atlasProductId || row.mpn !== finding.manufacturerPartNumber) blockers.push("SOURCE_ROW_BINDING_INVALID");
        const sourceUrl = rowValue(row ?? {}, finding.retailer, "UrlManual") || rowValue(row ?? {}, finding.retailer, "UrlCurrent");
        const sourcePrice = rowValue(row ?? {}, finding.retailer, "PriceManual");
        if (sourceUrl !== finding.destinationUrl || listingFromUrl(finding.retailer, sourceUrl) !== finding.retailerListingId) blockers.push("EXACT_DESTINATION_EVIDENCE_INVALID");
        const owner = listingOwners.get(`${id}|${finding.retailerListingId}`);
        if (owner && owner !== finding.atlasProductId) blockers.push("RETAILER_LISTING_PRODUCT_CONFLICT");
        const existing = destinationByKey.get(`${finding.atlasProductId}|${id}`);
        if (existing && existing.retailerListingId !== finding.retailerListingId) blockers.push("DESTINATION_CONFLICT");
        if (blockers.length) { outcomes.push({ ...finding, destinationOutcome: "BLOCKED", currentDisplayOutcome: "UNCHANGED", blockers }); continue; }

        let destination = existing;
        let destinationOutcome = "EXISTING_DESTINATION_REUSED";
        if (!destination) {
            destination = createRetailerDestination({ atlasProductId: finding.atlasProductId, retailerId: id, marketplace: marketplace(finding.retailer), destinationType: "PRODUCT_PAGE", destinationUrl: finding.destinationUrl, retailerListingId: finding.retailerListingId, binding: { manufacturerPartNumber: finding.manufacturerPartNumber, method: "OPERATOR_EXACT_PRODUCT_REVIEW", scope: "EXACT_STANDALONE_PRODUCT", evidenceReferences: [`operator:retail-lifecycle-reassess-001:manual-pass:row-${finding.sourceRow}:${id.toLowerCase()}:${finding.retailerListingId}`] }, provenance: { sourceType: RETAILER_DESTINATION_MANUAL_REVIEW_SOURCE_TYPE }, reviewedBy, reviewedAt: reassessedAt, status: "ACTIVE", supersedesDestinationId: null, retirementReason: null, createdAt: reassessedAt, createdBy: reviewedBy });
            additions.push(destination); destinationByKey.set(`${finding.atlasProductId}|${id}`, destination); listingOwners.set(`${id}|${finding.retailerListingId}`, finding.atlasProductId); destinationOutcome = "NEW_EXACT_DESTINATION_ADMITTED";
        }
        const offer = nextOffers.find(item => item.atlasProductId === finding.atlasProductId && item.retailer === finding.retailer);
        const exactOfferEvidence = Number.isFinite(sourcePrice) && offer && offer.priceUsd === sourcePrice && listingFromUrl(finding.retailer, offer.researchUrl) === finding.retailerListingId;
        let currentDisplayOutcome = "PRICE_NOT_EXPOSED";
        if (exactOfferEvidence) {
            const eligibility = assessCurrentDisplayItemPriceEligibility({ condition: offer.condition, availability: offer.availability, destinationId: destination.destinationId });
            Object.assign(offer, { destinationId: destination.destinationId, ...eligibility });
            currentDisplayOutcome = eligibility.itemPriceEligible ? "CURRENT_ITEM_PRICE_ELIGIBLE" : "CURRENT_ITEM_PRICE_BLOCKED";
        }
        outcomes.push({ ...finding, destinationId: destination.destinationId, destinationOutcome, currentDisplayOutcome, priceUsd: Number.isFinite(sourcePrice) ? sourcePrice : null, observedAt: exactOfferEvidence ? offer.observedAt : null, condition: exactOfferEvidence ? offer.condition : null, availability: exactOfferEvidence ? offer.availability : null, blockers: exactOfferEvidence ? offer.comparisonReasons : ["PRICE_NOT_EXPOSED"] });
    }
    const sourceDigest = digest(heldArtifact);
    const snapshot = createCurrentDisplaySnapshot({ observedAt: currentSnapshot.observedAt, importedAt: reassessedAt, source: { workbook: heldArtifact.source.workbook, sheet: "Manual Pass / RETAIL-LIFECYCLE-REASSESS-001", digest: sourceDigest }, offers: nextOffers });
    const auditMaterial = { policyVersion: RETAIL_LIFECYCLE_REASSESS_POLICY_VERSION, sourceDigest, predecessorSnapshotId: currentSnapshot.snapshotId, reviewedBy, reassessedAt, outcomes };
    const audit = { schemaVersion: "1.0", reassessmentId: `mer_retailreassess_${digest(auditMaterial).slice(0, 24)}`, ...auditMaterial, counts: { findings: 22, products: 14, lifecycleBlocked: outcomes.filter(item => item.blockers.includes("ATLAS_PRODUCT_NOT_ACTIVE_READY")).length, destinationsAdmitted: outcomes.filter(item => item.destinationOutcome === "NEW_EXACT_DESTINATION_ADMITTED").length, destinationsReused: outcomes.filter(item => item.destinationOutcome === "EXISTING_DESTINATION_REUSED").length, destinationBlocked: outcomes.filter(item => item.destinationOutcome === "BLOCKED").length, currentOffersBound: outcomes.filter(item => item.currentDisplayOutcome !== "PRICE_NOT_EXPOSED" && item.currentDisplayOutcome !== "UNCHANGED").length }, providerOperations: 0, actualSpendUsd: 0 };
    return { additions, snapshot, audit };
}
