import crypto from "node:crypto";

export const HISTORICAL_REFRESH_CONFIRMATION = "SPEND-REFRESH-0.001";
const hash=value=>crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
const freeze=value=>{if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;};
const provider=value=>({productId:value?.productId??null,dataDocId:value?.dataDocId??null,gid:value?.gid??null});
const binding=plan=>({refreshPlanId:plan?.refreshPlanId,operation:plan?.operation,atlasProductId:plan?.atlasProductId,providerIdentity:provider(plan?.providerIdentity),existingIdentity:plan?.existingIdentity,minimumSafePath:plan?.minimumSafePath,previous:plan?.previous,spendPolicy:plan?.spendPolicy});

function validateRefreshPlan(plan){
 if(plan?.schemaVersion!=="1.0"||plan?.status!=="PENDING_OPERATOR_REVIEW"||plan?.operation!=="SELLERS")throw new Error("HISTORICAL_REFRESH_PLAN_NOT_AUTHORIZABLE");
 if(typeof plan.refreshPlanId!=="string"||!plan.refreshPlanId||typeof plan.atlasProductId!=="string"||!plan.atlasProductId)throw new Error("HISTORICAL_REFRESH_PLAN_INVALID");
 if(plan.existingIdentity?.productState!=="VERIFIED"||plan.existingIdentity?.merchantState!=="REGISTERED"||!plan.existingIdentity?.retailerId)throw new Error("HISTORICAL_REFRESH_IDENTITY_NOT_GOVERNED");
 const id=provider(plan.providerIdentity);if(!id.productId&&!id.dataDocId&&!id.gid)throw new Error("HISTORICAL_REFRESH_PROVIDER_IDENTITY_REQUIRED");
 if(plan.minimumSafePath?.directSellersEligible!==true||plan.minimumSafePath?.productsRequired!==false||plan.minimumSafePath?.productInfoPaidTaskRequired!==false)throw new Error("HISTORICAL_REFRESH_MINIMUM_PATH_INVALID");
 if(plan.spendPolicy?.maxPaidTasks!==1||plan.spendPolicy?.maxSpendUsd!==.001||plan.spendPolicy?.automaticPaidRetries!==0||plan.spendPolicy?.singleUseAuthorizationRequired!==true)throw new Error("HISTORICAL_REFRESH_SPEND_POLICY_INVALID");
 for(const field of ["observationId","evidenceId","providerTaskId"])if(typeof plan.previous?.[field]!=="string"||!plan.previous[field])throw new Error("HISTORICAL_REFRESH_PRIOR_BINDING_INVALID");
 return plan;
}

export function historicalRefreshPlanDigest(plan){validateRefreshPlan(plan);return hash(binding(plan));}
export function assertHistoricalRefreshConfirmation(value){if(value!==HISTORICAL_REFRESH_CONFIRMATION)throw new Error(`EXPLICIT_CONFIRMATION_REQUIRED:--confirm=${HISTORICAL_REFRESH_CONFIRMATION}`);return true;}

export function createHistoricalRefreshAuthorizationRequest({refreshPlan,sourceValidation,createdAt=new Date().toISOString(),ttlMinutes=15,spentTodayUsd=0}={}){
 validateRefreshPlan(refreshPlan);if(!Number.isFinite(Date.parse(createdAt))||!Number.isInteger(ttlMinutes)||ttlMinutes<=0)throw new TypeError("HISTORICAL_REFRESH_AUTHORIZATION_TIME_INVALID");
 const refreshPlanDigest=historicalRefreshPlanDigest(refreshPlan);if(sourceValidation?.valid!==true||sourceValidation.refreshPlanId!==refreshPlan.refreshPlanId||sourceValidation.refreshPlanDigest!==refreshPlanDigest)throw new Error("HISTORICAL_REFRESH_CURRENT_SOURCE_VALIDATION_REQUIRED");const planId=`histrefreshplan_${hash([refreshPlan.refreshPlanId,refreshPlanDigest,createdAt]).slice(0,24)}`;const id=provider(refreshPlan.providerIdentity);
 const execution={kind:"SELLERS",...id,locationName:"United States",languageName:"English",acquisitionCycleId:refreshPlan.refreshPlanId};
 const plan=freeze({schemaVersion:"1.0",planId,plannedAt:createdAt,policy:{schemaVersion:"1.0",enabled:true,maxPaidTasksPerRun:1,maxSpendPerRunUsd:.001,maxSpendPerDayUsd:.01,automaticPaidRetries:0},spentTodayUsd,approvedTaskCount:1,estimatedApprovedSpendUsd:.001,decisions:[{candidateId:`history-refresh:${refreshPlan.atlasProductId}:${refreshPlan.refreshPlanId}`,priority:"NORMAL",estimatedCostUsd:.001,decision:"APPROVED",reason:null,rationale:"Operator-authorized governed historical SELLERS refresh.",execution}]});
 return freeze({schemaVersion:"1.0",requestId:`histrefreshauth_${hash([planId,refreshPlanDigest]).slice(0,24)}`,mode:"LIVE",authorizationType:"HISTORICAL_REFRESH_SELLERS",refreshPlanId:refreshPlan.refreshPlanId,refreshPlanDigest,currentSourceValidated:true,planId,atlasProductId:refreshPlan.atlasProductId,existingIdentity:refreshPlan.existingIdentity,retailerId:refreshPlan.existingIdentity.retailerId,providerIdentity:id,previous:refreshPlan.previous,operation:"SELLERS",createdAt,expiresAt:new Date(Date.parse(createdAt)+ttlMinutes*60000).toISOString(),maxSpendUsd:.001,maxPaidTasks:1,automaticPaidRetries:0,singleUse:true,status:"PENDING_OPERATOR_APPROVAL",plan});
}

export function assertHistoricalRefreshAuthorizationBinding({request,refreshPlan}={}){
 validateRefreshPlan(refreshPlan);if(request?.authorizationType!=="HISTORICAL_REFRESH_SELLERS"||request?.status!=="PENDING_OPERATOR_APPROVAL"||request?.currentSourceValidated!==true)throw new Error("HISTORICAL_REFRESH_AUTHORIZATION_NOT_PENDING");
 if(request.refreshPlanId!==refreshPlan.refreshPlanId||request.refreshPlanDigest!==historicalRefreshPlanDigest(refreshPlan)||request.atlasProductId!==refreshPlan.atlasProductId||request.retailerId!==refreshPlan.existingIdentity.retailerId)throw new Error("HISTORICAL_REFRESH_AUTHORIZATION_BINDING_MISMATCH");
 if(request.maxPaidTasks!==1||request.maxSpendUsd!==.001||request.automaticPaidRetries!==0||request.singleUse!==true)throw new Error("HISTORICAL_REFRESH_AUTHORIZATION_LIMIT_INVALID");
 const expected=provider(refreshPlan.providerIdentity),execution=request.plan?.decisions?.find(x=>x.decision==="APPROVED")?.execution;
 if(request.planId!==request.plan?.planId||request.plan?.approvedTaskCount!==1||execution?.kind!=="SELLERS"||execution.acquisitionCycleId!==refreshPlan.refreshPlanId||JSON.stringify(provider(execution))!==JSON.stringify(expected))throw new Error("HISTORICAL_REFRESH_EXECUTION_SUBSTITUTION_BLOCKED");
 return true;
}
