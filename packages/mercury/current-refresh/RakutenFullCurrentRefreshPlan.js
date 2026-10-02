import crypto from "node:crypto";
import { createCurrentDisplaySnapshot } from "../current-display/CurrentDisplaySnapshot.js";

export const RAKUTEN_FULL_CURRENT_REFRESH_POLICY_VERSION="RAKUTEN-NEWEGG-FRESH-FULL-CURRENT-REFRESH-P1-1.0";
const stable=value=>Array.isArray(value)?`[${value.map(stable).join(",")}]`:value&&typeof value==="object"?`{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`:JSON.stringify(value);
const digest=value=>crypto.createHash("sha256").update(stable(value)).digest("hex");
const freeze=value=>{if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;};
const offerMap=snapshot=>new Map((snapshot?.offers??[]).map(offer=>[offer.offerIdentity,offer]));

export function prepareRakutenFullCurrentRefreshPlan({sourceSnapshot,proposedSnapshot,catalogManifest,result,preparedAt}={}){
  if(sourceSnapshot?.schemaVersion!=="1.1"||proposedSnapshot?.schemaVersion!=="1.1"||!catalogManifest?.stateId||!Number.isFinite(Date.parse(preparedAt))||result?.mode!=="DRY_RUN")throw new TypeError("RAKUTEN_FULL_CURRENT_REFRESH_PLAN_INPUT_INVALID");
  const before=offerMap(sourceSnapshot),after=offerMap(proposedSnapshot),added=[],updated=[],unchanged=[],withdrawn=[];
  for(const [id,offer] of after){const prior=before.get(id);if(!prior)added.push(offer);else if(stable(prior)===stable(offer))unchanged.push(offer);else updated.push({before:prior,after:offer});}
  for(const [id,offer] of before)if(!after.has(id))withdrawn.push(offer);
  for(let index=added.length-1;index>=0;index-=1){const incoming=added[index],priorIndex=withdrawn.findIndex(prior=>prior.identityMode==="LEGACY_PRODUCT_CHANNEL"&&prior.atlasProductId===incoming.atlasProductId&&prior.retailerId===incoming.retailerId&&prior.destinationId===incoming.destinationId);if(priorIndex>=0){updated.push({before:withdrawn[priorIndex],after:incoming,progression:"LEGACY_TO_EVIDENCE_GROUNDED"});added.splice(index,1);withdrawn.splice(priorIndex,1);}}
  const ordered=value=>value.sort((a,b)=>(a.offerIdentity??a.after?.offerIdentity).localeCompare(b.offerIdentity??b.after?.offerIdentity));
  const material={policyVersion:RAKUTEN_FULL_CURRENT_REFRESH_POLICY_VERSION,preparedAt,sourceCurrent:{snapshotId:sourceSnapshot.snapshotId,materialFingerprint:sourceSnapshot.materialFingerprint,offerCount:sourceSnapshot.offers.length},sourceCatalog:{stateId:catalogManifest.stateId,stateDigest:catalogManifest.stateDigest,catalogDigest:catalogManifest.catalogDigest,artifactDigest:catalogManifest.artifact.digest,headerTimestamp:catalogManifest.artifact.headerTimestamp,remoteModifiedAt:catalogManifest.artifact.remoteModifiedAt,recordCount:catalogManifest.recordCount,historyEligibility:false},proposedCurrent:{snapshotId:proposedSnapshot.snapshotId,materialFingerprint:proposedSnapshot.materialFingerprint,offerCount:proposedSnapshot.offers.length},diff:{added:ordered(added),updated:ordered(updated),withdrawn:ordered(withdrawn),unchanged:ordered(unchanged)},qualification:{summary:result.summary,rowAssessments:result.rowAssessments,outcomes:result.outcomes,exceptions:result.exceptions},authority:"NONE",currentMutationAuthorized:false,historyEligibility:false,providerOperationsAuthorized:0,releaseAuthority:false};
  const bindingDigest=digest(material);return freeze({schemaVersion:"1.0",planType:"RAKUTEN_FULL_CURRENT_REFRESH_PLAN",planId:`mer_rakutenfullrefresh_${bindingDigest.slice(0,24)}`,bindingDigest,...material,providerCalls:0,paidTasksCreated:0,actualSpendUsd:0});
}

