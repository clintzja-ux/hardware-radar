import {governHistoricalRefreshIdentityReuse,validateGovernedHistoricalRefreshIdentityReuse} from "../historical-refresh/GovernedHistoricalRefreshIdentityReuse.js";

const freeze=value=>{if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;};

export async function resolveHistoricalRefreshAdmissionGovernance({targetRecord,evidenceRepository,refreshResult,refreshPlan}={}){
  if(!targetRecord?.evidenceId||!evidenceRepository?.getById)throw new TypeError("HISTORICAL_REFRESH_ADMISSION_INPUT_INVALID");
  if(refreshResult?.operation!=="HISTORICAL_REFRESH_RESULT_RETRIEVAL"||refreshResult?.retrievalStatus!=="COMPLETED"||refreshResult.refreshPlanId!==refreshPlan?.refreshPlanId)throw new Error("HISTORICAL_REFRESH_ADMISSION_ENVELOPE_INVALID");
  const matches=(refreshResult.identityReuse??[]).filter(x=>x?.targetEvidenceId===targetRecord.evidenceId);if(matches.length!==1)throw new Error(matches.length?"HISTORICAL_REFRESH_ADMISSION_REUSE_CONFLICT":"HISTORICAL_REFRESH_ADMISSION_REUSE_MISSING");
  const persisted=matches[0];if(persisted.status!=="APPLICABLE")throw new Error(`HISTORICAL_REFRESH_ADMISSION_REUSE_${persisted.status??"INVALID"}`);
  if(persisted.authorizationId&&persisted.authorizationId!==refreshResult.authorizationId)throw new Error("HISTORICAL_REFRESH_ADMISSION_AUTHORIZATION_SUBSTITUTION_BLOCKED");
  const sourceRecord=await evidenceRepository.getById(persisted.sourceEvidenceId);if(!sourceRecord)throw new Error("HISTORICAL_REFRESH_ADMISSION_SOURCE_EVIDENCE_MISSING");
  const governed=governHistoricalRefreshIdentityReuse({assessment:persisted,refreshResult,refreshPlan,sourceRecord,targetRecord});const report=validateGovernedHistoricalRefreshIdentityReuse(governed);if(!report.valid)throw new Error("HISTORICAL_REFRESH_ADMISSION_REUSE_INVALID");
  if(persisted.reuseAssessmentId&&(persisted.reuseAssessmentId!==governed.reuseAssessmentId||persisted.providerTaskId!==governed.providerTaskId||persisted.refreshPlanId!==governed.refreshPlanId))throw new Error("HISTORICAL_REFRESH_ADMISSION_REUSE_BINDING_CHANGED");
  return freeze({kind:"HISTORICAL_REFRESH",identityReuseAssessments:[governed],reuse:governed,sourceRecord});
}

export async function resolveGovernedHistoricalRefreshContext({refreshResult,refreshPlan,evidenceRepository,evidenceRecords}={}){
  if(!refreshResult)return freeze({refreshResult:null,identityReuseAssessments:[]});
  if(!refreshPlan||!evidenceRepository?.getById||!Array.isArray(evidenceRecords))throw new TypeError("HISTORICAL_REFRESH_CONTEXT_INPUT_INVALID");
  if(!Array.isArray(refreshResult.identityReuse))throw new Error("HISTORICAL_REFRESH_CONTEXT_REUSE_INVALID");
  const governedReuse=[],identityReuseAssessments=[];
  for(const persisted of refreshResult.identityReuse){
    if(!persisted||typeof persisted!=="object"||typeof persisted.status!=="string")throw new Error("HISTORICAL_REFRESH_CONTEXT_REUSE_INVALID");
    if(persisted.status!=="APPLICABLE"){
      governedReuse.push(structuredClone(persisted));
      continue;
    }
    const matches=evidenceRecords.filter(record=>record?.evidenceId===persisted.targetEvidenceId);
    if(matches.length!==1)throw new Error(matches.length?"HISTORICAL_REFRESH_CONTEXT_EVIDENCE_CONFLICT":"HISTORICAL_REFRESH_CONTEXT_EVIDENCE_MISSING");
    const governed=await resolveHistoricalRefreshAdmissionGovernance({targetRecord:matches[0],evidenceRepository,refreshResult,refreshPlan});
    governedReuse.push(governed.reuse);identityReuseAssessments.push(...governed.identityReuseAssessments);
  }
  return freeze({refreshResult:{...structuredClone(refreshResult),identityReuse:governedReuse},identityReuseAssessments});
}

export default resolveHistoricalRefreshAdmissionGovernance;
