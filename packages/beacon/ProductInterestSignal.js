export const PRODUCT_INTEREST_SIGNAL_TYPES=Object.freeze(["PRODUCT_PAGE_VIEW","PRODUCT_SEARCH_MATCH","PRODUCT_SEARCH_CLICK","OUTBOUND_RETAILER_CLICK","CATEGORY_PRODUCT_IMPRESSION"]);
export const PRODUCT_INTEREST_EVIDENCE_KINDS=Object.freeze(["RAW","AGGREGATED"]);
const prohibitedKeys=new Set(["name","username","user_name","email","emailaddress","ip","ipaddress","userid","user_id","persistentidentifier","persistent_identifier","advertisingid","advertising_id","fingerprint"]);
const freeze=value=>{if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;};
const nonBlank=value=>typeof value==="string"&&value.trim()!=="";
const timestamp=value=>nonBlank(value)&&Number.isFinite(Date.parse(value));
const privateData=value=>{if(!value||typeof value!=="object")return false;return Object.entries(value).some(([key,child])=>prohibitedKeys.has(key.toLowerCase())||privateData(child));};

export function createProductInterestSignal({schemaVersion="1.0",signalId,atlasProductId,signalType,source,observedAt,windowStart,windowEnd,value,unit,evidenceKind="RAW",provenance,metadata=null}={}){
 if(schemaVersion!=="1.0"||!nonBlank(signalId)||!nonBlank(atlasProductId)||!PRODUCT_INTEREST_SIGNAL_TYPES.includes(signalType)||!nonBlank(source)||!timestamp(observedAt)||!timestamp(windowStart)||!timestamp(windowEnd)||Date.parse(windowStart)>Date.parse(windowEnd)||typeof value!=="number"||!Number.isFinite(value)||value<0||!nonBlank(unit)||!PRODUCT_INTEREST_EVIDENCE_KINDS.includes(evidenceKind)||!provenance||typeof provenance!=="object"||Array.isArray(provenance)||privateData(provenance)||privateData(metadata))throw new TypeError("PRODUCT_INTEREST_SIGNAL_INVALID");
 return freeze({schemaVersion:"1.0",signalId:signalId.trim(),atlasProductId:atlasProductId.trim(),signalType,source:source.trim(),observedAt,windowStart,windowEnd,value,unit:unit.trim(),evidenceKind,provenance:structuredClone(provenance),metadata:metadata==null?null:structuredClone(metadata)});
}
export default createProductInterestSignal;
