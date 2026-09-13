import crypto from "node:crypto";
const stable=value=>Array.isArray(value)?`[${value.map(stable).join(",")}]`:value&&typeof value==="object"?`{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`:JSON.stringify(value);
const hash=value=>crypto.createHash("sha256").update(stable(value)).digest("hex");
const freeze=value=>Object.freeze(structuredClone(value));
export const PAID_ACTION_RECOVERY_STATES=Object.freeze({SAFE_NO_PROVIDER_TASK:"SAFE_NO_PROVIDER_TASK",PROVIDER_TASK_STATUS_UNKNOWN:"PROVIDER_TASK_STATUS_UNKNOWN",PROVIDER_TASK_CREATED:"PROVIDER_TASK_CREATED"});
export function assessPaidActionRecovery({authorization,executionRun,taskLedger=[]}={}){
 if(!authorization?.authorizationId||!executionRun?.runId||executionRun.planId!==authorization.plan?.planId||!Array.isArray(taskLedger))throw new Error("PAID_ACTION_RECOVERY_INPUT_INVALID");
 const paidActionIntentId=authorization.plan?.decisions?.[0]?.execution?.paidActionIntentId;
 if(!paidActionIntentId)throw new Error("PAID_ACTION_RECOVERY_INPUT_INVALID");
 const matchingRunTasks=(executionRun.tasks??[]).filter(row=>row?.paidActionIntentId===paidActionIntentId);
 if(matchingRunTasks.length!==1)throw new Error("PAID_ACTION_RECOVERY_EXECUTION_LINEAGE_INVALID");
 const task=matchingRunTasks[0],durable=taskLedger.filter(row=>row?.paidActionIntentId===paidActionIntentId),reasons=[];
 let state;
 if(durable.length||task?.providerTaskId){state=PAID_ACTION_RECOVERY_STATES.PROVIDER_TASK_CREATED;reasons.push("DURABLE_PROVIDER_TASK_EXISTS");}
 else if(executionRun.actualSpendUsd!==0||task?.actualCostUsd!==0){state=PAID_ACTION_RECOVERY_STATES.PROVIDER_TASK_STATUS_UNKNOWN;reasons.push("NONZERO_SPEND_WITHOUT_TASK_LINEAGE");}
 else if(task?.failure?.failureClass==="PROVIDER_REJECTION"&&task.failure.providerTaskCreationCertainty==="NO_TASK"){state=PAID_ACTION_RECOVERY_STATES.SAFE_NO_PROVIDER_TASK;reasons.push("PROVIDER_REJECTED_NO_TASK");}
 else if(task?.failure?.providerTaskCreationCertainty==="NO_TASK"||task?.failure?.failureStage==="BEFORE_PROVIDER_REQUEST"&&task.failure.providerRequestDispatched===false||task?.failure?.causeChain?.[0]?.name==="TypeError"&&/is not a function$/i.test(task.failure.causeChain[0].message??"")){state=PAID_ACTION_RECOVERY_STATES.SAFE_NO_PROVIDER_TASK;reasons.push("PRE_REQUEST_LOCAL_FAILURE");}
 else{state=PAID_ACTION_RECOVERY_STATES.PROVIDER_TASK_STATUS_UNKNOWN;reasons.push("PROVIDER_REQUEST_OUTCOME_NOT_PROVEN");}
 const material={authorizationId:authorization.authorizationId,executionRunId:executionRun.runId,paidActionIntentId,state,reasons,providerTaskIds:durable.map(row=>row.taskId),actualSpendUsd:executionRun.actualSpendUsd};
 return freeze({schemaVersion:"1.0",assessmentId:`mer_paidrecovery_${hash(material).slice(0,24)}`,...material,recoveryAuthorizationEligible:state===PAID_ACTION_RECOVERY_STATES.SAFE_NO_PROVIDER_TASK});
}
