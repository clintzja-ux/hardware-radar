import {executeRakutenFullCurrentRefresh,validateRakutenFullCurrentRefreshPlan,validateRakutenFullCurrentRefreshPreparation} from "../current-refresh/index.js";
import {assertRetainedCommercePreparationCurrent,retainedCommerceDigest,retainedCommerceHistoryExecutionConfirmation} from "../historical-admission/index.js";

const freeze=value=>Object.freeze(structuredClone(value));

function requireLineage(lineage){
 if(!/^[a-f0-9]{64}$/i.test(lineage?.artifactDigest??"")||!Number.isFinite(Date.parse(lineage?.sourceObservedAt)))throw new Error("NEWEGG_ROUTINE_SOURCE_LINEAGE_INVALID");
 return lineage;
}

export const rakutenFullCurrentRefreshExecutionConfirmation=(plan,preparation)=>`EXECUTE-RAKUTEN-FULL-CURRENT:${plan?.planId}:${preparation?.preparationId}`;

export class RakutenFullCurrentRoutineAuthorityAdapter{
 constructor({currentSnapshotRepository}={}){if(!currentSnapshotRepository?.getState)throw new TypeError("NEWEGG_ROUTINE_CURRENT_REPOSITORY_REQUIRED");this.repository=currentSnapshotRepository;}
 async inspect({plan,preparation,authority,lineage}={}){
  requireLineage(lineage);validateRakutenFullCurrentRefreshPlan(plan);validateRakutenFullCurrentRefreshPreparation(preparation,{plan});
  if(authority?.authorizedPlanId!==plan.planId||authority?.authorizedPreparationId!==preparation.preparationId)throw new Error("RAKUTEN_FULL_CURRENT_REFRESH_AUTHORIZATION_SCOPE_INVALID");
  if(authority?.confirmation!==rakutenFullCurrentRefreshExecutionConfirmation(plan,preparation))throw new Error("RAKUTEN_FULL_CURRENT_REFRESH_CONFIRMATION_INVALID");
  if(plan.sourceCatalog?.artifactDigest?.toLowerCase()!==lineage.artifactDigest.toLowerCase()||new Date(plan.sourceCatalog?.headerTimestamp).toISOString()!==new Date(lineage.sourceObservedAt).toISOString())throw new Error("RAKUTEN_FULL_CURRENT_REFRESH_LINEAGE_CHANGED");
  if(lineage.catalogStateId&&plan.sourceCatalog?.stateId!==lineage.catalogStateId)throw new Error("RAKUTEN_FULL_CURRENT_REFRESH_CATALOG_STATE_CHANGED");
  const current=(await this.repository.getState()).current;
  const completed=current?.snapshotId===plan.proposedCurrent.snapshotId&&current?.materialFingerprint===plan.proposedCurrent.materialFingerprint&&current?.offers?.length===plan.proposedCurrent.offerCount;
  const predecessor=current?.snapshotId===plan.sourceCurrent.snapshotId&&current?.materialFingerprint===plan.sourceCurrent.materialFingerprint&&current?.offers?.length===plan.sourceCurrent.offerCount;
  if(!completed&&!predecessor)throw new Error("RAKUTEN_FULL_CURRENT_REFRESH_SOURCE_CHANGED");
  return freeze({state:completed?"COMPLETED":"AUTHORIZED",planId:plan.planId,preparationId:preparation.preparationId,artifactDigest:lineage.artifactDigest,sourceObservedAt:lineage.sourceObservedAt,currentSnapshotId:current?.snapshotId??null});
 }
 async validate({authority,context}={}){await this.inspect({plan:context?.input?.current?.plan,preparation:context?.input?.current?.preparation,authority,lineage:context?.input?.lineage});return true;}
}

export function createRakutenFullCurrentRoutineOwner({currentSnapshotRepository}={}){
 const adapter=new RakutenFullCurrentRoutineAuthorityAdapter({currentSnapshotRepository});
 const argumentsFor=context=>({plan:context.input.current.plan,preparation:context.input.current.preparation,authority:context.input.stageAuthorities?.CURRENT,lineage:context.input.lineage});
 return Object.freeze({mutating:true,authorityOwner:adapter,receiptOwner:{async resolve(context){const result=await adapter.inspect(argumentsFor(context));return result.state==="COMPLETED"?{state:"COMPLETED",receipt:result}:{state:"NOT_COMPLETED"};}},executionOwner:{async execute(context){const {plan,preparation}=context.input.current,authority=context.input.stageAuthorities.CURRENT;return executeRakutenFullCurrentRefresh({plan,preparation,currentSnapshotRepository,authorizedPlanId:authority.authorizedPlanId,authorizedPreparationId:authority.authorizedPreparationId,confirmation:authority.confirmation});}}});
}

