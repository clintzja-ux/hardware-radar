import assert from "node:assert/strict";
import {mkdtemp,readFile,rm} from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {
  DataForSeoAcquisitionResultProcessor,
  FileDataForSeoMarketEvidenceRepository,
  SellersResultDf003RetentionService,
  assessDataForSeoEvidencePromotion,
  classifyDefaultAcquisitionRoute,
  composeInitialAcquisitionPromotionAssessment,
  createDirectProductsSellersProposal,
  createGovernedInitialAcquisitionIdentityProjection,
  createSellersEnrichmentAuthorizationRequest,
  resolveGovernedInitialAcquisitionPromotionContext,
  validateSellersRetentionLineage,
  validateSellersRetentionResults
} from "../index.js";

const atlasProduct=JSON.parse(await readFile(new URL("../../atlas/products/ram/ddr5/HR-RAM-DDR5-000002-crucial-crucial-pro-cp2k16g56c46u5.json",import.meta.url),"utf8"));
const atlasProductId=atlasProduct.identity.atlasProductId;
const providerIdentity={productId:"provider-product-1",dataDocId:"provider-document-1",gid:"provider-gid-1"};
const candidate={score:100,exactMpnMatch:true,signals:[{name:"MPN",matched:true},{name:"BRAND",matched:true}],contradictions:[],item:{title:"Crucial Pro CP2K16G56C46U5 32GB DDR5",...providerIdentity}};
const resolution={recommendationStatus:"RECOMMENDED",recommendedCandidate:candidate,candidates:[candidate]};
const productsReview={schemaVersion:"1.1",reviewId:"productsreview_fixture_1",atlasProductId,providerTaskId:"products-task-1",identityState:"EXACT_OR_GOVERNED_MATCH",sourceRightsDigest:"rights-digest-1",materialDigest:"products-review-digest-1",resultIdentity:resolution};

const proposal=createDirectProductsSellersProposal({atlasProduct,productsReview,sourceRightsDigest:productsReview.sourceRightsDigest,createdAt:"2026-09-03T12:00:00.000Z"});
assert.equal(proposal.identityLineageType,"DIRECT_PRODUCTS_STRONG_IDENTITY");
assert.equal(proposal.sourceProductInfoTaskId,null);
assert.equal(proposal.validation.status,"VALIDATED");
assert.equal(proposal.providerIdentity.dataDocId,providerIdentity.dataDocId);
const replay=createDirectProductsSellersProposal({atlasProduct,productsReview,sourceRightsDigest:productsReview.sourceRightsDigest,createdAt:"2026-09-03T12:05:00.000Z"});
assert.equal(replay.proposalId,proposal.proposalId);
assert.equal(replay.materialDigest,proposal.materialDigest);

const authorization=createSellersEnrichmentAuthorizationRequest({proposal,createdAt:"2026-09-03T12:10:00.000Z"});
assert.equal(authorization.identityLineageType,"DIRECT_PRODUCTS_STRONG_IDENTITY");
assert.equal(authorization.sourceProductInfoTaskId,null);
assert.equal(authorization.maxSpendUsd,.001);

const sellersTaskId="sellers-task-1",candidateId=`sellers:${atlasProductId}:${proposal.proposalId}`;
const taskLedger=[{taskId:productsReview.providerTaskId,kind:"PRODUCTS"},{taskId:sellersTaskId,kind:"SELLERS"}];
const executionRuns=[{runId:"run-1",planId:authorization.planId,status:"COMPLETED",plannedTasks:1,attemptedTasks:1,completedTasks:1,failedTasks:0,tasks:[{candidateId,outcome:"COMPLETED",providerTaskId:sellersTaskId}]}];
const authorizationConsumptions=[{authorizationId:authorization.requestId,planId:authorization.planId}];
const lineage=validateSellersRetentionLineage({sellersTaskId,productInfoTaskId:null,sellersAuthorization:authorization,sellersProposal:proposal,taskLedger,executionRuns,authorizationConsumptions});
assert.equal(lineage.identityLineageType,"DIRECT_PRODUCTS_STRONG_IDENTITY");
assert.equal(lineage.productInfoTaskId,null);

