import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { renderProductInfoResultOutcome } from "../index.js";

const identity={dataDocId:"data",productId:"product",gid:"gid"},base={resultId:"result",providerTaskId:"task",atlasProductId:"ram_fixture",providerIdentity:identity,retrievedEvidence:{title:"Safe RAM title"},sellersReadiness:"NOT_ESTABLISHED",downstreamAuthority:{sellersExecution:false}};
const reviewed={...base,status:"PRODUCT_INFO_REVIEW_REQUIRED",validation:{status:"REVIEW_REQUIRED",reasons:["BRAND_CONFLICT"]}},reviewOutput=renderProductInfoResultOutcome({status:"PRODUCT_INFO_REVIEW_REQUIRED",result:reviewed});
assert.match(reviewOutput,/PRODUCT_INFO_REVIEW_REQUIRED/);assert.match(reviewOutput,/BRAND_CONFLICT/);assert.match(reviewOutput,/dataDocId=data productId=product gid=gid/);assert.match(reviewOutput,/Sellers readiness:\s+NOT_ESTABLISHED/);assert.doesNotMatch(reviewOutput,/undefined|Authorization|password|token/i);
const validated={...base,status:"PRODUCT_INFO_VALIDATED",validation:{status:"VALIDATED",atlas:{status:"COMPATIBLE_WITH_UNKNOWNS"}},sellersReadiness:"READY_FOR_SELLERS"},validOutput=renderProductInfoResultOutcome({status:"RESULT_RECEIVED",result:validated,sellersReadiness:"READY_FOR_SELLERS"});assert.match(validOutput,/PRODUCT_INFO_VALIDATED/);assert.match(validOutput,/COMPATIBLE_WITH_UNKNOWNS/);assert.match(validOutput,/READY_FOR_SELLERS/);
for(const status of ["PROVIDER_PENDING","NO_RESULT"]){const output=renderProductInfoResultOutcome({status,lineage:{productInfoTaskId:"task",atlasProductId:"ram_fixture"}});assert.match(output,new RegExp(status));assert.match(output,/NOT_ESTABLISHED/);}
assert.throws(()=>renderProductInfoResultOutcome({status:"PRODUCT_INFO_REVIEW_REQUIRED",result:{...reviewed,validation:{status:"REVIEW_REQUIRED",reasons:[]}}}),/OUTPUT_INVALID/);
const root=await mkdtemp(path.join(os.tmpdir(),"hr-product-info-output-"));try{const state=path.join(root,"results.json");await writeFile(state,JSON.stringify({schemaVersion:"1.0",results:[reviewed]}));const output=execFileSync(process.execPath,["scripts/mercury-product-info-result-inspect.mjs","--task-id=task",`--result-state=${state}`],{cwd:process.cwd(),encoding:"utf8",env:{PATH:process.env.PATH}});assert.match(output,/PRODUCT_INFO_REVIEW_REQUIRED/);assert.match(output,/BRAND_CONFLICT/);assert.doesNotMatch(output,/DATAFORSEO|fetch|credential|password/i);}finally{await rm(root,{recursive:true,force:true});}
console.log("Product Info result output tests passed.");
