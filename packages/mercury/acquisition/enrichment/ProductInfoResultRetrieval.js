import crypto from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createGovernedSellersEnrichmentProposal, validateProductInfoRetrievalLineage } from "./ProductInfoResultBoundary.js";

const stable=value=>Array.isArray(value)?`[${value.map(stable).join(",")}]`:value&&typeof value==="object"?`{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`:JSON.stringify(value);
const digest=value=>crypto.createHash("sha256").update(stable(value)).digest("hex");
const freeze=value=>{if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;};
const clone=value=>value==null?value:structuredClone(value);
const nonBlank=value=>typeof value==="string"&&value.trim()!=="";

export class FileProductInfoResultRepository{
  constructor({statePath}={}){if(!statePath)throw new TypeError("PRODUCT_INFO_RESULT_STATE_PATH_REQUIRED");this.statePath=resolve(statePath);}
  async _read(){try{const value=JSON.parse(await readFile(this.statePath,"utf8"));if(value?.schemaVersion!=="1.0"||!Array.isArray(value.results)||value.reassessments!=null&&!Array.isArray(value.reassessments))throw new Error("PRODUCT_INFO_RESULT_STATE_MALFORMED");return{...value,reassessments:value.reassessments??[]};}catch(error){if(error?.code==="ENOENT")return{schemaVersion:"1.0",results:[],reassessments:[]};throw error;}}
  async getByTaskId(taskId){return freeze(clone((await this._read()).results.find(value=>value.providerTaskId===taskId)??null));}
  async record(result){const state=await this._read(),prior=state.results.find(value=>value.providerTaskId===result?.providerTaskId);if(prior){if(prior.materialDigest!==result?.materialDigest)throw new Error("PRODUCT_INFO_RESULT_REPLAY_CONFLICT");return freeze({status:"DUPLICATE",result:clone(prior)});}const next={...state,results:[...state.results,clone(result)]};await mkdir(dirname(this.statePath),{recursive:true});const temp=`${this.statePath}.${process.pid}.${crypto.randomUUID()}.tmp`;await writeFile(temp,`${JSON.stringify(next,null,2)}\n`,"utf8");await rename(temp,this.statePath);return freeze({status:"RECORDED",result:clone(result)});}
  async recordReassessment(value){const state=await this._read(),prior=state.reassessments.find(item=>item.reassessmentId===value?.reassessmentId);if(prior){if(prior.materialDigest!==value?.materialDigest)throw new Error("PRODUCT_INFO_REASSESSMENT_REPLAY_CONFLICT");return freeze({status:"DUPLICATE",reassessment:clone(prior)});}const next={...state,reassessments:[...state.reassessments,clone(value)]};await mkdir(dirname(this.statePath),{recursive:true});const temp=`${this.statePath}.${process.pid}.${crypto.randomUUID()}.tmp`;await writeFile(temp,`${JSON.stringify(next,null,2)}\n`,"utf8");await rename(temp,this.statePath);return freeze({status:"RECORDED",reassessment:clone(value)});}
  async getReassessments(taskId){return freeze(clone((await this._read()).reassessments.filter(value=>value.providerTaskId===taskId)));}
}

function evidence(item){return{title:item?.title??null,productId:item?.product_id??null,dataDocId:item?.data_docid??null,gid:item?.gid??null,brand:item?.brand??null,description:item?.description??null,specifications:Array.isArray(item?.specifications)?clone(item.specifications):[],sellerCount:Array.isArray(item?.sellers)?item.sellers.length:0,sourceUrl:item?.url??item?.source_url??null};}

