import crypto from "node:crypto";

export const NEWEGG_ROUTINE_POLICY_VERSION="NEWEGG-ROUTINE-MARKET-OBSERVATION-P1-1.0";
export const NEWEGG_ROUTINE_STAGES=Object.freeze(["PREFLIGHT","ACQUISITION","VALIDATION","CATALOG","BINDING","QUALIFICATION","PREPARE","CURRENT","HISTORY","QA","RECOMPOSITION","CERTIFICATION","RELEASE_CERTIFICATION","COMPLETE"]);
const stable=value=>Array.isArray(value)?`[${value.map(stable).join(",")}]`:value&&typeof value==="object"?`{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`:JSON.stringify(value);
export const neweggRoutineDigest=value=>crypto.createHash("sha256").update(stable(value)).digest("hex");
const freeze=value=>Object.freeze(structuredClone(value));

export function createNeweggRoutineRun({provider="RAKUTEN_ADVERTISING",source="RAKUTEN_NEWEGG_PRODUCT_CATALOG",feedFamily="RAKUTEN_MAIN:44583:4746097",fullDigest,hdrObservedAt,sourceCurrent,sourceHistory,rightsDigest,routineVersion=NEWEGG_ROUTINE_POLICY_VERSION}={}){
  if(!/^[a-f0-9]{64}$/i.test(fullDigest??"")||!Number.isFinite(Date.parse(hdrObservedAt))||!sourceCurrent?.snapshotId||!sourceCurrent?.hash||!Number.isInteger(sourceHistory?.sequence)||!sourceHistory?.hash||!/^[a-f0-9]{64}$/i.test(rightsDigest??""))throw new TypeError("NEWEGG_ROUTINE_INPUT_INVALID");
  const semantic={routineVersion,provider,source,feedFamily,fullDigest:fullDigest.toLowerCase(),hdrObservedAt:new Date(hdrObservedAt).toISOString(),sourceCurrent,sourceHistory,rightsDigest:rightsDigest.toLowerCase()};
  const bindingDigest=neweggRoutineDigest(semantic);
  return freeze({schemaVersion:"1.0",runType:"NEWEGG_ROUTINE_MARKET_OBSERVATION",runId:`mer_neweggroutine_${bindingDigest.slice(0,24)}`,bindingDigest,...semantic,stage:"PREFLIGHT",completedStages:[],stageResults:{},providerCalls:0,fullDownloads:0,deltaDownloads:0,retries:0,paidTasks:0,actualSpendUsd:0,authority:"NONE",releaseAuthority:false,deploymentAuthority:false});
}

export function advanceNeweggRoutine(run,{stage,result={}}={}){
  const expected=NEWEGG_ROUTINE_STAGES[run.completedStages.length];
  if(stage!==expected)throw new Error(`NEWEGG_ROUTINE_STAGE_INVALID:${expected}`);
  const completedStages=[...run.completedStages,stage],next=NEWEGG_ROUTINE_STAGES[completedStages.length]??"COMPLETE";
  return freeze({...run,stage:stage==="COMPLETE"?"COMPLETE":next,completedStages,stageResults:{...run.stageResults,[stage]:result}});
}

export function nextIncompleteNeweggRoutineStage(run){return NEWEGG_ROUTINE_STAGES.find(stage=>!run.completedStages.includes(stage))??"COMPLETE";}

export function assertNeweggRoutineResumeSafe(run){
  if(run.runId!==`mer_neweggroutine_${run.bindingDigest.slice(0,24)}`||run.bindingDigest!==neweggRoutineDigest({routineVersion:run.routineVersion,provider:run.provider,source:run.source,feedFamily:run.feedFamily,fullDigest:run.fullDigest,hdrObservedAt:run.hdrObservedAt,sourceCurrent:run.sourceCurrent,sourceHistory:run.sourceHistory,rightsDigest:run.rightsDigest}))throw new Error("NEWEGG_ROUTINE_BINDING_INVALID");
  return nextIncompleteNeweggRoutineStage(run);
}
