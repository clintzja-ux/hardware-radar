import crypto from "node:crypto";

export const HISTORICAL_FACT_ADMISSION_POLICY_VERSION = "DF004-E2H-2.0-FACT";
const freeze=value=>{if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;};
const stable=value=>Array.isArray(value)?`[${value.map(stable).join(",")}]`:value&&typeof value==="object"?`{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`:JSON.stringify(value);
const hash=value=>crypto.createHash("sha256").update(stable(value)).digest("hex");
const nonBlank=value=>typeof value==="string"&&value.trim()!=="";
const validTime=value=>nonBlank(value)&&Number.isFinite(Date.parse(value));

export function assessHistoricalFactEligibility({record,productProjection,criticalContradiction=false}={}){
  const evidence=record?.candidate?.marketEvidence,reasons=[];
  if(!record||typeof record!=="object"||!evidence||typeof evidence!=="object")reasons.push("HISTORICAL_FACT_EVIDENCE_INVALID");
  if(criticalContradiction)reasons.push("HISTORICAL_FACT_CRITICAL_PRODUCT_CONTRADICTION");
  if(!["VERIFIED","CONFIRMED"].includes(productProjection?.state)||!nonBlank(productProjection?.atlasProductId))reasons.push("HISTORICAL_FACT_PRODUCT_NOT_VERIFIED");
  if(!validTime(evidence?.provenance?.observedAt))reasons.push("HISTORICAL_FACT_OBSERVATION_TIME_INVALID");
  if(!nonBlank(evidence?.provenance?.sourceTaskId)||!nonBlank(evidence?.provenance?.rawPayloadReference))reasons.push("HISTORICAL_FACT_PROVENANCE_INCOMPLETE");
  if(!(typeof evidence?.pricing?.basePrice==="number"&&Number.isFinite(evidence.pricing.basePrice)&&evidence.pricing.basePrice>0))reasons.push("HISTORICAL_FACT_ITEM_PRICE_INVALID");
  if(!/^[A-Z]{3}$/.test(evidence?.pricing?.currency??""))reasons.push("HISTORICAL_FACT_CURRENCY_INVALID");
  const material={policyVersion:HISTORICAL_FACT_ADMISSION_POLICY_VERSION,evidenceId:record?.evidenceId??null,atlasProductId:productProjection?.atlasProductId??null,reasons};
  return freeze({schemaVersion:"1.0",assessmentType:"FACT_LEVEL_HISTORICAL_ELIGIBILITY",assessmentId:`mer_histfact_${hash(material).slice(0,24)}`,policyVersion:HISTORICAL_FACT_ADMISSION_POLICY_VERSION,factLevelHistoricalEligible:reasons.length===0,reasons,canonicalEligible:false,currentPriceEligible:false,cheapestEligible:false,pickEligible:false,publicationEligible:false});
}
export default assessHistoricalFactEligibility;
