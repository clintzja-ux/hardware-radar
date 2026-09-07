import crypto from "node:crypto";
import { createCurrentDisplaySnapshot } from "./CurrentDisplaySnapshot.js";

export const MANUAL_RETAIL_REVIEW_STATUSES = Object.freeze([
    "PENDING", "COMPLETED", "CONFIRMED_NOT_SOLD_AMAZON", "CONFIRMED_NOT_SOLD_NEWEGG",
    "CONFIRMED_NOT_SOLD_BOTH", "OUT_OF_STOCK_CONFIRMED", "MARKETPLACE_ONLY_CONFIRMED",
    "UNRESOLVED_AFTER_MANUAL_REVIEW"
]);

const digest = value => crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
const nonBlank = value => typeof value === "string" && value.trim() !== "";
const parsePrice = value => {
    if (typeof value === "number") return Number.isFinite(value) && value > 0 ? value : null;
    if (!nonBlank(value)) return null;
    const normalized = value.replace(/[\s\u00a0$,]/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};
const listing = (retailer, value) => retailer === "AMAZON"
    ? value?.match(/\/dp\/([A-Z0-9]{10})(?:\/|$|\?)/i)?.[1]?.toUpperCase() ?? null
    : value && !value.includes("/p/pl?") ? value.match(/\/p\/([A-Z0-9-]+)(?:\/|$|\?)/i)?.[1]?.toUpperCase() ?? null : null;
const expectedHost = retailer => retailer === "AMAZON" ? "amazon.com" : "newegg.com";
const retailerId = retailer => retailer === "AMAZON" ? "RETAILER-0001" : "RETAILER-0004";
const host = value => { try { return new URL(value).hostname.toLowerCase().replace(/^www\./, ""); } catch { return null; } };
const exactUrl = (retailer, value) => nonBlank(value) && host(value) === expectedHost(retailer) && Boolean(listing(retailer, value));
const statusApplies = (status, retailer) => status === "CONFIRMED_NOT_SOLD_BOTH" || status === `CONFIRMED_NOT_SOLD_${retailer}`;
const classification = product => product?.extension?.data?.classification ?? {};
const clone = value => structuredClone(value);

export function canonicalizeSuppliedAmazonProductUrl(value) {
    if (!nonBlank(value) || host(value) !== "amazon.com") return null;
    const asin = value.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})(?:\/|$|\?)/i)?.[1]?.toUpperCase() ?? null;
    return asin ? `https://amazon.com/dp/${asin}` : null;
}

export function classifyDestinationBackedMissingPrice({ availability, notes } = {}) {
    const evidence = `${availability ?? ""} ${notes ?? ""}`.toUpperCase();
    if (/OUT_OF_STOCK/.test(evidence)) return "OUT_OF_STOCK_PRICE_NOT_REQUIRED";
    if (/MARKETPLACE/.test(evidence)) return "MARKETPLACE_PRICE_NOT_ELIGIBLE";
    if (/PRICE_NOT_EXPOSED|PAGE_FOUND_PRICE_NOT_EXPOSED/.test(evidence)) return "PRICE_NOT_CURRENTLY_EXPOSED";
    if (/REFRESH|VOLATILE/.test(evidence)) return "REQUIRES_FUTURE_REFRESH";
    return "MANUAL_PRICE_MISSING";
}

