import crypto from "node:crypto";
import { createCurrentDisplaySnapshot } from "./CurrentDisplaySnapshot.js";
import { assessStandardRetailNewCondition } from "./StandardRetailNewConditionPolicy.js";

const BLOCKED_PRICE_STATES = new Set(["PRICE_VOLATILE_REFRESH_REQUIRED", "PAGE_FOUND_PRICE_NOT_EXPOSED", "OUT_OF_STOCK_OR_PRICE_NOT_EXPOSED", "NO_QUALIFYING_NEW_EXACT_PAGE", "NO_CLEAN_RETAILER_EXACT_PAGE"]);
const digest = value => crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
const price = value => typeof value === "number" && Number.isFinite(value) && value > 0;
const excelTime = value => {
    if (typeof value === "number") return new Date(Math.round((value - 25569) * 86400000)).toISOString();
    if (typeof value !== "string" || !value.trim()) return null;
    const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value.trim()) ? `${value.trim().replace(" ", "T")}Z` : value.trim();
    return Number.isFinite(Date.parse(normalized)) ? new Date(normalized).toISOString() : null;
};
const host = value => { try { return new URL(value).hostname.toLowerCase().replace(/^www\./, ""); } catch { return null; } };
const amazonListing = value => value?.match(/\/dp\/([A-Z0-9]{10})(?:\/|$|\?)/i)?.[1]?.toUpperCase() ?? null;
const neweggListing = value => value && !value.includes("/p/pl?") ? value.match(/\/p\/([A-Z0-9-]+)(?:\/|$|\?)/i)?.[1]?.toUpperCase() ?? null : null;

export class RetailDisplayImportService {
    constructor({ products, destinations = [] } = {}) {
        this.products = new Map((products ?? []).map(product => [product.identity?.atlasProductId, product]));
        this.destinations = destinations;
    }

    importRows({ rows, sourceWorkbook, sourceSheet, importedAt, priorSnapshot = null } = {}) {
        const outcomes = [];
        const offersByKey = new Map((priorSnapshot?.offers ?? []).map(offer => [
            `${offer.atlasProductId}|${offer.retailer}`,
            { ...structuredClone(offer), observedAt: offer.observedAt ?? priorSnapshot.observedAt }
        ]));
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
                { key: "NEWEGG", id: "RETAILER-0004", marketplace: "newegg.com", url: row.neweggUrl, amount: row.neweggObservedPriceUsd, availability: row.neweggAvailability, matchStatus: row.neweggMatchStatus, listing: neweggListing(row.neweggUrl) }
            ]) {
                if (!retailer.url && !price(retailer.amount)) continue;
                const offerKey = `${row.atlasProductId}|${retailer.key}`;
                if (observedAt) offersByKey.delete(offerKey);
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
                const condition = assessStandardRetailNewCondition({ retailer: retailer.key, researchUrl: retailer.url, matchStatus: retailer.matchStatus, evidenceText: `${retailer.availability ?? ""} ${row.researchNotes ?? ""}` });
                const comparisonReasons = [];
                if (!condition.eligible) comparisonReasons.push(...condition.reasons);
                if (!destinationId) comparisonReasons.push("DESTINATION_UNRESOLVED");
                if (retailer.availability !== "AVAILABLE") comparisonReasons.push("AVAILABILITY_NOT_ELIGIBLE");
                const itemPriceEligible = comparisonReasons.length === 0;
                const deliveredCostReasons = [...comparisonReasons];
                if (itemPriceEligible) deliveredCostReasons.push("SHIPPING_COST_UNKNOWN", "FEES_UNKNOWN");
                if (!observedAt) {
                    outcomes.push({ sourceRow, atlasProductId: row.atlasProductId, retailer: retailer.key, status: "CURRENT_PRICE_BLOCKED_OBSERVATION_TIME_MISSING" });
                    continue;
                }
                offersByKey.set(offerKey, {
                    atlasProductId: row.atlasProductId,
                    retailer: retailer.key,
                    retailerId: retailer.id,
                    marketplace: retailer.marketplace,
                    priceUsd: retailer.amount,
                    currency: "USD",
                    availability: retailer.availability,
                    condition: condition.condition,
                    shippingUsd: null,
                    feesUsd: null,
                    researchUrl: retailer.url ?? null,
                    destinationId,
                    matchStatus: retailer.matchStatus,
                    sourceRow,
                    observedAt,
                    itemPriceEligible,
                    deliveredCostEligible: deliveredCostReasons.length === 0,
                    deliveredCostReasons,
                    comparisonEligible: itemPriceEligible,
                    comparisonReasons
                });
                outcomes.push({ sourceRow, atlasProductId: row.atlasProductId, retailer: retailer.key, status: retailer.url && destinationId ? "DISPLAY_PRICE_IMPORTED" : "PRICE_OBSERVED_DESTINATION_UNRESOLVED" });
            }
        }
        const offers = [...offersByKey.values()];
        const effectiveTimes = [...observedTimes, ...offers.map(offer => offer.observedAt).filter(Boolean)];
        if (!effectiveTimes.length) throw new Error("CURRENT_DISPLAY_OBSERVATION_TIME_REQUIRED");
        const latestObservedAt = effectiveTimes.sort((left, right) => Date.parse(left) - Date.parse(right)).at(-1);
        const snapshot = createCurrentDisplaySnapshot({
            observedAt: latestObservedAt,
            importedAt,
            source: { workbook: sourceWorkbook, sheet: sourceSheet, digest: digest(rows) },
            offers
        });
        return Object.freeze({ snapshot, outcomes: Object.freeze(outcomes), networkOperations: 0, providerTasks: 0, actualSpendUsd: 0, historicalObservationsCreated: 0 });
    }
}
