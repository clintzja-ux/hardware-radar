const freeze=value=>{if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;};
const clone=value=>structuredClone(value);
const SYSTEMIC=new Set(["UNAUTHORIZED_SPEND","DUPLICATE_PAID_TASK","LINEAGE_CONFLICT","IMMUTABLE_RESULT_CONFLICT","REPOSITORY_INTEGRITY_FAILURE","RIGHTS_INTEGRITY_FAILURE","AUTHORITY_SUBSTITUTION"]);
const DOMAIN_EXCEPTION=new Set(["MULTIPLE_COMPATIBLE_ASINS","ASIN_VARIANT_CONFLICT","INSUFFICIENT_ASIN_EVIDENCE","KNOWN_UNRESOLVED"]);
const SUCCESS=new Set(["STRONG_UNIQUE_ASIN","IDENTITY_RESOLVED","ADMITTED","DUPLICATE"]);

function classify(member,run){
 const reason=member.systemicFailureReason??member.failure?.reason??member.failure?.failureClass??null;
 if(member.systemicFailure===true||SYSTEMIC.has(reason))return "SYSTEMIC_ATTENTION";
 if(member.state==="WAITING_FOR_PROVIDER"||member.state==="PENDING")return "PENDING_ROUTINE_WORK";
 if(member.reviewEligibility?.eligible===true)return "GOVERNED_REVIEW_AVAILABLE";
 if(DOMAIN_EXCEPTION.has(member.outcome))return member.reviewEligibility?.eligible===false?"SAFELY_UNRESOLVED":"EXPECTED_DOMAIN_EXCEPTION";
 if(member.state==="COMPLETED"&&SUCCESS.has(member.outcome))return "ROUTINE_SUCCESS";
 if(member.state==="COMPLETED")return "EXPECTED_DOMAIN_EXCEPTION";
 return "PENDING_ROUTINE_WORK";
}

function projectMember(member,run,atlas){
 const atlasProduct=atlas.get(member.atlasProductId);if(!atlasProduct)throw new Error("FORGE_COHORT_ATLAS_BINDING_INVALID");
 const classification=classify(member,run),review=member.reviewEligibility??{eligible:false,reviewType:null,permittedDecisions:[]};
 if(review.eligible===true&&typeof review.owner!=="string")throw new Error("FORGE_COHORT_REVIEW_OWNER_REQUIRED");
 return {memberKey:member.memberKey??member.preparedObservationId??member.atlasProductId,atlasProduct:{atlasProductId:member.atlasProductId,displayName:atlasProduct.identity?.displayName??null,manufacturerPartNumber:atlasProduct.identity?.manufacturerPartNumber??null},source:member.source??null,operation:member.operation??null,state:member.state,outcome:member.outcome??null,classification,providerTaskId:member.providerTaskId??null,canonicalResultId:member.providerResultId??member.canonicalResultId??null,assessmentId:member.assessmentId??null,automationStopReason:member.automationStopReason??member.outcome??member.failure?.reason??member.failure?.failureClass??null,review:{eligible:review.eligible===true,owner:review.owner??null,type:review.reviewType??null,permittedDecisions:clone(review.permittedDecisions??[]),evidenceReferences:clone(review.evidenceReferences??[]),actionExecutable:false},unresolvedIsLegitimate:classification==="SAFELY_UNRESOLVED",progression:{status:member.progression?.status??null,attemptCount:member.progression?.attemptCount??null,bounded:member.progression?.bounded??null},repeatObservation:clone(member.repeatObservation??null),downstreamAuthority:{sellers:false,history:false,canonical:false,reviewMutation:false,publication:false,currentPrice:false,cheapest:false,picks:false},systemicFailureReason:classification==="SYSTEMIC_ATTENTION"?(member.systemicFailureReason??member.failure?.reason??member.failure?.failureClass??run.systemicFailureReason??"SYSTEMIC_FAILURE"):null};
}

export function createCertifiedMercuryCohortOperationsProjection({asOf,atlasProducts,cohorts=[]}={}){
 if(typeof asOf!=="string"||!Number.isFinite(Date.parse(asOf))||!Array.isArray(atlasProducts)||!Array.isArray(cohorts))throw new TypeError("FORGE_COHORT_PROJECTION_INPUT_INVALID");
 const atlas=new Map(atlasProducts.map(product=>[product?.identity?.atlasProductId,product]));if(atlas.size!==atlasProducts.length||atlas.has(undefined))throw new Error("FORGE_COHORT_ATLAS_SOURCE_INVALID");
 const projected=[...cohorts].sort((a,b)=>String(a.planId).localeCompare(String(b.planId))).map(cohort=>{
  if(!cohort||typeof cohort.planId!=="string"||!Array.isArray(cohort.members)||!Array.isArray(cohort.requestedMembers))throw new Error("FORGE_COHORT_SOURCE_INVALID");
  const members=cohort.members.map(member=>projectMember(member,cohort,atlas));
  const count=classification=>members.filter(member=>member.classification===classification).length;
  const actualSpendUsd=cohort.cost?.actualSpendUsd;
  return {cohortType:cohort.cohortType,identity:{planId:cohort.planId,runId:cohort.runId??null,cycle:cohort.cycle??null,asOf,sources:[...new Set(members.map(x=>x.source).filter(Boolean))].sort(),operations:[...new Set(members.map(x=>x.operation).filter(Boolean))].sort()},membership:{requested:cohort.requestedMembers.length,ready:cohort.readyCount??cohort.members.length,completed:members.filter(x=>x.state==="COMPLETED").length,pending:count("PENDING_ROUTINE_WORK"),blocked:cohort.blockedCount??0,exceptions:members.filter(x=>["EXPECTED_DOMAIN_EXCEPTION","GOVERNED_REVIEW_AVAILABLE","SAFELY_UNRESOLVED","SYSTEMIC_ATTENTION"].includes(x.classification)).length},execution:{authorizationState:cohort.authorizationState??"NOT_AUTHORIZED",runState:cohort.runState??null,paidTaskCount:members.filter(member=>member.providerTaskId).length,progressionCount:cohort.progression?.completedCount??null,progressionStatus:cohort.progression?.status??null,automaticRetryCount:cohort.automaticRetryCount??0},cost:{authorizedMaximumSpendUsd:cohort.cost?.authorizedMaximumSpendUsd??null,actualSpendUsd:Number.isFinite(actualSpendUsd)?actualSpendUsd:null,currentUtcDaySpendUsd:cohort.cost?.currentUtcDaySpendUsd??null,dailyCeilingUsd:cohort.cost?.dailyCeilingUsd??null,remainingDailyCapacityUsd:cohort.cost?.remainingDailyCapacityUsd??null},safety:{unauthorizedSpend:cohort.safety?.unauthorizedSpend??false,duplicatePaidTask:cohort.safety?.duplicatePaidTask??false,lineageConflict:cohort.safety?.lineageConflict??false,immutableResultConflict:cohort.safety?.immutableResultConflict??false,systemicFailure:cohort.systemicFailure===true,rightsFailure:cohort.safety?.rightsFailure??false,downstreamAuthorityLeakage:false,reason:cohort.systemicFailureReason??null},members};
 });
 return freeze({schemaVersion:"1.0",projectionType:"CERTIFIED_MERCURY_COHORT_OPERATIONS",asOf,cohorts:projected,readOnly:true,actionExecuted:false,mutationAuthorized:false,networkOperation:"NONE",paidTaskCreated:false,actualSpendUsd:0});
}

export default createCertifiedMercuryCohortOperationsProjection;