export class ProductInfoResultRetrievalService{
  constructor({retriever,resultRepository,now=()=>new Date().toISOString()}={}){if(typeof retriever!=="function"||!resultRepository?.record)throw new TypeError("PRODUCT_INFO_RESULT_RETRIEVAL_DEPENDENCY_REQUIRED");this.retriever=retriever;this.resultRepository=resultRepository;this.now=now;}
  async retrieve({taskId,productInfoAuthorization,productInfoProposal,taskLedger,executionRuns,authorizationConsumptions,atlasProduct,brandAliases=[]}={}){
    if(!nonBlank(taskId))throw new Error("PRODUCT_INFO_TASK_ID_REQUIRED");
    const lineage=validateProductInfoRetrievalLineage({productInfoTaskId:taskId.trim(),productInfoAuthorization,productInfoProposal,taskLedger,executionRuns,authorizationConsumptions});
    const prior=await this.resultRepository.getByTaskId?.(taskId.trim());
    let providerResult;try{providerResult=await this.retriever(taskId.trim());}catch(error){if(/^DATAFORSEO_TASK_ERROR:40/.test(String(error?.message)))return freeze({status:"PROVIDER_PENDING",lineage,paidTaskCreated:false,actualSpendUsd:0});throw error;}
    if(providerResult?.id!==taskId.trim())throw new Error("PRODUCT_INFO_RESULT_TASK_BINDING_FAILURE");
    const blocks=providerResult?.result;
    if(!Array.isArray(blocks)||blocks.length===0){const outcome=freeze({status:"PROVIDER_PENDING",lineage,paidTaskCreated:false,actualSpendUsd:0});return outcome;}
    const items=blocks[0]?.items;
    if(!Array.isArray(items))throw new Error("PRODUCT_INFO_RESULT_MALFORMED");
    if(items.length===0)return freeze({status:"NO_RESULT",lineage,paidTaskCreated:false,actualSpendUsd:0});
    let derived;try{derived=createGovernedSellersEnrichmentProposal({lineage,productInfoResult:providerResult,productInfoAuthorization,atlasProduct,brandAliases,createdAt:this.now()});}catch(error){if(!String(error?.message).startsWith("SELLERS_PRODUCT_INFO_ATLAS_CONTRADICTION:"))throw error;const reason=String(error.message).slice("SELLERS_PRODUCT_INFO_ATLAS_CONTRADICTION:".length),material={providerTaskId:taskId.trim(),executionRunId:lineage.executionRunId,authorizationId:lineage.productInfoAuthorizationId,proposalId:lineage.productInfoProposalId,selectionDecisionId:lineage.providerSelectionLineage?.selectionDecisionId??null,atlasProductId:lineage.atlasProductId,providerIdentity:{productId:items[0]?.product_id??null,dataDocId:items[0]?.data_docid??null,gid:items[0]?.gid??null},retrievedEvidence:evidence(items[0]),validation:{status:"REVIEW_REQUIRED",reasons:reason.split(",").filter(Boolean)},sellersReadiness:"NOT_ESTABLISHED"},materialDigest=digest(material),record=freeze({schemaVersion:"1.0",resultId:`mer_productinforesult_${materialDigest.slice(0,24)}`,...material,retrievedAt:this.now(),materialDigest,status:"PRODUCT_INFO_REVIEW_REQUIRED",paidTaskCreated:false,actualSpendUsd:0,downstreamAuthority:{sellersExecution:false,retention:false,historical:false,canonical:false,review:false,publication:false,currentPrice:false,cheapest:false,pick:false}});if(prior&&prior.materialDigest!==materialDigest)throw new Error("PRODUCT_INFO_RESULT_REPLAY_CONFLICT");const persisted=await this.resultRepository.record(record);return freeze({status:persisted.status==="DUPLICATE"?"DUPLICATE":"PRODUCT_INFO_REVIEW_REQUIRED",result:persisted.result,sellersReadiness:"NOT_ESTABLISHED",lineage,paidTaskCreated:false,actualSpendUsd:0});}
    const material={providerTaskId:taskId.trim(),executionRunId:lineage.executionRunId,authorizationId:lineage.productInfoAuthorizationId,proposalId:lineage.productInfoProposalId,selectionDecisionId:lineage.providerSelectionLineage?.selectionDecisionId??null,atlasProductId:lineage.atlasProductId,providerIdentity:derived.providerIdentity,retrievedEvidence:evidence(items[0]),validation:derived.validation,sellersReadiness:"READY_FOR_SELLERS"};
    const materialDigest=digest(material),record=freeze({schemaVersion:"1.0",resultId:`mer_productinforesult_${materialDigest.slice(0,24)}`,...material,retrievedAt:this.now(),materialDigest,status:"PRODUCT_INFO_VALIDATED",paidTaskCreated:false,actualSpendUsd:0,downstreamAuthority:{sellersExecution:false,retention:false,historical:false,canonical:false,review:false,publication:false,currentPrice:false,cheapest:false,pick:false}});
    if(prior&&prior.materialDigest!==materialDigest)throw new Error("PRODUCT_INFO_RESULT_REPLAY_CONFLICT");
    const persisted=await this.resultRepository.record(record);return freeze({status:persisted.status==="DUPLICATE"?"DUPLICATE":"RESULT_RECEIVED",result:persisted.result,sellersReadiness:"READY_FOR_SELLERS",lineage,paidTaskCreated:false,actualSpendUsd:0});
  }
}
