import crypto from "node:crypto";
import { evaluateAcquisitionRight } from "../rights/SourceRightsEvaluator.js";
import { DataForSeoTaskLedger } from "../acquisition/dataforseo/DataForSeoTaskLedger.js";
import { DATAFORSEO_AMAZON_OPERATIONS, DATAFORSEO_AMAZON_SOURCE_ID } from "./DataForSeoAmazonContracts.js";
import { buildAmazonProductsRequest, buildAmazonAsinRequest, buildAmazonSellersRequest } from "./DataForSeoAmazonRequests.js";

const stable=value=>Array.isArray(value)?`[${value.map(stable).join(",")}]`:value&&typeof value==="object"?`{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`:JSON.stringify(value);
const key=value=>crypto.createHash("sha256").update(stable(value)).digest("hex");
function rights(){const result=evaluateAcquisitionRight({licenseContext:DATAFORSEO_AMAZON_SOURCE_ID,sourceMethod:"API"});if(!result.allowed)throw new Error(`DATAFORSEO_AMAZON_SOURCE_RIGHTS_BLOCKED:${result.state}`);}
async function persist(ledger,request,task,lineage){const {paidActionIntentId=null,checkpointId=null,productIndex=null,sourceRightsProfileDigest=null}=lineage;const requestKey=key({sourceId:request.sourceId,operation:request.operation,requestDigest:request.requestDigest,paidActionIntentId});ledger.requireNew(requestKey);return ledger.record(requestKey,{kind:request.operation,taskId:task.id,costUsd:Number(task.cost??0),createdStatus:task.status_code,sourceId:request.sourceId,atlasProductId:request.internalLineage.atlasProductId,asin:request.providerPayload.asin??null,requestDigest:request.requestDigest,checkpointId,productIndex,sourceRightsProfileDigest,...(paidActionIntentId?{paidActionIntentId}:{})});}

export class DataForSeoAmazonAcquisitionService{
 constructor({client,ledger=new DataForSeoTaskLedger()}={}){if(!client)throw new TypeError("client is required.");Object.assign(this,{client,ledger});}
 async createAmazonProductsTask({atlasProduct,locationName,languageName,...lineage}={}){rights();const request=buildAmazonProductsRequest({atlasProduct,locationName,languageName}),task=await this.client.postAmazonProductsTask(request.providerPayload);return persist(this.ledger,request,task,lineage);}
 async createAmazonAsinTask({atlasProductId,dataAsin,locationName,languageName,...lineage}={}){rights();const request=buildAmazonAsinRequest({atlasProductId,dataAsin,locationName,languageName}),task=await this.client.postAmazonAsinTask(request.providerPayload);return persist(this.ledger,request,task,lineage);}
 async createAmazonSellersTask({atlasProductId,dataAsin,locationName,languageName,...lineage}={}){rights();const request=buildAmazonSellersRequest({atlasProductId,dataAsin,locationName,languageName}),task=await this.client.postAmazonSellersTask(request.providerPayload);return persist(this.ledger,request,task,lineage);}
 async getAmazonProductsResult(taskId){rights();return this.client.getAmazonProductsResult(taskId);}
 async getAmazonAsinResult(taskId){rights();return this.client.getAmazonAsinResult(taskId);}
 async getAmazonSellersResult(taskId){rights();return this.client.getAmazonSellersResult(taskId);}
}
