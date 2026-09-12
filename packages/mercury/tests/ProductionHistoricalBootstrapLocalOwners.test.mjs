import assert from "node:assert/strict";
import { createProductsIdentityProgressionOwner, createProductInfoIdentityProgressionOwner, createProductionHistoricalAdmissionOwner } from "../index.js";

const atlasProduct={identity:{atlasProductId:"ram_fixture",manufacturerPartNumber:"CMK32GX5M2B6000Z30",brand:"Corsair"},extension:{data:{classification:{memoryType:"DDR5"},capacity:{capacityGb:32,moduleCount:2,capacityPerModuleGb:16},performance:{dataRateMtps:6000,casLatency:30},physical:{color:"BLACK",rgbLighting:false}}}};
const products=createProductsIdentityProgressionOwner();
const strong=await products.resolve({atlasProduct,providerTaskId:"products-1",providerResult:{result:[{items:[{title:"Corsair 32GB (2x16GB) DDR5 6000 CL30 CMK32GX5M2B6000Z30 Black",data_docid:"doc-1"}]}]}});
assert.equal(strong.status,"STRONG_UNIQUE");assert.equal(strong.routing.executableRoute,"READY_FOR_SELLERS");assert.equal(strong.paidTaskCreated,false);assert.equal(strong.actualSpendUsd,0);
const unresolved=await products.resolve({atlasProduct,providerTaskId:"products-2",providerResult:{result:[{items:[]}]}});assert.equal(unresolved.status,"BLOCKED_IDENTITY");
const conflict=await products.resolve({atlasProduct,providerTaskId:"products-3",providerResult:{result:[{items:[{title:"Corsair 64GB DDR4 CMK000000000000",data_docid:"doc-2"}]}]}});assert.equal(conflict.status,"BLOCKED_IDENTITY");assert.equal(conflict.routing.materialIdentity,"CONTRADICTED");

const info=createProductInfoIdentityProgressionOwner();
const sellersProposal={proposalId:"s1",operation:"SELLERS",atlasProductId:"ram_fixture"};
assert.equal((await info.resolve({retrievalOutcome:{status:"RESULT_RECEIVED",sellersReadiness:"READY_FOR_SELLERS",result:{resultId:"r1"},sellersProposal}})).status,"STRONG_UNIQUE");
assert.equal((await info.resolve({retrievalOutcome:{status:"DUPLICATE",sellersReadiness:"READY_FOR_SELLERS",result:{resultId:"r1"},sellersProposal}})).status,"STRONG_UNIQUE");
assert.equal((await info.resolve({retrievalOutcome:{status:"PRODUCT_INFO_REVIEW_REQUIRED",sellersReadiness:"NOT_ESTABLISHED"}})).status,"BLOCKED_IDENTITY");
await assert.rejects(()=>info.resolve({}),/OUTCOME_REQUIRED/);

let calls=0;const outcomes=[{status:"ADMITTED",observationId:"hist-1"},{status:"DUPLICATE",observationId:"hist-1"}];
const historical=createProductionHistoricalAdmissionOwner({admissionService:{admit:async input=>(calls++,{...outcomes.shift(),evidenceId:input.evidenceId})},portfolioProjector:async asOf=>({asOf,summary:{totalHistoricalObservations:1}}),now:()=>"2026-09-11T12:00:00Z"});
const admitted=await historical.process({evidenceId:"ev-1",admittedBy:"operator:test"});assert.equal(admitted.status,"ADMITTED");assert.equal(admitted.portfolio.summary.totalHistoricalObservations,1);assert.equal(admitted.canonicalEligible,false);assert.equal(admitted.publicationEligible,false);
const duplicate=await historical.process({evidenceId:"ev-1",admittedBy:"operator:test"});assert.equal(duplicate.status,"DUPLICATE");assert.equal(calls,2);
for(const [message,status] of [["HISTORICAL_SOURCE_RIGHTS_DENIED","BLOCKED_RIGHTS"],["HISTORICAL_OFFER_BUNDLE_NOT_COMPARABLE","BLOCKED_COMPARABILITY"],["HISTORICAL_ADMISSION_NOT_ELIGIBLE:REVIEW_REQUIRED","BLOCKED_IDENTITY"],["repository unavailable","ADMISSION_FAILED"]]){const owner=createProductionHistoricalAdmissionOwner({admissionService:{admit:async()=>{throw new Error(message)}},portfolioProjector:async()=>null});const result=await owner.process({evidenceId:"ev",admittedBy:"operator:test"});assert.equal(result.status,status);assert.equal(result.paidTaskCreated,false);}
assert.equal(historical.paths.evidenceState.endsWith("dataforseo-market-evidence.json"),true);assert.equal(historical.paths.historicalState.endsWith("historical-observations.json"),true);
console.log("Production historical bootstrap local owner tests passed (25 cases).");
