import assert from "node:assert/strict";
import {EXISTING_TASK_SUPERVISION_EXIT_CODES,EXISTING_TASK_SUPERVISION_MAX_CHECKS_LIMIT,parseExistingTaskSupervisionArgs,runExistingTaskSupervisionCommand} from "../../../scripts/mercury-existing-task-supervision-cli.mjs";

const runId="mer_fixture_run",members=Array.from({length:5},(_,index)=>({memberKey:`member-${index}`,state:"WAITING_FOR_PROVIDER"}));
const records=members.map((member,index)=>({providerTaskId:`task-${index}`,memberKey:member.memberKey,atlasProductId:`ram-${index}`,supervisionState:index<3?"WAITING_UNTIL_NEXT_CHECK":index===3?"OPERATOR_REVIEW_REQUIRED":"PROVIDER_TERMINAL_FAILURE",attemptCountSinceSupervision:1,lastRetrievalAttemptAt:"2026-10-06T06:00:00.000Z",nextEligibleCheckAt:index<3?"2026-10-06T06:15:00.000Z":null,latestProviderStatus:index<3?"RETRYABLE_PENDING":index===3?"OTHER_REVIEW_REQUIRED":"PROVIDER_TERMINAL_FAILURE",latestProviderStatusCode:index<3?40602:index===4?40103:49999,latestProviderStatusMessage:null,operatorReviewState:index===3?"REQUIRED":"NOT_REQUIRED",operatorReviewReason:index===3?"UNRECOGNIZED_PROVIDER_STATUS":null,terminalReason:index===4?"TASK_EXECUTION_FAILED":null}));
let received=null,closed=0,written="";
const runtimeFactory=()=>({repositories:{boundedRepository:{getRun:id=>id===runId?{runId,state:"WAITING_FOR_PROVIDER",members}:null,close:()=>closed++}},inspectTaskSupervision:()=>({due:5,records}),superviseExistingTasks:async input=>{received=input;return{checks:5,pending:3,due:0,reviewRequired:1,terminalFailures:1,records};}});

assert.deepEqual(parseExistingTaskSupervisionArgs([`--run-id=${runId}`,"--max-checks=5"]),{runId,maxChecks:5});
for(const values of[[],[`--run-id=${runId}`],[`--run-id=${runId}`,"--max-checks=0"],[`--run-id=${runId}`,"--max-checks=-1"],[`--run-id=${runId}`,"--max-checks=1.5"],[`--run-id=${runId}`,`--max-checks=${EXISTING_TASK_SUPERVISION_MAX_CHECKS_LIMIT+1}`],[`--run-id=${runId}`,"--max-checks=5","--provider-task-id=forbidden"]])assert.throws(()=>parseExistingTaskSupervisionArgs(values),error=>error.exitCode===2);
const output=await runExistingTaskSupervisionCommand({values:[`--run-id=${runId}`,"--max-checks=5"],runtimeFactory,write:value=>written=value});
assert.deepEqual(received,{runId,maxChecks:5});
assert.equal(output.checksPerformed,5);
assert.equal(output.reviewRequired,1);
assert.equal(output.providerTerminalFailures,1);
assert.equal(output.newPaidTasks,0);
assert.equal(output.replacementTasks,0);
assert.equal(output.additionalSpendUsd,0);
assert.equal(JSON.parse(written).runId,runId);
assert.doesNotMatch(written,/password|credential|environment/i);
assert.equal(closed,1);

await assert.rejects(()=>runExistingTaskSupervisionCommand({values:["--run-id=missing","--max-checks=5"],runtimeFactory,write:()=>{}}),error=>error.exitCode===EXISTING_TASK_SUPERVISION_EXIT_CODES.CANONICAL_RUN_INVALID);
await assert.rejects(()=>runExistingTaskSupervisionCommand({values:[`--run-id=${runId}`,"--max-checks=5"],runtimeFactory:()=>({...runtimeFactory(),superviseExistingTasks:async()=>{throw new Error("NETWORK_UNAVAILABLE");}}),write:()=>{}}),error=>error.exitCode===EXISTING_TASK_SUPERVISION_EXIT_CODES.SYSTEMIC_FAILURE);

console.log("Existing-provider-task supervision production command tests passed (22 cases).");
