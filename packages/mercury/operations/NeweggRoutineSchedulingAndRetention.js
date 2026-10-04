import crypto from "node:crypto";

export const NEWEGG_ROUTINE_CADENCE_MS=86_400_000;
export const NEWEGG_CURRENT_TTL_MS=129_600_000;
export const NEWEGG_RAW_FULL_RETENTION_MS=604_800_000;
export const NEWEGG_ROUTINE_EXCEPTION_TYPES=Object.freeze(["PROVIDER_FAILURE","INTEGRITY_FAILURE","COVERAGE_DROP","IDENTITY_REVIEW_REQUIRED","CURRENT_QUALIFICATION_FAILURE","HISTORY_QUALIFICATION_FAILURE","CURRENT_MUTATION_FAILURE","HISTORY_MUTATION_FAILURE","QA_FAILURE","RECOMPOSITION_FAILURE","CERTIFICATION_FAILURE","RELEASE_NOT_READY","STORAGE_HOLD","PRUNING_REVIEW_REQUIRED"]);
const stable=value=>Array.isArray(value)?`[${value.map(stable).join(",")}]`:value&&typeof value==="object"?`{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`:JSON.stringify(value);
const digest=value=>crypto.createHash("sha256").update(stable(value)).digest("hex");
const clone=value=>structuredClone(value);
const freeze=value=>Object.freeze(clone(value));

export function assessNeweggRoutineScheduling({asOf,lastAttempt=null,activeRun=null}={}){
 const now=Date.parse(asOf);if(!Number.isFinite(now))throw new TypeError("NEWEGG_ROUTINE_SCHEDULE_AS_OF_REQUIRED");
 if(activeRun&&!['COMPLETE','FAILED','CANCELLED'].includes(activeRun.status))return freeze({state:"BLOCKED_ACTIVE_RUN",due:false,overlapPrevented:true,nextExpectedAt:null,automaticExecution:false});
 const last=lastAttempt?Date.parse(lastAttempt):NaN,next=Number.isFinite(last)?new Date(last+NEWEGG_ROUTINE_CADENCE_MS).toISOString():null;
 return freeze({state:!Number.isFinite(last)||now>=last+NEWEGG_ROUTINE_CADENCE_MS?"DUE":"NOT_DUE",due:!Number.isFinite(last)||now>=last+NEWEGG_ROUTINE_CADENCE_MS,overlapPrevented:false,nextExpectedAt:next,automaticExecution:false});
}

export function createNeweggRoutineHealthProjection(input={}){
 if(!Number.isFinite(Date.parse(input.asOf))||!input.schedule||typeof input.schedule!=="object")throw new TypeError("NEWEGG_ROUTINE_HEALTH_INPUT_INVALID");
 const exceptions=(input.exceptions??[]).map(value=>{if(!NEWEGG_ROUTINE_EXCEPTION_TYPES.includes(value.type))throw new Error("NEWEGG_ROUTINE_EXCEPTION_INVALID");return clone(value);});
 const projection={schemaVersion:"1.0",projectionType:"NEWEGG_ROUTINE_OPERATIONS",asOf:new Date(input.asOf).toISOString(),status:input.status??"NOT_CONFIGURED",lastSuccessfulRun:input.lastSuccessfulRun??null,lastAttemptedRun:input.lastAttemptedRun??null,schedule:clone(input.schedule),provider:input.provider??"RAKUTEN_ADVERTISING",source:input.source??"RAKUTEN_NEWEGG_PRODUCT_CATALOG",full:clone(input.full??null),catalog:clone(input.catalog??null),coverage:clone(input.coverage??null),current:clone(input.current??null),history:clone(input.history??null),qa:clone(input.qa??null),releaseReadiness:clone(input.releaseReadiness??null),providerCalls:Number(input.providerCalls??0),actualSpendUsd:Number(input.actualSpendUsd??0),exceptions,storage:clone(input.storage??null),readOnly:true,mutationAuthorized:false,networkOperation:"NONE",automaticExecution:false,affiliateRevalidation:false,releaseAuthority:false};
 projection.projectionDigest=digest(projection);return freeze(projection);
}

export function createNeweggRetentionPlan({asOf,entries,currentCatalogId=null,predecessorCatalogId=null}={}){
 const now=Date.parse(asOf);if(!Number.isFinite(now)||!Array.isArray(entries))throw new TypeError("NEWEGG_RETENTION_INPUT_INVALID");
 const classified=[...entries].sort((a,b)=>String(a.path).localeCompare(String(b.path))).map(entry=>{
  const base={path:entry.path,kind:entry.kind,bytes:Number(entry.bytes??0),observedAt:entry.observedAt??null};let state="RETAIN",reason="RETENTION_WINDOW_ACTIVE";
  if(entry.hold===true||entry.kind==="PARTIAL_DIAGNOSTIC"){state="HOLD_FOR_REVIEW";reason=entry.holdReason??"INCIDENT_ARTIFACT";}
  else if(entry.kind==="CATALOG_STATE"){
   if(entry.catalogStateId===currentCatalogId){state="RETAIN";reason="CURRENT_CATALOG_STATE";}
   else if(entry.catalogStateId===predecessorCatalogId){state="RETAIN";reason="IMMEDIATE_PREDECESSOR_CATALOG_STATE";}
   else if(entry.prerequisitesComplete===true){state="SAFE_TO_PRUNE";reason="OLDER_CATALOG_STATE_FULLY_DURABLE";}
   else{state="RETAIN";reason="DURABILITY_PREREQUISITES_INCOMPLETE";}
  }else if(entry.kind==="RAW_FULL"){
   const age=now-Date.parse(entry.observedAt);if(Number.isFinite(age)&&age>=NEWEGG_RAW_FULL_RETENTION_MS&&entry.prerequisitesComplete===true){state="SAFE_TO_PRUNE";reason="SEVEN_DAY_WINDOW_COMPLETE_AND_DURABLE";}else if(entry.prerequisitesComplete!==true){reason="DURABILITY_PREREQUISITES_INCOMPLETE";}
  }else if(entry.kind==="RAW_DELTA"&&entry.prerequisitesComplete===true){state="SAFE_TO_PRUNE";reason="DELTA_NOT_REQUIRED_BY_CURRENT_FULL_LINEAGE";}
  return {...base,state,reason};
 });
 const bytes=state=>classified.filter(x=>x.state===state).reduce((sum,x)=>sum+x.bytes,0),counts=kind=>classified.filter(x=>x.kind===kind).length;
 const summary={totalFiles:classified.length,totalBytes:classified.reduce((sum,x)=>sum+x.bytes,0),safeToPruneBytes:bytes("SAFE_TO_PRUNE"),retainBytes:bytes("RETAIN"),holdBytes:bytes("HOLD_FOR_REVIEW"),rawFullFiles:counts("RAW_FULL"),rawDeltaFiles:counts("RAW_DELTA"),partialFiles:counts("PARTIAL_DIAGNOSTIC"),catalogStateFiles:counts("CATALOG_STATE"),qaFiles:counts("QA_ARTIFACT")};
 const semantic={policyVersion:"NEWEGG-ROUTINE-RETENTION-P1-1.0",asOf:new Date(asOf).toISOString(),operatorApprovalRequired:true,automaticDeletion:false,currentCatalogId,predecessorCatalogId,entries:classified,summary};
 return freeze({...semantic,planId:`mer_neweggprune_${digest(semantic).slice(0,24)}`});
}
