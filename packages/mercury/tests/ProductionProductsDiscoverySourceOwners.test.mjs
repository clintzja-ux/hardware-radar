import assert from "node:assert/strict";
import {mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {
  DataForSeoTaskLedger, FileAcquisitionExecutionLedgerRepository, FileAmazonAcceptanceActionRepository,
  FileAmazonHistoricalAcceptanceRepository, FileDataForSeoPrepareArtifactRepository,
  FileHistoricalBootstrapProviderResultRepository, FileLiveAuthorizationConsumptionRepository,
  NeutralBoundedPaidActionCoordinator, ProductsIdentityDiscoveryDomainAdapter,
  ProductsIdentityDiscoveryService, PRODUCTS_DISCOVERY_CONFIRMATIONS, SqliteNeutralBoundedRepository,
  createProductionAmazonProductsDiscoverySourceOwner, createProductionGoogleProductsDiscoverySourceOwner,
  defaultSourceRightsRegistry
} from "../index.js";

let cases=0;const eq=(a,b)=>{assert.deepEqual(a,b);cases++};
const at="2026-09-14T12:00:00.000Z",expiresAt="2026-09-14T13:00:00.000Z";
const product=(id,mpn)=>({identity:{atlasProductId:id,brand:"Corsair",manufacturerPartNumber:mpn},governance:{lifecycleStatus:"ACTIVE",publicationStatus:"READY"},extension:{data:{capacity:{capacityGb:32,moduleCount:2},classification:{memoryType:"DDR5",formFactor:"DIMM"},performance:{dataRateMtps:6000},physical:{}}}});
const googleProduct=product("ram_google_source_owner","CMK32GX5M2B6000Z30"),amazonProduct=product("ram_amazon_source_owner","CMH32GX5M2B6000C38"),products=[googleProduct,amazonProduct];
const atlas={products:{getAll:async()=>products,getById:async id=>products.find(value=>value.identity.atlasProductId===id)??null}};

const root=await mkdtemp(join(tmpdir(),"production-products-source-owners-"));
const boundedRepository=new SqliteNeutralBoundedRepository({databasePath:join(root,"bounded.sqlite")});
try{
  const taskLedger=new DataForSeoTaskLedger(),executionRepository=new FileAcquisitionExecutionLedgerRepository({filePath:join(root,"executions.json")}),consumptionRepository=new FileLiveAuthorizationConsumptionRepository({filePath:join(root,"consumptions.json")}),resultRepository=new FileHistoricalBootstrapProviderResultRepository({statePath:join(root,"results.json")}),childArtifactRepository=new FileDataForSeoPrepareArtifactRepository({statePath:join(root,"children.json")}),amazonArtifactRepository=new FileAmazonHistoricalAcceptanceRepository({statePath:join(root,"amazon-artifacts.json")}),amazonActionRepository=new FileAmazonAcceptanceActionRepository({statePath:join(root,"amazon-actions.json")});
  let googleCalls=0,amazonCalls=0,googlePending=false,amazonPending=false;
  const googleProvider={async createProductsTask(execution){googleCalls++;return taskLedger.record(`google:${execution.keyword}`,{kind:"PRODUCTS",taskId:"google-task",costUsd:.001,createdStatus:20100,sourceId:"DATAFORSEO_GOOGLE_SHOPPING"})},async getProductsResult(){return googlePending?{result:[]}:{id:"google-task",result:[{items:[{title:"Corsair CMK32GX5M2B6000Z30 VENGEANCE DDR5 32GB 2x16GB Memory Kit 6000MT/s CL30",product_id:"google-product",data_docid:"google-doc",gid:"google-gid"}]}]}}};
  const amazonProvider={async createAmazonProductsTask(execution){amazonCalls++;return taskLedger.record(`amazon:${execution.paidActionIntentId}`,{kind:"AMAZON_PRODUCTS",taskId:"amazon-task",costUsd:.0015,createdStatus:20100,sourceId:"DATAFORSEO_AMAZON",atlasProductId:execution.atlasProduct.identity.atlasProductId,requestDigest:"a".repeat(64),checkpointId:execution.checkpointId,productIndex:execution.productIndex,sourceRightsProfileDigest:execution.sourceRightsProfileDigest,paidActionIntentId:execution.paidActionIntentId})},async getAmazonProductsResult(){return amazonPending?{result:[]}:{id:"amazon-task",result:[{items:[{data_asin:"B0CQQVNCB6",title:`Corsair ${amazonProduct.identity.manufacturerPartNumber} 32GB DDR5 6000`}]}]}}};
  const google=createProductionGoogleProductsDiscoverySourceOwner({atlas,boundedRepository,childArtifactRepository,taskLedger,executionRepository,consumptionRepository,resultRepository,rightsRegistry:defaultSourceRightsRegistry,acquisitionService:googleProvider,stateRoot:root,now:()=>at});
  const spendResolver=async()=>Number((await executionRepository.getAll()).filter(row=>row.status==="COMPLETED").reduce((sum,row)=>sum+(row.actualSpendUsd??0),0).toFixed(4));
  const amazon=createProductionAmazonProductsDiscoverySourceOwner({atlas,destinationRepository:{getAll:async()=>[{destinationId:"amazon-destination",atlasProductId:amazonProduct.identity.atlasProductId,retailerId:"RETAILER-0001",marketplace:"amazon.com",retailerListingId:"B0CQQVNCB6",status:"ACTIVE"}]},historicalRepository:{getAll:async()=>[]},boundedRepository,artifactRepository:amazonArtifactRepository,actionRepository:amazonActionRepository,taskLedger,executionRepository,consumptionRepository,resultRepository,rightsRegistry:defaultSourceRightsRegistry,spendResolver,acquisitionService:amazonProvider,stateRoot:root,now:()=>at});
  for(const owner of[google,amazon])for(const method of["prepare","authorize","execute","resolveTask","retrieve","finalize","recoverPreExecution"])eq(typeof owner[method],"function");
  const adapter=new ProductsIdentityDiscoveryDomainAdapter({productRepository:atlas.products,readinessOwner:{assess:async()=>({state:"READY_FOR_DISCOVERY",readinessBindingDigest:"b".repeat(64)})},rightsRegistry:defaultSourceRightsRegistry,sourceOwners:{DATAFORSEO_GOOGLE_SHOPPING:google,DATAFORSEO_AMAZON:amazon},boundedRepository,childAuthorizationArtifactRepository:childArtifactRepository,now:()=>at});
  const coordinator=new NeutralBoundedPaidActionCoordinator({repository:boundedRepository,domainAdapter:adapter,spendResolver:async()=>0,now:()=>at,dailySpendCeilingUsd:.025,policyVersion:"MERCURY-PRODUCTS-IDENTITY-DISCOVERY-1.0"}),service=new ProductsIdentityDiscoveryService({coordinator});
  for(const cohort of[[{atlasProductId:googleProduct.identity.atlasProductId,sourceId:"DATAFORSEO_GOOGLE_SHOPPING"}],[{atlasProductId:amazonProduct.identity.atlasProductId,sourceId:"DATAFORSEO_AMAZON"}]]){
    const prepared=await service.prepare({cycle:at,cohort}),authorized=await service.authorize({planId:prepared.value.planId,operator:"fixture",reason:"complete source-owner fixture",expiresAt,confirmation:PRODUCTS_DISCOVERY_CONFIRMATIONS.AUTHORIZE}),completed=await service.start({authorizationId:authorized.value.authorizationId,startedBy:"fixture",confirmation:PRODUCTS_DISCOVERY_CONFIRMATIONS.START});
    eq(completed.state,"COMPLETED");eq(completed.members.every(member=>member.sellersTaskCreated===false&&member.publicationAuthority===false&&member.currentPriceAuthority===false),true);eq((await service.resume({runId:completed.runId,resumedBy:"fixture",confirmation:PRODUCTS_DISCOVERY_CONFIRMATIONS.RESUME})).state,"COMPLETED");
  }
  eq(googleCalls,1);eq(amazonCalls,1);eq(googleCalls+amazonCalls,2);
  googlePending=true;amazonPending=true;eq(typeof google.recoverPreExecution,"function");eq(typeof amazon.recoverPreExecution,"function");
}finally{boundedRepository.close();await rm(root,{recursive:true,force:true,maxRetries:5,retryDelay:50});}
console.log(`Production Products discovery source-owner tests passed: ${cases} cases.`);
