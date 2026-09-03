function freeze(v){if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v}
function clone(v){return v==null?v:structuredClone(v)}
function latestIso(values){return values.filter(Boolean).sort((a,b)=>Date.parse(b)-Date.parse(a))[0]??null}

export async function buildOperationalAcquisitionCandidates({atlas,acceptanceRepository=null,evidenceRepository=null,estimatedCostUsd=0.001,locationName='United States',languageName='English'}={}){
 if(!atlas?.products?.getAll)throw new TypeError('atlas with products.getAll is required.');
 const products=await atlas.products.getAll();
 const observations=acceptanceRepository?await acceptanceRepository.getAll():[];
 const evidence=evidenceRepository?await evidenceRepository.getAll():[];
 return freeze(products.filter(p=>p?.governance?.lifecycleStatus==='ACTIVE'&&p?.governance?.publicationStatus==='READY').map(product=>{
  const id=product.identity.atlasProductId; const mpn=product.identity.manufacturerPartNumber;
  const canonicalTimes=observations.filter(o=>o.atlasProductId===id).map(o=>o.observationTime);
  const evidenceTimes=evidence.filter(r=>r?.candidate?.atlasResolution?.atlasProductId===id||r?.candidate?.productResolution?.atlasProductId===id).map(r=>r?.candidate?.marketEvidence?.provenance?.observedAt);
  const lastObservedAt=latestIso([...canonicalTimes,...evidenceTimes]);
  return {candidateId:`atlas:${id}:products`,atlasProductId:id,priority:'NORMAL',estimatedCostUsd,lastObservedAt,rationale:lastObservedAt?'Atlas product refresh candidate; prior Mercury/DataForSEO evidence exists.':'Atlas product has no retained Mercury/DataForSEO observation.',execution:{kind:'PRODUCTS',keyword:mpn,locationName,languageName}};
 }));
}
