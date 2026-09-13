import crypto from "node:crypto";

function nonBlank(value){return typeof value==="string"&&value.trim()!=="";}
function iso(value){return nonBlank(value)&&Number.isFinite(Date.parse(value));}
function price(value){return typeof value==="number"&&Number.isFinite(value)&&value>0;}
function optionalMoney(value){return value===null||(typeof value==="number"&&Number.isFinite(value)&&value>=0);}
function freeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;}

export function validateHistoricalObservation(record){
  const errors=[];
  if(!record||typeof record!=="object"||Array.isArray(record))return freeze({valid:false,errors:["Historical observation must be an object."]});
  if(!["1.0","1.1"].includes(record.schemaVersion)||record.observationClass!=="HISTORICAL")errors.push("Historical observation schema is invalid.");
  if(!/^mer_hist_[a-f0-9]{16}$/.test(record.observationId??""))errors.push("observationId is invalid.");
  if(!nonBlank(record.atlasProductId)||(record.retailerId!==null&&!/^RETAILER-[0-9]{4}$/.test(record.retailerId??"")))errors.push("Atlas product binding or optional retailer binding is invalid.");
  if(!iso(record.observationTime)||!iso(record.admittedAt))errors.push("Observation and admission timestamps must be valid.");
  const market=record.market;
  if(!market||!price(market.basePrice)||(market.totalPrice!==null&&!price(market.totalPrice))||!optionalMoney(market.shipping)||!optionalMoney(market.tax))errors.push("Historical market prices are invalid.");
  if(!/^[A-Z]{3}$/.test(market?.currency??""))errors.push("Historical currency is invalid.");
  if(market?.condition!==null&&typeof market?.condition!=="string")errors.push("condition must remain null or a source string.");
  if(market?.sourceUrl!==null&&!nonBlank(market?.sourceUrl))errors.push("Historical source URL is invalid.");
  if(market?.sellerName!==null&&!nonBlank(market?.sellerName))errors.push("Historical seller identity is invalid.");
  const provenance=record.provenance;
  if(!nonBlank(provenance?.retainedEvidenceId)||!nonBlank(provenance?.provider)||!nonBlank(provenance?.source)||!nonBlank(provenance?.rawPayloadReference))errors.push("Historical retained-evidence provenance is incomplete.");
  const acquisition=provenance?.acquisition;const acquisitionType=acquisition?.type??"INITIAL_ACQUISITION";
  if(acquisitionType==="INITIAL_ACQUISITION"){for(const key of ["productsTaskId","productInfoTaskId","sellersTaskId"])if(!nonBlank(acquisition?.[key]))errors.push(`Historical ${key} is required.`);}else if(acquisitionType==="AMAZON_INITIAL_ACQUISITION"){for(const key of ["productsTaskId","sellersTaskId","governedAsin","immutableSellersResultId","immutableSellersResultDigest","sourceRightsProfileDigest"])if(!nonBlank(acquisition?.[key]))errors.push(`Historical Amazon ${key} is required.`);}else if(acquisitionType==="HISTORICAL_REFRESH"){for(const key of ["sellersTaskId","refreshPlanId","authorizationId","identityReuseAssessmentId","sourceEvidenceId"])if(!nonBlank(acquisition?.[key]))errors.push(`Historical refresh ${key} is required.`);if(acquisition.productsTaskId!=null||acquisition.productInfoTaskId!=null)errors.push("Historical refresh must not invent PRODUCTS or PRODUCT_INFO tasks.");if(!acquisition.providerIdentity||!["productId","dataDocId","gid"].some(key=>nonBlank(acquisition.providerIdentity[key])))errors.push("Historical refresh provider identity is required.");}else errors.push("Historical acquisition type is invalid.");
  if(record.schemaVersion==="1.0"&&(record.governance?.promotionState!=="HISTORICAL_ELIGIBLE"||record.governance?.historicalEligible!==true))errors.push("Historical governance boundary is invalid.");
  if(record.schemaVersion==="1.1"&&(record.governance?.promotionState!=="FACT_LEVEL_HISTORICAL_ELIGIBLE"||record.governance?.factLevelHistoricalEligible!==true||!record.observedMerchant||typeof record.observedMerchant.resolutionState!=="string"||!record.comparability||typeof record.comparability.classification!=="string"||!Array.isArray(record.comparability.reasons)))errors.push("Historical fact governance metadata is invalid.");
  if(record.governance?.canonicalEligible!==false||record.governance?.publicationEligible!==false||record.governance?.currentPriceEligible===true||record.governance?.cheapestEligible===true||record.governance?.pickEligible===true)errors.push("Historical downstream authority boundary is invalid.");
  if(!nonBlank(record.metadata?.admittedBy)||!nonBlank(record.metadata?.idempotencyKey)||!nonBlank(record.metadata?.recordHash))errors.push("Historical audit metadata is incomplete.");
  return freeze({valid:errors.length===0,errors});
}

export function createHistoricalObservation(input={}){
  const factLevel=input.factLevel===true;
  const record={schemaVersion:factLevel?"1.1":"1.0",observationClass:"HISTORICAL",observationId:input.observationId,atlasProductId:input.atlasProductId,retailerId:input.retailerId,marketplace:input.marketplace,observationTime:input.observationTime,admittedAt:input.admittedAt,market:structuredClone(input.market),provenance:structuredClone(input.provenance),...(factLevel?{observedMerchant:structuredClone(input.observedMerchant),comparability:structuredClone(input.comparability)}:{}),governance:factLevel?{promotionState:"FACT_LEVEL_HISTORICAL_ELIGIBLE",factLevelHistoricalEligible:true,historicalEligible:true,canonicalEligible:false,currentPriceEligible:false,cheapestEligible:false,pickEligible:false,publicationEligible:false}:{promotionState:"HISTORICAL_ELIGIBLE",historicalEligible:true,canonicalEligible:false,publicationEligible:false},metadata:{admittedBy:input.admittedBy,idempotencyKey:input.idempotencyKey,recordHash:null}};
  record.metadata.recordHash=crypto.createHash("sha256").update(JSON.stringify(record)).digest("hex");
  const report=validateHistoricalObservation(record);if(!report.valid)throw new TypeError(`HISTORICAL_OBSERVATION_INVALID:${report.errors.join(" ")}`);
  return freeze(record);
}

export function createHistoricalObservationId(retainedEvidenceId){
  if(!nonBlank(retainedEvidenceId))throw new TypeError("retainedEvidenceId is required.");
  return `mer_hist_${crypto.createHash("sha256").update(retainedEvidenceId.trim()).digest("hex").slice(0,16)}`;
}
