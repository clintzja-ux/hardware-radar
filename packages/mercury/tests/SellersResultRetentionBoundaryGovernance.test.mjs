import assert from "node:assert/strict";
import crypto from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  DataForSeoAcquisitionResultProcessor,
  FileDataForSeoMarketEvidenceRepository,
  SellersResultDf003RetentionService,
  createSellersEnrichmentAuthorizationRequest,
  validateSellersRetentionLineage,
  validateSellersRetentionResults
} from "../index.js";

const ids={productId:"4796965035927175117",dataDocId:"9225099931765836490",gid:"4027682025249817743"};
const proposal={schemaVersion:"1.0",proposalId:"sellerenrich_2bf037679693b6adae4815ea",status:"PENDING_OPERATOR_REVIEW",createdAt:"2026-09-01T17:58:20.488Z",operation:"SELLERS",atlasProductId:"ram_crucial_cp2k16g56c46u5",sourceProductsTaskId:"09011702-2304-0179-0000-c977c7e8a824",sourceProductInfoTaskId:"09011739-2304-0455-0000-2f32c707dfc6",sourceProductInfoAuthorizationId:"enrichauth_54aa607cf7baf70a24e54c0a",sourceProductInfoProposalId:"enrich_de39dafdbbad923d0cbb2dc6",sourceProductInfoExecutionRunId:"acqrun_4090bfb8-e98c-4ec5-b545-05e681e2ad31",providerIdentity:ids,evidence:{title:"Crucial Pro 32GB DDR5",specifications:[],sellerCount:1},estimatedCostUsd:.001,maxPaidTasks:1,automaticPaidRetries:0,authorizationCreated:false,validation:{schemaVersion:"1.0",status:"VALIDATED",lineage:{schemaVersion:"1.0",status:"VALIDATED",productInfoTaskId:"09011739-2304-0455-0000-2f32c707dfc6",productInfoAuthorizationId:"enrichauth_54aa607cf7baf70a24e54c0a",productInfoPlanId:"enrichplan_0e6b13bfb42214a01f591d14",productInfoProposalId:"enrich_de39dafdbbad923d0cbb2dc6",atlasProductId:"ram_crucial_cp2k16g56c46u5",sourceProductsTaskId:"09011702-2304-0179-0000-c977c7e8a824",executionRunId:"acqrun_4090bfb8-e98c-4ec5-b545-05e681e2ad31",providerIdentity:ids},providerIdentity:{status:"VALIDATED"},atlas:{status:"COMPATIBLE_WITH_UNKNOWNS"}}};
proposal.validationDigest=crypto.createHash("sha256").update(JSON.stringify(proposal.validation)).digest("hex");
const authorization=createSellersEnrichmentAuthorizationRequest({proposal,createdAt:"2026-09-01T18:01:04.518Z",spentTodayUsd:.002});
assert.equal(authorization.requestId,"sellerauth_685b971d63777a6c3854b314");
assert.equal(authorization.planId,"sellerplan_f601af2808675fdb6f548480");
const sellersTaskId="09011802-2304-0183-0000-b27c074679a9",productInfoTaskId=proposal.sourceProductInfoTaskId,candidateId=`sellers:${proposal.atlasProductId}:${proposal.proposalId}`;
const taskLedger=[{requestKey:"products",kind:"PRODUCTS",taskId:proposal.sourceProductsTaskId,costUsd:.001,createdStatus:20100,sourceId:"DATAFORSEO_GOOGLE_SHOPPING"},{requestKey:"product-info",kind:"PRODUCT_INFO",taskId:productInfoTaskId,costUsd:.001,createdStatus:20100,sourceId:"DATAFORSEO_GOOGLE_SHOPPING"},{requestKey:"sellers",kind:"SELLERS",taskId:sellersTaskId,costUsd:.001,createdStatus:20100,sourceId:"DATAFORSEO_GOOGLE_SHOPPING"}];
const executionRuns=[{schemaVersion:"1.0",runId:"acqrun_669db492-b577-4e97-92df-e1965c607435",planId:authorization.planId,status:"COMPLETED",plannedTasks:1,attemptedTasks:1,completedTasks:1,failedTasks:0,tasks:[{candidateId,outcome:"COMPLETED",providerTaskId:sellersTaskId}]}];
const authorizationConsumptions=[{authorizationId:authorization.requestId,planId:authorization.planId,consumedAt:"2026-09-01T18:02:26.845Z"}];
const lineageInput={sellersTaskId,productInfoTaskId,sellersAuthorization:authorization,sellersProposal:proposal,taskLedger,executionRuns,authorizationConsumptions};
const lineage=validateSellersRetentionLineage(lineageInput);
assert.equal(lineage.status,"VALIDATED");assert.equal(lineage.sellersExecutionRunId,executionRuns[0].runId);assert.equal(lineage.atlasProductId,proposal.atlasProductId);

