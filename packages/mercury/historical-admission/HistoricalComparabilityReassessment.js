import crypto from "node:crypto";
import {HISTORICAL_OFFER_COMPARABILITY_POLICY_VERSION} from "./HistoricalOfferComparabilityAssessment.js";

export const HISTORICAL_COMPARABILITY_REASSESSMENT_VERSION="DATAFORSEO-AMAZON-HISTORICAL-COMPARABILITY-RECOVERY-P1-1.0";
const stable=v=>Array.isArray(v)?`[${v.map(stable).join(",")}]`:v&&typeof v==="object"?`{${Object.keys(v).sort().map(k=>`${JSON.stringify(k)}:${stable(v[k])}`).join(",")}}`:JSON.stringify(v);
const digest=v=>crypto.createHash("sha256").update(stable(v)).digest("hex");
const freeze=v=>{if(v&&typeof v==="object"&&!Object.isFrozen(v)){Object.freeze(v);for(const x of Object.values(v))freeze(x)}return v};
const material=v=>({observationId:v.observationId,retainedEvidenceId:v.retainedEvidenceId,immutableProviderResultId:v.immutableProviderResultId,immutableProviderResultDigest:v.immutableProviderResultDigest,atlasProductId:v.atlasProductId,governedAsin:v.governedAsin,priorClassification:v.priorClassification,newAssessment:v.newAssessment,comparabilityPolicyVersion:v.comparabilityPolicyVersion,migrationVersion:v.migrationVersion,titleDigest:v.titleDigest,rightsProfileDigest:v.rightsProfileDigest});

export function createHistoricalComparabilityReassessment(input={}){
 const value={schemaVersion:"1.0",...material({...input,comparabilityPolicyVersion:HISTORICAL_OFFER_COMPARABILITY_POLICY_VERSION,migrationVersion:HISTORICAL_COMPARABILITY_REASSESSMENT_VERSION}),recordedAt:input.recordedAt};
 value.bindingDigest=digest(material(value));value.reassessmentId=`mer_histcomparereassess_${value.bindingDigest.slice(0,24)}`;
 validateHistoricalComparabilityReassessment(value);return freeze(value);
}
export function validateHistoricalComparabilityReassessment(value){
 const m=material(value),valid=value?.schemaVersion==="1.0"&&value?.migrationVersion===HISTORICAL_COMPARABILITY_REASSESSMENT_VERSION&&value?.comparabilityPolicyVersion===HISTORICAL_OFFER_COMPARABILITY_POLICY_VERSION&&[value.observationId,value.retainedEvidenceId,value.immutableProviderResultId,value.atlasProductId,value.governedAsin,value.priorClassification,value.newAssessment?.assessmentId,value.newAssessment?.classification].every(x=>typeof x==="string"&&x.trim())&&[value.immutableProviderResultDigest,value.titleDigest,value.rightsProfileDigest,value.bindingDigest].every(x=>/^[a-f0-9]{64}$/.test(x??""))&&value.bindingDigest===digest(m)&&value.reassessmentId===`mer_histcomparereassess_${value.bindingDigest.slice(0,24)}`&&Number.isFinite(Date.parse(value.recordedAt));
 if(!valid)throw new Error("HISTORICAL_COMPARABILITY_REASSESSMENT_INVALID");return true;
}
export function projectEffectiveHistoricalObservation(observation,reassessments=[]){
 const applicable=reassessments.filter(x=>x.observationId===observation.observationId);if(!applicable.length)return freeze(structuredClone(observation));
 for(const item of applicable)validateHistoricalComparabilityReassessment(item);const versions=new Set(applicable.map(x=>x.migrationVersion));if(versions.size!==applicable.length)throw new Error("HISTORICAL_COMPARABILITY_REASSESSMENT_CONFLICT");
 const latest=[...applicable].sort((a,b)=>Date.parse(a.recordedAt)-Date.parse(b.recordedAt)||a.reassessmentId.localeCompare(b.reassessmentId)).at(-1);if(latest.retainedEvidenceId!==observation.provenance?.retainedEvidenceId||latest.atlasProductId!==observation.atlasProductId||latest.priorClassification!==observation.comparability?.classification)throw new Error("HISTORICAL_COMPARABILITY_REASSESSMENT_LINEAGE_CONFLICT");
 const projected=structuredClone(observation);projected.comparability={policyVersion:latest.newAssessment.policyVersion,assessmentId:latest.newAssessment.assessmentId,classification:latest.newAssessment.classification,reasons:[...latest.newAssessment.reasons],standaloneEligible:latest.newAssessment.historicalStandaloneEligible,effectiveReassessmentId:latest.reassessmentId};return freeze(projected);
}
