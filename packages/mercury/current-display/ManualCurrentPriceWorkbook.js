import { canonicalizeRetailerDestinationUrl } from "../destinations/RetailerDestination.js";

export const MANUAL_CURRENT_PRICE_WORKBOOK_SCHEMA_VERSION = "1.1";
export const MANUAL_CURRENT_PRICE_WORKBOOK_RETAILERS = Object.freeze(["NEWEGG", "AMAZON"]);
export const MANUAL_CURRENT_PRICE_WORKBOOK_RAKUTEN_LINK_STATUSES = Object.freeze(["READY", "MISSING", "REVIEW_REQUIRED"]);
const freeze = value => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; };
const nonBlank = value => typeof value === "string" && value.trim().length > 0;
const CONDITIONS = new Set(["UNKNOWN", "NEW", "USED", "REFURBISHED", "OPEN_BOX"]);

export function normalizeManualWorkbookCondition(value) {
  const raw = typeof value === "string" ? value.trim().toUpperCase() : value;
  if (!CONDITIONS.has(raw)) throw new Error("WORKBOOK_CONDITION_INVALID");
  return raw === "UNKNOWN" ? null : raw;
}

export function normalizeManualWorkbookShipping(value) {
  if (typeof value === "string") {
    const raw=value.trim().toUpperCase();
    if (raw === "UNKNOWN" || raw === "") return null;
    if (raw === "FREE") return 0;
    if (raw !== "" && Number.isFinite(Number(raw)) && Number(raw) >= 0) return Number(raw);
    throw new Error("WORKBOOK_SHIPPING_INVALID");
  }
  if (value == null) return null;
  if (!Number.isFinite(value) || value < 0) throw new Error("WORKBOOK_SHIPPING_INVALID");
  return value;
}

export function normalizeManualWorkbookSeller(value) {
  if (value == null) return null;
  if (typeof value !== "string") throw new Error("WORKBOOK_SELLER_INVALID");
  const raw=value.trim();
  return !raw || raw.toUpperCase() === "UNKNOWN" ? null : raw;
}