const sellerItem={type:"shops_list",seller_name:"Fixture Memory",domain:"fixture-memory.example",url:"https://fixture-memory.example/crucial",base_price:99.99,shipping_price:null,tax:null,total_price:99.99,currency:"USD",product_condition:null,product_availability:"in_stock",details:"Crucial CP2K16G56C46U5"};
const productInfoItem={title:"Crucial Pro CP2K16G56C46U5 32GB DDR5 5600",product_id:ids.productId,data_docid:ids.dataDocId,gid:ids.gid,specifications:[]};
const sellersResult={id:sellersTaskId,cost:0,result:[{title:productInfoItem.title,product_id:ids.productId,data_docid:ids.dataDocId,gid:ids.gid,items:[sellerItem]}]};
const productInfoResult={id:productInfoTaskId,cost:0,result:[{items:[productInfoItem]}]};
const governed=validateSellersRetentionResults({lineage,sellersResult,productInfoResult});
assert.equal(governed.status,"VALIDATED");assert.ok(governed.providerIdentity.comparisons.every(entry=>entry.authorizationToProductInfo==="MATCH"&&entry.authorizationToSellers==="MATCH"));

const lineageFailures=[
  ["unknown task",{sellersTaskId:"unknown"}],
  ["duplicate task",{taskLedger:[...taskLedger,{...taskLedger[2],requestKey:"duplicate"}]}],
  ["wrong task operation",{taskLedger:taskLedger.map(entry=>entry.taskId===sellersTaskId?{...entry,kind:"PRODUCT_INFO"}:entry)}],
  ["wrong authorization",{authorizationConsumptions:[{authorizationId:"wrong",planId:authorization.planId}]}],
  ["unconsumed",{authorizationConsumptions:[]}],
  ["wrong Product Info task",{productInfoTaskId:"other"}],
  ["duplicate execution",{executionRuns:[...executionRuns,{...executionRuns[0],runId:"duplicate"}]}],
  ["failed execution",{executionRuns:[{...executionRuns[0],status:"FAILED"}]}],
  ["conflicting completed task",{executionRuns:[{...executionRuns[0],attemptedTasks:2,completedTasks:2,tasks:[...executionRuns[0].tasks,{candidateId:"other",outcome:"COMPLETED",providerTaskId:"other"}]}]}]
];
for(const [name,change] of lineageFailures)assert.throws(()=>validateSellersRetentionLineage({...lineageInput,...change}),undefined,name);
const wrongProposal={...proposal,atlasProductId:"wrong"};assert.throws(()=>validateSellersRetentionLineage({...lineageInput,sellersProposal:wrongProposal}),undefined,"wrong Atlas product");
const wrongProducts={...proposal,sourceProductsTaskId:"wrong"};assert.throws(()=>validateSellersRetentionLineage({...lineageInput,sellersProposal:wrongProducts}),undefined,"wrong PRODUCTS lineage");
const wrongPlan=structuredClone(authorization);wrongPlan.planId="wrong";assert.throws(()=>validateSellersRetentionLineage({...lineageInput,sellersAuthorization:wrongPlan}),undefined,"wrong plan");
const wrongProposalId=structuredClone(authorization);wrongProposalId.proposalId="wrong";assert.throws(()=>validateSellersRetentionLineage({...lineageInput,sellersAuthorization:wrongProposalId}),undefined,"wrong proposal");

