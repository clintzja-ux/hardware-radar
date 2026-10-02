import crypto from "node:crypto";
import { createCurrentDisplaySnapshot, validateCurrentDisplaySnapshot } from "../current-display/CurrentDisplaySnapshot.js";
import { createCurrentOfferProjection } from "../current-display/CurrentOfferModel.js";

export const RAKUTEN_LEGACY_OFFER_RECOVERY_POLICY_VERSION = "RAKUTEN-NEWEGG-LEGACY-OFFER-BINDING-AND-CURRENT-RECOVERY-P1-1.0";
export const RAKUTEN_LEGACY_OFFER_RECOVERY_SCHEMA_VERSION = "1.0";
const stable=value=>Array.isArray(value)?`[${value.map(stable).join(",")}]`:value&&typeof value==="object"?`{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`:JSON.stringify(value);
const digest=value=>crypto.createHash("sha256").update(stable(value)).digest("hex");
const freeze=value=>{if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;};
const validTime=value=>typeof value==="string"&&Number.isFinite(Date.parse(value));
const findOne=(values,predicate,code)=>{const found=values.filter(predicate);if(found.length!==1)throw new Error(code);return found[0];};

export function createOperatorVerifiedLegacyOfferBinding({sourceSnapshot,atlasProductId,legacyOfferIdentity,listingIdentity,sellerName,verifiedBy,recordedAt,evidenceReferences=[]}={}) {
  if(sourceSnapshot?.schemaVersion!=="1.1"||!validTime(recordedAt)||!atlasProductId||!legacyOfferIdentity||!listingIdentity||!sellerName||!verifiedBy||!Array.isArray(evidenceReferences)||!evidenceReferences.length)throw new TypeError("LEGACY_OFFER_BINDING_INPUT_INVALID");
  const legacy=findOne(sourceSnapshot.offers,value=>value.offerIdentity===legacyOfferIdentity&&value.atlasProductId===atlasProductId,"LEGACY_OFFER_BINDING_TARGET_INVALID");
  if(legacy.identityMode!=="LEGACY_PRODUCT_CHANNEL"||legacy.retailerId!=="RETAILER-0004"||legacy.seller?.sellerName!==sellerName||legacy.sellerName!==sellerName)throw new Error("LEGACY_OFFER_BINDING_EVIDENCE_CONTRADICTORY");
  const material={policyVersion:RAKUTEN_LEGACY_OFFER_RECOVERY_POLICY_VERSION,sourceSnapshotId:sourceSnapshot.snapshotId,sourceSnapshotFingerprint:sourceSnapshot.materialFingerprint,atlasProductId,legacyOfferIdentity,listingIdentity,sellerName,verifiedBy,recordedAt,evidenceReferences:[...evidenceReferences],effect:"IDENTITY_ENRICHMENT_ONLY",originalEvidencePreserved:true,authority:"NONE"};
  const bindingDigest=digest(material);
  return freeze({schemaVersion:RAKUTEN_LEGACY_OFFER_RECOVERY_SCHEMA_VERSION,bindingType:"OPERATOR_VERIFIED_LEGACY_OFFER_LISTING_BINDING",bindingId:`mer_offerbinding_${bindingDigest.slice(0,24)}`,bindingDigest,...material});
}

export function validateOperatorVerifiedLegacyOfferBinding(value) {
  const material={policyVersion:value?.policyVersion,sourceSnapshotId:value?.sourceSnapshotId,sourceSnapshotFingerprint:value?.sourceSnapshotFingerprint,atlasProductId:value?.atlasProductId,legacyOfferIdentity:value?.legacyOfferIdentity,listingIdentity:value?.listingIdentity,sellerName:value?.sellerName,verifiedBy:value?.verifiedBy,recordedAt:value?.recordedAt,evidenceReferences:value?.evidenceReferences,effect:value?.effect,originalEvidencePreserved:value?.originalEvidencePreserved,authority:value?.authority};
  if(value?.schemaVersion!==RAKUTEN_LEGACY_OFFER_RECOVERY_SCHEMA_VERSION||value?.bindingType!=="OPERATOR_VERIFIED_LEGACY_OFFER_LISTING_BINDING"||value?.bindingDigest!==digest(material)||value?.bindingId!==`mer_offerbinding_${value.bindingDigest.slice(0,24)}`||value?.effect!=="IDENTITY_ENRICHMENT_ONLY"||value?.originalEvidencePreserved!==true||value?.authority!=="NONE")throw new Error("LEGACY_OFFER_BINDING_INVALID");
  return true;
}

