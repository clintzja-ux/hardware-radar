import { normalizeManualCurrentPriceWorkbookRow } from "./ManualCurrentPriceWorkbook.js";

export const NEWEGG_AFFILIATE_PUBLIC_ACTION_POLICY_VERSION = "NEWEGG-AFFILIATE-DESTINATION-PRECEDENCE-P1-1.0";
const NEWEGG_RETAILER_ID = "RETAILER-0004";
const NEWEGG_ADVERTISER_MID = "44583";
const RAKUTEN_CLICK_HOST = "click.linksynergy.com";
const freeze = value => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; };
const nonBlank = value => typeof value === "string" && value.trim().length > 0;
const listingFromNeweggUrl = value => {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !["newegg.com", "www.newegg.com"].includes(url.hostname.toLowerCase())) return null;
    const match = /\/p\/([^/?#]+)/i.exec(url.pathname);
    return match?.[1]?.toUpperCase() ?? null;
  } catch { return null; }
};

export function assessNeweggAffiliatePublicAction({ row, destination, duplicateAffiliateUrl = false } = {}) {
  const reasons = [];
  let normalized;
  try { normalized = normalizeManualCurrentPriceWorkbookRow(row); } catch { reasons.push("AFFILIATE_EVIDENCE_INVALID"); }
  const reference = normalized?.neweggReference, routing = normalized?.rakutenRouting;
  if (destination?.retailerId !== NEWEGG_RETAILER_ID || destination?.marketplace !== "newegg.com") reasons.push("NEWEGG_DESTINATION_REQUIRED");
  if (normalized?.atlasProductId !== destination?.atlasProductId) reasons.push("AFFILIATE_PRODUCT_BINDING_INVALID");
  if (reference?.destinationId !== destination?.destinationId || reference?.listingId !== destination?.retailerListingId) reasons.push("AFFILIATE_DESTINATION_BINDING_INVALID");
  if (routing?.status !== "READY" || !nonBlank(routing?.checkedAt) || !Number.isFinite(Date.parse(routing?.checkedAt)) || !nonBlank(routing?.reviewedBy)) reasons.push("AFFILIATE_OPERATOR_REVIEW_REQUIRED");
  if (duplicateAffiliateUrl) reasons.push("AFFILIATE_PRODUCT_BINDING_AMBIGUOUS");
  const affiliateUrl = routing?.affiliateUrl;
  let parsed;
  if (!nonBlank(affiliateUrl) || affiliateUrl !== affiliateUrl.trim()) reasons.push("AFFILIATE_URL_INVALID");
  else try { parsed = new URL(affiliateUrl); } catch { reasons.push("AFFILIATE_URL_INVALID"); }
  if (parsed && (parsed.protocol !== "https:" || parsed.hostname.toLowerCase() !== RAKUTEN_CLICK_HOST || parsed.username || parsed.password || parsed.searchParams.get("mid") !== NEWEGG_ADVERTISER_MID)) reasons.push("AFFILIATE_URL_INVALID");
  const merchantListing = listingFromNeweggUrl(parsed?.searchParams.get("murl") ?? null);
  if (parsed && (!merchantListing || merchantListing !== String(destination?.retailerListingId ?? "").toUpperCase())) reasons.push("AFFILIATE_RETAILER_LISTING_INVALID");
  return freeze({ eligible: reasons.length === 0, reasons: [...new Set(reasons)], actionUrl: reasons.length === 0 ? affiliateUrl : null });
}

export function createPublicRetailerActionProjection({ destinations, governedDestinations = destinations, manualWorkbookRows = [] } = {}) {
  if (!Array.isArray(destinations) || !Array.isArray(governedDestinations) || !Array.isArray(manualWorkbookRows)) throw new TypeError("PUBLIC_RETAILER_ACTION_INPUT_INVALID");
  const rowsByProduct = new Map();
  const affiliateOwners = new Map();
  for (const row of manualWorkbookRows) {
    if (!nonBlank(row?.atlasProductId) || rowsByProduct.has(row.atlasProductId)) throw new Error("PUBLIC_RETAILER_ACTION_PRODUCT_EVIDENCE_AMBIGUOUS");
    rowsByProduct.set(row.atlasProductId, row);
    const value = row?.rakutenRouting?.affiliateUrl;
    if (nonBlank(value)) {
      if (!affiliateOwners.has(value)) affiliateOwners.set(value, new Set());
      affiliateOwners.get(value).add(row.atlasProductId);
    }
  }
  const governedById = new Map(governedDestinations.map(destination => [destination.destinationId, destination]));
  return freeze(destinations.map(destination => {
    if (destination.retailerId !== NEWEGG_RETAILER_ID) return structuredClone(destination);
    const row = rowsByProduct.get(destination.atlasProductId);
    if (!row?.rakutenRouting?.affiliateUrl) return structuredClone(destination);
    const governedDestination = governedById.get(destination.destinationId);
    if (!governedDestination || governedDestination.atlasProductId !== destination.atlasProductId || governedDestination.retailerId !== destination.retailerId || governedDestination.destinationUrl !== destination.destinationUrl) return structuredClone(destination);
    const assessment = assessNeweggAffiliatePublicAction({ row, destination: governedDestination, duplicateAffiliateUrl: affiliateOwners.get(row.rakutenRouting.affiliateUrl)?.size !== 1 });
    return { ...structuredClone(destination), destinationUrl: assessment.eligible ? assessment.actionUrl : destination.destinationUrl };
  }));
}
