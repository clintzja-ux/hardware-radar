import {resolveGovernedHistoricalRefreshContext} from "../historical-admission/HistoricalRefreshAdmissionGovernance.js";

const freeze=value=>{if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;};
const identity=value=>({productId:value?.productId??null,dataDocId:value?.dataDocId??null,gid:value?.gid??null});
const same=(left,right)=>JSON.stringify(left)===JSON.stringify(right);

function latestForProduct({atlasProductId,historicalObservations,evidenceRecords}){
 const history=historicalObservations.filter(value=>value?.atlasProductId===atlasProductId).sort((a,b)=>Date.parse(a.observationTime)-Date.parse(b.observationTime)||a.observationId.localeCompare(b.observationId));
 const observation=history.at(-1);if(!observation)throw new Error("HISTORICAL_REFRESH_PRIOR_OBSERVATION_REQUIRED");
 const matches=evidenceRecords.filter(value=>value?.evidenceId===observation.provenance?.retainedEvidenceId);if(matches.length!==1)throw new Error(matches.length?"HISTORICAL_REFRESH_PRIOR_EVIDENCE_CONFLICT":"HISTORICAL_REFRESH_PRIOR_EVIDENCE_MISSING");
 const evidence=matches[0];if(evidence.candidate?.identity?.atlasProductId!==atlasProductId)throw new Error("HISTORICAL_REFRESH_PRIOR_PRODUCT_BINDING_INVALID");
 return {observation,evidence};
}

function originalContext({atlasProductId,observation,evidence,sellersAuthorization,executionRuns}){
 if(sellersAuthorization?.authorizationType!=="SELLERS_ENRICHMENT"||sellersAuthorization.atlasProductId!==atlasProductId)throw new Error("GOVERNED_SELLERS_AUTHORIZATION_REQUIRED");
 const providerIdentity=identity(sellersAuthorization.providerIdentity),execution=sellersAuthorization.plan?.decisions?.find(value=>value.decision==="APPROVED")?.execution;
 if(execution?.kind!=="SELLERS"||!same(identity(execution),providerIdentity))throw new Error("GOVERNED_PROVIDER_IDENTITY_BINDING_INVALID");
 const runs=executionRuns.filter(value=>value?.planId===sellersAuthorization.planId&&value.status==="COMPLETED");if(runs.length!==1)throw new Error(runs.length?"GOVERNED_SELLERS_EXECUTION_CONFLICT":"GOVERNED_SELLERS_EXECUTION_NOT_FOUND");
 const tasks=(runs[0].tasks??[]).filter(value=>value?.outcome==="COMPLETED");if(tasks.length!==1||!tasks[0].providerTaskId)throw new Error(tasks.length?"GOVERNED_SELLERS_EXECUTION_CONFLICT":"GOVERNED_SELLERS_EXECUTION_NOT_FOUND");
 const taskId=tasks[0].providerTaskId,evidenceTask=evidence.candidate?.marketEvidence?.provenance?.sourceTaskId,observationTask=observation.provenance?.acquisition?.sellersTaskId;
 if(taskId!==evidenceTask||taskId!==observationTask)throw new Error("HISTORICAL_REFRESH_PRIOR_TASK_BINDING_INVALID");
 return freeze({generation:"ORIGINAL_SELLERS",observation,evidence,providerTaskId:taskId,providerIdentity});
}

