import crypto from "node:crypto";
import { createCurrentDisplaySnapshot } from "./CurrentDisplaySnapshot.js";

const BLOCKED_PRICE_STATES = new Set(["PRICE_VOLATILE_REFRESH_REQUIRED", "PAGE_FOUND_PRICE_NOT_EXPOSED", "OUT_OF_STOCK_OR_PRICE_NOT_EXPOSED", "NO_QUALIFYING_NEW_EXACT_PAGE", "NO_CLEAN_RETAILER_EXACT_PAGE"]);
const digest = value => crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
const price = value => typeof value === "number" && Number.isFinite(value) && value > 0;
const excelTime = value => typeof value === "number" ? new Date(Math.round((value - 25569) * 86400000)).toISOString() : value;
const host = value => { try { return new URL(value).hostname.toLowerCase().replace(/^www\./, ""); } catch { return null; } };
const amazonListing = value => value?.match(/\/dp\/([A-Z0-9]{10})(?:\/|$|\?)/i)?.[1]?.toUpperCase() ?? null;
const neweggListing = value => value && !value.includes("/p/pl?") ? value.match(/\/p\/([A-Z0-9-]+)(?:\/|$|\?)/i)?.[1]?.toUpperCase() ?? null : null;

export class RetailDisplayImportService {
    constructor({ products, destinations = [] } = {}) {
        this.products = new Map((products ?? []).map(product => [product.identity?.atlasProductId, product]));
        this.destinations = destinations;
    }

    importRows({ rows, sourceWorkbook, sourceSheet, importedAt } = {}) {
        const outcomes = [];
        const offers = [];
        const observedTimes = new Set();
        const existing = new Map(this.destinations.map(destination => [`${destination.atlasProductId}|${destination.retailerId}`, destination]));
        for (const [index, row] of (rows ?? []).entries()) {
            const sourceRow = index + 5;
            const product = this.products.get(row.atlasProductId);
            if (!product || product.identity.manufacturerPartNumber !== row.manufacturerPartNumber) {
                outcomes.push({ sourceRow, atlasProductId: row.atlasProductId ?? null, status: "REJECTED_IDENTITY_MISMATCH" });
                continue;
            }
            const observedAt = excelTime(row.observedAt);
            if (observedAt) observedTimes.add(observedAt);
            if (row.amazonMatchStatus === "NOT_VERIFIED_IN_INITIAL_SWEEP" && row.neweggMatchStatus === "NOT_VERIFIED_IN_INITIAL_SWEEP") {
                outcomes.push({ sourceRow, atlasProductId: row.atlasProductId, status: "UNVERIFIED" });
                continue;
            }
            for (const retailer of [
                { key: "AMAZON", id: "RETAILER-0001", marketplace: "amazon.com", url: row.amazonUrl, amount: row.amazonObservedPriceUsd, availability: row.amazonAvailability, matchStatus: row.amazonMatchStatus, listing: amazonListing(row.amazonUrl) },
                { key: "NEWEGG", id: null, marketplace: "newegg.com", url: row.neweggUrl, amount: row.neweggObservedPriceUsd, availability: row.neweggAvailability, matchStatus: row.neweggMatchStatus, listing: neweggListing(row.neweggUrl) }
            ]) {
                if (!retailer.url && !price(retailer.amount)) continue;
                let destinationId = null;
                let destinationStatus = "NO_DESTINATION";
                if (retailer.url?.includes("/p/pl?")) destinationStatus = "SEARCH_URL_ONLY";
                else if (retailer.listing) {
                    if (!retailer.id) destinationStatus = "DESTINATION_BLOCKED_RETAILER_UNREGISTERED";
                    else if (product.governance.lifecycleStatus !== "ACTIVE" || product.governance.publicationStatus !== "READY") destinationStatus = "DESTINATION_BLOCKED_ATLAS_NOT_ACTIVE_READY";
                    else {
                        const prior = existing.get(`${row.atlasProductId}|${retailer.id}`);
                        if (prior && prior.retailerListingId === retailer.listing) { destinationStatus = "DESTINATION_REUSED"; destinationId = prior.destinationId; }
                        else if (prior) destinationStatus = "DESTINATION_REVIEW_REQUIRED";
                        else destinationStatus = "DESTINATION_ADMISSION_REQUIRED";
                    }
                }
                outcomes.push({ sourceRow, atlasProductId: row.atlasProductId, retailer: retailer.key, status: destinationStatus });
                if (!price(retailer.amount) || BLOCKED_PRICE_STATES.has(retailer.availability) || BLOCKED_PRICE_STATES.has(retailer.matchStatus)) {
                    if (retailer.url) outcomes.push({ sourceRow, atlasProductId: row.atlasProductId, retailer: retailer.key, status: "NO_CURRENT_PRICE" });
                    continue;
                }
                offers.push({
                    atlasProductId: row.atlasProductId,
                    retailer: retailer.key,
                    retailerId: retailer.id,
                    marketplace: retailer.marketplace,
                    priceUsd: retailer.amount,
                    currency: "USD",
                    availability: retailer.availability,
                    condition: null,
                    shippingUsd: null,
                    feesUsd: null,
                    researchUrl: retailer.url ?? null,
                    destinationId,
                    matchStatus: retailer.matchStatus,
                    sourceRow,
                    comparisonEligible: false,
                    comparisonReasons: ["CONDITION_UNKNOWN"]
                });
                outcomes.push({ sourceRow, atlasProductId: row.atlasProductId, retailer: retailer.key, status: retailer.url && destinationId ? "DISPLAY_PRICE_IMPORTED" : "PRICE_OBSERVED_DESTINATION_UNRESOLVED" });
            }
        }
        if (observedTimes.size !== 1) throw new Error("CURRENT_DISPLAY_OBSERVATION_TIME_INCONSISTENT");
        const snapshot = createCurrentDisplaySnapshot({
            observedAt: [...observedTimes][0],
            importedAt,
            source: { workbook: sourceWorkbook, sheet: sourceSheet, digest: digest(rows) },
            offers
        });
        return Object.freeze({ snapshot, outcomes: Object.freeze(outcomes), networkOperations: 0, providerTasks: 0, actualSpendUsd: 0, historicalObservationsCreated: 0 });
    }
}
