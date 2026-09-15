import assert from "node:assert/strict";
import crypto from "node:crypto";
import {mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {PRODUCTS_DISCOVERY_CONFIRMATIONS,SqliteNeutralBoundedRepository,createProductionProductsIdentityDiscoveryService,defaultSourceRightsRegistry} from "../index.js";
import {parseIdentityDiscoveryArgs,runIdentityDiscoveryCommand} from "../../../scripts/mercury-products-identity-discovery-runtime.mjs";
let cases=0;const eq=(a,b)=>{assert.deepEqual(a,b);cases++};
const stable=x=>Array.isArray(x)?`[${x.map(stable).join(",")}]`:x&&typeof x==="object"?`{${Object.keys(x).sort().map(k=>`${JSON.stringify(k)}:${stable(x[k])}`).join(",")}}`:JSON.stringify(x);
const hash=x=>crypto.createHash("sha256").update(stable(x)).digest("hex"),at="2026-09-14T12:00:00.000Z",expires="2026-09-14T13:00:00.000Z",ids=["ram_factory_one","ram_factory_two"];
const products=ids.map((id,i)=>({identity:{atlasProductId:id,brand:"Corsair",manufacturerPartNumber:`MPN${i}`}})),productRepository={getById:async id=>products.find(x=>x.identity.atlasProductId===id)??null};
const root=await mkdtemp(join(tmpdir(),"products-discovery-factory-")),repository=new SqliteNeutralBoundedRepository({databasePath:join(root,"bounded.sqlite")});
try{
 let spend=.006,calls=0,pending=true;
 const owner={prepare:async({rightsProfile})=>({rightsDigest:hash(rightsProfile),requestIdentity:"request"}),authorize:async({member,parentAuthorization})=>({authorizationId:`child-${member.domainMemberId}`,authorizationDigest:"c".repeat(64),expiresAt:parentAuthorization.expiresAt,durableAuthority:true}),execute:async()=>({status:"COMPLETED"}),resolveTask:async({member})=>({providerTaskId:`task-${member.domainMemberId}`,actualSpendUsd:member.taskCeilingUsd}),retrieve:async()=>{calls++;return pending?{status:"PENDING"}:{status:"AVAILABLE",canonicalResult:{}}},finalize:async()=>({state:"IDENTITY_RESOLVED",assessmentId:"assessment"})};
 const runtime=createProductionProductsIdentityDiscoveryService({stateRoot:root,productRepository,boundedRepository:repository,rightsRegistry:defaultSourceRightsRegistry,readinessOwner:{assess:async()=>({state:"READY_FOR_DISCOVERY",readinessBindingDigest:"b".repeat(64)})},sourceOwners:{DATAFORSEO_GOOGLE_SHOPPING:owner,DATAFORSEO_AMAZON:owner},spendResolver:async()=>spend,now:()=>at});
 eq(typeof runtime.readinessOwner.assess,"function");
 const cohort=ids.map(atlasProductId=>({atlasProductId,sourceId:"DATAFORSEO_AMAZON"})),prepared=await runtime.service.prepare({cycle:at,cohort});
 eq(prepared.value.maximumPaidTasks,2);eq(prepared.value.maximumSpendUsd,.003);
 const authorized=await runtime.service.authorize({planId:prepared.value.planId,operator:"fixture",reason:"fixture",expiresAt:expires,confirmation:PRODUCTS_DISCOVERY_CONFIRMATIONS.AUTHORIZE});eq(authorized.value.currentUtcDaySpendUsd,.006);
 spend=.024;await assert.rejects(()=>runtime.service.start({authorizationId:authorized.value.authorizationId,startedBy:"fixture",confirmation:PRODUCTS_DISCOVERY_CONFIRMATIONS.START}),/BOUNDED_AGGREGATE_BUDGET_INVALID/);cases++;
 spend=.006;const started=await runtime.service.start({authorizationId:authorized.value.authorizationId,startedBy:"fixture",confirmation:PRODUCTS_DISCOVERY_CONFIRMATIONS.START});eq(started.state,"WAITING_FOR_PROVIDER");eq(started.sellersTasksCreated,0);eq(started.evidenceWritten,0);eq(started.historyWritten,0);
 pending=false;const resumed=await runtime.service.resume({runId:started.runId,resumedBy:"fixture",confirmation:PRODUCTS_DISCOVERY_CONFIRMATIONS.RESUME});eq(resumed.state,"COMPLETED");eq(resumed.paidTasksCreated,2);eq(resumed.publicationAuthority,false);eq(resumed.currentPriceAuthority,false);eq((await runtime.service.resume({runId:started.runId,resumedBy:"fixture",confirmation:PRODUCTS_DISCOVERY_CONFIRMATIONS.RESUME})).state,"COMPLETED");eq(calls,4);
 const args={prepare:["--cohort-file=x",`--discovery-cycle=${at}`],inspect:["--discovery-plan-id=p"],authorize:["--discovery-plan-id=p","--operator=o","--reason=r",`--expires-at=${expires}`,`--confirm=${PRODUCTS_DISCOVERY_CONFIRMATIONS.AUTHORIZE}`],start:["--authorization-id=a","--executed-by=o",`--confirm=${PRODUCTS_DISCOVERY_CONFIRMATIONS.START}`],resume:["--run-id=r","--resumed-by=o",`--confirm=${PRODUCTS_DISCOVERY_CONFIRMATIONS.RESUME}`]};
 for(const[action,values]of Object.entries(args))eq(parseIdentityDiscoveryArgs(action,values).size,values.length);assert.throws(()=>parseIdentityDiscoveryArgs("prepare",[...args.prepare,"--product=x"]),/NOT_ALLOWED/);cases++;
 const commandCalls=[],fake={service:{prepare:async x=>(commandCalls.push("prepare"),x),inspect:async x=>(commandCalls.push("inspect"),x),authorize:async x=>(commandCalls.push("authorize"),x),start:async x=>(commandCalls.push("start"),x),resume:async x=>(commandCalls.push("resume"),x)}};
 await runIdentityDiscoveryCommand("prepare",["--cohort-file=fixture.json",`--discovery-cycle=${at}`],{runtime:fake,readJson:async()=>[{atlasProductId:"ram_x",sourceId:"DATAFORSEO_AMAZON"}]});for(const action of["inspect","authorize","start","resume"])await runIdentityDiscoveryCommand(action,args[action],{runtime:fake});eq(commandCalls,["prepare","inspect","authorize","start","resume"]);
}finally{repository.close();await rm(root,{recursive:true,force:true,maxRetries:5,retryDelay:50})}
console.log(`Production Products identity discovery tests passed: ${cases} cases.`);
