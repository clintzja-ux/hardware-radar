import assert from "node:assert/strict";
import {mkdtemp,readFile,rm} from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {createProductionNeweggRoutineCommand,createNeweggRoutineBinding,NEWEGG_ROUTINE_COMMAND_STAGES} from "../index.js";

const root=await mkdtemp(join(tmpdir(),"newegg-production-factory-")),statePath=join(root,"runs.json"),clock=()=>"2026-10-12T20:30:00.000Z";
const lineage={artifactDigest:"a".repeat(64),sourceObservedAt:"2026-10-12T18:00:00.000Z",catalogStateId:"rakuten_catalog_fixture",currentPredecessor:{snapshotId:"current-1",hash:"b".repeat(64)},historyPredecessor:{sequence:10,hash:"c".repeat(64)},rightsDigest:"d".repeat(64)};
const bindingDigest=createNeweggRoutineBinding({lineage,mode:"FIXTURE"}),receipts=new Map(),calls=[];
const owners=Object.fromEntries(NEWEGG_ROUTINE_COMMAND_STAGES.map(stage=>{const mutating=["ACQUISITION","CATALOG","CURRENT","HISTORY","RECOMPOSITION","CERTIFICATION"].includes(stage);return[stage,{mutating,authorityOwner:mutating?{validate:async({authority})=>authority?.authorized===true}:null,receiptOwner:{resolve:async()=>receipts.has(stage)?{state:"COMPLETED",receipt:receipts.get(stage)}:{state:"NOT_COMPLETED"}},executionOwner:{execute:async context=>{calls.push(stage);const receipt={stage,artifactDigest:context.input.lineage.artifactDigest,sourceObservedAt:context.input.lineage.sourceObservedAt,catalogStateId:context.input.lineage.catalogStateId};receipts.set(stage,receipt);return{status:"COMPLETED"};}}}];}));
try{
 const stageAuthorities=Object.fromEntries(NEWEGG_ROUTINE_COMMAND_STAGES.map(stage=>[stage,{authorized:true}])),command=createProductionNeweggRoutineCommand({statePath,owners,now:clock}),input={bindingDigest,lineage,stageAuthorities};
 const first=await command.execute({mode:"FIXTURE",input});assert.equal(first.outcome,"SUCCESS_RELEASE_READY");assert.deepEqual(calls,NEWEGG_ROUTINE_COMMAND_STAGES);
 const durable=JSON.parse(await readFile(statePath,"utf8"));assert.equal(durable.runs.length,1);assert.deepEqual(durable.runs[0].completedStages,NEWEGG_ROUTINE_COMMAND_STAGES);
 // Canonical completion without a routine receipt: recovery resolves and does not execute again.
 const crashRoot=join(root,"crash.json"),crashReceipts=new Map([["ACQUISITION",{stage:"ACQUISITION",artifactDigest:lineage.artifactDigest}]]),crashCalls=[];
 const crashOwners=Object.fromEntries(NEWEGG_ROUTINE_COMMAND_STAGES.map(stage=>[stage,{mutating:true,authorityOwner:{validate:async()=>true},receiptOwner:{resolve:async()=>crashReceipts.has(stage)?{state:"COMPLETED",receipt:crashReceipts.get(stage)}:{state:"NOT_COMPLETED"}},executionOwner:{execute:async()=>{crashCalls.push(stage);const receipt={stage,artifactDigest:lineage.artifactDigest};crashReceipts.set(stage,receipt);return{status:"COMPLETED"};}}}]));
 const recovered=await createProductionNeweggRoutineCommand({statePath:crashRoot,owners:crashOwners,now:clock}).execute({mode:"FIXTURE",input});assert.equal(recovered.success,true);assert.equal(crashCalls.includes("ACQUISITION"),false);assert.equal(crashCalls.length,NEWEGG_ROUTINE_COMMAND_STAGES.length-1);
 const conflictOwners=structuredClone({}),conflictReceipts=new Map();for(const stage of NEWEGG_ROUTINE_COMMAND_STAGES)conflictOwners[stage]={mutating:false,receiptOwner:{resolve:async()=>stage==="CURRENT"?{state:"CONFLICT"}:conflictReceipts.has(stage)?{state:"COMPLETED",receipt:conflictReceipts.get(stage)}:{state:"NOT_COMPLETED"}},executionOwner:{execute:async()=>{const receipt={stage,artifactDigest:lineage.artifactDigest};conflictReceipts.set(stage,receipt);return{status:"COMPLETED"};}}};
 const conflict=await createProductionNeweggRoutineCommand({statePath:join(root,"conflict.json"),owners:conflictOwners,now:clock}).execute({mode:"FIXTURE",input});assert.equal(conflict.outcome,"CURRENT_FAILURE");
 const emptyReceipts=new Map(),unauthorizedOwners=Object.fromEntries(NEWEGG_ROUTINE_COMMAND_STAGES.map(stage=>[stage,{mutating:true,authorityOwner:{validate:async()=>false},receiptOwner:{resolve:async()=>emptyReceipts.has(stage)?{state:"COMPLETED",receipt:emptyReceipts.get(stage)}:{state:"NOT_COMPLETED"}},executionOwner:{execute:async()=>{throw new Error("SHOULD_NOT_EXECUTE");}}}]));
 const unauthorized=await createProductionNeweggRoutineCommand({statePath:join(root,"unauthorized.json"),owners:unauthorizedOwners,now:clock}).execute({mode:"PRODUCTION",input:{bindingDigest,lineage}});assert.equal(unauthorized.outcome,"INTEGRITY_FAILURE");assert.equal(unauthorized.providerCalls,0);
 console.log("Production Newegg routine factory tests passed: 18 cases.");
}finally{await rm(root,{recursive:true,force:true});}
