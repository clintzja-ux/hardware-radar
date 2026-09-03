import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  createGovernedSellersEnrichmentProposal,
  createProductInfoEnrichmentAuthorizationRequest,
  validateProductInfoRetrievalLineage
} from "../index.js";

const atlasProduct=JSON.parse(await readFile(new URL("../../atlas/products/ram/ddr5/HR-RAM-DDR5-000002-crucial-crucial-pro-cp2k16g56c46u5.json",import.meta.url),"utf8"));
const ids={productId:"4796965035927175117",dataDocId:"9225099931765836490",gid:"4027682025249817743"};
const proposal={schemaVersion:"1.0",proposalId:"enrich_de39dafdbbad923d0cbb2dc6",status:"PENDING_OPERATOR_REVIEW",createdAt:"2026-09-01T17:07:22.336Z",sourceTaskId:"09011702-2304-0179-0000-c977c7e8a824",atlasProductId:"ram_crucial_cp2k16g56c46u5",operation:"PRODUCT_INFO",estimatedCostUsd:.001,maxPaidTasks:1,automaticPaidRetries:0,providerIdentity:ids,candidate:{title:"Crucial Pro 32GB DDR5 SDRAM Memory Module cp2k16g56c46u5",price:399.27,currency:"USD",score:88,exactMpnMatch:true},authorizationCreated:false};
const authorization=createProductInfoEnrichmentAuthorizationRequest({proposal,createdAt:"2026-09-01T17:36:30.081Z",spentTodayUsd:.001});
assert.equal(authorization.requestId,"enrichauth_54aa607cf7baf70a24e54c0a");assert.equal(authorization.planId,"enrichplan_0e6b13bfb42214a01f591d14");
const taskId="09011739-2304-0455-0000-2f32c707dfc6",runId="acqrun_4090bfb8-e98c-4ec5-b545-05e681e2ad31";
const taskLedger=[{requestKey:"products",kind:"PRODUCTS",taskId:proposal.sourceTaskId,costUsd:.001,createdStatus:20100,sourceId:"DATAFORSEO_GOOGLE_SHOPPING"},{requestKey:"product-info",kind:"PRODUCT_INFO",taskId,costUsd:.001,createdStatus:20100,sourceId:"DATAFORSEO_GOOGLE_SHOPPING"}];
const executionRuns=[{schemaVersion:"1.0",runId,planId:authorization.planId,status:"COMPLETED",attemptedTasks:1,completedTasks:1,failedTasks:0,tasks:[{outcome:"COMPLETED",providerTaskId:taskId}]}];
const authorizationConsumptions=[{authorizationId:authorization.requestId,planId:authorization.planId,consumedAt:"2026-09-01T17:39:13.787Z"}];
const validInput={productInfoTaskId:taskId,productInfoAuthorization:authorization,productInfoProposal:proposal,taskLedger,executionRuns,authorizationConsumptions};
const lineage=validateProductInfoRetrievalLineage(validInput);assert.equal(lineage.status,"VALIDATED");assert.equal(lineage.executionRunId,runId);assert.equal(lineage.sourceProductsTaskId,proposal.sourceTaskId);

