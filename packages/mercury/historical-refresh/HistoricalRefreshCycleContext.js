import {resolveGovernedHistoricalRefreshContext} from "../historical-admission/HistoricalRefreshAdmissionGovernance.js";
import {resolveHistoricalRefreshPriorContext} from "./HistoricalRefreshPriorContext.js";

const freeze=value=>{if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;};
const same=(left,right)=>JSON.stringify(left)===JSON.stringify(right);
const priorPlanFrom=authorization=>({schemaVersion:"1.0",refreshPlanId:authorization?.refreshPlanId,operation:"SELLERS",atlasProductId:authorization?.atlasProductId,providerIdentity:authorization?.providerIdentity,existingIdentity:authorization?.existingIdentity,previous:authorization?.previous});

export async function composeHistoricalRefreshCycleContext({atlasProductId,activePlan=null,authorization=null,result=null,historicalObservations=[],evidenceRecords=[],evidenceRepository,sellersAuthorization=null,executionRuns=[]}={}){
 if(typeof atlasProductId!=="string"||!atlasProductId||!Array.isArray(historicalObservations)||!Array.isArray(evidenceRecords)||!evidenceRepository?.getById)throw new TypeError("HISTORICAL_REFRESH_CYCLE_CONTEXT_INPUT_INVALID");
 if(!activePlan)return freeze({activePlan:null,activeAuthorization:null,activeResult:null,priorContext:null,priorPlan:null});
 if(activePlan.atlasProductId!==atlasProductId)throw new Error("HISTORICAL_REFRESH_ACTIVE_PLAN_PRODUCT_INVALID");
 if(result&&result.refreshPlanId===activePlan.refreshPlanId){
  if(!authorization||authorization.refreshPlanId!==activePlan.refreshPlanId)throw new Error("HISTORICAL_REFRESH_ACTIVE_AUTHORIZATION_REQUIRED");
  const requiresGovernance=(result.identityReuse??[]).some(value=>value?.status==="APPLICABLE"&&!value.reuseAssessmentId),governed=requiresGovernance?await resolveGovernedHistoricalRefreshContext({refreshResult:result,refreshPlan:activePlan,evidenceRepository,evidenceRecords}):{refreshResult:structuredClone(result)};
  return freeze({activePlan,activeAuthorization:authorization,activeResult:governed.refreshResult,priorContext:null,priorPlan:null});
 }
 const latest=historicalObservations.filter(value=>value?.atlasProductId===atlasProductId).sort((a,b)=>Date.parse(a.observationTime)-Date.parse(b.observationTime)||String(a.observationId).localeCompare(String(b.observationId))).at(-1);if(!latest)throw new Error("HISTORICAL_REFRESH_PRIOR_OBSERVATION_REQUIRED");
 if(latest.provenance?.acquisition?.type!=="HISTORICAL_REFRESH"){
  if(result)throw new Error("HISTORICAL_REFRESH_UNEXPECTED_PRIOR_RESULT");
  const priorContext=await resolveHistoricalRefreshPriorContext({atlasProductId,historicalObservations,evidenceRecords,evidenceRepository,sellersAuthorization,executionRuns});
  if(activePlan.previous?.observationId!==priorContext.observation.observationId||activePlan.previous?.evidenceId!==priorContext.evidence.evidenceId||activePlan.previous?.providerTaskId!==priorContext.providerTaskId)throw new Error("HISTORICAL_REFRESH_ACTIVE_PLAN_PRIOR_BINDING_INVALID");
  return freeze({activePlan,activeAuthorization:null,activeResult:null,priorContext,priorPlan:null});
 }
 if(!authorization||!result)throw new Error("HISTORICAL_REFRESH_GOVERNED_RESULT_REQUIRED");
 if(authorization.refreshPlanId!==result.refreshPlanId||authorization.requestId!==result.authorizationId)throw new Error("HISTORICAL_REFRESH_PRIOR_AUTHORIZATION_BINDING_INVALID");
 const priorPlan=priorPlanFrom(authorization),priorContext=await resolveHistoricalRefreshPriorContext({atlasProductId,historicalObservations,evidenceRecords,evidenceRepository,sellersAuthorization,executionRuns,refreshPlan:priorPlan,refreshAuthorization:authorization,refreshResult:result});
 if(activePlan.refreshPlanId===priorPlan.refreshPlanId||activePlan.previous?.observationId!==priorContext.observation.observationId||activePlan.previous?.evidenceId!==priorContext.evidence.evidenceId||activePlan.previous?.providerTaskId!==priorContext.providerTaskId||!same(activePlan.providerIdentity,priorContext.providerIdentity))throw new Error("HISTORICAL_REFRESH_ACTIVE_PLAN_PRIOR_BINDING_INVALID");
 return freeze({activePlan,activeAuthorization:null,activeResult:null,priorContext,priorPlan});
}

export default composeHistoricalRefreshCycleContext;
