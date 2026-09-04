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
const sameFinding = (prior, retailer) => prior.priceUsd === retailer.amount
    && prior.researchUrl === (retailer.url ?? null)
    && prior.availability === retailer.availability
    && prior.matchStatus === retailer.matchStatus;

export function classifyRetailDiscoveryGaps(rows = [], products = []) {
    const productById = new Map(products.map(product => [product.identity?.atlasProductId, product]));
    const exactAmazon = row => /\/dp\/[A-Z0-9]{10}(?:\/|$|\?)/i.test(row.amazonUrl ?? "");
    const exactNewegg = row => Boolean(row.neweggUrl) && !row.neweggUrl.includes("/p/pl?") && /\/p\/[A-Z0-9-]+(?:\/|$|\?)/i.test(row.neweggUrl);
    const records = rows.map(row => {
        const categories = [];
        const amazonFinding = Boolean(row.amazonUrl) || price(row.amazonObservedPriceUsd);
        const neweggFinding = Boolean(row.neweggUrl) || price(row.neweggObservedPriceUsd);
        if (!amazonFinding && !neweggFinding) categories.push("COMPLETELY_UNVERIFIED");
        if (exactAmazon(row) && exactNewegg(row)) categories.push("COMPLETE_BOTH_RETAILERS");
        else if (amazonFinding && !neweggFinding) categories.push("AMAZON_ONLY");
        else if (neweggFinding && !amazonFinding) categories.push("NEWEGG_ONLY");
        if ((exactAmazon(row) && !price(row.amazonObservedPriceUsd)) || (exactNewegg(row) && !price(row.neweggObservedPriceUsd))) categories.push("URL_FOUND_PRICE_MISSING");
        if ((row.amazonUrl?.includes("/s?") || row.neweggUrl?.includes("/p/pl?")) && !exactAmazon(row) && !exactNewegg(row)) categories.push("SEARCH_RESULT_ONLY");
        if (/OUT_OF_STOCK/.test(`${row.amazonAvailability ?? ""} ${row.neweggAvailability ?? ""}`)) categories.push("OUT_OF_STOCK");
        if (/MARKETPLACE|REFURBISHED/.test(`${row.amazonAvailability ?? ""} ${row.neweggAvailability ?? ""} ${row.researchNotes ?? ""}`.toUpperCase())) categories.push("MARKETPLACE_REVIEW");
        if ((price(row.amazonObservedPriceUsd) && !exactAmazon(row)) || (price(row.neweggObservedPriceUsd) && !exactNewegg(row))) categories.push("PRICE_ONLY_DESTINATION_UNRESOLVED");
        if (/NO_QUALIFYING|NO_CLEAN_RETAILER|NOT_SOLD/.test(`${row.amazonMatchStatus ?? ""} ${row.neweggMatchStatus ?? ""} ${row.researchNotes ?? ""}`.toUpperCase())) categories.push("CONFIRM_NOT_SOLD");
        if (/VOLATILE/.test(`${row.amazonAvailability ?? ""} ${row.neweggAvailability ?? ""} ${row.researchNotes ?? ""}`.toUpperCase())) categories.push("MANUAL_PRICE_REFRESH");
        const product = productById.get(row.atlasProductId);
        const recommendedNextResearchAction = categories.includes("COMPLETELY_UNVERIFIED") ? "VERIFY_AMAZON_AND_NEWEGG_EXACT_SKU"
            : categories.includes("MANUAL_PRICE_REFRESH") ? "REFRESH_VOLATILE_PRICE"
                : categories.includes("MARKETPLACE_REVIEW") ? "REVIEW_MARKETPLACE_SELLER_AND_CONDITION"
                    : categories.includes("SEARCH_RESULT_ONLY") || categories.includes("PRICE_ONLY_DESTINATION_UNRESOLVED") ? "RESOLVE_EXACT_PRODUCT_DESTINATION"
                        : categories.includes("URL_FOUND_PRICE_MISSING") ? "REFRESH_CURRENT_PRICE"
                            : categories.includes("CONFIRM_NOT_SOLD") ? "CONFIRM_RETAILER_NON_AVAILABILITY"
                                : "COMPLETE_MISSING_RETAILER_RESEARCH";
        return {
            atlasProductId: row.atlasProductId,
            canonicalBrand: row.canonicalBrand,
            family: row.family ?? null,
            series: row.series ?? null,
            manufacturerPartNumber: row.manufacturerPartNumber,
            lifecycle: product ? `${product.governance.lifecycleStatus}/${product.governance.publicationStatus}` : null,
            exactMpnSearchKey: row.exactMpnSearchKey,
            classifications: categories,
            recommendedNextResearchAction,
            missingRetailerFields: [
                ...(!row.amazonUrl ? ["amazonUrl"] : []), ...(!price(row.amazonObservedPriceUsd) ? ["amazonObservedPriceUsd"] : []),
                ...(!row.neweggUrl ? ["neweggUrl"] : []), ...(!price(row.neweggObservedPriceUsd) ? ["neweggObservedPriceUsd"] : [])
            ]
        };
    });
    return Object.freeze(records.map(record => Object.freeze(record)));
}

