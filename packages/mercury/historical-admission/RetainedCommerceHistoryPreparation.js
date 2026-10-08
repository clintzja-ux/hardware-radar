import crypto from "node:crypto";
import {createHistoricalObservationId} from "./HistoricalObservation.js";

export const RETAINED_COMMERCE_HISTORY_PREPARE_VERSION="RETAINED-COMMERCE-HISTORY-PREPARE-1.0";
const canonical=value=>Array.isArray(value)?`[${value.map(canonical).join(",")}]`:value&&typeof value==="object"?`{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`:JSON.stringify(value);
export const retainedCommerceDigest=value=>crypto.createHash("sha256").update(canonical(value)).digest("hex");
const freeze=value=>Object.freeze(structuredClone(value));
const validDigest=value=>typeof value==="string"&&/^[a-f0-9]{64}$/i.test(value);
const validTime=value=>typeof value==="string"&&Number.isFinite(Date.parse(value));
const identityOf=x=>({providerId:x.providerId,sourceId:x.sourceId,feedFamily:x.feedFamily,artifactDigest:x.artifactDigest,eventType:x.eventType,validatedObservedAt:x.validatedObservedAt,sourceProductId:x.sourceProductId,sourceListingId:x.sourceListingId,atlasProductId:x.atlasProductId,retailerId:x.retailerId,selectedPriceSemantic:x.selectedPriceSemantic,conditionProvenance:x.conditionProvenance,sourceRightsProfileId:x.sourceRightsProfileId,sourceRightsProfileDigest:x.sourceRightsProfileDigest,basePrice:x.basePrice,currency:x.currency});

export function createRetainedCommerceCandidate(input={}){
  const required=["providerId","sourceId","feedFamily","artifactDigest","eventType","validatedObservedAt","sourceProductId","sourceListingId","atlasProductId","retailerId","selectedPriceSemantic","conditionProvenance","sourceRightsProfileId","sourceRightsProfileDigest","currency"];
  if(required.some(key=>typeof input[key]!=="string"||!input[key])||!validDigest(input.artifactDigest)||!validDigest(input.sourceRightsProfileDigest)||!["FULL","DELTA"].includes(input.eventType)||!validTime(input.validatedObservedAt)||!["SALE_PRICE","RETAIL_PRICE","PROVIDER_ITEM_PRICE"].includes(input.selectedPriceSemantic)||!["EXPLICIT_PROVIDER","CONTEXTUALLY_DERIVED","UNKNOWN"].includes(input.conditionProvenance)||!Number.isFinite(input.basePrice)||input.basePrice<=0||!/^[A-Z]{3}$/.test(input.currency))throw new TypeError("RETAINED_COMMERCE_CANDIDATE_INVALID");
  const identity={providerId:input.providerId,sourceId:input.sourceId,feedFamily:input.feedFamily,artifactDigest:input.artifactDigest.toLowerCase(),eventType:input.eventType,validatedObservedAt:new Date(input.validatedObservedAt).toISOString(),sourceProductId:input.sourceProductId,sourceListingId:input.sourceListingId,atlasProductId:input.atlasProductId,retailerId:input.retailerId,selectedPriceSemantic:input.selectedPriceSemantic,conditionProvenance:input.conditionProvenance,sourceRightsProfileId:input.sourceRightsProfileId,sourceRightsProfileDigest:input.sourceRightsProfileDigest.toLowerCase(),basePrice:input.basePrice,currency:input.currency};
  const digest=retainedCommerceDigest(identity),retainedEvidenceId=`mer_retainedfeed_${digest.slice(0,24)}`;
  return freeze({...identity,candidateDigest:digest,retainedEvidenceId,historicalObservationId:createHistoricalObservationId(retainedEvidenceId),marketplace:input.marketplace??null,sourceUrl:input.sourceUrl??null,sellerName:input.sellerName??null,condition:input.condition??null,availability:input.availability??null,shipping:input.shipping??null,tax:input.tax??null,comparability:structuredClone(input.comparability??{classification:"STANDALONE_COMPARABLE",standaloneEligible:true,reasons:[]}),rawPayloadReference:input.rawPayloadReference??`retained-commerce:${identity.artifactDigest}:${identity.sourceProductId}:${identity.sourceListingId}`});
}

