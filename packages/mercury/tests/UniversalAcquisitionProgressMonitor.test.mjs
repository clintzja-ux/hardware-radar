import assert from "node:assert/strict";
import {ProductionNeweggAcquisitionProgressProvider} from "../operations/ProductionNeweggAcquisitionProgressProvider.js";

const stages=["PREFLIGHT","ACQUISITION","VALIDATION","CATALOG","BINDING","QUALIFICATION","PREPARE","HISTORY","CURRENT","QA","RECOMPOSITION","CERTIFICATION","RELEASE_CERTIFICATION","RETENTION_ASSESSMENT","FORGE_PROJECTION","FORGE_TRANSPORT"];
const run={runId:"mer_run_1",bindingDigest:"a".repeat(64),status:"RUNNING",startedAt:"2026-11-09T20:00:00.000Z",updatedAt:"2026-11-09T20:02:00.000Z",completedStages:["PREFLIGHT","ACQUISITION","VALIDATION"],stageResults:{ACQUISITION:{canonicalReceipt:{outputArtifact:{bytes:1234,digest:"b".repeat(64)}}},VALIDATION:{canonicalReceipt:{outputArtifact:{productRows:159,trailerCount:159}}}}};
const base={runs:[run],scheduler:null,bootstrap:{operations:{}},publication:null,forgeRecords:[]};
const provider=evidence=>new ProductionNeweggAcquisitionProgressProvider({runStatePath:"x",schedulerHealthPath:"y",bootstrapStatePath:"z",evidenceReader:async()=>evidence,now:()=>"2026-11-09T20:03:00.000Z"});

let result=await provider(base).list(),view=result.current;
assert.equal(view.stageManifest.length,16);assert.deepEqual(view.stageManifest.map(value=>value.id),stages);assert.equal(view.workflow.completedStageCount,3);assert.equal(view.workflow.percentage,null);assert.equal(view.stages[3].status,"ACTIVE");assert.equal(view.stages[1].metrics[0].value,1234);assert.equal(view.stages[2].metrics[0].value,159);assert.equal(view.routine.origin,"UNKNOWN");assert.equal(view.routine.originLabel,"Origin Unverified");

const forge={requestId:"forge_req_1",events:[{state:"ACCEPTED",occurredAt:"2026-11-09T19:59:59.000Z"},{state:"RUNNING",routineRunId:run.runId}]};
view=(await provider({...base,forgeRecords:[forge]}).list()).current;assert.equal(view.routine.origin,"FORGE");assert.equal(view.routine.originLabel,"Manual / Forge Operator");assert.equal(view.routine.forgeRequestId,forge.requestId);

const scheduler={routineRunId:run.runId,attemptId:"sched_1",attemptedAt:"2026-11-09T20:00:00.000Z"};
view=(await provider({...base,scheduler}).list()).current;assert.equal(view.routine.origin,"SCHEDULED");assert.equal(view.routine.originLabel,"Scheduled / Automatic");assert.equal(view.routine.schedulerAttemptId,"sched_1");
view=(await provider({...base,scheduler,forgeRecords:[forge]}).list()).current;assert.equal(view.routine.origin,"UNKNOWN");assert.equal(view.routine.originLabel,"Origin Unverified");assert.equal(view.routine.contradictory,true);
view=(await provider({...base,runs:[{...run,origin:{type:"TRUSTED_CLI_OPERATOR",evidenceId:"audit-1"}}]}).list()).current;assert.equal(view.routine.origin,"OTHER_AUTHORIZED");assert.equal(view.routine.originLabel,"TRUSTED_CLI_OPERATOR");

const bootstrap={operationId:"mer_live_1",status:"INTENT_AUTHORIZED",createdAt:"2026-11-09T20:05:00.000Z",updatedAt:"2026-11-09T20:06:00.000Z",bytesDurablyReceived:4096,totalBytes:8192,leaseHeld:true};
view=(await provider({...base,runs:[],bootstrap:{operations:{[bootstrap.operationId]:bootstrap}}}).list()).current;assert.equal(view.routine.runId,null);assert.equal(view.acquisition.operationId,bootstrap.operationId);assert.equal(view.stages[1].status,"ACTIVE");assert.equal(view.acquisition.bytesReceived,4096);assert.equal(view.acquisition.totalBytes,8192);assert.equal(view.routine.origin,"UNKNOWN");

const failed={...run,status:"ACQUISITION_FAILED",failedStage:"CATALOG",failure:{code:"CATALOG_CONFLICT"},completedAt:"2026-11-09T20:04:00.000Z"};
view=(await provider({...base,runs:[failed]}).list()).current;assert.equal(view.stages[3].status,"FAILED");assert.ok(view.stages.slice(4).every(value=>value.status==="NOT_REACHED"));assert.equal(view.terminal.status,"TERMINAL_FAILURE");
for(let index=0;index<stages.length;index++){const boundary={...run,status:"ROUTINE_FAILED",completedStages:stages.slice(0,index),stageResults:{},failedStage:stages[index],failure:{code:`${stages[index]}_FAILED`}};const projected=(await provider({...base,runs:[boundary]}).list()).current;assert.equal(projected.stages[index].status,"FAILED",stages[index]);assert.ok(projected.stages.slice(index+1).every(value=>value.status==="NOT_REACHED"),`${stages[index]} downstream stages`);}

const before=JSON.stringify(base);await provider(base).list();assert.equal(JSON.stringify(base),before,"status projection must not mutate evidence");
console.log("Universal acquisition progress monitor tests passed: stages, metrics, origins, terminal states, and read-only projection.");
