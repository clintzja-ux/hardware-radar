import assert from "node:assert/strict";
import crypto from "node:crypto";
import {HistoricalBootstrapLifecycleService,HISTORICAL_BOOTSTRAP_CHECKPOINT_VERSION,projectHistoricalBootstrapCheckpoint} from "../index.js";
const stable=v=>Array.isArray(v)?`[${v.map(stable).join(",")}]`:v&&typeof v==="object"?`{${Object.keys(v).sort().map(k=>`${JSON.stringify(k)}:${stable(v[k])}`).join(",")}}`:JSON.stringify(v);
const hash=v=>crypto.createHash("sha256").update(stable(v)).digest("hex"),rights="d".repeat(64);
const binding={artifactId:"mer_histbootstrap_fixture",artifactDigest:"a".repeat(64),asOf:"2026-09-11T12:00:00Z",sourceId:"DATAFORSEO_GOOGLE_SHOPPING",sourceRightsProfileDigest:rights,acquisitionPortfolioReference:{portfolioCycleId:"mer_acqportfolio_"+"e".repeat(24),bindingDigest:"f".repeat(64)},products:["p1","p2","p3"],taskCap:9,spendCapUsd:.009,utcDayCapUsd:.01};
const checkpoint={schemaVersion:"1.0",checkpointId:"cp",policyVersion:HISTORICAL_BOOTSTRAP_CHECKPOINT_VERSION,binding,bindingDigest:hash(binding),createdAt:"2026-09-11T12:00:00Z",events:[{sequence:1,type:"CHECKPOINT_PREPARED",at:"2026-09-11T12:00:00Z",productIndex:0,atlasProductId:"p1",stage:"PRODUCTS"}]};
let current=structuredClone(checkpoint),savedAuthorization,calls=0;
const repository={
 create:async value=>(current=value),
 getById:async()=>structuredClone(current),
 append:async(_id,event)=>(current={...current,events:[...current.events,{...event,sequence:current.events.length+1}]})
};
const service=new HistoricalBootstrapLifecycleService({artifactRepository:{getById:async()=>null},checkpointRepository:repository,continuationRepository:{record:async value=>(savedAuthorization=value),getById:async()=>savedAuthorization},handoff:{execute:async input=>(calls++,{status:"PAID_TASK_CREATED",...input})},retrievalOwner:{retrieve:async()=>({status:"PENDING"})},identityOwner:{resolve:async()=>({status:"STRONG_UNIQUE"})},localProcessingOwner:{process:async()=>({status:"ADMITTED"})},rightsRegistry:{get:()=>({acquisition:{api:"ALLOWED"}})},spendResolver:async()=>0,now:()=>"2026-09-11T12:01:00Z"});
const inspected=await service.inspect({checkpointId:"cp"});assert.equal(inspected.nextPaidOperation,"PRODUCTS");assert.equal(inspected.providerOperation,"NONE");assert.equal(inspected.sourceRightsProfileDigest,rights);
const authorization=await service.authorizeNext({checkpointId:"cp",authorizedBy:"operator:test",reason:"fixture",confirmation:"AUTHORIZE-PRODUCTS-cp"});assert.equal(authorization.atlasProductId,"p1");assert.equal(authorization.nextOperation,"PRODUCTS");assert.equal(authorization.sourceRightsProfileDigest,rights);
await assert.rejects(()=>service.authorizeNext({checkpointId:"cp",authorizedBy:"x",reason:"x",confirmation:"AUTHORIZE-PRODUCTS-cp",paidActionIntentId:"mer_histbootintent_"+"a".repeat(24)}),/CALLER_OVERRIDE/);await assert.rejects(()=>service.executeNext({checkpointId:"cp",authorizationId:authorization.continuationAuthorizationId,executedBy:"x",confirmation:authorization.confirmation,atlasProductId:"p2"}),/CALLER_OVERRIDE/);
await service.executeNext({checkpointId:"cp",authorizationId:authorization.continuationAuthorizationId,executedBy:"x",confirmation:authorization.confirmation});assert.equal(calls,1);
current={...current,events:[...current.events,{sequence:2,type:"TASK_CREATED",at:"x",productIndex:0,atlasProductId:"p1",operation:"PRODUCTS",providerTaskId:"task",actualSpendUsd:.001}]};const pending=await service.retrieve({checkpointId:"cp"});assert.equal(pending.status,"PENDING");assert.equal(current.events.length,2);assert.equal(projectHistoricalBootstrapCheckpoint({checkpoint:current}).cohortState,"WAITING_FOR_RESULT");
console.log("Historical bootstrap trusted lifecycle tests passed (15 cases).");