export function prepareRakutenLegacyOfferRecovery({sourceSnapshot,binding,incomingCrucial,incomingGSkill,retainedRakutenState,retainedDeltaDigest,preparedAt,unresolvedMultiItem,sourceWithdrawal}={}) {
  validateOperatorVerifiedLegacyOfferBinding(binding);
  if(sourceSnapshot?.snapshotId!==binding.sourceSnapshotId||sourceSnapshot?.materialFingerprint!==binding.sourceSnapshotFingerprint)throw new Error("CURRENT_RECOVERY_SOURCE_CHANGED");
  if(!validTime(preparedAt)||!retainedRakutenState?.stateId||!retainedDeltaDigest||!incomingCrucial||!incomingGSkill)throw new TypeError("CURRENT_RECOVERY_INPUT_INVALID");
  const legacy=findOne(sourceSnapshot.offers,value=>value.offerIdentity===binding.legacyOfferIdentity,"CURRENT_RECOVERY_LEGACY_OFFER_NOT_FOUND");
  const enrichedLegacy=createCurrentOfferProjection({offer:legacy,listingIdentity:binding.listingIdentity});
  const crucial=createCurrentOfferProjection({offer:{...structuredClone(incomingCrucial),sellerName:binding.sellerName,sellerBindingProvenance:{bindingId:binding.bindingId,bindingDigest:binding.bindingDigest,method:"OPERATOR_VERIFIED_EXACT_ITEM_SELLER",originalManualSellerPreserved:true}},listingIdentity:binding.listingIdentity});
  if(enrichedLegacy.offerIdentity!==crucial.offerIdentity)throw new Error("CURRENT_RECOVERY_CRUCIAL_IDENTITY_DID_NOT_CONVERGE");
  if(Date.parse(crucial.observedAt)<=Date.parse(legacy.observedAt))throw new Error("CURRENT_RECOVERY_CRUCIAL_NOT_NEWER");
  const gskill=createCurrentOfferProjection({offer:incomingGSkill,listingIdentity:incomingGSkill.listingIdentity});
  const priorGSkill=findOne(sourceSnapshot.offers,value=>value.atlasProductId===gskill.atlasProductId&&value.retailerId==="RETAILER-0004","CURRENT_RECOVERY_GSKILL_PRIOR_INVALID");
  if(gskill.offerIdentity===priorGSkill.offerIdentity)throw new Error("CURRENT_RECOVERY_GSKILL_IDENTITY_NOT_DISTINCT");
  const expiry=new Date(Date.parse(crucial.observedAt)+36*60*60*1000).toISOString();
  const qualifying=offer=>offer.condition==="NEW"&&offer.availability==="AVAILABLE"&&offer.currency==="USD"&&offer.priceUsd>0&&offer.itemPriceEligible===true&&offer.comparisonEligible===true&&Date.parse(preparedAt)<=Date.parse(expiry)&&offer.sourceIdentity?.historicalRetentionAllowed===false&&offer.destinationId;
  if(!qualifying(crucial)||!qualifying(gskill))throw new Error("CURRENT_RECOVERY_QUALIFICATION_BLOCKED");
  const offers=sourceSnapshot.offers.filter(value=>value.offerIdentity!==legacy.offerIdentity);
  offers.push(crucial,gskill);
  const proposedSnapshot=createCurrentDisplaySnapshot({schemaVersion:"1.1",observedAt:preparedAt,importedAt:preparedAt,source:{workbook:`rakuten-current-recovery:${retainedRakutenState.stateId}`,sheet:"Prepared zero-authority recovery",digest:retainedDeltaDigest},offers});
  const report=validateCurrentDisplaySnapshot(proposedSnapshot);if(!report.valid)throw new Error(`CURRENT_RECOVERY_PROPOSED_SNAPSHOT_INVALID:${report.errors.join(",")}`);
  const exactDiff={oldCount:sourceSnapshot.offers.length,newCount:proposedSnapshot.offers.length,added:1,updated:1,removed:0,identityEnriched:1,unchanged:sourceSnapshot.offers.length-1};
  const common={policyVersion:RAKUTEN_LEGACY_OFFER_RECOVERY_POLICY_VERSION,sourceSnapshotId:sourceSnapshot.snapshotId,sourceSnapshotFingerprint:sourceSnapshot.materialFingerprint,bindingId:binding.bindingId,bindingDigest:binding.bindingDigest,retainedRakutenStateId:retainedRakutenState.stateId,retainedRakutenStateDigest:retainedRakutenState.stateDigest,retainedDeltaDigest,preparedAt,expiry,historyMutation:false,destinationMutation:false,affiliateMutation:false,currentMutationAuthorized:false,authority:"NONE"};
  const preparationFor=(operation,prior,proposed)=>{const material={...common,operation,atlasProductId:proposed.atlasProductId,priorOffer:prior,proposedOffer:proposed};const bindingDigest=digest(material);return freeze({schemaVersion:RAKUTEN_LEGACY_OFFER_RECOVERY_SCHEMA_VERSION,preparationType:"RAKUTEN_NEWEGG_CURRENT_RECOVERY_PREPARATION",preparationId:`mer_currecoveryprep_${bindingDigest.slice(0,24)}`,bindingDigest,...material});};
  const preparations=[preparationFor("SAME_OFFER_REFRESH",legacy,crucial),preparationFor("DISTINCT_OFFER_ADDITION",null,gskill)];
  const planMaterial={...common,planType:"RAKUTEN_NEWEGG_LEGACY_OFFER_RECOVERY_PLAN",exactDiff,proposedSnapshotId:proposedSnapshot.snapshotId,proposedSnapshotFingerprint:proposedSnapshot.materialFingerprint,preparationIds:preparations.map(value=>value.preparationId),unresolvedMultiItem,sourceWithdrawal};
  const planDigest=digest(planMaterial);
  const plan=freeze({schemaVersion:RAKUTEN_LEGACY_OFFER_RECOVERY_SCHEMA_VERSION,planId:`mer_currecovery_${planDigest.slice(0,24)}`,planDigest,...planMaterial,providerCalls:0,paidTasksCreated:0,actualSpendUsd:0});
  return freeze({binding,enrichedLegacy,proposedSnapshot,exactDiff,plan,preparations});
}

export function validateRakutenLegacyOfferRecoveryPlan(plan,{currentSnapshot,retainedRakutenState}={}) {
  const {schemaVersion,planId,planDigest,providerCalls,paidTasksCreated,actualSpendUsd,...material}=plan??{};
  if(schemaVersion!==RAKUTEN_LEGACY_OFFER_RECOVERY_SCHEMA_VERSION||planId!==`mer_currecovery_${digest(material).slice(0,24)}`||planDigest!==digest(material)||providerCalls!==0||paidTasksCreated!==0||actualSpendUsd!==0||material.authority!=="NONE"||material.currentMutationAuthorized!==false)throw new Error("CURRENT_RECOVERY_PLAN_INVALID");
  if(currentSnapshot&&(currentSnapshot.snapshotId!==material.sourceSnapshotId||currentSnapshot.materialFingerprint!==material.sourceSnapshotFingerprint))throw new Error("CURRENT_RECOVERY_SOURCE_CHANGED");
  if(retainedRakutenState&&(retainedRakutenState.stateId!==material.retainedRakutenStateId||retainedRakutenState.stateDigest!==material.retainedRakutenStateDigest))throw new Error("CURRENT_RECOVERY_RAKUTEN_STATE_CHANGED");
  return true;
}
