import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createProductionDataForSeoTaskOwner } from "../index.js";

let cases=0;
const at="2026-09-12T18:00:00.000Z";
const product={identity:{atlasProductId:"ram_transport_fixture",manufacturerPartNumber:"CMH32GX5M2B6000C38",brand:"Corsair"},extension:{data:{capacity:{capacityGb:32,moduleCount:2},classification:{memoryType:"DDR5",formFactor:"DIMM"},performance:{dataRateMtps:6000},physical:{}}}};
const endpoints={AMAZON_PRODUCTS:"/v3/merchant/amazon/products/task_post",AMAZON_ASIN:"/v3/merchant/amazon/asin/task_post",AMAZON_SELLERS:"/v3/merchant/amazon/sellers/task_post"};
const root=await mkdtemp(path.join(os.tmpdir(),"hr-h050b-"));
const intent=operation=>`mer_histbootintent_${(operation==="failure"?"b":"a").repeat(24)}`;
try{
 for(const operation of Object.keys(endpoints)){
  const calls=[],stateRoot=path.join(root,operation);
  const owner=createProductionDataForSeoTaskOwner({operation,stateRoot,credentialLoader:()=>({login:"fixture",password:"fixture"}),httpTransport:async request=>(calls.push(structuredClone(request)),{status_code:20000,tasks:[{id:`task-${operation}`,status_code:20100,cost:.0015}]}),now:()=>at});
  const execution={kind:operation,provider:"DATAFORSEO",source:"DATAFORSEO_AMAZON",atlasProductId:product.identity.atlasProductId,locationName:"United States",languageName:"English (United States)",paidActionIntentId:intent(operation),checkpointId:`artifact-${operation}`,productIndex:0,sourceRightsProfileDigest:"a".repeat(64)};
  if(operation==="AMAZON_PRODUCTS")execution.atlasProduct=product;else execution.dataAsin="B0CQQVNCB6";
  const plan={schemaVersion:"1.0",planId:`plan-${operation}`,plannedAt:at,policy:{enabled:true,maxPaidTasksPerRun:1,maxSpendPerRunUsd:.0015,maxSpendPerDayUsd:.01,automaticPaidRetries:0},spentTodayUsd:0,approvedTaskCount:1,estimatedApprovedSpendUsd:.0015,decisions:[{candidateId:operation,estimatedCostUsd:.0015,decision:"APPROVED",execution}]};
  const request={requestId:`auth-${operation}`,planId:plan.planId,plan,expiresAt:"2026-09-12T18:15:00.000Z",maxSpendUsd:.0015,maxPaidTasks:1};
  const result=await owner.execute({request,authorizedAt:at});
  assert.equal(result.status,"COMPLETED",JSON.stringify(result));assert.equal(calls.length,1);assert.equal(new URL(calls[0].url).pathname,endpoints[operation]);
  const payload=calls[0].body[0],keys=Object.keys(payload).sort();assert.deepEqual(keys,operation==="AMAZON_PRODUCTS"?["keyword","language_name","location_name","priority"]:["asin","language_name","location_name","priority"]);assert.equal(JSON.stringify(payload).includes("ram_transport_fixture"),false);
  assert.equal((await owner.execute({request,authorizedAt:at})).status,"LIVE_AUTHORIZATION_ALREADY_CONSUMED");assert.equal(calls.length,1);cases+=7;
 }
 let failureCalls=0;const failedRoot=path.join(root,"failed");
 const failedOwner=createProductionDataForSeoTaskOwner({operation:"AMAZON_PRODUCTS",stateRoot:failedRoot,credentialLoader:()=>({login:"fixture",password:"fixture"}),httpTransport:async()=>{failureCalls++;throw new Error("fixture transport failure");},now:()=>at});
 const execution={kind:"AMAZON_PRODUCTS",provider:"DATAFORSEO",source:"DATAFORSEO_AMAZON",atlasProduct:product,atlasProductId:product.identity.atlasProductId,locationName:"United States",languageName:"English (United States)",paidActionIntentId:intent("failure"),checkpointId:"artifact-failure",productIndex:0,sourceRightsProfileDigest:"b".repeat(64)};
 const plan={schemaVersion:"1.0",planId:"plan-failure",plannedAt:at,policy:{enabled:true,maxPaidTasksPerRun:1,maxSpendPerRunUsd:.0015,maxSpendPerDayUsd:.01,automaticPaidRetries:0},spentTodayUsd:0,approvedTaskCount:1,estimatedApprovedSpendUsd:.0015,decisions:[{candidateId:"failure",estimatedCostUsd:.0015,decision:"APPROVED",execution}]};
 const failed=await failedOwner.execute({request:{requestId:"auth-failure",planId:plan.planId,plan,expiresAt:"2026-09-12T18:15:00.000Z",maxSpendUsd:.0015,maxPaidTasks:1},authorizedAt:at});
 assert.equal(failed.status,"FAILED");assert.equal(failed.execution.run.tasks[0].providerTaskId,null);assert.equal(failed.execution.run.actualSpendUsd,0);assert.equal(failureCalls,1);await assert.rejects(()=>readFile(path.join(failedRoot,"dataforseo-task-ledger.json"),"utf8"),error=>error.code==="ENOENT");cases+=5;
 console.log(`DataForSEO Amazon production transport composition tests passed: ${cases} cases.`);
}finally{await rm(root,{recursive:true,force:true});}
