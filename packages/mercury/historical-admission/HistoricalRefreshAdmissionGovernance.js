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

export default resolveHistoricalRefreshAdmissionGovernance;
