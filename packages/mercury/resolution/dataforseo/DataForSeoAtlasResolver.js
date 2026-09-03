import { createDataForSeoProductEvidence } from "./DataForSeoProductEvidence.js";

export const DATAFORSEO_RESOLUTION_OUTCOMES = Object.freeze({ CONFIRMED:"CONFIRMED", PROBABLE:"PROBABLE", AMBIGUOUS:"AMBIGUOUS", REJECTED:"REJECTED" });
const O=DATAFORSEO_RESOLUTION_OUTCOMES;
function norm(v){return typeof v==="string"?v.toLowerCase().replace(/[^a-z0-9]/g,""):null;}
function textNorm(v){return typeof v==="string"?v.toLowerCase().replace(/[^a-z0-9]+/g," ").trim():"";}
function eq(a,b){return a!=null&&b!=null&&norm(String(a))===norm(String(b));}
function expected(product){ const d=product.extension?.data??{}; return {
  id:product.identity?.atlasProductId, mpn:product.identity?.manufacturerPartNumber, alternates:product.identity?.alternatePartNumbers??[], gtin:product.identity?.gtin, upc:product.identity?.upc,
  brand:product.identity?.brand, family:product.identity?.productFamily, capacityGb:d.capacity?.capacityGb, moduleCount:d.capacity?.moduleCount, capacityPerModuleGb:d.capacity?.capacityPerModuleGb,
  memoryType:d.classification?.memoryType, dataRateMtps:d.performance?.dataRateMtps, casLatency:d.performance?.casLatency, formFactor:d.classification?.formFactor
}; }
function pushEvidence(list, field, status, external, atlas){ list.push(Object.freeze({field,status,external:external??null,atlas:atlas??null})); }
function assess(e,p){ const x=expected(p), ev=[]; let deterministic=false, conflict=false, structuredMatches=0, structuredKnown=0;
  const knownIds=[x.mpn,...x.alternates].filter(Boolean);
  if(e.manufacturerPartNumbers.length){ deterministic=e.manufacturerPartNumbers.some(v=>knownIds.some(k=>eq(v,k))); pushEvidence(ev,"manufacturerPartNumber",deterministic?"MATCH":"CONFLICT",e.manufacturerPartNumbers,x.mpn); if(!deterministic) conflict=true; }
  for(const [field,external,atlas] of [["gtin",e.gtin,x.gtin],["upc",e.upc,x.upc]]) if(external&&atlas){ const m=eq(external,atlas); deterministic ||= m; conflict ||= !m; pushEvidence(ev,field,m?"MATCH":"CONFLICT",external,atlas); }
  const attrs=[["brand",e.brand,x.brand],["capacityGb",e.capacityGb,x.capacityGb],["moduleCount",e.moduleCount,x.moduleCount],["capacityPerModuleGb",e.capacityPerModuleGb,x.capacityPerModuleGb],["memoryType",e.memoryType,x.memoryType],["dataRateMtps",e.dataRateMtps,x.dataRateMtps],["casLatency",e.casLatency,x.casLatency],["formFactor",e.formFactor,x.formFactor]];
  for(const [field,external,atlas] of attrs){ if(external!=null&&atlas!=null){ structuredKnown++; const m=eq(external,atlas); if(m) structuredMatches++; else conflict=true; pushEvidence(ev,field,m?"MATCH":"CONFLICT",external,atlas); } }
  if(e.capacityGb!=null&&e.moduleCount!=null&&e.capacityPerModuleGb!=null&&e.capacityGb!==e.moduleCount*e.capacityPerModuleGb){ conflict=true; pushEvidence(ev,"capacityInvariant","CONFLICT",`${e.capacityGb} != ${e.moduleCount} x ${e.capacityPerModuleGb}`,`${x.capacityGb} = ${x.moduleCount} x ${x.capacityPerModuleGb}`); }
  const title=textNorm(e.title); const titleSupport=[x.brand,x.family,x.mpn].filter(Boolean).filter(v=>title.includes(textNorm(v))).length;
  return {product:p,evidence:ev,deterministic,conflict,structuredMatches,structuredKnown,titleSupport};
}
const contradictionCode=field=>({manufacturerPartNumber:"MPN_CONFLICT",gtin:"GTIN_CONFLICT",upc:"UPC_CONFLICT",brand:"BRAND_CONFLICT",capacityGb:"CAPACITY_CONFLICT",moduleCount:"MODULE_CONFIGURATION_CONFLICT",capacityPerModuleGb:"MODULE_CONFIGURATION_CONFLICT",memoryType:"MEMORY_GENERATION_CONFLICT",dataRateMtps:"SPEED_CONFLICT",casLatency:"CAS_LATENCY_CONFLICT",formFactor:"FORM_FACTOR_CONFLICT",capacityInvariant:"MODULE_CONFIGURATION_CONFLICT"}[field]??`${String(field).toUpperCase()}_CONFLICT`);
export function assessDataForSeoProductEvidenceAgainstAtlas(rawItem,atlasProduct){
  if(!atlasProduct?.identity?.atlasProductId)throw new TypeError("atlasProduct is required.");
  if(!rawItem||typeof rawItem!=="object")throw new TypeError("rawItem is required.");
  const external=createDataForSeoProductEvidence(rawItem),assessment=assess(external,atlasProduct),contradictions=[...new Set(assessment.evidence.filter(entry=>entry.status==="CONFLICT").map(entry=>contradictionCode(entry.field)))];
  const fields=["manufacturerPartNumber","brand","memoryType","capacityGb","moduleCount","capacityPerModuleGb","dataRateMtps","casLatency","formFactor"];
  const evidence=fields.map(field=>assessment.evidence.find(entry=>entry.field===field)??Object.freeze({field,status:"UNKNOWN",external:null,atlas:expected(atlasProduct)[field==="manufacturerPartNumber"?"mpn":field]??null}));
  return Object.freeze({schemaVersion:"1.0",atlasProductId:atlasProduct.identity.atlasProductId,status:contradictions.length?"CONTRADICTION":evidence.some(entry=>entry.status==="UNKNOWN")?"COMPATIBLE_WITH_UNKNOWNS":"MATCH",contradictions:Object.freeze(contradictions),evidence:Object.freeze(evidence),priceUsedForIdentity:false});
}
export class DataForSeoAtlasResolver {
  constructor({productRepository}={}){ if(!productRepository?.getAll) throw new TypeError("productRepository with getAll() is required."); this.productRepository=productRepository; }
  async resolve(rawItem){ const external=createDataForSeoProductEvidence(rawItem); const products=await this.productRepository.getAll({productType:"ram"}); const assessments=products.map(p=>assess(external,p));
    const confirmed=assessments.filter(a=>a.deterministic&&!a.conflict); if(confirmed.length===1) return result(O.CONFIRMED,external,confirmed[0]); if(confirmed.length>1) return result(O.AMBIGUOUS,external,null,confirmed);
    const viable=assessments.filter(a=>!a.conflict && a.structuredKnown>=4 && a.structuredMatches===a.structuredKnown); if(viable.length===1) return result(O.PROBABLE,external,viable[0]); if(viable.length>1) return result(O.AMBIGUOUS,external,null,viable);
    const conflicting=assessments.filter(a=>a.conflict); if(conflicting.length===assessments.length && assessments.length) return result(O.REJECTED,external,null,conflicting);
    return result(O.AMBIGUOUS,external,null,assessments.filter(a=>!a.conflict)); }
}
function result(outcome,external,match,candidates=[]){ return Object.freeze({ outcome, atlasProductId:match?.product?.identity?.atlasProductId??null, externalProductId:external.productId, evidence:Object.freeze(match?.evidence??[]), candidateAtlasProductIds:Object.freeze(candidates.map(a=>a.product.identity.atlasProductId)), automaticMercuryEligible:outcome===O.CONFIRMED }); }
