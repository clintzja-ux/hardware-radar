import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { BrandRepository, ProductRepository } from "../packages/atlas/index.js";
import {
  DataForSeoMerchantApiClient, DataForSeoAcquisitionService,
  FileAcquisitionExecutionLedgerRepository, FileDataForSeoTaskLedger,
  FileLiveAuthorizationConsumptionRepository, createDirectProductsSellersProposal, createGovernedSellersEnrichmentProposal,
  loadDataForSeoCredentials, validateProductInfoRetrievalLineage
} from "../packages/mercury/index.js";

const args=new Map(process.argv.slice(2).map(value=>{const index=value.indexOf("=");return index<0?[value,true]:[value.slice(0,index),value.slice(index+1)];}));
const productInfoTaskId=args.get("--product-info-task-id");
const productsReviewState=args.get("--products-review-state");
const stateRoot=path.resolve(".forge-review/acquisition");
const readLocalJson=async resource=>JSON.parse(await readFile(resource,"utf8"));
const writeProposal=async proposal=>{const envelope={schemaVersion:"1.0",proposal,paidTaskCreated:false,actualSpendUsd:0},output=path.join(stateRoot,"sellers-enrichment-proposal.json");await mkdir(path.dirname(output),{recursive:true});await writeFile(output,`${JSON.stringify(envelope,null,2)}\n`);console.log("SELLERS ENRICHMENT PREPARE");console.log("Source PRODUCTS task:    ",proposal.sourceProductsTaskId);console.log("Identity lineage:        ",proposal.identityLineageType);console.log("Source PRODUCT_INFO task:",proposal.sourceProductInfoTaskId??"NOT_REQUIRED");console.log("Atlas product:           ",proposal.atlasProductId);console.log("Data docid:              ",proposal.providerIdentity.dataDocId);console.log("Atlas evidence:          ",proposal.validation.atlas.status);console.log("Operation:                SELLERS");console.log("Paid task created:        NO");console.log("Actual spend:             $0.000");console.log("Status:                   PENDING_OPERATOR_REVIEW");console.log("Proposal export:          .forge-review\\acquisition\\sellers-enrichment-proposal.json");};
if(typeof productsReviewState==="string"&&productsReviewState){
  if(productInfoTaskId)throw new Error("SELLERS_PREPARE_LINEAGE_AMBIGUOUS");
  const productsReview=await readLocalJson(path.resolve(productsReviewState));
  const atlasProduct=await new ProductRepository({readJson:readLocalJson}).loadProduct(productsReview.atlasProductId);
  const proposal=createDirectProductsSellersProposal({atlasProduct,productsReview,sourceRightsDigest:productsReview.sourceRightsDigest});
  await writeProposal(proposal);
  process.exit(0);
}
if(typeof productInfoTaskId!=="string"||!productInfoTaskId)throw new Error("PRODUCT_INFO_TASK_ID_REQUIRED");
const authorization=JSON.parse(await readFile(path.join(stateRoot,"product-info-authorization-request.json"),"utf8"));
const prepared=JSON.parse(await readFile(path.join(stateRoot,"product-enrichment-proposal.json"),"utf8"));
const productInfoProposal=prepared.proposal??prepared;
const taskRepository=new FileDataForSeoTaskLedger(path.join(stateRoot,"dataforseo-task-ledger.json"));
const executionRepository=new FileAcquisitionExecutionLedgerRepository({filePath:path.join(stateRoot,"execution-ledger.json")});
const consumptionRepository=new FileLiveAuthorizationConsumptionRepository({filePath:path.join(stateRoot,"live-authorization-consumptions.json")});
const lineage=validateProductInfoRetrievalLineage({productInfoTaskId,productInfoAuthorization:authorization,productInfoProposal,taskLedger:taskRepository.getAll(),executionRuns:await executionRepository.getAll(),authorizationConsumptions:await consumptionRepository.getAll()});

const credentials=loadDataForSeoCredentials();
const transport=async({method,url,headers,body})=>{if(method!=="GET"||!url.includes("/product_info/task_get/advanced/"))throw new Error("PRODUCT_INFO_RESULT_RETRIEVAL_GET_ONLY");const response=await fetch(url,{method,headers,body:body?JSON.stringify(body):undefined});const data=await response.json();if(!response.ok)throw new Error(`HTTP_${response.status}`);return data;};
const client=new DataForSeoMerchantApiClient({login:credentials.login,password:credentials.password,transport});
const service=new DataForSeoAcquisitionService({client});
const productInfoResult=await service.getProductInfoResult(productInfoTaskId);
const atlasProduct=await new ProductRepository({readJson:readLocalJson}).loadProduct(authorization.atlasProductId),brandRecord=await new BrandRepository({readJson:readLocalJson}).getByDisplayName(atlasProduct.identity.brand);
const proposal=createGovernedSellersEnrichmentProposal({lineage,productInfoResult,productInfoAuthorization:authorization,atlasProduct,brandAliases:brandRecord?.aliases??[]});
await writeProposal(proposal);
