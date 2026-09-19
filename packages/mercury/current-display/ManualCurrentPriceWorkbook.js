export const MANUAL_CURRENT_PRICE_WORKBOOK_SCHEMA_VERSION = "1.0";
export const MANUAL_CURRENT_PRICE_WORKBOOK_RETAILERS = Object.freeze(["NEWEGG", "AMAZON"]);
const freeze = value => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; };
const nonBlank = value => typeof value === "string" && value.trim().length > 0;

export function createManualCurrentPriceWorkbookRows({ products, destinations, legacyResearch = [] } = {}) {
  if (!Array.isArray(products) || !Array.isArray(destinations) || !Array.isArray(legacyResearch)) throw new TypeError("MANUAL_CURRENT_PRICE_WORKBOOK_INPUT_INVALID");
  const legacy = new Map(legacyResearch.map(row => [row.atlasProductId, row]));
  const byProductRetailer = new Map(destinations.filter(row => row.status === "ACTIVE").map(row => [`${row.atlasProductId}|${row.retailerId}`, row]));
  return freeze([...products].sort((a,b)=>a.identity.atlasProductId.localeCompare(b.identity.atlasProductId)).map(product => {
    const id=product.identity.atlasProductId, old=legacy.get(id) ?? {}, amazon=byProductRetailer.get(`${id}|RETAILER-0001`) ?? null, newegg=byProductRetailer.get(`${id}|RETAILER-0004`) ?? null;
    const equivalent=(left,right)=>{try{return canonicalizeRetailerDestinationUrl(left)===canonicalizeRetailerDestinationUrl(right);}catch{return left===right;}};
    const reference=(destination,oldUrl)=>({destinationId:destination?.destinationId ?? null,url:destination?.destinationUrl ?? oldUrl ?? null,listingId:destination?.retailerListingId ?? null,status:destination ? (oldUrl && !equivalent(oldUrl,destination.destinationUrl) ? "DESTINATION_REVIEW_REQUIRED" : "CANONICAL_REVIEWED_DESTINATION") : oldUrl ? "LEGACY_REFERENCE_ONLY" : "NO_DESTINATION",legacyUrl:oldUrl ?? null});
    return {schemaVersion:MANUAL_CURRENT_PRICE_WORKBOOK_SCHEMA_VERSION,atlasProductId:id,brand:product.identity.brand,productName:product.identity.displayName,manufacturerPartNumber:product.identity.manufacturerPartNumber,ddrGeneration:product.extension?.data?.classification?.memoryType ?? null,formFactor:product.extension?.data?.classification?.formFactor ?? null,totalCapacityGb:product.extension?.data?.capacity?.capacityGb ?? null,moduleCount:product.extension?.data?.capacity?.moduleCount ?? null,capacityPerModuleGb:product.extension?.data?.capacity?.capacityPerModuleGb ?? null,neweggReference:reference(newegg,old.neweggUrlManual ?? old.neweggUrlCurrent),amazonReference:reference(amazon,old.amazonUrlManual ?? old.amazonUrlCurrent),neweggObservation:{itemPriceUsd:null,currency:"USD",availability:"UNKNOWN",observedDate:null,observedTime:null,timezone:"America/Bogota",observedAt:null,shipping:"UNKNOWN",condition:"UNKNOWN",seller:"UNKNOWN",evidenceNotes:null,reviewedBy:null,readyForImport:"NO"},amazonObservation:{itemPriceUsd:null,currency:"USD",availability:"UNKNOWN",observedDate:null,observedTime:null,timezone:"America/Bogota",observedAt:null,shipping:"UNKNOWN",condition:"UNKNOWN",seller:"UNKNOWN",evidenceNotes:null,reviewedBy:null,readyForImport:"NO"}};
  }));
}

export function selectManualCurrentPriceWorkbookObservation({ row, retailer } = {}) {
  if (!MANUAL_CURRENT_PRICE_WORKBOOK_RETAILERS.includes(retailer)) throw new Error("MANUAL_CURRENT_PRICE_WORKBOOK_RETAILER_INVALID");
  const key=retailer === "NEWEGG" ? "newegg" : "amazon", reference=row?.[`${key}Reference`], observation=row?.[`${key}Observation`];
  if (!reference?.destinationId || !nonBlank(reference.url) || reference.status === "DESTINATION_REVIEW_REQUIRED") throw new Error("MANUAL_CURRENT_PRICE_WORKBOOK_DESTINATION_NOT_READY");
  if (observation?.readyForImport !== "YES") throw new Error("MANUAL_CURRENT_PRICE_WORKBOOK_NOT_READY");
  return freeze({productionPrepareEligible:true,reason:null,retailer,preparationInput:{retailer,atlasProductId:row.atlasProductId,destinationId:reference.destinationId,itemPriceUsd:observation.itemPriceUsd,currency:observation.currency,availability:observation.availability,observedAt:observation.observedAt,observedBy:observation.reviewedBy,evidenceReference:`manual-workbook:${row.atlasProductId}:${key}:${observation.observedAt}`,evidenceNotes:observation.evidenceNotes}});
}
import { canonicalizeRetailerDestinationUrl } from "../destinations/RetailerDestination.js";
