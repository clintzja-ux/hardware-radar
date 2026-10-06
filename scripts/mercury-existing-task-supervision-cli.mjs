import {createProductionProductsIdentityDiscoveryService} from "../packages/mercury/bounded/ProductionProductsIdentityDiscovery.js";

export const EXISTING_TASK_SUPERVISION_MAX_CHECKS_LIMIT=200;
export const EXISTING_TASK_SUPERVISION_EXIT_CODES=Object.freeze({SUCCESS:0,INVALID_INPUT_OR_CONFIGURATION:2,CANONICAL_RUN_INVALID:3,SYSTEMIC_FAILURE:4});

const freeze=value=>Object.freeze(structuredClone(value));
const required=(value,code)=>{if(typeof value!=="string"||!value.trim())throw Object.assign(new Error(code),{exitCode:EXISTING_TASK_SUPERVISION_EXIT_CODES.INVALID_INPUT_OR_CONFIGURATION});return value.trim();};

export function parseExistingTaskSupervisionArgs(values=[]){
 const args=new Map();
 for(const value of values){const at=value.indexOf("=");if(at<1)throw Object.assign(new Error("EXISTING_TASK_SUPERVISION_ARGUMENT_INVALID"),{exitCode:2});const key=value.slice(0,at),entry=value.slice(at+1);if(!["--run-id","--max-checks"].includes(key)||args.has(key))throw Object.assign(new Error(`EXISTING_TASK_SUPERVISION_ARGUMENT_NOT_ALLOWED:${key}`),{exitCode:2});args.set(key,entry);}
 const runId=required(args.get("--run-id"),"EXISTING_TASK_SUPERVISION_RUN_REQUIRED"),maximum=Number(args.get("--max-checks"));
 if(!Number.isInteger(maximum)||maximum<1||maximum>EXISTING_TASK_SUPERVISION_MAX_CHECKS_LIMIT)throw Object.assign(new Error("EXISTING_TASK_SUPERVISION_MAX_CHECKS_INVALID"),{exitCode:2});
 return freeze({runId,maxChecks:maximum});
}
const summarizeRun=run=>({state:run.state,total:run.members.length,completed:run.members.filter(value=>value.state==="COMPLETED").length,pending:run.members.filter(value=>value.state==="WAITING_FOR_PROVIDER").length,exceptions:run.members.filter(value=>value.state==="EXCEPTION").length});

export async function runExistingTaskSupervisionCommand({values=process.argv.slice(2),runtimeFactory=createProductionProductsIdentityDiscoveryService,write=console.log}={}){
 const input=parseExistingTaskSupervisionArgs(values);let runtime;
 try{
  runtime=runtimeFactory();const repository=runtime?.repositories?.boundedRepository,run=repository?.getRun?.(input.runId);if(!run)throw Object.assign(new Error("EXISTING_TASK_SUPERVISION_RUN_NOT_FOUND"),{exitCode:3});
  const before=runtime.inspectTaskSupervision({runId:input.runId}),result=await runtime.superviseExistingTasks(input),afterRun=repository.getRun(input.runId),records=result.records.map(value=>({providerTaskId:value.providerTaskId,memberKey:value.memberKey,atlasProductId:value.atlasProductId,supervisionState:value.supervisionState,attemptCountSinceSupervision:value.attemptCountSinceSupervision,lastRetrievalAttemptAt:value.lastRetrievalAttemptAt,nextEligibleCheckAt:value.nextEligibleCheckAt,latestProviderStatus:value.latestProviderStatus,latestProviderStatusCode:value.latestProviderStatusCode,latestProviderStatusMessage:value.latestProviderStatusMessage,operatorReviewState:value.operatorReviewState,operatorReviewReason:value.operatorReviewReason,terminalReason:value.terminalReason})),output=freeze({schemaVersion:"1.0",command:"MERCURY_EXISTING_TASK_SUPERVISION",runId:input.runId,requestedMaxChecks:input.maxChecks,eligibleDueBefore:before.due,checksPerformed:result.checks,skippedNotDueOrIneligible:Math.max(0,before.records.length-before.due),completedThisInvocation:Math.max(0,summarizeRun(afterRun).completed-summarizeRun(run).completed),tracked:records.length,stillPending:result.pending,due:result.due,reviewRequired:result.reviewRequired,providerTerminalFailures:result.terminalFailures,taskNotFound:records.filter(value=>value.latestProviderStatus==="TASK_NOT_FOUND").length,records,runReconciliation:summarizeRun(afterRun),newPaidTasks:0,replacementTasks:0,additionalSpendUsd:0,automaticPaidRetries:0});write(JSON.stringify(output,null,2));return output;
 }catch(error){if(Number.isInteger(error?.exitCode))throw error;if(/RUN_NOT_FOUND|RUN_REQUIRED|LINEAGE_INVALID/.test(String(error?.message)))error.exitCode=3;else error.exitCode=4;throw error;
 }finally{runtime?.repositories?.boundedRepository?.close?.();}
}
