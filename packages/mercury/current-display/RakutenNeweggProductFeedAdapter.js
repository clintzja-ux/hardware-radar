import crypto from "node:crypto";
import { projectRakutenCatalogState, reduceRakutenDeltaRecords } from "./RakutenCatalogStateProjection.js";
import { createCurrentOfferIdentity, normalizeSellerAttribution } from "./CurrentOfferModel.js";
import defaultSourceRightsRegistry from "../rights/SourceRightsRegistry.js";

export const RAKUTEN_NEWEGG_SOURCE = "RAKUTEN_NEWEGG_PRODUCT_CATALOG";
export const RAKUTEN_NEWEGG_CONDITION_POLICY_VERSION = "RAKUTEN-NEWEGG-CONTEXTUAL-RETAIL-CONDITION-P1-1.0";
export const RAKUTEN_NEWEGG_PROFILES = Object.freeze(["MAIN", "MAIN_FULL", "MAIN_DELTA", "NEWEGG_MKPL", "ADDITIONAL_UNCLASSIFIED"]);
const freeze = value => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; };
const hash = value => crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
const money = value => value === null || value === "" ? null : Number(value);
const alternativeCondition = /\b(?:used|refurb(?:ished)?|open[ -]?box|renewed|pre[ -]?owned|recertified)\b/i;
const explicitCondition = value => {
    const title = typeof value === "string" ? value.trim() : "";
    if (/^open[ -]?box\s*-/i.test(title)) return "OPEN_BOX";
    if (/^(?:manufacturer\s+)?refurbished\b/i.test(title)) return "REFURBISHED";
    if (/^(?:used|pre[ -]?owned)\b/i.test(title)) return "USED";
    return null;
};
const RAKUTEN_WINDOW_TIMEZONE_UNCERTAINTY_MS = 14 * 60 * 60 * 1000;
const canonicalCurrentRights = () => {
    const profile = defaultSourceRightsRegistry.require(RAKUTEN_NEWEGG_SOURCE);
    return Object.freeze({
        profileId: profile.sourceId,
        acquisitionAllowed: profile.acquisition.import === "ALLOWED",
        ephemeralRetentionAllowed: profile.processing.ephemeral === "ALLOWED" && profile.retention.current === "ALLOWED",
        publicDisplayAllowed: profile.live.publicDisplay === "ALLOWED",
        comparisonAllowed: profile.live.comparison === "ALLOWED",
        historicalRetentionAllowed: profile.retention.historical === "ALLOWED",
        ttlSeconds: profile.retention.contentTtlMs / 1000
    });
};

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

export function assessRakutenNeweggDestination(record, destinations) {
    if (record?.recordType !== "PRODUCT" || !Array.isArray(destinations)) throw new TypeError("RAKUTEN_DESTINATION_ASSESSMENT_INPUT_INVALID");
    return freeze(exactDestination(record, destinations));
}

function rakutenWallClock(value) {
    if (typeof value !== "string" || value.trim() === "") return null;
    const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{2}):(\d{2})$/);
    if (!match) return Number.NaN;
    const [, month, day, year, hour, minute, second] = match.map(Number);
    const timestamp = Date.UTC(year, month - 1, day, hour, minute, second);
    const parsed = new Date(timestamp);
    return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day
        && parsed.getUTCHours() === hour && parsed.getUTCMinutes() === minute && parsed.getUTCSeconds() === second
        ? timestamp : Number.NaN;
}

function classifyWindow(record, evaluatedAt) {
    const rawBeginDate = record.beginDate ?? "", rawEndDate = record.endDate ?? "";
    const begin = rakutenWallClock(rawBeginDate), end = rakutenWallClock(rawEndDate);
    if (begin === null && end === null) return { status: "UNBOUNDED", rawBeginDate, rawEndDate };
    if (begin === null || end === null) return { status: "UNRESOLVED_ONE_SIDED", rawBeginDate, rawEndDate };
    if (!Number.isFinite(begin) || !Number.isFinite(end) || begin >= end) return { status: "UNRESOLVED_MALFORMED", rawBeginDate, rawEndDate };
    const evaluated = Date.parse(evaluatedAt);
    if (!Number.isFinite(evaluated)) return { status: "UNRESOLVED_EVALUATION_TIME", rawBeginDate, rawEndDate };
    if (evaluated > begin + RAKUTEN_WINDOW_TIMEZONE_UNCERTAINTY_MS && evaluated < end - RAKUTEN_WINDOW_TIMEZONE_UNCERTAINTY_MS) return { status: "INSIDE", rawBeginDate, rawEndDate };
    if (evaluated < begin - RAKUTEN_WINDOW_TIMEZONE_UNCERTAINTY_MS || evaluated > end + RAKUTEN_WINDOW_TIMEZONE_UNCERTAINTY_MS) return { status: "OUTSIDE", rawBeginDate, rawEndDate };
    return { status: "UNRESOLVED_BOUNDARY", rawBeginDate, rawEndDate };
}

