import {normalizeManufacturerKey,normalizeManufacturerPartNumber} from '../../resolution/dataforseo/DataForSeoAtlasResolver.js';

function norm(v){return normalizeManufacturerKey(String(v??''))?.toUpperCase()??'';}
function titleText(item){return String(item?.title??'').toUpperCase();}
function has(re,s){return re.test(s);}
function escapeRegExp(value){return value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
function hasExactMpnToken(title,mpn){
  if(!mpn) return false;
  return new RegExp(`(?<![A-Z0-9-])${escapeRegExp(mpn)}(?![A-Z0-9-])`).test(title);
}
function signal(name,matched,weight,detail){return Object.freeze({name,matched,weight,detail});}
function normalizeColor(v){
  const n=norm(v);
  if(n==='GRAY'||n==='GREY') return 'GREY';
  return n||null;
}
function titleColor(title){
  if(/\b(?:GRAY|GREY)\b/i.test(title)) return 'GREY';
  if(/\bBLACK\b/i.test(title)) return 'BLACK';
  if(/\bWHITE\b/i.test(title)) return 'WHITE';
  return null;
}
function primaryTimingEvidence(title,performance){
  const timing=String(performance?.primaryTimings??'').trim();
  if(!timing) return {matched:false,detail:null};
  const escaped=timing.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/-/g,'[-\\s]');
  return {matched:new RegExp(`\\b${escaped}\\b`,'i').test(title),detail:timing};
}

const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;};
const identityKey=item=>JSON.stringify([item?.productId??null,item?.dataDocId??null,item?.gid??null]);
const nonNullValues=(candidates,field)=>[...new Set(candidates.map(candidate=>candidate.item?.[field]).filter(value=>value!=null).map(String))].sort();

export const PRODUCTS_IDENTITY_POLICY_VERSION='MERCURY-HISTORY-044-1.0';
export const ATLAS_IDENTITY_STATES=Object.freeze({CONTRADICTED:'CONTRADICTED',UNRESOLVED:'UNRESOLVED',CORROBORATED:'CORROBORATED'});
export const PROVIDER_IDENTITY_STATES=Object.freeze({UNIQUE_DOCUMENT_ANCHOR:'UNIQUE_DOCUMENT_ANCHOR',SHARED_DOCUMENTED_PRODUCT:'SHARED_DOCUMENTED_PRODUCT',MULTIPLE_DOCUMENTS_UNGROUPED:'MULTIPLE_DOCUMENTS_UNGROUPED',UNRESOLVED:'UNRESOLVED'});