export function prepareRakutenFullCurrentRefresh({plan}={}){
  if(plan?.planType!=="RAKUTEN_FULL_CURRENT_REFRESH_PLAN"||plan.authority!=="NONE"||plan.currentMutationAuthorized!==false)throw new TypeError("RAKUTEN_FULL_CURRENT_REFRESH_PREPARATION_INPUT_INVALID");
  const members=[...plan.diff.added.map(offer=>({change:"ADD",offer})),...plan.diff.updated.map(value=>({change:"UPDATE",offer:value.after,priorOffer:value.before})),...plan.diff.withdrawn.map(offer=>({change:"WITHDRAW",offer}))].sort((a,b)=>a.offer.offerIdentity.localeCompare(b.offer.offerIdentity));
  const material={policyVersion:RAKUTEN_FULL_CURRENT_REFRESH_POLICY_VERSION,refreshPlanId:plan.planId,refreshPlanBindingDigest:plan.bindingDigest,sourceCurrent:plan.sourceCurrent,sourceCatalog:plan.sourceCatalog,proposedCurrent:plan.proposedCurrent,members,authority:"NONE",networkOperation:"NONE",currentMutationAuthorized:false,historyEligibility:false};
  const bindingDigest=digest(material);return freeze({schemaVersion:"1.0",preparationType:"RAKUTEN_FULL_CURRENT_REFRESH_PREPARATION",preparationId:`mer_rakutenfullprep_${bindingDigest.slice(0,24)}`,bindingDigest,...material,providerCalls:0,paidTasksCreated:0,actualSpendUsd:0});
}

export function validateRakutenFullCurrentRefreshPlan(plan){
  const {schemaVersion,planType,planId,bindingDigest,providerCalls,paidTasksCreated,actualSpendUsd,...material}=plan??{};
  const expected=digest(material);
  if(schemaVersion!=="1.0"||planType!=="RAKUTEN_FULL_CURRENT_REFRESH_PLAN"||bindingDigest!==expected||planId!==`mer_rakutenfullrefresh_${expected.slice(0,24)}`||providerCalls!==0||paidTasksCreated!==0||actualSpendUsd!==0||material.authority!=="NONE"||material.currentMutationAuthorized!==false||material.historyEligibility!==false)throw new Error("RAKUTEN_FULL_CURRENT_REFRESH_PLAN_INVALID");
  return true;
}

export function validateRakutenFullCurrentRefreshPreparation(preparation,{plan}={}){
  const {schemaVersion,preparationType,preparationId,bindingDigest,providerCalls,paidTasksCreated,actualSpendUsd,...material}=preparation??{};
  const expected=digest(material);
  if(schemaVersion!=="1.0"||preparationType!=="RAKUTEN_FULL_CURRENT_REFRESH_PREPARATION"||bindingDigest!==expected||preparationId!==`mer_rakutenfullprep_${expected.slice(0,24)}`||providerCalls!==0||paidTasksCreated!==0||actualSpendUsd!==0||material.authority!=="NONE"||material.networkOperation!=="NONE"||material.currentMutationAuthorized!==false||material.historyEligibility!==false)throw new Error("RAKUTEN_FULL_CURRENT_REFRESH_PREPARATION_INVALID");
  if(plan&&(material.refreshPlanId!==plan.planId||material.refreshPlanBindingDigest!==plan.bindingDigest||stable(material.sourceCurrent)!==stable(plan.sourceCurrent)||stable(material.sourceCatalog)!==stable(plan.sourceCatalog)||stable(material.proposedCurrent)!==stable(plan.proposedCurrent)))throw new Error("RAKUTEN_FULL_CURRENT_REFRESH_PREPARATION_BINDING_INVALID");
  return true;
}

