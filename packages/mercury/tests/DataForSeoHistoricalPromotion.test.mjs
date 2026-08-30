import assert from "node:assert/strict";
import {DataForSeoHistoricalPromotionService} from "../index.js";

let calls=0;const canonicalAdmissionService={admit:async input=>{calls++;return Object.freeze({status:"CANONICAL_ADMITTED",...input});}},service=new DataForSeoHistoricalPromotionService({canonicalAdmissionService});
await assert.rejects(()=>service.promote({evidenceId:"dfev_fixture",createdBy:"operator:test",atlasResolution:{outcome:"CONFIRMED"}}),/CALLER_SUPPLIED_CANONICAL_RESOLUTION_FORBIDDEN/);
await assert.rejects(()=>service.promote({evidenceId:"dfev_fixture",createdBy:"operator:test",merchantResolution:{outcome:"RESOLVED"}}),/CALLER_SUPPLIED_CANONICAL_RESOLUTION_FORBIDDEN/);
await assert.rejects(()=>service.promote({evidenceId:"dfev_fixture",createdBy:"operator:test",providerIdentity:{provider:"DATAFORSEO"}}),/CALLER_SUPPLIED_CANONICAL_RESOLUTION_FORBIDDEN/);
await assert.rejects(()=>service.promote({evidenceId:"dfev_fixture",createdBy:"operator:test",eligibility:{eligible:true}}),/CALLER_SUPPLIED_CANONICAL_RESOLUTION_FORBIDDEN/);
assert.equal(calls,0);const result=await service.promote({evidenceId:"dfev_fixture",createdBy:"operator:test"});assert.equal(result.status,"CANONICAL_ADMITTED");assert.equal(result.evidenceId,"dfev_fixture");assert.equal(result.admittedBy,"operator:test");assert.equal(calls,1);assert.throws(()=>new DataForSeoHistoricalPromotionService({}),/E2P_CANONICAL_ADMISSION_SERVICE_REQUIRED/);
console.log("DataForSEO historical promotion compatibility tests passed (9 cases).");