export function buildFinalRetailManualPass(rows = [], products = []) {
    const productById = new Map(products.map(product => [product.identity?.atlasProductId, product]));
    const exactAmazon = row => /\/dp\/[A-Z0-9]{10}(?:\/|$|\?)/i.test(row.amazonUrl ?? "");
    const exactNewegg = row => Boolean(row.neweggUrl) && !row.neweggUrl.includes("/p/pl?") && /\/p\/[A-Z0-9-]+(?:\/|$|\?)/i.test(row.neweggUrl);
    const unavailable = value => /OUT_OF_STOCK|MARKETPLACE_ONLY/.test(String(value ?? "").toUpperCase());
    const records = rows.map(row => {
        const amazonExact = exactAmazon(row), neweggExact = exactNewegg(row);
        const amazonFinding = Boolean(row.amazonUrl) || price(row.amazonObservedPriceUsd);
        const neweggFinding = Boolean(row.neweggUrl) || price(row.neweggObservedPriceUsd);
        const actions = [];
        if (!amazonExact) actions.push(price(row.amazonObservedPriceUsd) ? "AMAZON_EXACT_URL_NEEDED" : "AMAZON_URL_NEEDED");
        else if (!price(row.amazonObservedPriceUsd) && !unavailable(row.amazonAvailability)) actions.push("AMAZON_PRICE_NEEDED");
        if (!neweggExact) actions.push(price(row.neweggObservedPriceUsd) || row.neweggUrl?.includes("/p/pl?") ? "NEWEGG_EXACT_URL_NEEDED" : "NEWEGG_URL_NEEDED");
        else if (!price(row.neweggObservedPriceUsd) && !unavailable(row.neweggAvailability)) actions.push(/VOLATILE/.test(String(row.neweggAvailability ?? "")) ? "MANUAL_PRICE_REFRESH" : "NEWEGG_PRICE_NEEDED");
        const researchState = amazonExact && neweggExact ? "COMPLETE_BOTH_RETAILERS"
            : !amazonFinding && !neweggFinding ? "COMPLETELY_UNVERIFIED"
                : "PARTIAL_RETAIL_COVERAGE";
        const priority = researchState === "COMPLETELY_UNVERIFIED" || (price(row.amazonObservedPriceUsd) && !amazonExact) || (price(row.neweggObservedPriceUsd) && !neweggExact) ? "HIGH"
            : actions.some(action => /PRICE_NEEDED|EXACT_URL_NEEDED|MANUAL_PRICE_REFRESH/.test(action)) ? "MEDIUM" : "LOW";
        const product = productById.get(row.atlasProductId);
        return { atlasProductId: row.atlasProductId, brand: row.canonicalBrand, family: row.family ?? null, series: row.series ?? null, manufacturerPartNumber: row.manufacturerPartNumber, researchState, priority, recommendedManualActions: actions, searchKey: row.exactMpnSearchKey, currentAmazon: { url: row.amazonUrl ?? null, priceUsd: row.amazonObservedPriceUsd ?? null, availability: row.amazonAvailability ?? null, matchStatus: row.amazonMatchStatus ?? null }, currentNewegg: { url: row.neweggUrl ?? null, priceUsd: row.neweggObservedPriceUsd ?? null, availability: row.neweggAvailability ?? null, matchStatus: row.neweggMatchStatus ?? null }, lifecycle: product ? `${product.governance.lifecycleStatus}/${product.governance.publicationStatus}` : null };
    });
    const actionableItems = records.filter(record => record.recommendedManualActions.length);
    return Object.freeze({ researchCompletionCounts: Object.fromEntries(["COMPLETE_BOTH_RETAILERS", "PARTIAL_RETAIL_COVERAGE", "CONFIRMED_SINGLE_RETAILER", "COMPLETELY_UNVERIFIED"].map(state => [state, records.filter(record => record.researchState === state).length])), priorityCounts: Object.fromEntries(["HIGH", "MEDIUM", "LOW"].map(priority => [priority, actionableItems.filter(record => record.priority === priority).length])), actionableItems: Object.freeze(actionableItems) });
}

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
                const offerKey = `${row.atlasProductId}|${retailer.key}`;
                const priorOffer = offersByKey.get(offerKey);
                if (!retailer.url && !price(retailer.amount)) {
                    outcomes.push({ sourceRow, atlasProductId: row.atlasProductId, retailer: retailer.key, status: priorOffer ? "NO_NEW_EVIDENCE" : "UNVERIFIED" });
                    continue;
                }
                let replaceOffer = Boolean(observedAt);
                if (priorOffer && observedAt) {
                    const comparison = Date.parse(observedAt) - Date.parse(priorOffer.observedAt ?? priorSnapshot?.observedAt);
                    if (comparison < 0) { replaceOffer = false; outcomes.push({ sourceRow, atlasProductId: row.atlasProductId, retailer: retailer.key, status: "NO_NEW_EVIDENCE" }); }
                    else if (comparison === 0 && sameFinding(priorOffer, retailer)) { replaceOffer = false; outcomes.push({ sourceRow, atlasProductId: row.atlasProductId, retailer: retailer.key, status: "EXACT_REPLAY" }); }
                    else if (comparison === 0) { outcomes.push({ sourceRow, atlasProductId: row.atlasProductId, retailer: retailer.key, status: "CONFLICTING_FINDING" }); continue; }
                    else outcomes.push({ sourceRow, atlasProductId: row.atlasProductId, retailer: retailer.key, status: "UPDATED_FINDING" });
                } else if (!priorOffer) outcomes.push({ sourceRow, atlasProductId: row.atlasProductId, retailer: retailer.key, status: "NEW_FINDING" });
                if (replaceOffer) offersByKey.delete(offerKey);
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
                if (!replaceOffer) continue;
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
