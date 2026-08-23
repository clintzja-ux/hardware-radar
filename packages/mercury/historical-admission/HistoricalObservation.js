import crypto from "node:crypto";

function nonBlank(value){return typeof value==="string"&&value.trim()!=="";}
function iso(value){return nonBlank(value)&&Number.isFinite(Date.parse(value));}
function price(value){return typeof value==="number"&&Number.isFinite(value)&&value>0;}
function optionalMoney(value){return value===null||(typeof value==="number"&&Number.isFinite(value)&&value>=0);}
function freeze(value){if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;}

export function validateHistoricalObservation(record){
  const errors=[];
  if(!record||typeof record!=="object"||Array.isArray(record))return freeze({valid:false,errors:["Historical observation must be an object."]});
  if(record.schemaVersion!=="1.0"||record.observationClass!=="HISTORICAL")errors.push("Historical observation schema is invalid.");
  if(!/^mer_hist_[a-f0-9]{16}$/.test(record.observationId??""))errors.push("observationId is invalid.");
  if(!nonBlank(record.atlasProductId)||!/^RETAILER-[0-9]{4}$/.test(record.retailerId??""))errors.push("Atlas product and retailer bindings are required.");
  if(!iso(record.observationTime)||!iso(record.admittedAt))errors.push("Observation and admission timestamps must be valid.");
  const market=record.market;
  if(!market||!price(market.basePrice)||!price(market.totalPrice)||!optionalMoney(market.shipping)||!optionalMoney(market.tax))errors.push("Historical market prices are invalid.");
  if(!/^[A-Z]{3}$/.test(market?.currency??""))errors.push("Historical currency is invalid.");
  if(market?.condition!==null&&typeof market?.condition!=="string")errors.push("condition must remain null or a source string.");
  if(!nonBlank(market?.sourceUrl)||!nonBlank(market?.sellerName))errors.push("Historical seller identity is incomplete.");
  const provenance=record.provenance;
  if(!nonBlank(provenance?.retainedEvidenceId)||!nonBlank(provenance?.provider)||!nonBlank(provenance?.source)||!nonBlank(provenance?.rawPayloadReference))errors.push("Historical retained-evidence provenance is incomplete.");
  for(const key of ["productsTaskId","productInfoTaskId","sellersTaskId"])if(!nonBlank(provenance?.acquisition?.[key]))errors.push(`Historical ${key} is required.`);
  if(record.governance?.promotionState!=="HISTORICAL_ELIGIBLE"||record.governance?.historicalEligible!==true||record.governance?.canonicalEligible!==false||record.governance?.publicationEligible!==false)errors.push("Historical governance boundary is invalid.");
  if(!nonBlank(record.metadata?.admittedBy)||!nonBlank(record.metadata?.idempotencyKey)||!nonBlank(record.metadata?.recordHash))errors.push("Historical audit metadata is incomplete.");
  return freeze({valid:errors.length===0,errors});
}

export function createHistoricalObservation(input={}){
  const record={schemaVersion:"1.0",observationClass:"HISTORICAL",observationId:input.observationId,atlasProductId:input.atlasProductId,retailerId:input.retailerId,marketplace:input.marketplace,observationTime:input.observationTime,admittedAt:input.admittedAt,market:structuredClone(input.market),provenance:structuredClone(input.provenance),governance:{promotionState:"HISTORICAL_ELIGIBLE",historicalEligible:true,canonicalEligible:false,publicationEligible:false},metadata:{admittedBy:input.admittedBy,idempotencyKey:input.idempotencyKey,recordHash:null}};
  record.metadata.recordHash=crypto.createHash("sha256").update(JSON.stringify(record)).digest("hex");
  const report=validateHistoricalObservation(record);if(!report.valid)throw new TypeError(`HISTORICAL_OBSERVATION_INVALID:${report.errors.join(" ")}`);
  return freeze(record);
}

export function createHistoricalObservationId(retainedEvidenceId){
  if(!nonBlank(retainedEvidenceId))throw new TypeError("retainedEvidenceId is required.");
  return `mer_hist_${crypto.createHash("sha256").update(retainedEvidenceId.trim()).digest("hex").slice(0,16)}`;
}
