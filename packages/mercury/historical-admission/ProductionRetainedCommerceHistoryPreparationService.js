import crypto from "node:crypto";
import {createReadStream} from "node:fs";
import {mkdir,readFile,writeFile} from "node:fs/promises";
import path from "node:path";
import {ProductRepository,RetailerRepository} from "../../atlas/index.js";
import {assessRakutenNeweggCondition,assessRakutenNeweggDestination,assessRakutenNeweggPrice,extractRakutenMerchantUrl,parseRakutenProductCatalogGzip} from "../current-display/index.js";
import {loadRetailerDestinationSource} from "../destinations/RetailerDestinationSource.js";
import {defaultSourceRightsRegistry} from "../rights/SourceRightsRegistry.js";
import {createRetainedCommerceCandidate,createRetainedCommerceHistoryPlan,prepareRetainedCommerceHistory,retainedCommerceDigest} from "./RetainedCommerceHistoryPreparation.js";
import {retainedCommerceHistoryExecutionConfirmation} from "./RetainedCommerceHistoryExecutionService.js";

const freeze=value=>Object.freeze(structuredClone(value));
const hashBytes=bytes=>crypto.createHash("sha256").update(bytes).digest("hex");
const hashFile=async file=>{const hash=crypto.createHash("sha256");for await(const chunk of createReadStream(file))hash.update(chunk);return hash.digest("hex");};
const readExisting=async file=>{try{return await readFile(file,"utf8");}catch(error){if(error?.code==="ENOENT")return null;throw error;}};
const activeProduct=product=>product?.governance?.lifecycleStatus==="ACTIVE"&&product?.governance?.publicationStatus==="READY";