export function createRetainedCommerceHistoryPlan({historyHash,historySequence,historyCount,rightsProfileDigest,candidates,projectedImpact={}}={}){
  if(!validDigest(historyHash)||!validDigest(rightsProfileDigest)||!Number.isInteger(historySequence)||historySequence<0||!Number.isInteger(historyCount)||historyCount<0||!Array.isArray(candidates)||candidates.some(x=>x?.candidateDigest!==retainedCommerceDigest(identityOf(x))))throw new TypeError("RETAINED_COMMERCE_HISTORY_PLAN_INPUT_INVALID");
  const members=[...candidates].sort((a,b)=>a.candidateDigest.localeCompare(b.candidateDigest)),semantic={version:RETAINED_COMMERCE_HISTORY_PREPARE_VERSION,sourceHistory:{hash:historyHash.toLowerCase(),sequence:historySequence,count:historyCount},rightsProfileDigest:rightsProfileDigest.toLowerCase(),members:members.map(x=>({candidateDigest:x.candidateDigest,historicalObservationId:x.historicalObservationId,artifactDigest:x.artifactDigest,validatedObservedAt:x.validatedObservedAt,atlasProductId:x.atlasProductId,sourceListingId:x.sourceListingId,basePrice:x.basePrice,currency:x.currency,conditionProvenance:x.conditionProvenance})),projectedImpact};
  const bindingDigest=retainedCommerceDigest(semantic);
  return freeze({schemaVersion:"1.0",planType:"RETAINED_COMMERCE_HISTORY_ADMISSION",planId:`mer_rethistplan_${bindingDigest.slice(0,24)}`,bindingDigest,...semantic,authority:"NONE",historyMutationAuthorized:false,currentMutationAuthorized:false,networkOperation:"NONE",providerCalls:0,paidTasks:0,actualSpendUsd:0,candidates:members});
}

export function prepareRetainedCommerceHistory({plan}={}){
  if(plan?.planType!=="RETAINED_COMMERCE_HISTORY_ADMISSION"||plan.bindingDigest!==retainedCommerceDigest({version:plan.version,sourceHistory:plan.sourceHistory,rightsProfileDigest:plan.rightsProfileDigest,members:plan.members,projectedImpact:plan.projectedImpact}))throw new TypeError("RETAINED_COMMERCE_HISTORY_PLAN_INVALID");
  const digest=retainedCommerceDigest({planId:plan.planId,planBindingDigest:plan.bindingDigest,candidates:plan.candidates.map(x=>x.candidateDigest)});
  return freeze({schemaVersion:"1.0",preparationType:"RETAINED_COMMERCE_HISTORY_ADMISSION",preparationId:`mer_rethistprep_${digest.slice(0,24)}`,bindingDigest:digest,planId:plan.planId,planBindingDigest:plan.bindingDigest,sourceHistory:plan.sourceHistory,rightsProfileDigest:plan.rightsProfileDigest,candidates:plan.candidates,authority:"NONE",historyMutationAuthorized:false,currentMutationAuthorized:false,networkOperation:"NONE",providerCalls:0,paidTasks:0,actualSpendUsd:0});
}

export function assertRetainedCommercePreparationCurrent({plan,preparation,currentHistoryHash,currentHistorySequence,currentRightsProfileDigest,candidates}={}){
  if(plan?.bindingDigest!==preparation?.planBindingDigest||preparation?.bindingDigest!==retainedCommerceDigest({planId:plan.planId,planBindingDigest:plan.bindingDigest,candidates:plan.candidates.map(x=>x.candidateDigest)}))throw new Error("RETAINED_COMMERCE_PREPARATION_BINDING_CHANGED");
  if(currentHistoryHash?.toLowerCase()!==plan.sourceHistory.hash||currentHistorySequence!==plan.sourceHistory.sequence)throw new Error("RETAINED_COMMERCE_HISTORY_STALE");
  if(currentRightsProfileDigest?.toLowerCase()!==plan.rightsProfileDigest)throw new Error("RETAINED_COMMERCE_RIGHTS_STALE");
  if(!Array.isArray(candidates)||candidates.some(x=>x?.candidateDigest!==retainedCommerceDigest(identityOf(x)))||retainedCommerceDigest([...candidates].map(x=>x.candidateDigest).sort())!==retainedCommerceDigest(plan.candidates.map(x=>x.candidateDigest).sort()))throw new Error("RETAINED_COMMERCE_ARTIFACT_OR_CANDIDATE_STALE");
  return true;
}
