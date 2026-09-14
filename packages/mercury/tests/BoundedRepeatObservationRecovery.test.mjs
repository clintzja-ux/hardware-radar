import assert from "node:assert/strict";
import {mkdtemp,rm} from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {BoundedRepeatObservationRunService,BOUNDED_REPEAT_RUN_AUTHORIZE_CONFIRMATION,BOUNDED_REPEAT_RUN_RESUME_CONFIRMATION,createAmazonRepeatObservationIdentity,createProductionRepeatObservationService,DataForSeoTaskLedger,defaultSourceRightsRegistry,FileDataForSeoTaskLedger,FileHistoricalBootstrapProviderResultRepository,ProductionRepeatObservationResultPipeline,REPEAT_OBSERVATION_AUTHORIZE_CONFIRMATION,SqliteRepeatObservationRepository} from "../index.js";

let cases=0;
const root=await mkdtemp(join(tmpdir(),"repeat-recovery-"));
const at="2026-09-14T00:30:00.000Z",expires="2026-09-14T02:00:00.000Z",productId="ram_fixture",providerTaskId="fixture-amazon-task";
const repository=new SqliteRepeatObservationRepository({databasePath:join(root,"repeat.sqlite")});
const taskLedger=new FileDataForSeoTaskLedger(join(root,"tasks.json"));
const resultRepository=new FileHistoricalBootstrapProviderResultRepository({statePath:join(root,"results.json")});

