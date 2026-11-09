import assert from "node:assert/strict";
import {mkdtemp,readFile,rm,writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import {FileForgeCommandOutcomeRepository,ForgeCommandOutcomeReconciler,ForgeNeweggRoutineExecutionSupervisor} from "../operations/index.js";

const root=await mkdtemp(path.join(tmpdir(),"forge-command-outcomes-"));
const statePath=path.join(root,"command-outcomes.json");
const repository=new FileForgeCommandOutcomeRepository({statePath});
const base={requestId:"request_000000000001",requestDigest:"a".repeat(64),operatorId:"operator:fixture",action:"RUN_NEWEGG_ROUTINE",runtimeId:"runtime-a"};
const at=index=>`2026-11-08T20:0${index}:00.000Z`;
try{
 await repository.append({...base,state:"ACCEPTED",occurredAt:at(0)});
 await repository.append({...base,state:"DISPATCHED",occurredAt:at(1)});
 await assert.rejects(repository.append({...base,state:"RUNNING",occurredAt:at(2)}),/CANONICAL_ID_REQUIRED/);
 await repository.append({...base,state:"RUNNING",occurredAt:at(2),canonicalOperationId:"mer_neweggroutine_fixture",routineRunId:"mer_neweggroutine_fixture",stage:"ACQUIRE"});
 await repository.append({...base,state:"TERMINAL_FAILURE",occurredAt:at(3),canonicalOperationId:"mer_neweggroutine_fixture",classification:"SFTP_DNS_FAILED"});
 await assert.rejects(repository.append({...base,state:"TERMINAL_SUCCESS",occurredAt:at(4),canonicalOperationId:"mer_neweggroutine_fixture"}),/TRANSITION_CONFLICT/);
 assert.equal((await repository.get(base.requestId)).events.length,4);
 await assert.rejects(repository.append({...base,requestDigest:"b".repeat(64),state:"ACCEPTED",occurredAt:at(0)}),/REPLAY_CONFLICT/);

 const concurrent={...base,requestId:"request_000000000006",requestDigest:"6".repeat(64),state:"ACCEPTED",occurredAt:at(0)};
 const concurrentResults=await Promise.allSettled([repository.append(concurrent),repository.append(concurrent)]);
 assert.ok(concurrentResults.some(result=>result.status==="fulfilled"));
 assert.equal((await repository.get(concurrent.requestId)).events.length,1,"concurrent duplicate acceptance must not create duplicate evidence");

 const restartRequest={...base,requestId:"request_000000000002",requestDigest:"c".repeat(64)};
 await repository.append({...restartRequest,state:"ACCEPTED",occurredAt:at(0)});
 await repository.append({...restartRequest,state:"DISPATCHED",occurredAt:at(1)});
 const reconciler=new ForgeCommandOutcomeReconciler({repository,runtimeId:"runtime-b",now:()=>at(4),evidenceProvider:async()=>({activeRun:null,lastSuccessfulRun:null,lastFailedRun:null})});
 await reconciler.reconcileAll();
 assert.equal((await repository.get(restartRequest.requestId)).events.at(-1).state,"AMBIGUOUS");

 const activeRequest={...base,requestId:"request_000000000003",requestDigest:"d".repeat(64),runtimeId:"runtime-b"};
 await repository.append({...activeRequest,state:"ACCEPTED",occurredAt:at(0)});
 await repository.append({...activeRequest,state:"DISPATCHED",occurredAt:at(1)});
 const activeReconciler=new ForgeCommandOutcomeReconciler({repository,runtimeId:"runtime-b",now:()=>at(2),evidenceProvider:async()=>({activeRun:{runId:"mer_neweggroutine_active",completedStages:["PREFLIGHT"]}})});
 await activeReconciler.reconcileAll();
 assert.equal((await repository.get(activeRequest.requestId)).events.at(-1).state,"RUNNING");

 const command={execute:async()=>({runId:"mer_neweggroutine_success",status:"SUCCESS_NO_CHANGE",completedStages:["SENTINEL"]})};
 const supervisor=new ForgeNeweggRoutineExecutionSupervisor({command,outcomeRepository:repository,runtimeId:"runtime-b",now:(()=>{let i=0;return()=>`2026-11-08T21:0${i++}:00.000Z`;})()});
 const accepted=await supervisor.start({requestId:"request_000000000004",requestDigest:"e".repeat(64),action:"RUN_NEWEGG_ROUTINE",operatorId:"operator:fixture",mode:"RUN_TODAY",mandateId:"mandate-fixture"});
 assert.equal(accepted.status,"ACCEPTED");
 await supervisor.active.promise;
 assert.deepEqual((await repository.get("request_000000000004")).events.map(event=>event.state),["ACCEPTED","DISPATCHED","RUNNING","TERMINAL_SUCCESS"]);

 const failedSupervisor=new ForgeNeweggRoutineExecutionSupervisor({command:{execute:async()=>({runId:"mer_neweggroutine_failed",status:"REVIEW_REQUIRED",failedStage:"ACQUIRE",failure:{code:"SFTP_DNS_FAILED"}})},outcomeRepository:repository,runtimeId:"runtime-b",now:(()=>{let i=0;return()=>`2026-11-08T22:0${i++}:00.000Z`;})()});
 await failedSupervisor.start({requestId:"request_000000000005",requestDigest:"f".repeat(64),action:"RUN_NEWEGG_ROUTINE",operatorId:"operator:fixture",mode:"RUN_TODAY",mandateId:"mandate-fixture"});
 await failedSupervisor.active.promise;
 assert.equal((await repository.get("request_000000000005")).events.at(-1).state,"TERMINAL_FAILURE");
 assert.equal((await repository.get("request_000000000005")).events.at(-1).classification,"SFTP_DNS_FAILED");

 const persisted=JSON.parse(await readFile(statePath,"utf8"));
 assert.equal(persisted.schemaVersion,"1.0");
 await writeFile(statePath,"{invalid json");
 await assert.rejects(repository.getAll(),/STATE_INVALID/);
 console.log("Forge command outcome journal: 24 assertions passed");
}finally{await rm(root,{recursive:true,force:true});}