function normalizedPrice(record, evaluatedAt) {
    const retailPrice = money(record.retailPrice);
    const salePrice = money(record.salePrice);
    const validRetail = Number.isFinite(retailPrice) && retailPrice > 0;
    const validSale = Number.isFinite(salePrice) && salePrice > 0;
    const window = classifyWindow(record, evaluatedAt);
    const evidence = { retailPrice: validRetail ? retailPrice : null, salePrice: validSale ? salePrice : null, rawRetailPrice: record.retailPrice ?? "", rawSalePrice: record.salePrice ?? "", selectedPriceField: null, window };
    if (window.status.startsWith("UNRESOLVED_")) return { status: "PRICE_SEMANTICS_UNRESOLVED", itemPriceUsd: null, ...evidence };
    if (validSale && window.status !== "OUTSIDE") return { status: "PRICE_RESOLVED", itemPriceUsd: salePrice, ...evidence, selectedPriceField: "SALE_PRICE" };
    if (validRetail) return { status: "PRICE_RESOLVED", itemPriceUsd: retailPrice, ...evidence, selectedPriceField: "RETAIL_PRICE" };
    return { status: "PRICE_NOT_EXPOSED", itemPriceUsd: null, ...evidence };
}

export function assessRakutenNeweggCondition(record, { feedProfile = "MAIN" } = {}) {
    if (!record || record.recordType !== "PRODUCT" || !RAKUTEN_NEWEGG_PROFILES.includes(feedProfile)) throw new TypeError("RAKUTEN_NEWEGG_CONDITION_INPUT_INVALID");
    const title = record.productName ?? "";
    const explicit = explicitCondition(title);
    if (explicit) return freeze({ condition: explicit, evidenceState: "EXPLICIT_PROVIDER", policyVersion: RAKUTEN_NEWEGG_CONDITION_POLICY_VERSION, reasons: ["STRUCTURED_PRODUCT_TITLE_CONDITION"] });
    if (alternativeCondition.test(title)) return freeze({ condition: null, evidenceState: "UNKNOWN", policyVersion: RAKUTEN_NEWEGG_CONDITION_POLICY_VERSION, reasons: ["AMBIGUOUS_CONTRARY_CONDITION_TEXT"] });
    const pricePresent = [record.salePrice, record.retailPrice].some(value => Number.isFinite(money(value)) && money(value) > 0);
    const ordinaryProfile = ["MAIN", "MAIN_FULL", "MAIN_DELTA", "NEWEGG_MKPL"].includes(feedProfile);
    if (ordinaryProfile && record.modification !== "D" && record.availability === "in-stock" && pricePresent) return freeze({ condition: "NEW", evidenceState: "CONTEXTUALLY_DERIVED", policyVersion: RAKUTEN_NEWEGG_CONDITION_POLICY_VERSION, reasons: ["NEWEGG_PRODUCT_CATALOG_ACTIVE_PRICED_IN_STOCK", "NO_CONTRARY_CONDITION_EVIDENCE"] });
    return freeze({ condition: null, evidenceState: "UNKNOWN", policyVersion: RAKUTEN_NEWEGG_CONDITION_POLICY_VERSION, reasons: ["CONTEXT_INSUFFICIENT"] });
}