export function classifyManualRetailResearch({ operatorReviewStatus, amazonListing = false, neweggListing = false, lifecycleBlocked = false } = {}) {
    const amazonAbsent = ["CONFIRMED_NOT_SOLD_AMAZON", "CONFIRMED_NOT_SOLD_BOTH"].includes(operatorReviewStatus);
    const neweggAbsent = ["CONFIRMED_NOT_SOLD_NEWEGG", "CONFIRMED_NOT_SOLD_BOTH"].includes(operatorReviewStatus);
    const amazonResolved = amazonListing || amazonAbsent;
    const neweggResolved = neweggListing || neweggAbsent;
    if (lifecycleBlocked) return "RETAIL_EVIDENCE_LIFECYCLE_BLOCKED";
    if (amazonAbsent && neweggAbsent) return "BOTH_RETAILERS_CONFIRMED_ABSENT";
    if (amazonAbsent && neweggListing) return "NEWEGG_RESOLVED_AMAZON_ABSENT";
    if (neweggAbsent && amazonListing) return "AMAZON_RESOLVED_NEWEGG_ABSENT";
    if (amazonResolved && neweggResolved) return "BOTH_RETAILERS_RESOLVED";
    if (amazonResolved || neweggResolved) return "SINGLE_RETAILER_RESOLVED_OTHER_UNRESOLVED";
    return "TRUE_RESEARCH_UNRESOLVED";
}

function availabilityFrom(status, notes, prior, sameDestination) {
    if (status === "OUT_OF_STOCK_CONFIRMED") return "OUT_OF_STOCK";
    if (status === "MARKETPLACE_ONLY_CONFIRMED" || /third[- ]party seller|marketplace/i.test(notes)) return "AVAILABLE_MARKETPLACE";
    if (/sold by amazon|sold by newegg/i.test(notes)) return "AVAILABLE";
    return sameDestination ? prior?.availability ?? "UNKNOWN" : "UNKNOWN";
}

function conditionFrom(notes, prior, sameDestination) {
    if (/refurbished|renewed/i.test(notes)) return "REFURBISHED";
    if (/open[- ]box/i.test(notes)) return "OPEN_BOX";
    if (/\bused\b|pre[- ]owned/i.test(notes)) return "USED";
    if (/\bnew(?: condition)?\b/i.test(notes)) return "NEW";
    return sameDestination ? prior?.condition ?? null : null;
}

export class ManualRetailReviewImportService {
    constructor({ products, destinations = [] } = {}) {
        this.products = new Map((products ?? []).map(product => [product.identity?.atlasProductId, product]));
        this.destinations = destinations;
    }