export function deriveLayeredProductsIdentity({candidates}={}){
  if(!Array.isArray(candidates))throw new TypeError('candidates must be an array.');
  const cleanByIdentity=new Map();
  for(const candidate of candidates){
    if(candidate?.exactMpnMatch===true&&candidate?.outcome!==PRODUCT_CANDIDATE_OUTCOMES.REJECTED&&(!Array.isArray(candidate.contradictions)||candidate.contradictions.length===0)&&(candidate.item?.productId||candidate.item?.dataDocId||candidate.item?.gid))cleanByIdentity.set(identityKey(candidate.item),candidate);
  }
  const clean=[...cleanByIdentity.values()].sort((a,b)=>identityKey(a.item).localeCompare(identityKey(b.item)));
  const contradictions=[...new Set(candidates.flatMap(candidate=>Array.isArray(candidate?.contradictions)?candidate.contradictions:[]))].sort();
  const atlasIdentity=clean.length
    ? {state:ATLAS_IDENTITY_STATES.CORROBORATED,reasons:['EXACT_MPN_MATERIALLY_CONCORDANT'],candidateCount:clean.length}
    : contradictions.length
      ? {state:ATLAS_IDENTITY_STATES.CONTRADICTED,reasons:['MATERIAL_ATLAS_IDENTITY_CONTRADICTION',...contradictions],candidateCount:0}
      : {state:ATLAS_IDENTITY_STATES.UNRESOLVED,reasons:['ATLAS_IDENTITY_EVIDENCE_INSUFFICIENT'],candidateCount:0};
  const documents=clean.map(candidate=>({dataDocId:candidate.item.dataDocId??null,productId:candidate.item.productId??null,gid:candidate.item.gid??null}));
  let providerIdentity;
  if(!clean.length)providerIdentity={state:PROVIDER_IDENTITY_STATES.UNRESOLVED,groupingKey:null,anchor:null,documents,reasons:['PROVIDER_IDENTITY_UNRESOLVED']};
  else if(clean.length===1)providerIdentity={state:PROVIDER_IDENTITY_STATES.UNIQUE_DOCUMENT_ANCHOR,groupingKey:null,anchor:documents[0],documents,reasons:['UNIQUE_PROVIDER_DOCUMENT_ANCHOR']};
  else{
    const productIds=nonNullValues(clean,'productId'),gids=nonNullValues(clean,'gid');
    const productConflict=productIds.length>1,gidConflict=gids.length>1;
    const sharedProductId=!productConflict&&clean.every(candidate=>candidate.item.productId!=null)&&productIds.length===1?productIds[0]:null;
    const sharedGid=!gidConflict&&clean.every(candidate=>candidate.item.gid!=null)&&gids.length===1?gids[0]:null;
    if(productConflict||gidConflict){
      const reasons=['PROVIDER_IDENTITY_UNRESOLVED'];if(productConflict)reasons.push('PRODUCT_ID_CONFLICT');if(gidConflict)reasons.push('GID_CONFLICT');
      providerIdentity={state:PROVIDER_IDENTITY_STATES.UNRESOLVED,groupingKey:null,anchor:null,documents,reasons};
    }else if(sharedProductId||sharedGid){
      const groupingKey=sharedProductId&&sharedGid?{type:'PRODUCT_ID_AND_GID',productId:sharedProductId,gid:sharedGid}:sharedProductId?{type:'PRODUCT_ID',value:sharedProductId}:{type:'GID',value:sharedGid};
      providerIdentity={state:PROVIDER_IDENTITY_STATES.SHARED_DOCUMENTED_PRODUCT,groupingKey,anchor:{productId:sharedProductId,dataDocId:null,gid:sharedGid},documents,reasons:[sharedProductId?'SHARED_DOCUMENTED_PRODUCT_ID':'SHARED_DOCUMENTED_GID']};
    }else providerIdentity={state:PROVIDER_IDENTITY_STATES.MULTIPLE_DOCUMENTS_UNGROUPED,groupingKey:null,anchor:null,documents,reasons:['PROVIDER_IDENTITY_UNRESOLVED','NO_SHARED_DOCUMENTED_PRODUCT_KEY']};
  }
  return freeze({schemaVersion:'1.0',policyVersion:PRODUCTS_IDENTITY_POLICY_VERSION,atlasIdentity,providerIdentity});
}

export const PRODUCT_CANDIDATE_OUTCOMES=Object.freeze({RECOMMENDED:'RECOMMENDED',AMBIGUOUS:'AMBIGUOUS',REJECTED:'REJECTED'});