export function createRakutenNeweggProductFeedAdapter({ records, catalogFiles = null, destinations, feedProfile = "MAIN", feedTimestamp, mode = "AUTOMATED_ALTERNATE", rights = null } = {}) {
    if ((!Array.isArray(records) && !Array.isArray(catalogFiles)) || !Array.isArray(destinations) || !RAKUTEN_NEWEGG_PROFILES.includes(feedProfile) || !Number.isFinite(Date.parse(feedTimestamp))) throw new TypeError("RAKUTEN_NEWEGG_ADAPTER_INPUT_INVALID");
    if (Array.isArray(records) && Array.isArray(catalogFiles)) throw new TypeError("RAKUTEN_NEWEGG_ADAPTER_INPUT_CONFLICT");
    const sourceRights = rights ?? canonicalCurrentRights();
    const destinationSet = destinations.filter(item => item.retailerId === "RETAILER-0004" && item.status === "ACTIVE");
    const catalogState = Array.isArray(catalogFiles) ? projectRakutenCatalogState({ files: catalogFiles }) : null;
    const sourceRecords = catalogState
        ? catalogState.currentCandidates.map(item => ({ record: item.record, evidence: item.evidence }))
        : (feedProfile === "MAIN_DELTA" ? reduceRakutenDeltaRecords(records) : records).map(record => ({ record, evidence: null }));
    const outcomes = sourceRecords.filter(item => item.record.recordType === "PRODUCT").map(({ record, evidence }) => ({ record, evidence, match: exactDestination(record, destinationSet) }));
    return freeze({
        adapterId: "mer_adapter_rakuten_newegg_product_catalog", mode, rights: sourceRights, weakItemPriceAllowed: true,
        supports: context => context.retailerId === "RETAILER-0004" && destinationSet.some(item => item.destinationId === context.destinationId),
        refresh: async context => {
            const applicable = outcomes.filter(item => item.match.destination?.destinationId === context.destinationId);
            if (applicable.length === 0) return { type: "OUTCOME", status: "SOURCE_UNAVAILABLE" };
            if (applicable.length !== 1) return { type: "OUTCOME", status: "INVALID_SOURCE_RESULT" };
            const { record, evidence, match } = applicable[0];
            if (record.currency !== "USD") return { type: "OUTCOME", status: "INVALID_SOURCE_RESULT" };
            const condition = assessRakutenNeweggCondition(record, { feedProfile: evidence?.feedProfile ?? feedProfile });
            if (record.modification === "D") {
                const seller = normalizeSellerAttribution();
                return { type: "OUTCOME", status: "SOURCE_WITHDRAWN", listingIdentity: record.sku, withdrawOfferIdentity: createCurrentOfferIdentity({ atlasProductId: context.atlasProductId, commerceChannelId: context.retailerId, listingIdentity: record.sku, seller, condition: condition.condition }) };
            }
            const observedAt = new Date(evidence?.observedAt ?? feedTimestamp).toISOString();
            const ageMs = Date.parse(context.asOf) - Date.parse(observedAt);
            if (ageMs < 0 || ageMs > sourceRights.ttlSeconds * 1000) return { type: "OUTCOME", status: "SOURCE_STALE" };
            const price = normalizedPrice(record, context.asOf);
            if (price.status !== "PRICE_RESOLVED") return { type: "OUTCOME", status: price.status };
            const availability = record.availability === "in-stock" ? "AVAILABLE" : record.availability === "out-of-stock" ? "OUT_OF_STOCK" : "UNKNOWN";
            const marketplace = feedProfile === "NEWEGG_MKPL" ? true : null;
            return freeze({ type: "OBSERVATION", atlasProductId: context.atlasProductId, retailerId: context.retailerId, retailer: "NEWEGG", destinationId: context.destinationId, destinationUrl: context.destinationUrl, marketplace: context.marketplace,
                itemPriceUsd: price.itemPriceUsd, currency: "USD", condition: condition.condition, conditionEvidence: condition, availability, sellerType: null, sellerName: null, listingIdentity: record.sku, shippingUsd: null, feesUsd: null,
                sourceId: RAKUTEN_NEWEGG_SOURCE, observedAt, sourceEvidence: { feedProfile: evidence?.feedProfile ?? feedProfile, sourceArtifactDigest: evidence?.artifactDigest ?? null, sourceProductId: record.productId, sourceSku: record.sku, sourceMpn: record.manufacturerPartNumber, sourceUpc: record.upc, sourceModification: record.modification, retailPrice: price.retailPrice, sourceSalePrice: price.salePrice, rawRetailPrice: price.rawRetailPrice, rawSalePrice: price.rawSalePrice, selectedPriceField: price.selectedPriceField, priceWindow: price.window, priceEvaluatedAt: context.asOf, conditionEvidence: condition, sourceShippingUsd: money(record.shipping), merchantUrl: match.merchantUrl, marketplace, digest: hash(record) } });
        }
    });
}