    importRows({ rows, sourceWorkbook, sourceSheet = "Manual Pass", importedAt, priorSnapshot = null } = {}) {
        if (!Number.isFinite(Date.parse(importedAt ?? ""))) throw new TypeError("MANUAL_RETAIL_REVIEW_IMPORT_TIME_INVALID");
        const outcomes = [];
        const offers = new Map((priorSnapshot?.offers ?? []).map(offer => [`${offer.atlasProductId}|${offer.retailer}`, clone(offer)]));
        const destinationsByKey = new Map(this.destinations.map(item => [`${item.atlasProductId}|${item.retailerId}`, item]));
        const listingOwners = new Map(this.destinations.filter(item => item.retailerListingId).map(item => [`${item.retailerId}|${item.retailerListingId}`, item.atlasProductId]));
        const seenRows = new Set();
        const research = [];
        for (const [index, row] of (rows ?? []).entries()) {
            const sourceRow = Number.isInteger(row.sourceRow) && row.sourceRow >= 2 ? row.sourceRow : index + 2;
            const rowKey = `${row.atlasProductId}|${row.manualAction}`;
            const product = this.products.get(row.atlasProductId);
            const status = String(row.operatorReviewStatus ?? "").trim();
            const context = classification(product);
            const failures = [];
            if (seenRows.has(rowKey)) failures.push("MANUAL_REVIEW_DUPLICATE_PRODUCT_ACTION");
            seenRows.add(rowKey);
            if (!MANUAL_RETAIL_REVIEW_STATUSES.includes(status)) failures.push("MANUAL_REVIEW_STATUS_INVALID");
            if (!product || product.identity.manufacturerPartNumber !== row.mpn) failures.push("MANUAL_REVIEW_ATLAS_IDENTITY_INVALID");
            if (product && (row.ddrGeneration !== context.memoryType || row.formFactor !== context.formFactor || row.applicationClass !== context.applicationClass)) failures.push("MANUAL_REVIEW_ATLAS_CONTEXT_INVALID");
            if (failures.length) { outcomes.push({ sourceRow, atlasProductId: row.atlasProductId ?? null, status: "ROW_REJECTED", reasons: failures }); continue; }
            if (status === "PENDING") { outcomes.push({ sourceRow, atlasProductId: row.atlasProductId, status: "PENDING_IGNORED" }); continue; }
            const researchRecord = { sourceRow, atlasProductId: row.atlasProductId, operatorReviewStatus: status, operatorNotes: row.operatorNotes ?? null, retailers: {} };
            for (const retailer of ["AMAZON", "NEWEGG"]) {
                const prefix = retailer === "AMAZON" ? "amazon" : "newegg";
                const manualUrl = nonBlank(row[`${prefix}UrlManual`]) ? row[`${prefix}UrlManual`].trim() : null;
                const rawPrice = row[`${prefix}PriceManual`];
                const manualNotes = nonBlank(row[`${prefix}ManualNotes`]) ? row[`${prefix}ManualNotes`].trim() : null;
                const manualPrice = parsePrice(rawPrice);
                const hasRawPrice = rawPrice !== null && rawPrice !== undefined && String(rawPrice).trim() !== "";
                const offerKey = `${row.atlasProductId}|${retailer}`;
                const prior = offers.get(offerKey) ?? null;
                const negative = statusApplies(status, retailer);
                researchRecord.retailers[retailer] = { url: manualUrl, priceUsd: manualPrice, notes: manualNotes, conclusion: negative ? "CONFIRMED_NOT_SOLD" : status };
                if (negative) { outcomes.push({ sourceRow, atlasProductId: row.atlasProductId, retailer, status: "CONFIRMED_NOT_SOLD" }); continue; }
                if (status === "UNRESOLVED_AFTER_MANUAL_REVIEW") { outcomes.push({ sourceRow, atlasProductId: row.atlasProductId, retailer, status: "UNRESOLVED_AFTER_MANUAL_REVIEW" }); continue; }
                if (hasRawPrice && manualPrice === null) { outcomes.push({ sourceRow, atlasProductId: row.atlasProductId, retailer, status: "ROW_RETAILER_REJECTED", reasons: ["MANUAL_PRICE_INVALID"] }); continue; }
                if (manualUrl && !exactUrl(retailer, manualUrl)) { outcomes.push({ sourceRow, atlasProductId: row.atlasProductId, retailer, status: "SEARCH_URL_REJECTED", reasons: ["MANUAL_EXACT_DESTINATION_INVALID"] }); continue; }
                if (!manualUrl && manualPrice === null && status !== "OUT_OF_STOCK_CONFIRMED" && status !== "MARKETPLACE_ONLY_CONFIRMED") { outcomes.push({ sourceRow, atlasProductId: row.atlasProductId, retailer, status: prior ? "NO_NEW_MANUAL_VALUE" : "NO_DESTINATION_REQUIRED" }); continue; }
                const effectiveUrl = manualUrl ?? prior?.researchUrl ?? (nonBlank(row[`${prefix}UrlCurrent`]) ? row[`${prefix}UrlCurrent`].trim() : null);
                if (manualPrice !== null && !exactUrl(retailer, effectiveUrl)) { outcomes.push({ sourceRow, atlasProductId: row.atlasProductId, retailer, status: "ROW_RETAILER_REJECTED", reasons: ["MANUAL_PRICE_DESTINATION_REQUIRED"] }); continue; }
                const foundListing = listing(retailer, effectiveUrl);
                const owner = foundListing ? listingOwners.get(`${retailerId(retailer)}|${foundListing}`) : null;
                if (owner && owner !== row.atlasProductId) { outcomes.push({ sourceRow, atlasProductId: row.atlasProductId, retailer, status: "DESTINATION_CONFLICT", reasons: ["RETAILER_LISTING_PRODUCT_CONFLICT"] }); continue; }
                if (foundListing) listingOwners.set(`${retailerId(retailer)}|${foundListing}`, row.atlasProductId);
                const existingDestination = destinationsByKey.get(`${row.atlasProductId}|${retailerId(retailer)}`) ?? null;
                let destinationStatus = "NO_DESTINATION_REQUIRED";
                let destinationId = existingDestination?.destinationId ?? null;
                if (foundListing) {
                    if (product.governance.lifecycleStatus !== "ACTIVE" || product.governance.publicationStatus !== "READY") { destinationStatus = "LIFECYCLE_BLOCKED"; destinationId = null; }
                    else if (existingDestination?.retailerListingId === foundListing) destinationStatus = "EXISTING_DESTINATION_REUSED";
                    else if (existingDestination) { destinationStatus = "DESTINATION_CONFLICT"; destinationId = null; }
                    else destinationStatus = "NEW_EXACT_DESTINATION_ADMITTED";
                }
                outcomes.push({ sourceRow, atlasProductId: row.atlasProductId, retailer, status: destinationStatus, destinationId, retailerListingId: foundListing, destinationUrl: effectiveUrl });
                const sameDestination = Boolean(prior && effectiveUrl && listing(retailer, prior.researchUrl) === foundListing);
                const effectivePrice = manualPrice ?? (sameDestination ? prior?.priceUsd ?? null : null);
                if (effectivePrice === null) continue;
                const evidenceText = `${manualNotes ?? ""} ${row.operatorNotes ?? ""}`;
                const availability = availabilityFrom(status, evidenceText, prior, sameDestination);
                const condition = conditionFrom(evidenceText, prior, sameDestination);
                const reasons = [];
                if (condition !== "NEW") reasons.push("CONDITION_NOT_ELIGIBLE");
                if (!destinationId) reasons.push("DESTINATION_UNRESOLVED");
                if (availability !== "AVAILABLE") reasons.push("AVAILABILITY_NOT_ELIGIBLE");
                const itemPriceEligible = reasons.length === 0;
                offers.set(offerKey, {
                    atlasProductId: row.atlasProductId, retailer, retailerId: retailerId(retailer), marketplace: expectedHost(retailer),
                    priceUsd: effectivePrice, currency: "USD", availability, condition, shippingUsd: null, feesUsd: null,
                    researchUrl: effectiveUrl, destinationId, matchStatus: "EXACT_PRODUCT_PAGE", sourceRow, observedAt: importedAt,
                    manualReviewProvenance: { sourceType: "OPERATOR_CURATED_RETAIL_REVIEW", workbook: sourceWorkbook, sheet: sourceSheet, operatorReviewStatus: status, operatorNotes: row.operatorNotes ?? null, retailerNotes: manualNotes, manufacturerPartNumber: row.mpn },
                    itemPriceEligible, deliveredCostEligible: false,
                    deliveredCostReasons: itemPriceEligible ? ["SHIPPING_COST_UNKNOWN", "FEES_UNKNOWN"] : reasons,
                    comparisonEligible: itemPriceEligible, comparisonReasons: reasons
                });
                outcomes.push({ sourceRow, atlasProductId: row.atlasProductId, retailer, status: itemPriceEligible ? "CURRENT_ITEM_PRICE_ELIGIBLE" : "CURRENT_ITEM_PRICE_BLOCKED" });
            }
            research.push(researchRecord);
        }
        const snapshot = createCurrentDisplaySnapshot({ observedAt: importedAt, importedAt, source: { workbook: sourceWorkbook, sheet: sourceSheet, digest: digest(rows) }, offers: [...offers.values()] });
        return Object.freeze({ snapshot, outcomes: Object.freeze(outcomes), research: Object.freeze(research), networkOperations: 0, providerTasks: 0, actualSpendUsd: 0, historicalObservationsCreated: 0 });
    }
}
