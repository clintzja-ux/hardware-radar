import assert from "node:assert/strict";
import {ExistingTaskSupervisionScheduler} from "../bounded/ExistingTaskSupervisionScheduler.js";

const at="2026-10-06T12:00:00.000Z",future="2026-10-06T13:00:00.000Z";
const records=[
 {runId:"run-a",memberKey:"a",providerTaskId:"task-a",supervisionState:"CHECK_DUE",nextEligibleCheckAt:at,firstKnownAt:"2026-10-06T10:00:00.000Z"},
 {runId:"run-b",memberKey:"b",providerTaskId:"task-b",supervisionState:"WAITING_UNTIL_NEXT_CHECK",nextEligibleCheckAt:future,firstKnownAt:"2026-10-06T11:00:00.000Z"},
 {runId:"run-old",memberKey:"c",providerTaskId:"task-c",supervisionState:"COMPLETED",nextEligibleCheckAt:null,firstKnownAt:"2026-10-05T11:00:00.000Z"}
];
const repository={listAllTaskSupervisions:()=>structuredClone(records),listDueTaskSupervisions:({asOf,limit})=>records.filter(x=>["PENDING_PROVIDER","CHECK_DUE","WAITING_UNTIL_NEXT_CHECK"].includes(x.supervisionState)&&(!x.nextEligibleCheckAt||x.nextEligibleCheckAt<=asOf)).slice(0,limit)};
let saved,calls=[];const scheduler=new ExistingTaskSupervisionScheduler({repository,superviseRun:async input=>{calls.push(input);return{checks:1,pending:0,due:0,reviewRequired:0,terminalFailures:0};},receiptRepository:{record:async value=>{saved=value;return{status:"RECORDED",value};}},now:()=>at,maximumChecksPerInvocation:2});
const inspect=scheduler.inspect({asOf:at,enabled:true});assert.equal(inspect.tracked,3);assert.equal(inspect.pending,2);assert.equal(inspect.due,1);assert.equal(inspect.nextDueCheckAt,at);assert.equal(inspect.additionalSpendUsd,0);
const result=await scheduler.run({maxChecks:1});assert.deepEqual(calls,[{runId:"run-a",maxChecks:1}]);assert.equal(result.checksPerformed,1);assert.equal(result.newPaidTasks,0);assert.equal(result.additionalSpendUsd,0);assert.equal(saved.invocationId,result.invocationId);
await assert.rejects(()=>scheduler.run({maxChecks:3}),/BOUND_INVALID/);
const idle=new ExistingTaskSupervisionScheduler({repository:{...repository,listDueTaskSupervisions:()=>[]},superviseRun:async()=>{throw new Error("must not run");},receiptRepository:{record:async value=>({value})},now:()=>at}).run();assert.equal((await idle).networkOperation,"NONE");
console.log("ExistingTaskSupervisionScheduler.test.mjs: PASS");