const sellerItem={type:"shops_list",seller_name:"Fixture Memory",domain:"fixture-memory.example",url:"https://fixture-memory.example/crucial",base_price:99.99,shipping_price:null,tax:null,total_price:99.99,currency:"USD",product_condition:null,product_availability:"in_stock",details:"Crucial CP2K16G56C46U5 32GB DDR5"};
const sellersResult={id:sellersTaskId,cost:0,result:[{title:candidate.item.title,product_id:providerIdentity.productId,data_docid:providerIdentity.dataDocId,gid:providerIdentity.gid,items:[sellerItem]}]};
const governance=validateSellersRetentionResults({lineage,sellersResult,productInfoResult:null});
assert.equal(governance.status,"VALIDATED");
assert.ok(governance.providerIdentity.comparisons.every(value=>value.authorizationToSellers==="MATCH"));
const projection=createGovernedInitialAcquisitionIdentityProjection({governance,sellersProposal:proposal,atlasProduct,sellerItem,rawPayloadReference:`dataforseo:sellers:${sellersTaskId}:item:0`});
assert.equal(projection.identityLineageType,"DIRECT_PRODUCTS_STRONG_IDENTITY");
assert.equal(projection.effectiveProductState,"VERIFIED");
assert.equal(projection.productInfoTaskId,null);

const root=await mkdtemp(join(tmpdir(),"hr-direct-sellers-"));
try{
  const evidenceRepository=new FileDataForSeoMarketEvidenceRepository({statePath:join(root,"evidence.json"),now:()=>"2026-09-03T12:20:00.000Z"});
  const atlasResolver={resolve:async()=>({outcome:"PROBABLE",atlasProductId,externalProductId:null,evidence:[],candidateAtlasProductIds:[],automaticMercuryEligible:false})};
  const processor=new DataForSeoAcquisitionResultProcessor({atlasResolver,evidenceRepository,retailers:[]});
  const retentionService=new SellersResultDf003RetentionService({resultProcessor:processor});
  const retention=await retentionService.retain({sellersResult,productInfoResult:null,sellersTaskId,productInfoTaskId:null,observedAt:"2026-09-03T12:15:00.000Z",providerIdentity,candidateId,governedAcquisition:{identityLineageType:"DIRECT_PRODUCTS_STRONG_IDENTITY",createProjection:({sellerItem:retainedSeller,rawPayloadReference})=>createGovernedInitialAcquisitionIdentityProjection({governance,sellersProposal:proposal,atlasProduct,sellerItem:retainedSeller,rawPayloadReference})}});
  assert.equal(retention.retained,1);assert.equal(retention.productInfoTaskId,null);assert.equal(retention.actualSpendUsd,0);
  const records=await evidenceRepository.getAll(),retentionAudit={...retention,governance,atlasProductId,integrations:retention.integrations};
  const composition=composeInitialAcquisitionPromotionAssessment({records,requestedAtlasProductId:atlasProductId,retentionAudit,sellersProposalEnvelope:{proposal},atlasProduct});
  assert.equal(composition.mode,"GOVERNED_INITIAL_ACQUISITION_BINDING");
  const context=await resolveGovernedInitialAcquisitionPromotionContext({record:records[0],evidenceRecords:records,retentionAudit,sellersProposalEnvelope:{proposal},productRepository:{getById:async()=>atlasProduct}});
  assert.equal(context.acquisitionChain.identityLineageType,"DIRECT_PRODUCTS_STRONG_IDENTITY");
  assert.equal(context.acquisitionChain.productInfoTaskId,null);
  const assessment=assessDataForSeoEvidencePromotion({records:composition.records,initialAcquisitionIdentityProjections:composition.initialAcquisitionIdentityProjections});
  assert.equal(assessment.productIdentity,"VERIFIED");
  assert.equal(assessment.historicalEligible,false); // Merchant remains independently unresolved.
  assert.equal((await retentionService.retain({sellersResult,productInfoResult:null,sellersTaskId,productInfoTaskId:null,observedAt:"2026-09-03T12:15:00.000Z",providerIdentity,candidateId,governedAcquisition:{identityLineageType:"DIRECT_PRODUCTS_STRONG_IDENTITY",createProjection:({sellerItem:retainedSeller,rawPayloadReference})=>createGovernedInitialAcquisitionIdentityProjection({governance,sellersProposal:proposal,atlasProduct,sellerItem:retainedSeller,rawPayloadReference})}})).duplicates,1);
}finally{await rm(root,{recursive:true,force:true});}

