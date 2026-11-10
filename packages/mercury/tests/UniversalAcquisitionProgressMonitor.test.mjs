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

const novemberLineage={artifactDigest:"f".repeat(64),sourceObservedAt:"2026-11-09T15:14:32.000Z",catalogStateId:"rakuten_catalog_82f4dedf2db4c4122fdf63d3",currentPredecessor:{snapshotId:"current-1"},historyPredecessor:{hash:"history-1"},rightsDigest:"9".repeat(64)},novemberRun={runId:"mer_neweggroutinecmd_1de6c8063fb562a60236f875",bindingDigest:"8".repeat(64),status:"INTEGRITY_FAILURE",startedAt:"2026-11-09T21:56:16.249Z",updatedAt:"2026-11-09T21:56:17.777Z",completedStages:["PREFLIGHT"],failedStage:"PREFLIGHT",failure:{code:"EPERM"},stageResults:{PREFLIGHT:{lineage:novemberLineage}}},novemberBootstrap={operationId:"mer_newegglive_f9766e5fca6aec1f591804c6",status:"LINEAGE_PROMOTED",createdAt:"2026-11-09T21:42:00.888Z",updatedAt:"2026-11-09T21:56:16.084Z",artifactDigest:novemberLineage.artifactDigest,sourceObservedAt:novemberLineage.sourceObservedAt,catalogStateId:novemberLineage.catalogStateId,rightsDigest:novemberLineage.rightsDigest,lineage:novemberLineage,artifact:{bytes:139130409}};
result=await provider({...base,runs:[novemberRun],bootstrap:{operations:{[novemberBootstrap.operationId]:novemberBootstrap}}}).list();view=result.current;assert.equal(result.recent.length,1,"correlated promoted bootstrap is not projected as a competing active run");assert.equal(view.state.status,"TERMINAL_FAILURE");assert.equal(view.state.failureClassification,"EPERM");assert.equal(view.acquisition.status,"COMPLETED");assert.equal(view.acquisition.catalogStatus,"COMPLETED");assert.equal(view.acquisition.operationId,novemberBootstrap.operationId);assert.equal(view.terminal.classification,"INTEGRITY_FAILURE");
await assert.rejects(()=>provider({...base,runs:[novemberRun],bootstrap:{operations:{[novemberBootstrap.operationId]:{...novemberBootstrap,rightsDigest:"8".repeat(64)}}}}).list(),/ACQUISITION_PROGRESS_LINEAGE_CONTRADICTION/);
console.log("Universal acquisition progress monitor tests passed: stages, metrics, origins, terminal states, and read-only projection.");
