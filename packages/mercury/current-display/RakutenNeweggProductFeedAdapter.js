import crypto from "node:crypto";

export const RAKUTEN_NEWEGG_SOURCE = "RAKUTEN_NEWEGG_PRODUCT_CATALOG";
export const RAKUTEN_NEWEGG_PROFILES = Object.freeze(["MAIN", "NEWEGG_MKPL", "ADDITIONAL_UNCLASSIFIED"]);
const freeze = value => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; };
const hash = value => crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
const money = value => value === null || value === "" ? null : Number(value);

export function extractRakutenMerchantUrl(value) {
    try {
        const url = new URL(value);
        const nested = url.searchParams.get("murl");
        const isNewegg = hostname => hostname === "newegg.com" || hostname.endsWith(".newegg.com");
        if (!nested) return isNewegg(url.hostname) ? url.toString() : null;
        const merchant = new URL(nested);
        return isNewegg(merchant.hostname) ? merchant.toString() : null;
    } catch { return null; }
}

function listingFromUrl(value) {
    if (!value) return null;
    try {
        const url = new URL(value);
        const path = decodeURIComponent(url.pathname);
        return path.match(/\/p\/([A-Za-z0-9-]+)/i)?.[1] ?? path.match(/\/Product\/Product\.aspx.*?Item=([A-Za-z0-9-]+)/i)?.[1] ?? url.searchParams.get("Item") ?? null;
    } catch { return null; }
}

function exactDestination(record, destinations) {
    const skuMatches = destinations.filter(item => item.retailerListingId?.toUpperCase() === record.sku?.toUpperCase());
    const merchantUrl = extractRakutenMerchantUrl(record.productUrl ?? record.buyUrl);
    const urlListing = listingFromUrl(merchantUrl);
    const urlMatches = urlListing ? destinations.filter(item => item.retailerListingId?.toUpperCase() === urlListing.toUpperCase()) : [];
    const candidates = new Map([...skuMatches, ...urlMatches].map(item => [item.destinationId, item]));
    if (candidates.size === 0) return { status: "DESTINATION_NOT_MATCHED", destination: null, merchantUrl };
    if (candidates.size !== 1) return { status: "DESTINATION_MATCH_CONFLICT", destination: null, merchantUrl };
    const destination = [...candidates.values()][0];
    if (skuMatches.length && urlMatches.length && !urlMatches.some(item => item.destinationId === destination.destinationId)) return { status: "DESTINATION_MATCH_CONFLICT", destination: null, merchantUrl };
    if (destination.binding?.manufacturerPartNumber && record.manufacturerPartNumber && destination.binding.manufacturerPartNumber.toUpperCase() !== record.manufacturerPartNumber.toUpperCase()) return { status: "MPN_CONTRADICTION", destination: null, merchantUrl };
    return { status: "MATCHED", destination, merchantUrl };
}

function normalizedPrice(record) {
    const retailPrice = money(record.retailPrice);
    const salePrice = money(record.salePrice);
    if (!Number.isFinite(retailPrice) || retailPrice <= 0) return { status: "PRICE_NOT_EXPOSED", itemPriceUsd: null, retailPrice: null, salePrice: Number.isFinite(salePrice) ? salePrice : null };
    if (salePrice !== null && Number.isFinite(salePrice) && salePrice > 0 && salePrice !== retailPrice) return { status: "PRICE_SEMANTICS_UNRESOLVED", itemPriceUsd: null, retailPrice, salePrice };
    return { status: "PRICE_RESOLVED", itemPriceUsd: retailPrice, retailPrice, salePrice: Number.isFinite(salePrice) ? salePrice : null };
}

export function createRakutenNeweggProductFeedAdapter({ records, destinations, feedProfile = "MAIN", feedTimestamp, mode = "AUTOMATED_ALTERNATE", rights = null } = {}) {
    if (!Array.isArray(records) || !Array.isArray(destinations) || !RAKUTEN_NEWEGG_PROFILES.includes(feedProfile) || !Number.isFinite(Date.parse(feedTimestamp))) throw new TypeError("RAKUTEN_NEWEGG_ADAPTER_INPUT_INVALID");
    const sourceRights = rights ?? { profileId: "FIXTURE_RAKUTEN_NEWEGG_PENDING_PUBLIC_RIGHTS", acquisitionAllowed: true, ephemeralRetentionAllowed: true, publicDisplayAllowed: false, comparisonAllowed: false, historicalRetentionAllowed: false, ttlSeconds: 129600 };
    const destinationSet = destinations.filter(item => item.retailerId === "RETAILER-0004" && item.status === "ACTIVE");
    const outcomes = records.filter(item => item.recordType === "PRODUCT").map(record => ({ record, match: exactDestination(record, destinationSet) }));
    return freeze({
        adapterId: "mer_adapter_rakuten_newegg_product_catalog", mode, rights: sourceRights,
        supports: context => context.retailerId === "RETAILER-0004" && destinationSet.some(item => item.destinationId === context.destinationId),
        refresh: async context => {
            const applicable = outcomes.filter(item => item.match.destination?.destinationId === context.destinationId);
            if (applicable.length === 0) return { type: "OUTCOME", status: "SOURCE_UNAVAILABLE" };
            if (applicable.length !== 1) return { type: "OUTCOME", status: "INVALID_SOURCE_RESULT" };
            const { record, match } = applicable[0];
            if (record.currency !== "USD") return { type: "OUTCOME", status: "INVALID_SOURCE_RESULT" };
            if (record.modification === "D") return { type: "OUTCOME", status: "SOURCE_WITHDRAWN" };
            const price = normalizedPrice(record);
            if (price.status !== "PRICE_RESOLVED") return { type: "OUTCOME", status: price.status };
            const availability = record.availability === "in-stock" ? "AVAILABLE" : "UNKNOWN";
            const marketplace = feedProfile === "NEWEGG_MKPL" ? true : null;
            return freeze({ type: "OBSERVATION", atlasProductId: context.atlasProductId, retailerId: context.retailerId, retailer: "NEWEGG", destinationId: context.destinationId, destinationUrl: context.destinationUrl, marketplace: context.marketplace,
                itemPriceUsd: price.itemPriceUsd, currency: "USD", condition: null, availability, sellerType: null, sellerName: null, shippingUsd: null, feesUsd: null,
                sourceId: RAKUTEN_NEWEGG_SOURCE, observedAt: new Date(feedTimestamp).toISOString(), sourceEvidence: { feedProfile, sourceProductId: record.productId, sourceSku: record.sku, sourceMpn: record.manufacturerPartNumber, sourceUpc: record.upc, sourceModification: record.modification, retailPrice: price.retailPrice, sourceSalePrice: price.salePrice, sourceShippingUsd: money(record.shipping), merchantUrl: match.merchantUrl, marketplace, digest: hash(record) } });
        }
    });
}
