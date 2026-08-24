import assert from "node:assert/strict";
import {mkdtemp,rm} from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {FileDataForSeoMarketEvidenceRepository,materialEvidenceFingerprint} from "../index.js";

const root=await mkdtemp(join(tmpdir(),"hardware-radar-e2l-replay-"));
const candidate=({taskId="task-1",observedAt="2026-08-21T00:00:00Z",name="Platinummicro",domain="platinummicro.com",basePrice=588.99,totalPrice=588.99,shippingPrice=null,tax=null,currency="USD",condition=null,availability="in_stock"}={})=>({candidateVersion:"1.0",candidateType:"MERCURY_MARKET_OBSERVATION",marketEvidence:{evidenceVersion:"1.0",provider:"DATAFORSEO",source:"DATAFORSEO_GOOGLE_SHOPPING",sourceMethod:"API",seller:{name,domain,url:`https://${domain}/item`},pricing:{basePrice,totalPrice,shippingPrice,tax,currency},offer:{condition,availability,details:"Corsair memory"},productEvidence:{title:"Corsair memory",productId:null,dataDocId:"3844868436216882408",gid:null},provenance:{sourceTaskId:taskId,observedAt,rawPayloadReference:`dataforseo:sellers:${taskId}:item:0`}},identity:{outcome:"PROBABLE",atlasProductId:"ram_corsair_cmk32gx5m2b6000z30",externalProductId:null,candidateAtlasProductIds:[],evidence:[]},governance:{requiresReview:true,canonicalObservationEligible:false,automaticPublicationEligible:false}});
const merchant=({name="Platinummicro",domain="platinummicro.com"}={})=>({resolutionVersion:"1.0",outcome:"DISCOVERED",retailerId:null,merchantKey:`domain:${domain}`,sellerName:name,canonicalDomain:domain,suppliedDomain:domain,urlDomain:domain,requiresRegistration:true,evidence:[],reason:"ATLAS_RETAILER_NOT_FOUND"});
const eligibility={eligibilityVersion:"1.0",status:"REVIEW_REQUIRED",canonicalObservationEligible:false,rawEvidenceRetentionEligible:true,historicalAnalyticsEligible:false,retailerId:null,requiresReview:true,reasons:["MERCHANT_REGISTRATION_REQUIRED"]};
try{
 const repository=new FileDataForSeoMarketEvidenceRepository({statePath:join(root,"evidence.json"),now:()=>"2026-08-22T00:00:00Z"});const original=candidate();const retained=await repository.retain({candidate:original,merchantResolution:merchant(),eligibility});assert.equal(retained.status,"RETAINED");assert.match(materialEvidenceFingerprint(original),/^[a-f0-9]{64}$/);
 const exact=await repository.retain({candidate:candidate(),merchantResolution:merchant(),eligibility});assert.equal(exact.status,"DUPLICATE");assert.equal(exact.evidenceId,retained.evidenceId);
 const timestampOnly=await repository.retain({candidate:candidate({observedAt:"2026-08-22T00:00:00Z"}),merchantResolution:merchant(),eligibility});assert.equal(timestampOnly.status,"DUPLICATE");assert.equal(timestampOnly.evidenceId,retained.evidenceId);
 for(const [label,next,merchantResolution] of [
  ["base price",candidate({basePrice:589.99}),merchant()],
  ["total price",candidate({totalPrice:600}),merchant()],
  ["merchant",candidate({name:"Different",domain:"different.example"}),merchant({name:"Different",domain:"different.example"})],
  ["currency",candidate({currency:"EUR"}),merchant()],
  ["availability",candidate({availability:"out_of_stock"}),merchant()],
  ["condition",candidate({condition:"used"}),merchant()]
 ])await assert.rejects(()=>repository.retain({candidate:next,merchantResolution,eligibility}),error=>error?.code==="ACQUISITION_EVIDENCE_CONFLICT",`${label} conflict must fail closed`);
 const sameValuesNewTask=await repository.retain({candidate:candidate({taskId:"task-2",observedAt:"2026-08-23T00:00:00Z"}),merchantResolution:merchant(),eligibility});assert.equal(sameValuesNewTask.status,"RETAINED");assert.notEqual(sameValuesNewTask.evidenceId,retained.evidenceId);
 const changedValuesNewTask=await repository.retain({candidate:candidate({taskId:"task-3",observedAt:"2026-08-24T00:00:00Z",basePrice:550,totalPrice:550}),merchantResolution:merchant(),eligibility});assert.equal(changedValuesNewTask.status,"RETAINED");assert.notEqual(changedValuesNewTask.evidenceId,sameValuesNewTask.evidenceId);assert.equal((await repository.getAll()).length,3);
}finally{await rm(root,{recursive:true,force:true});}
console.log("Historical refresh replay-conflict tests passed.");
