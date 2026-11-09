const STAGE_STATUSES=Object.freeze(["NOT_STARTED","ACTIVE","COMPLETED","FAILED","SKIPPED","NOT_REACHED","AMBIGUOUS","EVIDENCE_UNAVAILABLE"]);
const ORIGINS=Object.freeze(["SCHEDULED","FORGE","OTHER_AUTHORIZED","UNKNOWN"]);
const freeze=value=>Object.freeze(structuredClone(value));

export const ACQUISITION_PROGRESS_STAGE_STATUSES=STAGE_STATUSES;
export const ACQUISITION_PROGRESS_ORIGINS=ORIGINS;

export function createAcquisitionProgressProjection(input={}){
 const provider=input.provider,routine=input.routine,manifest=input.stageManifest,stages=input.stages;
 if(!provider?.providerId||!provider?.displayName||!routine?.routineType||(!routine?.runId&&!input.acquisition?.operationId)||!Array.isArray(manifest)||!Array.isArray(stages)||manifest.length!==stages.length)throw new TypeError("ACQUISITION_PROGRESS_PROJECTION_INVALID");
 if(!ORIGINS.includes(routine.origin)||stages.some((stage,index)=>stage.id!==manifest[index].id||!STAGE_STATUSES.includes(stage.status)))throw new TypeError("ACQUISITION_PROGRESS_PROJECTION_INVALID");
 return freeze({schemaVersion:"1.0",projectionType:"ACQUISITION_PROGRESS",provider,routine,stageManifest:manifest,stages,workflow:{completedStageCount:stages.filter(value=>value.status==="COMPLETED").length,totalStageCount:manifest.length,activeStageId:stages.find(value=>value.status==="ACTIVE")?.id??null,percentage:null},acquisition:input.acquisition??null,downstream:input.downstream??{},terminal:input.terminal??null,freshness:input.freshness,sources:input.sources??[],readOnly:true,authorityConsumed:false,canonicalMutation:false});
}