for(const [name,change,pattern] of [
  ["wrong seller envelope",{sellersResult:{...sellersResult,id:"wrong"}},/TASK_MISMATCH/],
  ["wrong Product Info envelope",{productInfoResult:{...productInfoResult,id:"wrong"}},/TASK_MISMATCH/],
  ["malformed sellers",{sellersResult:{id:sellersTaskId,cost:0,result:[]}},/MALFORMED/],
  ["malformed Product Info",{productInfoResult:{id:productInfoTaskId,cost:0,result:[{items:[]}]}},/MALFORMED/],
  ["non-zero sellers retrieval",{sellersResult:{...sellersResult,cost:.001}},/ZERO_COST/],
  ["productId drift",{productInfoResult:{...productInfoResult,result:[{items:[{...productInfoItem,product_id:"other"}]}]}},/PRODUCTID_DRIFT/],
  ["dataDocId drift",{productInfoResult:{...productInfoResult,result:[{items:[{...productInfoItem,data_docid:"other"}]}]}},/DATADOCID_DRIFT/],
  ["gid drift",{productInfoResult:{...productInfoResult,result:[{items:[{...productInfoItem,gid:"other"}]}]}},/GID_DRIFT/],
  ["seller product context drift",{sellersResult:{...sellersResult,result:[{...sellersResult.result[0],data_docid:"other"}]}},/DATADOCID_DRIFT/]
])assert.throws(()=>validateSellersRetentionResults({lineage,sellersResult,productInfoResult,...change}),pattern,name);

const sparseSellers={...sellersResult,result:[{title:productInfoItem.title,items:[sellerItem]}]};
assert.equal(validateSellersRetentionResults({lineage,sellersResult:sparseSellers,productInfoResult}).providerIdentity.comparisons[0].authorizationToSellers,"UNKNOWN");

const root=await mkdtemp(join(tmpdir(),"hr-b008a-"));
try{
  const evidenceRepository=new FileDataForSeoMarketEvidenceRepository({statePath:join(root,"evidence.json"),now:()=>"2026-09-01T18:03:00Z"});
  const atlasResolver={resolve:async()=>({outcome:"PROBABLE",atlasProductId:proposal.atlasProductId,externalProductId:null,evidence:[],candidateAtlasProductIds:[],automaticMercuryEligible:false})};
  const processor=new DataForSeoAcquisitionResultProcessor({atlasResolver,evidenceRepository,retailers:[]});
  const retention=new SellersResultDf003RetentionService({resultProcessor:processor});
  const input={sellersResult,productInfoResult,sellersTaskId,productInfoTaskId,observedAt:"2026-09-01T18:02:36.223Z",providerIdentity:ids,candidateId};
  const result=await retention.retain(input);assert.equal(result.retained,1);assert.equal(result.actualSpendUsd,0);assert.equal(result.integrations[0].merchantIdentityOutcome,"DISCOVERED");
  const stored=(await evidenceRepository.getAll())[0];assert.equal(stored.candidate.identity.atlasProductId,proposal.atlasProductId);assert.equal(stored.candidate.marketEvidence.provenance.sourceTaskId,sellersTaskId);assert.equal(stored.candidate.marketEvidence.offer.condition,null);assert.equal(stored.candidate.marketEvidence.pricing.shippingPrice,null);
  assert.equal((await retention.retain(input)).duplicates,1);assert.equal((await evidenceRepository.getAll()).length,1);
  await assert.rejects(()=>retention.retain({...input,productInfoResult:{...productInfoResult,result:[{items:[{...productInfoItem,gid:"drift"}]}]}}),/DF003_PRODUCT_INFO_IDENTITY_MISMATCH/);
  const contradiction={...sellersResult,result:[{...sellersResult.result[0],items:[{...sellerItem,url:"https://other.example/item"}]}]};const before=structuredClone(await evidenceRepository.getAll());await assert.rejects(()=>retention.retain({...input,sellersResult:contradiction}),/ACQUISITION_EVIDENCE_CONFLICT/);assert.deepEqual(await evidenceRepository.getAll(),before);
}finally{await rm(root,{recursive:true,force:true});}
console.log("B-008A SELLERS result/DF003 lineage governance tests passed (25 cases).");