const pad = value => String(value).padStart(2, "0");
const dateParts = value => {
  if (value instanceof Date && Number.isFinite(value.getTime())) return { year:value.getUTCFullYear(), month:value.getUTCMonth()+1, day:value.getUTCDate() };
  if (Number.isFinite(value)) {
    const date = new Date(Date.UTC(1899, 11, 30) + Math.trunc(value) * 86400000);
    return { year:date.getUTCFullYear(), month:date.getUTCMonth()+1, day:date.getUTCDate() };
  }
  const text = String(value ?? "").trim();
  let match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text);
  if (match) return { year:Number(match[1]), month:Number(match[2]), day:Number(match[3]) };
  match = /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/.exec(text);
  if (match) return { year:Number(match[3]), month:Number(match[2]), day:Number(match[1]) };
  throw new Error("WORKBOOK_OBSERVATION_DATE_INVALID");
};
const timeParts = value => {
  if (value instanceof Date && Number.isFinite(value.getTime())) return { hour:value.getUTCHours(), minute:value.getUTCMinutes(), second:value.getUTCSeconds() };
  if (Number.isFinite(value) && value >= 0 && value < 1) {
    const total = Math.round(value * 86400) % 86400;
    return { hour:Math.floor(total / 3600), minute:Math.floor(total % 3600 / 60), second:total % 60 };
  }
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?$/i.exec(String(value ?? "").trim());
  if (!match) throw new Error("WORKBOOK_OBSERVATION_TIME_INVALID");
  let hour=Number(match[1]); const minute=Number(match[2]), second=Number(match[3] ?? 0), meridiem=match[4]?.toLowerCase();
  if (minute > 59 || second > 59 || (meridiem ? hour < 1 || hour > 12 : hour > 23)) throw new Error("WORKBOOK_OBSERVATION_TIME_INVALID");
  if (meridiem) hour=(hour % 12) + (meridiem === "pm" ? 12 : 0);
  return { hour, minute, second };
};
const zonedParts = (instant, timeZone) => Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone, year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit", second:"2-digit", hourCycle:"h23" }).formatToParts(instant).filter(part=>part.type!=="literal").map(part=>[part.type,Number(part.value)]));
export function composeManualWorkbookInstant({ date, time, timeZone } = {}) {
  if (!nonBlank(timeZone)) throw new Error("WORKBOOK_OBSERVATION_TIMEZONE_REQUIRED");
  const local={...dateParts(date),...timeParts(time)};
  const guess=Date.UTC(local.year,local.month-1,local.day,local.hour,local.minute,local.second); let instantMs=guess, offset=0;
  try {
    for (let iteration=0;iteration<2;iteration++) {
      const parts=zonedParts(new Date(instantMs),timeZone.trim());
      offset=Date.UTC(parts.year,parts.month-1,parts.day,parts.hour,parts.minute,parts.second)-instantMs;
      instantMs=guess-offset;
    }
  } catch { throw new Error("WORKBOOK_OBSERVATION_TIMEZONE_INVALID"); }
  const instant=new Date(instantMs), verified=zonedParts(instant,timeZone.trim());
  if (["year","month","day","hour","minute","second"].some(key=>verified[key]!==local[key])) throw new Error("WORKBOOK_OBSERVATION_TIME_INVALID");
  const offsetMinutes=offset/60000, sign=offsetMinutes>=0?"+":"-", absolute=Math.abs(offsetMinutes);
  return `${local.year}-${pad(local.month)}-${pad(local.day)}T${pad(local.hour)}:${pad(local.minute)}:${pad(local.second)}${sign}${pad(Math.floor(absolute/60))}:${pad(absolute%60)}`;
}

export function normalizeManualCurrentPriceWorkbookRow(row = {}) {
  const clone=structuredClone(row);
  for (const key of ["newegg","amazon"]) {
    const observation=clone[`${key}Observation`];
    if (observation?.observedDate != null || observation?.observedTime != null) observation.observedAt=composeManualWorkbookInstant({date:observation.observedDate,time:observation.observedTime,timeZone:observation.timezone});
    else if (observation?.observedAt != null && !Number.isFinite(Date.parse(observation.observedAt))) throw new Error("WORKBOOK_OBSERVATION_TIME_INVALID");
  }
  if (clone.rakutenRouting?.checkedDate != null || clone.rakutenRouting?.checkedTime != null) clone.rakutenRouting.checkedAt=composeManualWorkbookInstant({date:clone.rakutenRouting.checkedDate,time:clone.rakutenRouting.checkedTime,timeZone:clone.rakutenRouting.timezone});
  else if (clone.rakutenRouting?.checkedAt != null && !Number.isFinite(Date.parse(clone.rakutenRouting.checkedAt))) throw new Error("WORKBOOK_OBSERVATION_TIME_INVALID");
  if (clone.rakutenRouting) clone.rakutenRouting.reviewedBy=nonBlank(clone.rakutenRouting.reviewedBy) ? clone.rakutenRouting.reviewedBy.trim() : nonBlank(clone.recordReviewedBy) ? clone.recordReviewedBy.trim() : null;
  return freeze(clone);
}

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
    return {schemaVersion:MANUAL_CURRENT_PRICE_WORKBOOK_SCHEMA_VERSION,atlasProductId:id,brand:product.identity.brand,productName:product.identity.displayName,manufacturerPartNumber:product.identity.manufacturerPartNumber,ddrGeneration:product.extension?.data?.classification?.memoryType ?? null,formFactor:product.extension?.data?.classification?.formFactor ?? null,totalCapacityGb:product.extension?.data?.capacity?.capacityGb ?? null,moduleCount:product.extension?.data?.capacity?.moduleCount ?? null,capacityPerModuleGb:product.extension?.data?.capacity?.capacityPerModuleGb ?? null,recordReviewedBy:null,neweggReference:reference(newegg,old.neweggUrlManual ?? old.neweggUrlCurrent),amazonReference:reference(amazon,old.amazonUrlManual ?? old.amazonUrlCurrent),neweggObservation:{itemPriceUsd:null,currency:"USD",availability:"UNKNOWN",observedDate:null,observedTime:null,timezone:"America/Jamaica",observedAt:null,shipping:"UNKNOWN",condition:"UNKNOWN",seller:"UNKNOWN",evidenceNotes:null,reviewedBy:null,readyForImport:"NO"},amazonObservation:{itemPriceUsd:null,currency:"USD",availability:"UNKNOWN",observedDate:null,observedTime:null,timezone:"America/Jamaica",observedAt:null,shipping:"UNKNOWN",condition:"UNKNOWN",seller:"UNKNOWN",evidenceNotes:null,reviewedBy:null,readyForImport:"NO"},rakutenRouting:{affiliateUrl,status:routingStatus,checkedDate:route?.checkedDate ?? null,checkedTime:route?.checkedTime ?? null,timezone:route?.timezone ?? "America/Jamaica",checkedAt:route?.checkedAt ?? null,notes:route?.notes ?? null,reviewedBy:null}};
  }));
}

