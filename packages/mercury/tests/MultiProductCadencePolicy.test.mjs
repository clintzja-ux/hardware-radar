import assert from "node:assert/strict";
import {createHistoricalRefreshCadencePolicy,evaluateResolvedHistoricalRefreshCadence,HistoricalObservationPortfolio,HistoricalRefreshCadencePolicyRepository} from "../index.js";

const raw=(policyId,atlasProductIds,{enabled=true,minimumIntervalMs=86400000}={})=>JSON.parse(JSON.stringify(createHistoricalRefreshCadencePolicy({policyId,enabled,minimumIntervalMs,atlasProductIds})));
const a=raw("policy-a",["product_A"]),b=raw("policy-b",["product_B"],{minimumIntervalMs:172800000}),locations=["b.json","a.json"],readJson=async location=>structuredClone(location==="a.json"?a:b);
const repository=new HistoricalRefreshCadencePolicyRepository({policyUrls:locations,readJson});
assert.deepEqual((await repository.getAllPolicies()).map(x=>x.policyId),["policy-a","policy-b"]);
assert.equal((await repository.getPolicy("policy-a")).minimumIntervalMs,86400000);
assert.equal((await repository.resolveApplicablePolicy("product_A")).policyId,"policy-a");
assert.equal((await repository.resolveApplicablePolicy("product_B")).policyId,"policy-b");
assert.equal(await repository.resolveApplicablePolicy("product_C"),null);
assert.equal(Object.isFrozen(await repository.getAllPolicies()),true);
assert.equal(Object.isFrozen((await repository.getAllPolicies())[0]),true);
await assert.rejects(()=>repository.getPolicy(),/SINGLE_REQUIRED/);

const duplicate=new HistoricalRefreshCadencePolicyRepository({policyUrls:["a.json","a2.json"],readJson:async()=>a});
await assert.rejects(()=>duplicate.getAllPolicies(),/ID_DUPLICATE/);
for(const order of [["a.json","conflict.json"],["conflict.json","a.json"]]){const conflict=new HistoricalRefreshCadencePolicyRepository({policyUrls:order,readJson:async location=>location==="a.json"?a:raw("policy-conflict",["product_A"])});await assert.rejects(()=>conflict.resolveApplicablePolicy("product_A"),/POLICY_AMBIGUOUS:product_A/);}
const empty=new HistoricalRefreshCadencePolicyRepository({policyUrls:[],readJson});assert.deepEqual(await empty.getAllPolicies(),[]);assert.equal(await empty.resolveApplicablePolicy("product_A"),null);
const disabledRaw=raw("disabled",["product_D"],{enabled:false,minimumIntervalMs:null}),disabled=new HistoricalRefreshCadencePolicyRepository({policyUrls:["disabled.json"],readJson:async()=>disabledRaw});assert.equal((await disabled.resolveApplicablePolicy("product_D")).enabled,false);
const cycle=id=>({atlasProductId:id,stage:"COMPLETE",latestHistoricalObservation:{observationId:`observation-${id}`,observationTime:"2026-08-24T00:00:00Z",retailerId:"RETAILER-0002"},nextAction:{name:"PREPARE_NEW_REFRESH",potentialPaidOperation:"SELLERS",maximumFutureSpendUsd:.001}});assert.equal((await evaluateResolvedHistoricalRefreshCadence({policyRepository:repository,atlasProductId:"product_A",cycleStatus:cycle("product_A"),asOf:"2026-08-25T00:00:00Z"})).dueState,"DUE");assert.equal((await evaluateResolvedHistoricalRefreshCadence({policyRepository:repository,atlasProductId:"product_C",cycleStatus:cycle("product_C"),asOf:"2026-08-25T00:00:00Z"})).dueState,"POLICY_NOT_CONFIGURED");assert.equal((await evaluateResolvedHistoricalRefreshCadence({policyRepository:disabled,atlasProductId:"product_D",cycleStatus:cycle("product_D"),asOf:"2026-08-25T00:00:00Z"})).dueState,"DISABLED");
const unknownAtlas=new HistoricalRefreshCadencePolicyRepository({policyUrls:["a.json"],readJson:async()=>a,atlasProductRepository:{getAll:async()=>[{identity:{atlasProductId:"different"}}]}});await assert.rejects(()=>unknownAtlas.getAllPolicies(),/ATLAS_PRODUCT_UNKNOWN/);
for(const value of [{...a,policyType:"UNKNOWN"},{...a,schemaVersion:"2.0"},{...a,minimumIntervalMs:0},{...a,automaticExecution:true}]){const invalid=new HistoricalRefreshCadencePolicyRepository({policyUrls:["invalid.json"],readJson:async()=>value});await assert.rejects(()=>invalid.getAllPolicies(),/POLICY_STATE_INVALID|INTERVAL_INVALID|INTERVAL_REQUIRED/);}

const productRepository={getAll:async()=>[{identity:{atlasProductId:"product_B"}},{identity:{atlasProductId:"product_A"}},{identity:{atlasProductId:"product_C"}}]},portfolio=new HistoricalObservationPortfolio({productRepository,historicalRepository:{getAll:async()=>[]},evidenceRepository:{getAll:async()=>[]},cadencePolicyRepository:repository});
const view=await portfolio.query({asOf:"2026-08-25T00:00:00Z"});assert.deepEqual(view.products.map(x=>x.atlasProductId),["product_A","product_B","product_C"]);assert.equal(view.summary.productsWithCadenceConfigured,2);assert.equal(view.summary.productsWithoutCadenceConfigured,1);assert.equal(view.summary.policyNotConfiguredProductCount,1);assert.equal(view.summary.blockedProductCount,2);assert.equal(view.products[0].cadence.minimumIntervalMs,86400000);assert.equal(view.products[1].cadence.minimumIntervalMs,172800000);assert.equal(view.products[2].cadence.policyId,null);assert.equal(view.summary.configuredAutomaticExecutionCount,0);assert.equal(view.actualSpendUsd,0);
const ambiguousPortfolio=new HistoricalObservationPortfolio({productRepository:{getAll:async()=>[{identity:{atlasProductId:"product_A"}}]},historicalRepository:{getAll:async()=>[]},evidenceRepository:{getAll:async()=>[]},cadencePolicyRepository:new HistoricalRefreshCadencePolicyRepository({policyUrls:["a.json","conflict.json"],readJson:async location=>location==="a.json"?a:raw("policy-conflict",["product_A"])})});await assert.rejects(()=>ambiguousPortfolio.query({asOf:"2026-08-25T00:00:00Z"}),/POLICY_AMBIGUOUS/);
assert.equal("interest" in a,false);assert.equal("trend" in a,false);assert.equal("price" in a,false);assert.equal(a.automaticExecution,false);
console.log("Multi-product cadence policy tests passed.");
