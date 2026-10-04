import crypto from "node:crypto";

export const NEWEGG_ROUTINE_COMMAND_VERSION="NEWEGG-ROUTINE-PRODUCTION-COMMAND-P1-1.0";
export const NEWEGG_ROUTINE_COMMAND_MODES=Object.freeze(["PRODUCTION","RETAINED_EVIDENCE","FIXTURE"]);
export const NEWEGG_ROUTINE_COMMAND_STAGES=Object.freeze(["PREFLIGHT","ACQUISITION","VALIDATION","CATALOG","BINDING","QUALIFICATION","PREPARE","CURRENT","HISTORY","QA","RECOMPOSITION","CERTIFICATION","RELEASE_CERTIFICATION","RETENTION_ASSESSMENT","FORGE_PROJECTION","FORGE_TRANSPORT"]);
export const NEWEGG_ROUTINE_COMMAND_OUTCOMES=Object.freeze(["SUCCESS_RELEASE_READY","SUCCESS_NO_CHANGE","BLOCKED_ACTIVE_RUN","PROVIDER_FAILURE","INTEGRITY_FAILURE","QUALIFICATION_REVIEW_REQUIRED","CURRENT_FAILURE","HISTORY_FAILURE","QA_FAILURE","RECOMPOSITION_FAILURE","CERTIFICATION_FAILURE","FORGE_TRANSPORT_FAILURE"]);
const terminal=new Set(["SUCCESS_RELEASE_READY","SUCCESS_NO_CHANGE"]);
const stable=value=>Array.isArray(value)?`[${value.map(stable).join(",")}]`:value&&typeof value==="object"?`{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`:JSON.stringify(value);
const digest=value=>crypto.createHash("sha256").update(stable(value)).digest("hex");
const copy=value=>structuredClone(value);
const failOutcome={ACQUISITION:"PROVIDER_FAILURE",VALIDATION:"INTEGRITY_FAILURE",CATALOG:"INTEGRITY_FAILURE",BINDING:"INTEGRITY_FAILURE",QUALIFICATION:"QUALIFICATION_REVIEW_REQUIRED",PREPARE:"QUALIFICATION_REVIEW_REQUIRED",CURRENT:"CURRENT_FAILURE",HISTORY:"HISTORY_FAILURE",QA:"QA_FAILURE",RECOMPOSITION:"RECOMPOSITION_FAILURE",CERTIFICATION:"CERTIFICATION_FAILURE",RELEASE_CERTIFICATION:"CERTIFICATION_FAILURE",RETENTION_ASSESSMENT:"CERTIFICATION_FAILURE",FORGE_PROJECTION:"CERTIFICATION_FAILURE",FORGE_TRANSPORT:"FORGE_TRANSPORT_FAILURE"};

export class NeweggRoutineProductionCommand{
 constructor({runRepository,overlapOwner,stageOwners,now=()=>new Date().toISOString()}={}){if(!runRepository?.loadActive||!runRepository?.save||!overlapOwner?.assess)throw new TypeError("NEWEGG_ROUTINE_COMMAND_OWNER_REQUIRED");this.runRepository=runRepository;this.overlapOwner=overlapOwner;this.stageOwners=stageOwners??{};this.now=now;}
 async execute({mode="PRODUCTION",input={}}={}){
  if(!NEWEGG_ROUTINE_COMMAND_MODES.includes(mode))throw new TypeError("NEWEGG_ROUTINE_COMMAND_MODE_INVALID");
  const active=await this.runRepository.loadActive();
  if(!active){const overlap=await this.overlapOwner.assess({asOf:this.now(),activeRun:null});if(overlap.state==="BLOCKED_ACTIVE_RUN")return this.result("BLOCKED_ACTIVE_RUN",null,0);}
  else if(active.bindingDigest!==input.bindingDigest)return this.result("BLOCKED_ACTIVE_RUN",active,2);
  let run=active??{schemaVersion:"1.0",commandVersion:NEWEGG_ROUTINE_COMMAND_VERSION,runId:`mer_neweggroutinecmd_${digest({mode,bindingDigest:input.bindingDigest}).slice(0,24)}`,bindingDigest:input.bindingDigest,mode,status:"RUNNING",completedStages:[],stageResults:{},providerEnvelope:{rakutenSessionsMaximum:1,fullDownloadsMaximum:1,deltaDownloadsMaximum:0,automaticRetries:0,concurrencyMaximum:1,dataForSeoCallsMaximum:0,paidTasksMaximum:0,maximumSpendUsd:0},affiliateRevalidation:false,releaseAuthority:false,startedAt:this.now(),updatedAt:this.now()};
  await this.runRepository.save(run);
  for(const stage of NEWEGG_ROUTINE_COMMAND_STAGES){
   if(run.completedStages.includes(stage))continue;
   const owner=this.stageOwners[stage];if(!owner?.execute)throw new TypeError(`NEWEGG_ROUTINE_STAGE_OWNER_REQUIRED:${stage}`);
   try{
    const stageResult=await owner.execute({mode,input:copy(input),run:copy(run),priorResults:copy(run.stageResults)});
    if(stageResult?.status==="REVIEW_REQUIRED")return await this.stop(run,stage,"QUALIFICATION_REVIEW_REQUIRED",stageResult);
    run={...run,completedStages:[...run.completedStages,stage],stageResults:{...run.stageResults,[stage]:copy(stageResult??{})},updatedAt:this.now()};await this.runRepository.save(run);
   }catch(error){return await this.stop(run,stage,failOutcome[stage]??"INTEGRITY_FAILURE",{code:error?.code??error?.message??"UNKNOWN_ERROR"});}
  }
  const unchanged=Object.values(run.stageResults).some(value=>value?.status==="NO_CHANGE"||value?.status==="REPLAY");const outcome=unchanged?"SUCCESS_NO_CHANGE":"SUCCESS_RELEASE_READY";
  run={...run,status:outcome,completedAt:this.now(),updatedAt:this.now()};await this.runRepository.save(run);return this.result(outcome,run,0);
 }
 async stop(run,stage,outcome,detail){const stopped={...run,status:outcome,failedStage:stage,failure:copy(detail),updatedAt:this.now()};await this.runRepository.save(stopped);return this.result(outcome,stopped,1);}
 result(outcome,run,exitCode){return Object.freeze({schemaVersion:"1.0",command:"mercury:newegg:routine",outcome,success:terminal.has(outcome),exitCode,runId:run?.runId??null,completedStages:copy(run?.completedStages??[]),providerCalls:run?.stageResults?.ACQUISITION?.providerCalls??0,paidTasks:0,actualSpendUsd:0,releaseAuthority:false,deploymentAuthority:false});}
}
