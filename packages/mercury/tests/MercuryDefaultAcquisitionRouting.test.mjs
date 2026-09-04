import assert from "node:assert/strict";
import {assessDataForSeoProductEvidenceAgainstAtlas,canonicalizeBrand,classifyDefaultAcquisitionRoute,normalizeManufacturerKey,normalizeManufacturerPartNumber} from "../index.js";

const product={identity:{atlasProductId:"ram_fixture",brand:"G.SKILL",manufacturerPartNumber:"F5-6000J3636F16GX1-RS5K",alternatePartNumbers:[]},extension:{data:{classification:{memoryType:"DDR5",formFactor:"DIMM"},capacity:{capacityGb:16,moduleCount:1,capacityPerModuleGb:16},performance:{dataRateMtps:6000}}}};
for(const value of ["G.SKILL","G.Skill","G Skill","GSkill","gskill"])assert.equal(normalizeManufacturerKey(value),"gskill");
assert.equal(canonicalizeBrand("Kingston Technology",{canonicalBrand:"Kingston",aliases:["Kingston Technology"]}),"Kingston");
assert.equal(canonicalizeBrand("Kingston FURY",{canonicalBrand:"Kingston",aliases:["Kingston Technology"]}),"Kingston FURY");
assert.equal(normalizeManufacturerPartNumber(" f5-6000j3636f16gx1-rs5k "),"F5-6000J3636F16GX1-RS5K");
assert.notEqual(normalizeManufacturerPartNumber("F5-6000J3636F16GX1-RS5K"),normalizeManufacturerPartNumber("F56000J3636F16GX1RS5K"));

const assess=specifications=>assessDataForSeoProductEvidenceAgainstAtlas({title:"fixture",specifications},product);
let value=assess([{specification_name:"Manufacturer Part Number",specification_value:"f5-6000j3636f16gx1-rs5k"}]);
assert.equal(value.evidence.find(entry=>entry.field==="manufacturerPartNumber").status,"MATCH");
assert.equal(value.evidence.find(entry=>entry.field==="brand").status,"UNKNOWN");
assert.equal(value.status,"COMPATIBLE_WITH_UNKNOWNS");
assert.deepEqual(value.contradictions,[]);
assert.ok(assess([{specification_name:"Manufacturer Part Number",specification_value:"F5-6000J3636F16GX1-RS5X"}]).contradictions.includes("MPN_CONFLICT"));
assert.ok(assess([{specification_name:"Memory Capacity",specification_value:"32 GB"}]).contradictions.includes("CAPACITY_CONFLICT"));
assert.ok(assess([{specification_name:"Number of Modules",specification_value:"2"}]).contradictions.includes("MODULE_CONFIGURATION_CONFLICT"));
assert.ok(assess([{specification_name:"Memory Type",specification_value:"DDR4"}]).contradictions.includes("MEMORY_GENERATION_CONFLICT"));
assert.ok(assess([{specification_name:"Manufacturer",specification_value:"Unrelated Memory Corp"}]).contradictions.includes("BRAND_CONFLICT"));

const candidate=(overrides={})=>({score:93,exactMpnMatch:true,signals:[{name:"BRAND",matched:true}],contradictions:[],item:{title:"G.Skill F5-6000J3636F16GX1-RS5K",dataDocId:"doc-1",productId:null,gid:null,...overrides}});
const recommended={recommendationStatus:"RECOMMENDED",recommendedCandidate:candidate(),candidates:[candidate()]};
value=classifyDefaultAcquisitionRoute({resolution:recommended});
assert.equal(value.materialIdentity,"ESTABLISHED");
assert.equal(value.desiredRoute,"READY_FOR_SELLERS");
assert.equal(value.executableRoute,"READY_FOR_PRODUCT_INFO");
assert.deepEqual(value.blockers,["DIRECT_SELLERS_LINEAGE_NOT_CERTIFIED"]);
assert.equal(value.fuzzyMatching,false);
assert.equal(classifyDefaultAcquisitionRoute({resolution:recommended,directSellersLineageCertified:true}).executableRoute,"READY_FOR_SELLERS");
assert.equal(classifyDefaultAcquisitionRoute({resolution:{recommendationStatus:"AMBIGUOUS",recommendedCandidate:null,candidates:[candidate(),candidate({dataDocId:"doc-2"})]}}).desiredRoute,"MANUAL_PROVIDER_SELECTION");
assert.equal(classifyDefaultAcquisitionRoute({resolution:{recommendationStatus:"NO_SAFE_CANDIDATE",recommendedCandidate:null,candidates:[{...candidate(),contradictions:["CAPACITY_CONFLICT"]}]}}).desiredRoute,"MANUAL_IDENTITY_REVIEW");
assert.equal(classifyDefaultAcquisitionRoute({resolution:{recommendationStatus:"NO_SAFE_CANDIDATE",recommendedCandidate:null,candidates:[{...candidate(),exactMpnMatch:false}]}}).desiredRoute,"MANUAL_IDENTITY_REVIEW");
assert.equal(classifyDefaultAcquisitionRoute({resolution:{recommendationStatus:"NO_SAFE_CANDIDATE",recommendedCandidate:null,candidates:[]}}).desiredRoute,"UNRESOLVED");

console.log("Mercury default acquisition routing tests passed.");