assert.throws(()=>createDirectProductsSellersProposal({atlasProduct,productsReview:{...productsReview,sourceRightsDigest:"other"},sourceRightsDigest:productsReview.sourceRightsDigest}),/GOVERNANCE_BINDING/);
assert.throws(()=>createDirectProductsSellersProposal({atlasProduct,productsReview:{...productsReview,resultIdentity:{...resolution,recommendedCandidate:{...candidate,signals:[{name:"BRAND",matched:false}]},candidates:[{...candidate,signals:[{name:"BRAND",matched:false}]}]}},sourceRightsDigest:productsReview.sourceRightsDigest}),/STRONG_IDENTITY/);
assert.throws(()=>validateSellersRetentionLineage({sellersTaskId,productInfoTaskId:"substitution",sellersAuthorization:authorization,sellersProposal:proposal,taskLedger,executionRuns,authorizationConsumptions}),/DIRECT_PRODUCTS_LINEAGE/);
assert.throws(()=>validateSellersRetentionResults({lineage,sellersResult:{...sellersResult,result:[{...sellersResult.result[0],data_docid:"substitution",items:[sellerItem]}]}}),/DRIFT/);

const duplicateCandidate={...candidate,item:{...candidate.item,dataDocId:"provider-document-2"}};
assert.equal(classifyDefaultAcquisitionRoute({resolution:{recommendationStatus:"AMBIGUOUS",recommendedCandidate:null,candidates:[candidate,duplicateCandidate]},directSellersLineageCertified:true}).executableRoute,"MANUAL_PROVIDER_SELECTION");
const portfolio=Array.from({length:50},(_,index)=>{
  if(index===47)return classifyDefaultAcquisitionRoute({resolution:{recommendationStatus:"AMBIGUOUS",recommendedCandidate:null,candidates:[candidate,duplicateCandidate]},directSellersLineageCertified:true});
  if(index===48)return classifyDefaultAcquisitionRoute({resolution:{recommendationStatus:"NO_SAFE_CANDIDATE",recommendedCandidate:null,candidates:[{...candidate,contradictions:["CAPACITY_CONFLICT"]}]},directSellersLineageCertified:true});
  if(index===49)return classifyDefaultAcquisitionRoute({resolution:{recommendationStatus:"NO_SAFE_CANDIDATE",recommendedCandidate:null,candidates:[]},directSellersLineageCertified:true});
  const item={...candidate.item,dataDocId:`doc-${index}`};return classifyDefaultAcquisitionRoute({resolution:{recommendationStatus:"RECOMMENDED",recommendedCandidate:{...candidate,item},candidates:[{...candidate,item}]},directSellersLineageCertified:true});
});
assert.equal(portfolio.filter(value=>value.executableRoute==="READY_FOR_SELLERS").length,47);
assert.equal(portfolio.filter(value=>value.executableRoute==="MANUAL_PROVIDER_SELECTION").length,1);
assert.equal(portfolio.filter(value=>value.executableRoute==="MANUAL_IDENTITY_REVIEW").length,1);
assert.equal(portfolio.filter(value=>value.executableRoute==="UNRESOLVED").length,1);
assert.equal(portfolio.reduce((sum,value)=>sum+value.actualSpendUsd,0),0);

console.log("Direct PRODUCTS to SELLERS lineage tests passed: 50-product scale fixture plus governance cases.");
