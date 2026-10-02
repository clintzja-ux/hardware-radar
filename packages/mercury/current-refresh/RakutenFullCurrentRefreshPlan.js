import crypto from "node:crypto";

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