function validateHistoryBindings({plan,preparation,currentRightsProfileDigest,candidates}){
 const planDigest=retainedCommerceDigest({version:plan?.version,sourceHistory:plan?.sourceHistory,rightsProfileDigest:plan?.rightsProfileDigest,members:plan?.members,projectedImpact:plan?.projectedImpact});
 const preparationDigest=retainedCommerceDigest({planId:plan?.planId,planBindingDigest:plan?.bindingDigest,candidates:plan?.candidates?.map(value=>value.candidateDigest)});
 if(plan?.bindingDigest!==planDigest||preparation?.bindingDigest!==preparationDigest||plan?.bindingDigest!==preparation?.planBindingDigest||plan?.planId!==preparation?.planId||plan?.projectedImpact?.newRecords!==plan?.candidates?.length||currentRightsProfileDigest?.toLowerCase()!==plan?.rightsProfileDigest)throw new Error("RETAINED_COMMERCE_HISTORY_AUTHORIZED_COHORT_MISMATCH");
 if(!Array.isArray(candidates)||retainedCommerceDigest(candidates.map(value=>value.candidateDigest).sort())!==retainedCommerceDigest(plan.candidates.map(value=>value.candidateDigest).sort()))throw new Error("RETAINED_COMMERCE_HISTORY_CANDIDATE_CHANGED");
}

export class RetainedCommerceHistoryRoutineAuthorityAdapter{
 constructor({historicalRepository,historyStateReader}={}){if(!historicalRepository?.getAll||typeof historyStateReader!=="function")throw new TypeError("NEWEGG_ROUTINE_HISTORY_REPOSITORY_REQUIRED");Object.assign(this,{historicalRepository,historyStateReader});}
 async inspect({plan,preparation,authority,lineage,candidates,currentRightsProfileDigest}={}){
  requireLineage(lineage);validateHistoryBindings({plan,preparation,currentRightsProfileDigest,candidates});
  if(authority?.authorizedPlanId!==plan.planId||authority?.authorizedPreparationId!==preparation.preparationId)throw new Error("RETAINED_COMMERCE_HISTORY_AUTHORIZATION_SCOPE_INVALID");
  if(authority?.confirmation!==retainedCommerceHistoryExecutionConfirmation(plan,preparation))throw new Error("RETAINED_COMMERCE_HISTORY_EXECUTION_CONFIRMATION_INVALID");
  if(candidates.some(candidate=>candidate.artifactDigest?.toLowerCase()!==lineage.artifactDigest.toLowerCase()||new Date(candidate.validatedObservedAt).toISOString()!==new Date(lineage.sourceObservedAt).toISOString()))throw new Error("RETAINED_COMMERCE_HISTORY_LINEAGE_CHANGED");
  const state=await this.historyStateReader(),existing=await this.historicalRepository.getAll(),ids=new Set(existing.map(value=>value.observationId)),present=plan.candidates.filter(value=>ids.has(value.historicalObservationId)).length;
  if(present===plan.candidates.length)return freeze({state:"COMPLETED",planId:plan.planId,preparationId:preparation.preparationId,artifactDigest:lineage.artifactDigest,sourceObservedAt:lineage.sourceObservedAt,observationIds:plan.candidates.map(value=>value.historicalObservationId),historySequence:state.sequence});
  if(present!==0)throw new Error("RETAINED_COMMERCE_HISTORY_PARTIAL_EXECUTION_CONFLICT");
  assertRetainedCommercePreparationCurrent({plan,preparation,currentHistoryHash:state.hash,currentHistorySequence:state.sequence,currentRightsProfileDigest,candidates});
  return freeze({state:"AUTHORIZED",planId:plan.planId,preparationId:preparation.preparationId,artifactDigest:lineage.artifactDigest,sourceObservedAt:lineage.sourceObservedAt,historySequence:state.sequence});
 }
 async validate({authority,context}={}){const history=context?.input?.history??{};await this.inspect({...history,authority,lineage:context?.input?.lineage});return true;}
}

export function createRetainedCommerceHistoryRoutineOwner({historicalRepository,historyStateReader,executionService}={}){
 if(!executionService?.execute)throw new TypeError("NEWEGG_ROUTINE_HISTORY_EXECUTOR_REQUIRED");
 const adapter=new RetainedCommerceHistoryRoutineAuthorityAdapter({historicalRepository,historyStateReader});
 const argumentsFor=context=>({...context.input.history,authority:context.input.stageAuthorities?.HISTORY,lineage:context.input.lineage});
 return Object.freeze({mutating:true,authorityOwner:adapter,receiptOwner:{async resolve(context){const result=await adapter.inspect(argumentsFor(context));return result.state==="COMPLETED"?{state:"COMPLETED",receipt:result}:{state:"NOT_COMPLETED"};}},executionOwner:{async execute(context){const history=context.input.history,authority=context.input.stageAuthorities.HISTORY;return executionService.execute({plan:history.plan,preparation:history.preparation,confirmation:authority.confirmation,executedBy:authority.executedBy,currentRightsProfileDigest:history.currentRightsProfileDigest,candidates:history.candidates});}}});
}