export function scoreDataForSeoProductCandidate({atlasProduct,item}={}){
  if(!atlasProduct?.identity) throw new TypeError('atlasProduct is required.');
  if(!item || typeof item!=='object') throw new TypeError('item is required.');
  const id=atlasProduct.identity, data=atlasProduct.extension?.data??{}, title=titleText(item);
  const performance=data.performance??{}, physical=data.physical??{};
  const mpn=normalizeManufacturerPartNumber(id.manufacturerPartNumber), brand=norm(id.brand), memory=norm(data.classification?.memoryType);
  const capacity=Number(data.capacity?.capacityGb), modules=Number(data.capacity?.moduleCount), perModule=Number(data.capacity?.capacityPerModuleGb), speed=Number(performance.dataRateMtps), cl=Number(performance.casLatency);
  const exactMpn=hasExactMpnToken(title,mpn);
  const otherCorsairMpn=(title.match(/\bCM[A-Z0-9]{8,}\b/g)??[]).map(normalizeManufacturerPartNumber).find(x=>x!==mpn);
  const wrongGeneration=memory==='DDR5'&&has(/\bDDR4\b/,title) || memory==='DDR4'&&has(/\bDDR5\b/,title);
  const wrongCapacity=Number.isFinite(capacity)&&has(/\b(?:8|16|32|48|64|96|128)\s*GB\b/,title)&&!new RegExp(`\\b${capacity}\\s*GB\\b`).test(title);
  const atlasColor=normalizeColor(physical.color), observedColor=titleColor(title);
  const colorConflict=!!atlasColor&&!!observedColor&&atlasColor!==observedColor;
  const explicitRgb=/\bRGB\b/i.test(title);
  const rgbConflict=physical.rgbLighting===false&&explicitRgb;
  const timings=primaryTimingEvidence(title,performance);
  const casMatched=Number.isFinite(cl)&&(new RegExp(`\\bCL\\s*${cl}\\b`,'i').test(title)||timings.matched);
  const contradictions=[];
  if(otherCorsairMpn) contradictions.push(`DIFFERENT_MPN:${otherCorsairMpn}`);
  if(wrongGeneration) contradictions.push('MEMORY_GENERATION_CONFLICT');
  if(wrongCapacity) contradictions.push('CAPACITY_CONFLICT');
  if(colorConflict) contradictions.push(`COLOR_CONFLICT:${observedColor}`);
  if(rgbConflict) contradictions.push('RGB_CONFLICT');
  const signals=[
    signal('EXACT_MPN',!!exactMpn,60,mpn||null),
    signal('BRAND',!!brand&&norm(title).includes(brand),10,id.brand??null),
    signal('MEMORY_TYPE',!!memory&&norm(title).includes(memory),8,memory||null),
    signal('CAPACITY',Number.isFinite(capacity)&&new RegExp(`\\b${capacity}\\s*GB\\b`).test(title),8,capacity||null),
    signal('MODULE_CONFIGURATION',Number.isFinite(modules)&&Number.isFinite(perModule)&&new RegExp(`${modules}\\s*[X×]\\s*${perModule}\\s*GB`,'i').test(title),5,`${modules}x${perModule}GB`),
    signal('SPEED',Number.isFinite(speed)&&new RegExp(`\\b${speed}\\s*(?:MHZ|MT/S|MTPS)?\\b`,'i').test(title),5,speed||null),
    signal('CAS_LATENCY',!!casMatched,4,cl||null),
    signal('PRIMARY_TIMINGS',timings.matched,4,timings.detail),
    signal('COLOR',!!atlasColor&&observedColor===atlasColor,3,atlasColor),
    signal('RGB_CONSISTENCY',physical.rgbLighting===false&&!explicitRgb,2,physical.rgbLighting===false?'NON_RGB':null),
  ];
  const score=signals.reduce((s,x)=>s+(x.matched?x.weight:0),0)-contradictions.length*100;
  const outcome=contradictions.length?PRODUCT_CANDIDATE_OUTCOMES.REJECTED:exactMpn&&score>=78?PRODUCT_CANDIDATE_OUTCOMES.RECOMMENDED:score>=31?PRODUCT_CANDIDATE_OUTCOMES.AMBIGUOUS:PRODUCT_CANDIDATE_OUTCOMES.REJECTED;
  return Object.freeze({outcome,score,exactMpnMatch:!!exactMpn,contradictions:Object.freeze(contradictions),signals:Object.freeze(signals),item:Object.freeze({title:item.title??null,productId:item.product_id??null,dataDocId:item.data_docid??null,gid:item.gid??null,price:item.price??null,currency:item.currency??null,shoppingUrl:item.shopping_url??null})});
}

export function resolveDataForSeoProductCandidates({atlasProduct,items}={}){
  if(!Array.isArray(items)) throw new TypeError('items must be an array.');
  const candidates=items.map(item=>scoreDataForSeoProductCandidate({atlasProduct,item})).sort((a,b)=>b.score-a.score||identityKey(a.item).localeCompare(identityKey(b.item)));
  const eligible=candidates.filter(c=>c.outcome==='RECOMMENDED');
  const top=eligible[0]??null, second=eligible[1]??null;
  const recommendation=top && (!second || top.score>second.score || (top.item.dataDocId&&top.item.dataDocId===second.item.dataDocId)) ? top : null;
  const layeredIdentity=deriveLayeredProductsIdentity({candidates});
  return freeze({schemaVersion:'1.2',identityPolicyVersion:PRODUCTS_IDENTITY_POLICY_VERSION,atlasProductId:atlasProduct.identity.atlasProductId,candidateCount:candidates.length,recommendationStatus:recommendation?'RECOMMENDED':eligible.length?'AMBIGUOUS':'NO_SAFE_CANDIDATE',recommendedCandidate:recommendation,runnerUp:second??null,candidates,layeredIdentity});
}
