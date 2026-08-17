import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createAcquisitionBudgetPolicy, createAcquisitionPlan, ControlledAcquisitionExecutor, FileAcquisitionExecutionLedgerRepository, FileSingleWriterRunLock } from "../index.js";

const dir=await mkdtemp(join(tmpdir(),"hr-df004b-"));
const policy=createAcquisitionBudgetPolicy({enabled:true,maxPaidTasksPerRun:3,maxSpendPerRunUsd:.003,maxSpendPerDayUsd:.01,defaultRefreshCooldownMs:1});
const makePlan=(id="a", costs=[.001,.001])=>createAcquisitionPlan({policy,plannedAt:"2026-08-17T06:00:00.000Z",candidates:costs.map((cost,i)=>({candidateId:`${id}-${i}`,priority:"HIGH",estimatedCostUsd:cost,execution:{kind:"FAKE_PAID_POST",key:`${id}-${i}`}}))});
let calls=0;
const transport={execute:async(execution)=>{calls++; return {providerTaskId:`provider-${execution.key}`,status:20100,costUsd:.001};}};
const lock=new FileSingleWriterRunLock({lockPath:join(dir,"run.lock"),heartbeatIntervalMs:100,staleAfterMs:1000});
const ledger=new FileAcquisitionExecutionLedgerRepository({filePath:join(dir,"ledger.json")});
const executor=new ControlledAcquisitionExecutor({runLock:lock,ledgerRepository:ledger,transport,now:()=>"2026-08-17T06:01:00.000Z",runId:()=>"run-1"});
let result=await executor.execute(makePlan());
assert.equal(result.status,"COMPLETED"); assert.equal(result.run.actualSpendUsd,.002); assert.equal(calls,2); assert.equal(result.run.tasks[0].providerTaskId,"provider-a-0");
result=await executor.execute(makePlan()); assert.equal(result.status,"DUPLICATE"); assert.equal(calls,2);

const costlyPlan=makePlan("costly",[.001,.001,.001]); let costlyCalls=0;
const costly=new ControlledAcquisitionExecutor({runLock:lock,ledgerRepository:ledger,transport:{execute:async()=>{costlyCalls++; return {costUsd:costlyCalls===1?.0035:.001,providerTaskId:`c${costlyCalls}`};}},now:()=>"2026-08-17T06:02:00.000Z"});
result=await costly.execute(costlyPlan); assert.equal(result.status,"PARTIAL"); assert.equal(result.run.stopReason,"ACTUAL_RUN_BUDGET"); assert.equal(costlyCalls,1); assert.equal(result.run.actualSpendUsd,.0035);

let failureCalls=0; const failurePlan=makePlan("failure",[.001,.001]);
const failure=new ControlledAcquisitionExecutor({runLock:lock,ledgerRepository:ledger,transport:{execute:async()=>{failureCalls++; const e=new Error("provider failed"); e.costUsd=.001; e.providerTaskId="charged-failure"; throw e;}},now:()=>"2026-08-17T06:03:00.000Z"});
result=await failure.execute(failurePlan); assert.equal(result.status,"FAILED"); assert.equal(failureCalls,1); assert.equal(result.run.actualSpendUsd,.001); assert.equal(result.run.tasks[0].providerTaskId,"charged-failure");

const held=await lock.acquire(); const blockedPlan=makePlan("blocked",[.001]); result=await executor.execute(blockedPlan); assert.equal(result.status,"SKIPPED_LOCKED"); await lock.release(held.owner.ownerId);

const invalid=structuredClone(makePlan("tamper",[.001])); invalid.approvedTaskCount=2; await assert.rejects(()=>executor.execute(invalid),/COUNT_MISMATCH/);
await rm(dir,{recursive:true,force:true});
console.log("Controlled acquisition executor tests passed.");
