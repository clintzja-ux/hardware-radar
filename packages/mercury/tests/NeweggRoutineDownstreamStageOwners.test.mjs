import assert from "node:assert/strict";
import {mkdtemp,readFile,rm,writeFile} from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {bindProductionNeweggRoutineDownstreamOwners,createNeweggRoutineBinding,createProductionNeweggRoutineCommand,InMemoryPrivateForgeOperationsStore,PrivateForgeOperationsTransport,NEWEGG_ROUTINE_COMMAND_STAGES} from "../index.js";

const root=await mkdtemp(join(tmpdir(),"newegg-downstream-")),now=()=>"2026-10-12T22:00:00.000Z",artifactDigest="a".repeat(64),lineage={artifactDigest,sourceObservedAt:"2026-10-12T18:00:00.000Z",catalogStateId:"catalog-1",currentPredecessor:{snapshotId:"current-1",hash:"b".repeat(64)},historyPredecessor:{sequence:1,hash:"c".repeat(64)},rightsDigest:"d".repeat(64)},bindingDigest=createNeweggRoutineBinding({lineage,mode:"RETAINED_EVIDENCE"});
const baseReceipts=new Map(),calls=[];
const baseOwners=Object.fromEntries(NEWEGG_ROUTINE_COMMAND_STAGES.map(stage=>[stage,{mutating:false,receiptOwner:{resolve:async()=>baseReceipts.has(stage)?{state:"COMPLETED",receipt:baseReceipts.get(stage)}:{state:"NOT_COMPLETED"}},executionOwner:{execute:async context=>{calls.push(stage);const receipt={stage,artifactDigest,lineage, ...(stage==="CURRENT"?{snapshotId:"current-2",productsRefreshed:4,expiresAt:"2026-10-14T06:00:00.000Z"}:{}),...(stage==="HISTORY"?{admitted:5,sequence:6}:{}),...(stage==="QA"?{available:true,rowCount:4}:{}),...(stage==="ACQUISITION"?{providerCalls:0}:{})};baseReceipts.set(stage,receipt);return{status:"COMPLETED",receipt};}}}]));
const store=new InMemoryPrivateForgeOperationsStore(),transport=new PrivateForgeOperationsTransport({store,accessToken:"fixture-private-token-123456789",now}),health=[];
const services={
 recompositionService:{prepare:async()=>({candidateId:"candidate-1",artifactId:"artifact-1",bindingDigest:"e".repeat(64),releaseAuthority:false,deploymentAuthority:false})},
 certificationService:{certify:async({candidate})=>({status:"CERTIFIED",certificationId:"cert-1",artifactBindingDigest:candidate.bindingDigest,releaseAuthority:false,deploymentAuthority:false})},
 releaseReadinessService:{assess:async()=>({state:"CERTIFIED_ZERO_AUTHORITY",releaseAuthority:false,deploymentAuthority:false})},
 inventoryOwner:{inspect:async()=>({asOf:now(),entries:[{path:"current",kind:"CATALOG_STATE",bytes:10,catalogStateId:"catalog-1",prerequisitesComplete:true},{path:"old",kind:"RAW_FULL",bytes:20,observedAt:"2026-09-01T00:00:00.000Z",prerequisitesComplete:true}],currentCatalogId:"catalog-1",predecessorCatalogId:null})},
 capacityOwner:{assess:async()=>({sufficient:true,availableBytes:1_000_000,requiredBytes:100})},
 healthRepository:{put:async value=>health.push(structuredClone(value))}
};

try{
 const owners=bindProductionNeweggRoutineDownstreamOwners({owners:baseOwners,receiptRoot:join(root,"receipts"),...services,forgeTransport:transport,now});
 const command=createProductionNeweggRoutineCommand({statePath:join(root,"runs.json"),owners,now}),input={bindingDigest,lineage};
 const first=await command.execute({mode:"RETAINED_EVIDENCE",input});assert.equal(first.outcome,"SUCCESS_RELEASE_READY");assert.equal(first.providerCalls,0);assert.equal(health.length,1);assert.equal(health[0].readOnly,true);assert.equal(health[0].releaseAuthority,false);assert.equal(health[0].storage.deletedArtifacts,0);assert.equal((await store.get()).projection.releaseReadiness.state,"CERTIFIED_ZERO_AUTHORITY");
 const replayState=JSON.parse(await readFile(join(root,"runs.json"),"utf8"));replayState.runs[0].status="RUNNING";replayState.runs[0].completedStages=replayState.runs[0].completedStages.filter(stage=>!stage.startsWith("FORGE"));delete replayState.runs[0].stageResults.FORGE_PROJECTION;delete replayState.runs[0].stageResults.FORGE_TRANSPORT;await writeFile(join(root,"runs.json"),`${JSON.stringify(replayState,null,2)}\n`);
 const replay=await command.execute({mode:"RETAINED_EVIDENCE",input});assert.equal(replay.success,true);assert.equal(health.length,1);
 const recompositionReceipt=join(root,"receipts",`recomposition-${bindingDigest}.json`),corrupt=JSON.parse(await readFile(recompositionReceipt,"utf8"));corrupt.result.artifactId="tampered";await writeFile(recompositionReceipt,JSON.stringify(corrupt));
 const freshRuns=join(root,"conflict-runs.json"),conflict=await createProductionNeweggRoutineCommand({statePath:freshRuns,owners,now}).execute({mode:"RETAINED_EVIDENCE",input});assert.equal(conflict.outcome,"RECOMPOSITION_FAILURE");
 const holdOwners=bindProductionNeweggRoutineDownstreamOwners({owners:baseOwners,receiptRoot:join(root,"hold-receipts"),...services,capacityOwner:{assess:async()=>({sufficient:false,availableBytes:1,requiredBytes:100})},forgeTransport:transport,now}),hold=await createProductionNeweggRoutineCommand({statePath:join(root,"hold-runs.json"),owners:holdOwners,now}).execute({mode:"RETAINED_EVIDENCE",input});assert.equal(hold.outcome,"STORAGE_HOLD");
 assert.equal(calls.includes("ACQUISITION"),true);assert.equal(first.releaseAuthority,false);assert.equal(first.deploymentAuthority,false);
 console.log("Newegg routine downstream stage owner tests passed: 26 cases.");
}finally{await rm(root,{recursive:true,force:true});}