try{
 let paidExecutions=0,retrievals=0,retentions=0,admissions=0,executionRows=[];
 const executionRepository={getAll:async()=>executionRows};
 const retrievalOwners={AMAZON_SELLERS:{retrieve:async()=>{retrievals++;return{id:providerTaskId,cost:0,result:[{items:[{data_asin:"B0CQQVNCB6",price:10,currency:"USD",seller_name:"seller"}]}]};}}};
 const processingOwners={AMAZON_SELLERS:{process:async()=>{retentions++;return{evidenceIds:["evidence-recovered"],duplicates:0};}}};
 const pipeline=new ProductionRepeatObservationResultPipeline({repeatRepository:repository,taskLedger,resultRepository,executionRepository,retrievalOwners,processingOwners,now:()=>at});
 const identityResolvers={DATAFORSEO_AMAZON:{resolve:async()=>createAmazonRepeatObservationIdentity({atlasProductId:productId,state:"STRONG_UNIQUE_ASIN",governedAsin:"B0CQQVNCB6",sellersAuthorizationEligible:true,outcomeId:"identity"})}};
 const repeat=createProductionRepeatObservationService({repository,databasePath:join(root,"repeat.sqlite"),stateRoot:root,productRepository:{getById:async()=>({identity:{atlasProductId:productId}})},identityResolvers,rightsRegistry:defaultSourceRightsRegistry,executionRepository,consumptionRepository:{getAll:async()=>[]},taskOwners:{AMAZON_SELLERS:{execute:async()=>{paidExecutions++;throw new Error("PAID_EXECUTION_FORBIDDEN");}}},resultPipeline:pipeline,historicalAdmissionOwner:{assess:async()=>({historicalEligible:true}),admit:async()=>{admissions++;return{observationId:"history-recovered"};}},now:()=>at});
 const bounded=new BoundedRepeatObservationRunService({repeatService:repeat,repository,spendResolver:async()=>.0065,now:()=>at});
 const plan=(await bounded.prepareRun({observationCycle:at,cohort:[{atlasProductId:productId,source:"DATAFORSEO_AMAZON"}]})).value;
 const runAuthorization=(await bounded.authorizeRun({runPlanId:plan.runPlanId,operator:"operator",reason:"fixture recovery",expiresAt:expires,confirmation:BOUNDED_REPEAT_RUN_AUTHORIZE_CONFIRMATION})).value;
 const preparation=plan.ready[0];
 const fullPreparation=await repository.getPreparation(preparation.preparedObservationId);
 const taskAuthorization=(await repeat.authorize({preparedObservationId:preparation.preparedObservationId,operator:`machine:${runAuthorization.runAuthorizationId}`,reason:`Derived exact-task authority for ${plan.runPlanId}`,expiresAt:expires,confirmation:REPEAT_OBSERVATION_AUTHORIZE_CONFIRMATION,parentRunAuthorizationId:runAuthorization.runAuthorizationId})).value;
 const runId="mer_repeatrun_fixture_recovery";
 repository.startRun({schemaVersion:"1.0",runId,runPlanId:plan.runPlanId,runAuthorizationId:runAuthorization.runAuthorizationId,observationCycle:at,state:"COMPLETED_WITH_EXCEPTIONS",startedAt:at,members:[{...preparation,state:"EXCEPTION",paidTaskCreated:true,evidenceIds:[],historicalObservationIds:[],exception:"REPEAT_OBSERVATION_PROVIDER_TASK_NOT_FOUND"}]});
 executionRows=[{schemaVersion:"1.0",runId:"execution-recovery",planId:taskAuthorization.planId,paidActionIntentId:fullPreparation.paidActionIntentId,status:"COMPLETED",actualSpendUsd:.0015,tasks:[{candidateId:fullPreparation.preparedObservationId,outcome:"COMPLETED",actualCostUsd:.0015,providerTaskId,providerStatus:20100,paidActionIntentId:fullPreparation.paidActionIntentId}]}];

 const recovered=await bounded.resumeRun({runId,resumedBy:"operator",confirmation:BOUNDED_REPEAT_RUN_RESUME_CONFIRMATION});
 assert.equal(recovered.state,"COMPLETED");assert.equal(recovered.paidTasksCreated,1);assert.equal(recovered.actualSpendUsd,.0015);assert.equal(paidExecutions,0);assert.equal(retrievals,1);assert.equal(retentions,1);assert.equal(admissions,1);cases+=7;
 const task=taskLedger.getByPaidActionIntentId(fullPreparation.paidActionIntentId)[0];assert.equal(task.taskId,providerTaskId);assert.equal(task.repeatAuthorizationId,taskAuthorization.authorizationId);assert.equal(task.parentRunAuthorizationId,runAuthorization.runAuthorizationId);cases+=3;
 const replay=await bounded.resumeRun({runId,resumedBy:"operator",confirmation:BOUNDED_REPEAT_RUN_RESUME_CONFIRMATION});assert.equal(replay.state,"COMPLETED");assert.equal(taskLedger.getByPaidActionIntentId(fullPreparation.paidActionIntentId).length,1);assert.equal(paidExecutions,0);assert.equal(retrievals,1);assert.equal(admissions,1);cases+=5;
 for(const [field,replacement] of [["paidActionIntentId","mer_repeatintent_wrong"],["acquisitionCycleId","mer_repeatcycle_wrong"],["preparedObservationId","mer_repeatprep_wrong"]]){const conflicting=new DataForSeoTaskLedger(),changed={...task,[field]:replacement};conflicting.entries.set(changed.taskId,changed);const strict=new ProductionRepeatObservationResultPipeline({repeatRepository:repository,taskLedger:conflicting,resultRepository,retrievalOwners,processingOwners,executionRepository});await assert.rejects(()=>strict.resolveTask(fullPreparation),field==="paidActionIntentId"?/NOT_FOUND/:/LINEAGE_CONFLICT/);cases++;}
 const bootstrapOnly=new DataForSeoTaskLedger();bootstrapOnly.entries.set("bootstrap",{...task,taskId:"bootstrap",paidActionIntentId:"mer_histbootintent_existing"});const bootstrapPipeline=new ProductionRepeatObservationResultPipeline({repeatRepository:repository,taskLedger:bootstrapOnly,resultRepository,retrievalOwners,processingOwners,executionRepository});await assert.rejects(()=>bootstrapPipeline.resolveTask(fullPreparation),/NOT_FOUND/);cases++;
 const staleA=new FileDataForSeoTaskLedger(join(root,"merge.json")),staleB=new FileDataForSeoTaskLedger(join(root,"merge.json")),base={kind:"SELLERS",costUsd:.001,createdStatus:20100,sourceId:"DATAFORSEO_GOOGLE_SHOPPING"};staleA.record("a",{...base,taskId:"a"});staleB.record("b",{...base,taskId:"b"});assert.equal(new FileDataForSeoTaskLedger(join(root,"merge.json")).getAll().length,2);cases++;
 const ambiguous=new DataForSeoTaskLedger(),row={kind:fullPreparation.operation,taskId:"one",costUsd:.0015,createdStatus:20100,sourceId:"DATAFORSEO_AMAZON",atlasProductId:productId,paidActionIntentId:fullPreparation.paidActionIntentId,acquisitionCycleId:fullPreparation.acquisitionCycleId,preparedObservationId:fullPreparation.preparedObservationId,reusableIdentityDigest:fullPreparation.identityDigest,sourceRightsProfileDigest:fullPreparation.rightsDigest,repeatAuthorizationId:taskAuthorization.authorizationId,parentRunAuthorizationId:runAuthorization.runAuthorizationId};ambiguous.entries.set("one",row);ambiguous.entries.set("two",{...row,taskId:"two"});const ambiguousPipeline=new ProductionRepeatObservationResultPipeline({repeatRepository:repository,taskLedger:ambiguous,resultRepository,retrievalOwners,processingOwners,executionRepository});await assert.rejects(()=>ambiguousPipeline.resolveTask(fullPreparation),/AMBIGUOUS/);cases++;
}finally{repository.close();await rm(root,{recursive:true,force:true});}
console.log(`Bounded repeat observation recovery tests passed: ${cases} cases.`);