export class ProductionRetainedCommerceHistoryPreparationService{
  constructor(input={}){
    for(const name of ["productRepository","retailerRepository","destinationSourceLoader","destinationSourcePath","historyPath","outputRoot","rightsRegistry"])if(!input[name])throw new TypeError("RETAINED_COMMERCE_HISTORY_PREPARATION_COMPOSITION_INVALID");
    Object.assign(this,input);this.root=path.resolve(input.root??process.cwd());this.historyPath=path.resolve(input.historyPath);this.outputRoot=path.resolve(input.outputRoot);
  }
  async persist(plan,preparation){
    await mkdir(this.outputRoot,{recursive:true});
    const planFile=path.join(this.outputRoot,`${plan.planId}.json`),preparationFile=path.join(this.outputRoot,`${preparation.preparationId}.json`),planText=`${JSON.stringify(plan,null,2)}\n`,preparationText=`${JSON.stringify(preparation,null,2)}\n`;
    const [priorPlan,priorPreparation]=await Promise.all([readExisting(planFile),readExisting(preparationFile)]);
    if((priorPlan===null)!==(priorPreparation===null))throw new Error("RETAINED_COMMERCE_HISTORY_PREPARATION_PARTIAL_CONFLICT");
    if(priorPlan!==null){
      if(priorPlan!==planText||priorPreparation!==preparationText)throw new Error("RETAINED_COMMERCE_HISTORY_PREPARATION_REPLAY_CONFLICT");
      const storedPlan=JSON.parse(priorPlan),storedPreparation=JSON.parse(priorPreparation),validatedPreparation=prepareRetainedCommerceHistory({plan:storedPlan});
      if(JSON.stringify(validatedPreparation)!==JSON.stringify(storedPreparation))throw new Error("RETAINED_COMMERCE_HISTORY_PREPARATION_REPLAY_CONFLICT");
      return{status:"REPLAY",planPath:path.relative(this.root,planFile),preparationPath:path.relative(this.root,preparationFile)};
    }
    await writeFile(planFile,planText,{flag:"wx"});
    try{await writeFile(preparationFile,preparationText,{flag:"wx"});}catch(error){throw Object.assign(new Error("RETAINED_COMMERCE_HISTORY_PREPARATION_PARTIAL_CONFLICT"),{cause:error});}
    return{status:"PREPARED",planPath:path.relative(this.root,planFile),preparationPath:path.relative(this.root,preparationFile)};
  }
  async prepare({artifactPath,expectedDigest,expectedObservedAt,catalogStateId=null}={}){
    const artifact=path.resolve(String(artifactPath??"")),digest=String(expectedDigest??"").toLowerCase(),observedAt=new Date(String(expectedObservedAt??"")).toISOString();
    if(!/^[a-f0-9]{64}$/.test(digest)||await hashFile(artifact)!==digest)throw new Error("NEWEGG_ROUTINE_ARTIFACT_DIGEST_MISMATCH");
    const rights=this.rightsRegistry.require("RAKUTEN_NEWEGG_PRODUCT_CATALOG"),rightsDigest=retainedCommerceDigest(rights);
    if(rights.retention.historical!=="ALLOWED"||rights.derivation.historicalAnalytics!=="ALLOWED")throw new Error("RETAINED_COMMERCE_HISTORY_RIGHTS_NOT_ALLOWED");
    const [products,retailers,historyBytes]=await Promise.all([this.productRepository.getAll(),this.retailerRepository.getAll(),readFile(this.historyPath)]),history=JSON.parse(historyBytes),destinationSource=await this.destinationSourceLoader({sourcePath:this.destinationSourcePath,products,retailers}),destinations=destinationSource.effective.filter(value=>value.retailerId==="RETAILER-0004"&&value.status==="ACTIVE"),productsById=new Map(products.map(value=>[value.identity.atlasProductId,value])),counts={},candidates=[],exceptions=[];
    let header=null,trailer=null,physical=0;const add=key=>counts[key]=(counts[key]??0)+1;
    for await(const record of parseRakutenProductCatalogGzip(createReadStream(artifact),{feedProfile:"MAIN_FULL",feedFamilyKey:"RAKUTEN_MAIN:44583:4746097"})){
      if(record.recordType==="HDR"){header=record;continue;}if(record.recordType==="TRL"){trailer=record;continue;}physical++;
      const binding=assessRakutenNeweggDestination(record,destinations);if(binding.status==="DESTINATION_NOT_MATCHED")continue;if(binding.status!=="MATCHED"){
        add("IDENTITY_BLOCKED");
        if(binding.status==="MPN_CONTRADICTION"&&binding.conflictingDestination)exceptions.push({scope:"PRODUCT_LOCAL",type:"IDENTITY_REVIEW_REQUIRED",reason:"MPN_CONTRADICTION",atlasProductId:binding.conflictingDestination.atlasProductId,destinationId:binding.conflictingDestination.destinationId,retailerId:binding.conflictingDestination.retailerId,providerListingId:record.sku??null,providerProductId:record.productId??null,providerManufacturerPartNumber:record.manufacturerPartNumber??null,atlasManufacturerPartNumber:binding.conflictingDestination.binding?.manufacturerPartNumber??productsById.get(binding.conflictingDestination.atlasProductId)?.identity?.manufacturerPartNumber??null,sourceArtifactDigest:digest,sourceObservedAt:observedAt,excludedFromCurrent:true,excludedFromHistory:true,publicationEligible:false});
        continue;
      }
      const product=productsById.get(binding.destination.atlasProductId);if(!product||!activeProduct(product)||product.identity.manufacturerPartNumber.toUpperCase()!==String(record.manufacturerPartNumber??"").toUpperCase()||!record.sku||!record.productId){add("IDENTITY_BLOCKED");continue;}
      const price=assessRakutenNeweggPrice(record,{evaluatedAt:observedAt}),condition=assessRakutenNeweggCondition(record,{feedProfile:"MAIN_FULL"});if(price.status!=="PRICE_RESOLVED"||record.currency!=="USD"){add("PRICE_BLOCKED");continue;}if(condition.condition!=="NEW"){add(condition.evidenceState==="UNKNOWN"?"CONDITION_BLOCKED":"COMPARABILITY_BLOCKED");continue;}if(record.availability!=="in-stock"){add("COMPARABILITY_BLOCKED");continue;}
      const shipping=record.shipping==null||record.shipping===""?null:Number(record.shipping),candidate=createRetainedCommerceCandidate({providerId:"RAKUTEN_ADVERTISING",sourceId:"RAKUTEN_NEWEGG_PRODUCT_CATALOG",feedFamily:"RAKUTEN_MAIN:44583:4746097",artifactDigest:digest,eventType:"FULL",validatedObservedAt:observedAt,sourceProductId:record.productId,sourceListingId:record.sku,atlasProductId:product.identity.atlasProductId,retailerId:"RETAILER-0004",selectedPriceSemantic:price.selectedPriceField,conditionProvenance:condition.evidenceState,sourceRightsProfileId:rights.sourceId,sourceRightsProfileDigest:rightsDigest,basePrice:price.itemPriceUsd,currency:"USD",marketplace:"newegg.com",sourceUrl:extractRakutenMerchantUrl(record.productUrl??record.buyUrl),sellerName:null,condition:"NEW",availability:"in_stock",shipping:Number.isFinite(shipping)&&shipping>=0?shipping:null,tax:null,comparability:{policyVersion:"HISTORICAL-OFFER-COMPARABILITY-1.0",classification:"STANDALONE_COMPARABLE",standaloneEligible:true,reasons:[]},rawPayloadReference:`retained-commerce:${digest}:${record.productId}:${record.sku}`});
      if(history.records[candidate.historicalObservationId]){add("ALREADY_IN_HISTORY");continue;}candidates.push(candidate);add("HISTORY_QUALIFIED");
    }
    if(header?.feedTimestamp!==observedAt||trailer?.actualProductCount!==physical)throw new Error("NEWEGG_ROUTINE_EVENT_VALIDATION_MISMATCH");
    const unique=[...new Map(candidates.map(value=>[value.candidateDigest,value])).values()],historyCount=Object.keys(history.records).length,projectedImpact={newRecords:unique.length,projectedCount:historyCount+unique.length,projectedSequence:history.sequence+unique.length,products:new Set(unique.map(value=>value.atlasProductId)).size},plan=createRetainedCommerceHistoryPlan({historyHash:hashBytes(historyBytes),historySequence:history.sequence,historyCount,rightsProfileDigest:rightsDigest,candidates:unique,projectedImpact}),preparation=prepareRetainedCommerceHistory({plan}),saved=await this.persist(plan,preparation);
    return freeze({operation:"NEWEGG_ROUTINE_RETAINED_COMMERCE_HISTORY_PREPARE",status:saved.status,source:{artifactPath:path.relative(this.root,artifact),artifactDigest:digest,observedAt,feedFamily:"RAKUTEN_MAIN:44583:4746097",eventType:"FULL",physicalRecords:physical,catalogStateId},sourceRights:{sourceId:rights.sourceId,profileDigest:rightsDigest},historyPredecessor:plan.sourceHistory,counts:{...counts,eligible:unique.length,excluded:physical-unique.length,reviewRequired:counts.IDENTITY_BLOCKED??0},exceptions,candidates:unique,projectedImpact,plan:{planId:plan.planId,bindingDigest:plan.bindingDigest,path:saved.planPath,authority:plan.authority},preparation:{preparationId:preparation.preparationId,bindingDigest:preparation.bindingDigest,path:saved.preparationPath,authority:preparation.authority},confirmation:retainedCommerceHistoryExecutionConfirmation(plan,preparation),historyMutation:"NONE",releaseAuthority:false,providerCalls:0,paidTasks:0,actualSpendUsd:0,planValue:plan,preparationValue:preparation});
  }
}

export function toRetainedCommerceHistoryPreparationCliOutput(result){return{status:"PREPARED",physicalRecords:result.source.physicalRecords,counts:result.counts?Object.fromEntries(Object.entries(result.counts).filter(([key])=>!["eligible","excluded","reviewRequired"].includes(key))):{},planId:result.plan.planId,preparationId:result.preparation.preparationId,confirmation:result.confirmation,candidates:result.candidates.length,products:new Set(result.candidates.map(value=>value.atlasProductId)).size,rightsDigest:result.sourceRights.profileDigest};}

export function createProductionRetainedCommerceHistoryPreparationService({root=process.cwd()}={}){root=path.resolve(root);const readJson=async file=>JSON.parse(await readFile(file,"utf8"));return new ProductionRetainedCommerceHistoryPreparationService({root,productRepository:new ProductRepository({readJson}),retailerRepository:new RetailerRepository({readJson}),destinationSourceLoader:loadRetailerDestinationSource,destinationSourcePath:path.join(root,"packages/mercury/destinations/production-destinations.json"),historyPath:path.join(root,".forge-review/mercury/historical-observations.json"),outputRoot:path.join(root,".forge-review/mercury/newegg-routine"),rightsRegistry:defaultSourceRightsRegistry});}