async function governedContext({atlasProductId,observation,evidence,evidenceRepository,evidenceRecords,refreshPlan,refreshAuthorization,refreshResult}){
 if(!refreshPlan||!refreshAuthorization||!refreshResult)throw new Error("HISTORICAL_REFRESH_GOVERNED_RESULT_REQUIRED");
 const governed=await resolveGovernedHistoricalRefreshContext({refreshResult,refreshPlan,evidenceRepository,evidenceRecords});
 const matches=governed.identityReuseAssessments.filter(value=>value.targetEvidenceId===evidence.evidenceId);if(matches.length!==1)throw new Error(matches.length?"HISTORICAL_REFRESH_GOVERNED_REUSE_CONFLICT":"HISTORICAL_REFRESH_GOVERNED_REUSE_MISSING");
 const reuse=matches[0],acquisition=observation.provenance?.acquisition??{},taskId=evidence.candidate?.marketEvidence?.provenance?.sourceTaskId;
 if(acquisition.type!=="HISTORICAL_REFRESH"||taskId!==acquisition.sellersTaskId||taskId!==refreshResult.providerTaskId||taskId!==reuse.providerTaskId)throw new Error("HISTORICAL_REFRESH_PRIOR_TASK_BINDING_INVALID");
 if(acquisition.refreshPlanId!==refreshPlan.refreshPlanId||refreshResult.refreshPlanId!==refreshPlan.refreshPlanId||reuse.refreshPlanId!==refreshPlan.refreshPlanId)throw new Error("HISTORICAL_REFRESH_PRIOR_PLAN_BINDING_INVALID");
 if(acquisition.authorizationId!==refreshResult.authorizationId||refreshAuthorization.requestId!==refreshResult.authorizationId||refreshAuthorization.refreshPlanId!==refreshPlan.refreshPlanId)throw new Error("HISTORICAL_REFRESH_PRIOR_AUTHORIZATION_BINDING_INVALID");
 if(refreshAuthorization.atlasProductId!==atlasProductId||reuse.atlasProductId!==atlasProductId||observation.atlasProductId!==atlasProductId)throw new Error("HISTORICAL_REFRESH_PRIOR_PRODUCT_BINDING_INVALID");
 if(refreshAuthorization.retailerId!==observation.retailerId||reuse.retailerId!==observation.retailerId)throw new Error("HISTORICAL_REFRESH_PRIOR_RETAILER_BINDING_INVALID");
 const providerIdentity=identity(evidence.candidate?.marketEvidence?.productEvidence);if(!same(providerIdentity,identity(refreshPlan.providerIdentity))||!same(providerIdentity,identity(refreshAuthorization.providerIdentity))||!same(providerIdentity,identity(reuse.providerIdentity)))throw new Error("HISTORICAL_REFRESH_PROVIDER_IDENTITY_DRIFT");
 return freeze({generation:"GOVERNED_HISTORICAL_REFRESH",observation,evidence,providerTaskId:taskId,providerIdentity,refreshPlanId:refreshPlan.refreshPlanId,authorizationId:refreshResult.authorizationId,reuseAssessmentId:reuse.reuseAssessmentId,identityProjection:{product:{state:reuse.product.state,decisionId:reuse.product.decisionId,remediationId:reuse.product.remediationId??null},merchant:{state:reuse.merchant.state,decisionId:reuse.merchant.decisionId,merchantId:reuse.merchant.retailerId}}});
}

export async function resolveHistoricalRefreshPriorContext({atlasProductId,historicalObservations=[],evidenceRecords=[],evidenceRepository,sellersAuthorization,executionRuns=[],refreshPlan=null,refreshAuthorization=null,refreshResult=null}={}){
 if(typeof atlasProductId!=="string"||!atlasProductId||!Array.isArray(historicalObservations)||!Array.isArray(evidenceRecords)||!evidenceRepository?.getById)throw new TypeError("HISTORICAL_REFRESH_PRIOR_CONTEXT_INPUT_INVALID");
 const {observation,evidence}=latestForProduct({atlasProductId,historicalObservations,evidenceRecords});
 if(observation.provenance?.acquisition?.type==="HISTORICAL_REFRESH")return governedContext({atlasProductId,observation,evidence,evidenceRepository,evidenceRecords,refreshPlan,refreshAuthorization,refreshResult});
 return originalContext({atlasProductId,observation,evidence,sellersAuthorization,executionRuns});
}

export default resolveHistoricalRefreshPriorContext;
