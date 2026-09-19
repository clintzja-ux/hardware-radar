import { canonicalizeRetailerDestinationUrl } from "../destinations/RetailerDestination.js";

export const MANUAL_CURRENT_PRICE_WORKBOOK_SCHEMA_VERSION = "1.1";
export const MANUAL_CURRENT_PRICE_WORKBOOK_RETAILERS = Object.freeze(["NEWEGG", "AMAZON"]);
export const MANUAL_CURRENT_PRICE_WORKBOOK_RAKUTEN_LINK_STATUSES = Object.freeze(["READY", "MISSING", "REVIEW_REQUIRED"]);
const freeze = value => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; };
const nonBlank = value => typeof value === "string" && value.trim().length > 0;

export function createManualCurrentPriceWorkbookRows({ products, destinations, legacyResearch = [], rakutenRouting = [] } = {}) {
  if (![products, destinations, legacyResearch, rakutenRouting].every(Array.isArray)) throw new TypeError("MANUAL_CURRENT_PRICE_WORKBOOK_INPUT_INVALID");
  const legacy = new Map(legacyResearch.map(row => [row.atlasProductId, row]));
  const routing = new Map(rakutenRouting.map(row => [row.atlasProductId, row]));
  const routeOwners = new Map();
  for (const row of rakutenRouting) if (nonBlank(row?.affiliateUrl)) {
    const url=row.affiliateUrl.trim();
    if (!routeOwners.has(url)) routeOwners.set(url,new Set());
    routeOwners.get(url).add(row.atlasProductId);
  }
  const byProductRetailer = new Map(destinations.filter(row => row.status === "ACTIVE").map(row => [`${row.atlasProductId}|${row.retailerId}`, row]));
  return freeze([...products].sort((a,b)=>a.identity.atlasProductId.localeCompare(b.identity.atlasProductId)).map(product => {
    const id=product.identity.atlasProductId, old=legacy.get(id) ?? {}, amazon=byProductRetailer.get(`${id}|RETAILER-0001`) ?? null, newegg=byProductRetailer.get(`${id}|RETAILER-0004`) ?? null;
    const equivalent=(left,right)=>{try{return canonicalizeRetailerDestinationUrl(left)===canonicalizeRetailerDestinationUrl(right);}catch{return left===right;}};
    const reference=(destination,oldUrl)=>({destinationId:destination?.destinationId ?? null,url:destination?.destinationUrl ?? oldUrl ?? null,listingId:destination?.retailerListingId ?? null,status:destination ? (oldUrl && !equivalent(oldUrl,destination.destinationUrl) ? "DESTINATION_REVIEW_REQUIRED" : "CANONICAL_REVIEWED_DESTINATION") : oldUrl ? "LEGACY_REFERENCE_ONLY" : "NO_DESTINATION",legacyUrl:oldUrl ?? null});
    const route=routing.get(id) ?? null, affiliateUrl=nonBlank(route?.affiliateUrl) ? route.affiliateUrl.trim() : null;
    const bindingMatches=affiliateUrl && affiliateUrl.startsWith("https://") && newegg && nonBlank(route?.checkedAt) && routeOwners.get(affiliateUrl)?.size === 1 && (!route.destinationId || route.destinationId === newegg.destinationId) && (!route.retailerListingId || route.retailerListingId === newegg.retailerListingId);
    const routingStatus=!affiliateUrl ? "MISSING" : bindingMatches ? "READY" : "REVIEW_REQUIRED";
    return {schemaVersion:MANUAL_CURRENT_PRICE_WORKBOOK_SCHEMA_VERSION,atlasProductId:id,brand:product.identity.brand,productName:product.identity.displayName,manufacturerPartNumber:product.identity.manufacturerPartNumber,ddrGeneration:product.extension?.data?.classification?.memoryType ?? null,formFactor:product.extension?.data?.classification?.formFactor ?? null,totalCapacityGb:product.extension?.data?.capacity?.capacityGb ?? null,moduleCount:product.extension?.data?.capacity?.moduleCount ?? null,capacityPerModuleGb:product.extension?.data?.capacity?.capacityPerModuleGb ?? null,neweggReference:reference(newegg,old.neweggUrlManual ?? old.neweggUrlCurrent),amazonReference:reference(amazon,old.amazonUrlManual ?? old.amazonUrlCurrent),neweggObservation:{itemPriceUsd:null,currency:"USD",availability:"UNKNOWN",observedDate:null,observedTime:null,timezone:"America/Jamaica",observedAt:null,shipping:"UNKNOWN",condition:"UNKNOWN",seller:"UNKNOWN",evidenceNotes:null,reviewedBy:null,readyForImport:"NO"},amazonObservation:{itemPriceUsd:null,currency:"USD",availability:"UNKNOWN",observedDate:null,observedTime:null,timezone:"America/Jamaica",observedAt:null,shipping:"UNKNOWN",condition:"UNKNOWN",seller:"UNKNOWN",evidenceNotes:null,reviewedBy:null,readyForImport:"NO"},rakutenRouting:{affiliateUrl,status:routingStatus,checkedDate:route?.checkedDate ?? null,checkedTime:route?.checkedTime ?? null,timezone:route?.timezone ?? "America/Jamaica",checkedAt:route?.checkedAt ?? null,notes:route?.notes ?? null}};
  }));
}

export function selectManualCurrentPriceWorkbookObservation({ row, retailer } = {}) {
  if (!MANUAL_CURRENT_PRICE_WORKBOOK_RETAILERS.includes(retailer)) throw new Error("MANUAL_CURRENT_PRICE_WORKBOOK_RETAILER_INVALID");
  const key=retailer === "NEWEGG" ? "newegg" : "amazon", reference=row?.[`${key}Reference`], observation=row?.[`${key}Observation`];
  if (!reference?.destinationId || !nonBlank(reference.url) || reference.status === "DESTINATION_REVIEW_REQUIRED") throw new Error("MANUAL_CURRENT_PRICE_WORKBOOK_DESTINATION_NOT_READY");
  if (observation?.readyForImport !== "YES") throw new Error("MANUAL_CURRENT_PRICE_WORKBOOK_NOT_READY");
  return freeze({productionPrepareEligible:true,reason:null,retailer,preparationInput:{retailer,atlasProductId:row.atlasProductId,destinationId:reference.destinationId,itemPriceUsd:observation.itemPriceUsd,currency:observation.currency,availability:observation.availability,observedAt:observation.observedAt,observedBy:observation.reviewedBy,evidenceReference:`manual-workbook:${row.atlasProductId}:${key}:${observation.observedAt}`,evidenceNotes:observation.evidenceNotes}});
}