export async function executeRakutenFullCurrentRefresh({plan,preparation,currentSnapshotRepository,authorizedPlanId,authorizedPreparationId,confirmation}={}){
  validateRakutenFullCurrentRefreshPlan(plan);validateRakutenFullCurrentRefreshPreparation(preparation,{plan});
  if(plan.planId!==authorizedPlanId||preparation.preparationId!==authorizedPreparationId)throw new Error("RAKUTEN_FULL_CURRENT_REFRESH_AUTHORIZATION_SCOPE_INVALID");
  const expectedConfirmation=`EXECUTE-RAKUTEN-FULL-CURRENT:${plan.planId}:${preparation.preparationId}`;
  if(confirmation!==expectedConfirmation)throw new Error("RAKUTEN_FULL_CURRENT_REFRESH_CONFIRMATION_INVALID");
  if(preparation.members.length!==plan.diff.added.length+plan.diff.updated.length+plan.diff.withdrawn.length)throw new Error("RAKUTEN_FULL_CURRENT_REFRESH_MEMBER_COUNT_INVALID");
  const state=await currentSnapshotRepository.getState(),current=state.current;
  if(current?.snapshotId===plan.proposedCurrent.snapshotId&&current?.materialFingerprint===plan.proposedCurrent.materialFingerprint)return freeze({status:"ALREADY_EXECUTED",planId:plan.planId,preparationId:preparation.preparationId,snapshotId:current.snapshotId,offerCount:current.offers.length,currentChanged:false});
  if(current?.snapshotId!==plan.sourceCurrent.snapshotId||current?.materialFingerprint!==plan.sourceCurrent.materialFingerprint||current?.offers?.length!==plan.sourceCurrent.offerCount)throw new Error("RAKUTEN_FULL_CURRENT_REFRESH_SOURCE_CHANGED");
  const offers=new Map(current.offers.map(offer=>[offer.offerIdentity,offer]));
  for(const member of preparation.members){
    if(member.change==="UPDATE"){
      const prior=offers.get(member.priorOffer.offerIdentity);
      if(stable(prior)!==stable(member.priorOffer))throw new Error("RAKUTEN_FULL_CURRENT_REFRESH_MEMBER_PREDECESSOR_CHANGED");
      offers.delete(member.priorOffer.offerIdentity);
      if(offers.has(member.offer.offerIdentity))throw new Error("RAKUTEN_FULL_CURRENT_REFRESH_MEMBER_CONFLICT");
      offers.set(member.offer.offerIdentity,member.offer);
    }else if(member.change==="ADD"){
      if(offers.has(member.offer.offerIdentity))throw new Error("RAKUTEN_FULL_CURRENT_REFRESH_MEMBER_CONFLICT");
      offers.set(member.offer.offerIdentity,member.offer);
    }else if(member.change==="WITHDRAW"){
      if(stable(offers.get(member.offer.offerIdentity))!==stable(member.offer))throw new Error("RAKUTEN_FULL_CURRENT_REFRESH_MEMBER_PREDECESSOR_CHANGED");
      offers.delete(member.offer.offerIdentity);
    }else throw new Error("RAKUTEN_FULL_CURRENT_REFRESH_MEMBER_CHANGE_INVALID");
  }
  const outcomes=plan.qualification.outcomes,items=outcomes.map(({operationId,status,...item})=>item),portfolioMaterial={asOf:plan.preparedAt,items},portfolioDigest=digest(portfolioMaterial),portfolioId=`mer_curportfolio_${portfolioDigest.slice(0,24)}`,runDigest=digest({portfolioId,asOf:plan.preparedAt,outcomes});
  const proposed=createCurrentDisplaySnapshot({schemaVersion:"1.1",observedAt:plan.preparedAt,importedAt:plan.preparedAt,source:{workbook:`fixture-current-retail-refresh:${portfolioId}`,sheet:"Source-neutral fixture refresh",digest:runDigest},offers:[...offers.values()]});
  if(proposed.snapshotId!==plan.proposedCurrent.snapshotId||proposed.materialFingerprint!==plan.proposedCurrent.materialFingerprint||proposed.offers.length!==plan.proposedCurrent.offerCount)throw new Error("RAKUTEN_FULL_CURRENT_REFRESH_PROPOSED_STATE_MISMATCH");
  const persistence=await currentSnapshotRepository.replaceIfCurrent(proposed,{expectedCurrentSnapshotId:plan.sourceCurrent.snapshotId,expectedCurrentFingerprint:plan.sourceCurrent.materialFingerprint});
  return freeze({status:"EXECUTED",planId:plan.planId,preparationId:preparation.preparationId,snapshotId:proposed.snapshotId,materialFingerprint:proposed.materialFingerprint,offerCount:proposed.offers.length,currentChanged:true,persistence,diff:{updated:plan.diff.updated.length,added:plan.diff.added.length,withdrawn:plan.diff.withdrawn.length,unchanged:plan.diff.unchanged.length},historyRecordsDelta:0,historySequenceDelta:0,destinationDelta:0,affiliateDelta:0,providerCalls:0,paidTasks:0,actualSpendUsd:0});
}