const specs=(overrides={})=>[{specification_name:"Manufacturer Part Number",specification_value:overrides.mpn??"CP2K16G56C46U5"},{specification_name:"Brand",specification_value:overrides.brand??"Crucial"},{specification_name:"Memory Type",specification_value:overrides.memoryType??"DDR5"},{specification_name:"Capacity",specification_value:overrides.capacity??"32 GB"},{specification_name:"Number of Modules",specification_value:overrides.modules??"2"},{specification_name:"Capacity per Module",specification_value:overrides.perModule??"16 GB"},{specification_name:"Memory Speed",specification_value:overrides.speed??"5600 MT/s"},{specification_name:"Form Factor",specification_value:overrides.formFactor??"DIMM"}];
const item=(overrides={})=>({title:"Crucial Pro CP2K16G56C46U5 32GB DDR5 5600",product_id:ids.productId,data_docid:ids.dataDocId,gid:ids.gid,specifications:specs(),...overrides});
const result=value=>({id:taskId,cost:0,result:[{items:[value]}]});
const governed=createGovernedSellersEnrichmentProposal({lineage,productInfoResult:result(item()),productInfoAuthorization:authorization,atlasProduct,createdAt:"2026-09-01T18:00:00Z"});
assert.equal(governed.status,"PENDING_OPERATOR_REVIEW");assert.equal(governed.sourceProductInfoTaskId,taskId);assert.equal(governed.sourceProductInfoExecutionRunId,runId);assert.equal(governed.sourceProductsTaskId,proposal.sourceTaskId);assert.equal(governed.validation.status,"VALIDATED");assert.equal(governed.validation.atlas.status,"COMPATIBLE_WITH_UNKNOWNS");assert.equal(governed.validation.atlas.priceUsedForIdentity,false);assert.equal(governed.authorizationCreated,false);
const sparse=createGovernedSellersEnrichmentProposal({lineage,productInfoResult:result(item({specifications:[]})),productInfoAuthorization:authorization,atlasProduct});assert.equal(sparse.validation.atlas.status,"COMPATIBLE_WITH_UNKNOWNS");

const lineageFailures=[
  ["wrong task",{productInfoTaskId:"wrong"}],
  ["wrong authorization",{authorizationConsumptions:[{authorizationId:"wrong",planId:authorization.planId}]}],
  ["unconsumed",{authorizationConsumptions:[]}],
  ["failed execution",{executionRuns:[{...executionRuns[0],status:"FAILED"}]}],
  ["wrong operation",{taskLedger:taskLedger.map(entry=>entry.taskId===taskId?{...entry,kind:"SELLERS"}:entry)}],
  ["duplicate execution",{executionRuns:[...executionRuns,{...executionRuns[0],runId:"duplicate"}]}]
];
for(const [name,change] of lineageFailures)assert.throws(()=>validateProductInfoRetrievalLineage({...validInput,...change}),undefined,name);
assert.throws(()=>createGovernedSellersEnrichmentProposal({lineage,productInfoResult:result(item()),productInfoAuthorization:authorization,atlasProduct:{...atlasProduct,identity:{...atlasProduct.identity,atlasProductId:"wrong"}}}),/ATLAS_PRODUCT_BINDING/);
for(const [field,raw] of [["productId","other"],["dataDocId","other"],["gid","other"]]){const providerField={productId:"product_id",dataDocId:"data_docid",gid:"gid"}[field];assert.throws(()=>createGovernedSellersEnrichmentProposal({lineage,productInfoResult:result(item({[providerField]:raw})),productInfoAuthorization:authorization,atlasProduct}),/DRIFT/,field);}
const contradictions=[
  ["MPN_CONFLICT",{mpn:"OTHER-MPN"}],
  ["BRAND_CONFLICT",{brand:"Kingston"}],
  ["MEMORY_GENERATION_CONFLICT",{memoryType:"DDR4"}],
  ["CAPACITY_CONFLICT",{capacity:"16 GB"}],
  ["MODULE_CONFIGURATION_CONFLICT",{modules:"1"}],
  ["MODULE_CONFIGURATION_CONFLICT",{perModule:"8 GB"}],
  ["FORM_FACTOR_CONFLICT",{formFactor:"SODIMM"}]
];
for(const [code,override] of contradictions)assert.throws(()=>createGovernedSellersEnrichmentProposal({lineage,productInfoResult:result(item({specifications:specs(override)})),productInfoAuthorization:authorization,atlasProduct}),new RegExp(code),code);
assert.throws(()=>createGovernedSellersEnrichmentProposal({lineage,productInfoResult:{cost:0,result:[{items:[]}]},productInfoAuthorization:authorization,atlasProduct}),/MALFORMED/);
assert.throws(()=>createGovernedSellersEnrichmentProposal({lineage,productInfoResult:{cost:0,result:[]},productInfoAuthorization:authorization,atlasProduct}),/MALFORMED/);
assert.throws(()=>createGovernedSellersEnrichmentProposal({lineage,productInfoResult:{...result(item()),cost:.001},productInfoAuthorization:authorization,atlasProduct}),/ZERO_COST/);
console.log("B-007A Product Info result boundary governance tests passed.");