export function selectManualCurrentPriceWorkbookObservation({ row, retailer } = {}) {
  if (!MANUAL_CURRENT_PRICE_WORKBOOK_RETAILERS.includes(retailer)) throw new Error("MANUAL_CURRENT_PRICE_WORKBOOK_RETAILER_INVALID");
  const normalized=normalizeManualCurrentPriceWorkbookRow(row), key=retailer === "NEWEGG" ? "newegg" : "amazon", reference=normalized?.[`${key}Reference`], observation=normalized?.[`${key}Observation`];
  if (!reference?.destinationId || !nonBlank(reference.url) || reference.status === "DESTINATION_REVIEW_REQUIRED") throw new Error("MANUAL_CURRENT_PRICE_WORKBOOK_DESTINATION_NOT_READY");
  if (observation?.readyForImport !== "YES") throw new Error("MANUAL_CURRENT_PRICE_WORKBOOK_NOT_READY");
  const observedBy=nonBlank(observation.reviewedBy) ? observation.reviewedBy.trim() : nonBlank(normalized.recordReviewedBy) ? normalized.recordReviewedBy.trim() : null;
  if (!observedBy) throw new Error("OPERATOR_PROVENANCE_REQUIRED");
  const condition=normalizeManualWorkbookCondition(observation.condition), shippingUsd=normalizeManualWorkbookShipping(observation.shipping), seller=normalizeManualWorkbookSeller(observation.seller);
  return freeze({productionPrepareEligible:true,reason:null,retailer,preparationInput:{
    retailer,atlasProductId:normalized.atlasProductId,destinationId:reference.destinationId,itemPriceUsd:observation.itemPriceUsd,currency:observation.currency,availability:observation.availability,
    condition,shippingUsd,seller,researchUrl:reference.url,observedAt:observation.observedAt,observedBy,
    evidenceReference:`manual-workbook:${normalized.atlasProductId}:${key}:${observation.observedAt}`,evidenceNotes:observation.evidenceNotes,
    operatorEvidence:{acquisitionMode:"MANUAL",rawCondition:observation.condition,normalizedCondition:condition,rawShipping:observation.shipping,normalizedShippingUsd:shippingUsd,rawSeller:observation.seller,normalizedSeller:seller,researchUrl:reference.url,observedDate:observation.observedDate,observedTime:observation.observedTime,timezone:observation.timezone,enteredObservedAt:observation.observedAt,rawReadyForImport:observation.readyForImport,submittedForProcessing:true}
  }});
}
