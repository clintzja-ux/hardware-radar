import crypto from "node:crypto";
import { assertProductInfoAuthorizationBinding } from "./ProductInfoEnrichmentAuthorization.js";
import { createSellersEnrichmentProposal } from "./SellersEnrichmentProposal.js";
import { assessDataForSeoProductEvidenceAgainstAtlas } from "../../resolution/dataforseo/DataForSeoAtlasResolver.js";

const freeze=value=>{if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;};
const digest=value=>crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
const one=(values,code)=>{if(values.length!==1)throw new Error(code);return values[0];};

export function validateProductInfoRetrievalLineage({productInfoTaskId,productInfoAuthorization,productInfoProposal,taskLedger,executionRuns,authorizationConsumptions}={}){
  if(typeof productInfoTaskId!=="string"||!productInfoTaskId.trim())throw new Error("PRODUCT_INFO_TASK_ID_REQUIRED");
  assertProductInfoAuthorizationBinding({request:productInfoAuthorization,proposal:productInfoProposal});
  if(!Array.isArray(taskLedger)||!Array.isArray(executionRuns)||!Array.isArray(authorizationConsumptions))throw new Error("PRODUCT_INFO_LINEAGE_STATE_MALFORMED");
  const task=one(taskLedger.filter(entry=>entry?.taskId===productInfoTaskId),"PRODUCT_INFO_TASK_LINEAGE_NOT_UNIQUE");
  if(task.kind!=="PRODUCT_INFO")throw new Error("PRODUCT_INFO_TASK_OPERATION_MISMATCH");
  const consumption=one(authorizationConsumptions.filter(entry=>entry?.authorizationId===productInfoAuthorization.requestId),"PRODUCT_INFO_AUTHORIZATION_NOT_CONSUMED_EXACTLY_ONCE");
  if(consumption.planId!==productInfoAuthorization.planId)throw new Error("PRODUCT_INFO_CONSUMPTION_PLAN_MISMATCH");
  const run=one(executionRuns.filter(entry=>entry?.planId===productInfoAuthorization.planId),"PRODUCT_INFO_EXECUTION_LINEAGE_NOT_UNIQUE");
  if(run.status!=="COMPLETED")throw new Error("PRODUCT_INFO_EXECUTION_NOT_COMPLETED");
  const completedTasks=(run.tasks??[]).filter(entry=>entry?.providerTaskId===productInfoTaskId&&entry?.outcome==="COMPLETED");
  one(completedTasks,"PRODUCT_INFO_COMPLETED_TASK_LINEAGE_NOT_UNIQUE");
  if((run.tasks??[]).length!==1||run.attemptedTasks!==1||run.completedTasks!==1||run.failedTasks!==0)throw new Error("PRODUCT_INFO_EXECUTION_TASK_CONFLICT");
  const decision=one((productInfoAuthorization.plan?.decisions??[]).filter(entry=>entry?.decision==="APPROVED"),"PRODUCT_INFO_AUTHORIZATION_PLAN_INVALID");
  if(decision.execution?.kind!=="PRODUCT_INFO")throw new Error("PRODUCT_INFO_AUTHORIZATION_OPERATION_MISMATCH");
  if(decision.candidateId!==`enrichment:${productInfoAuthorization.atlasProductId}:${productInfoAuthorization.proposalId}`)throw new Error("PRODUCT_INFO_AUTHORIZATION_CANDIDATE_BINDING_MISMATCH");
  const sourceTask=one(taskLedger.filter(entry=>entry?.taskId===productInfoAuthorization.sourceTaskId),"PRODUCT_INFO_SOURCE_PRODUCTS_TASK_LINEAGE_NOT_UNIQUE");
  if(sourceTask.kind!=="PRODUCTS")throw new Error("PRODUCT_INFO_SOURCE_TASK_OPERATION_MISMATCH");
  return freeze({schemaVersion:"1.0",status:"VALIDATED",productInfoTaskId,productInfoAuthorizationId:productInfoAuthorization.requestId,productInfoPlanId:productInfoAuthorization.planId,productInfoProposalId:productInfoAuthorization.proposalId,atlasProductId:productInfoAuthorization.atlasProductId,sourceProductsTaskId:productInfoAuthorization.sourceTaskId,executionRunId:run.runId,providerIdentity:structuredClone(productInfoAuthorization.providerIdentity),providerSelectionLineage:structuredClone(productInfoAuthorization.providerSelectionLineage??null),governanceBinding:structuredClone(productInfoAuthorization.governanceBinding??null)});
}

export function validateProductInfoProviderIdentity({authorizedIdentity,resultIdentity}={}){
  const fields=["productId","dataDocId","gid"],comparisons=[];
  for(const field of fields){const authorized=authorizedIdentity?.[field]??null,result=resultIdentity?.[field]??null;if(authorized!=null&&result!=null&&String(authorized)!==String(result))throw new Error(`SELLERS_PRODUCT_INFO_${field.toUpperCase()}_DRIFT`);comparisons.push({field,status:authorized!=null&&result!=null?"MATCH":"UNKNOWN",authorized,result});}
  if(!comparisons.some(entry=>entry.status==="MATCH"))throw new Error("SELLERS_PRODUCT_INFO_IDENTITY_UNPROVEN");
  return freeze({status:"VALIDATED",comparisons});
}

export function createGovernedSellersEnrichmentProposal({lineage,productInfoResult,productInfoAuthorization,atlasProduct,brandAliases=[],createdAt,estimatedCostUsd=.001}={}){
  if(lineage?.status!=="VALIDATED"||lineage.productInfoAuthorizationId!==productInfoAuthorization?.requestId)throw new Error("SELLERS_PRODUCT_INFO_LINEAGE_REQUIRED");
  if(atlasProduct?.identity?.atlasProductId!==lineage.atlasProductId)throw new Error("SELLERS_PRODUCT_INFO_ATLAS_PRODUCT_BINDING_MISMATCH");
  const items=productInfoResult?.result?.[0]?.items;
  if(!Array.isArray(items)||items.length!==1||!items[0]||typeof items[0]!=="object")throw new Error("SELLERS_PRODUCT_INFO_RESULT_MALFORMED");
  if(Number(productInfoResult?.cost??0)!==0)throw new Error("SELLERS_PREPARE_RETRIEVAL_MUST_BE_ZERO_COST");
  const item=items[0],resultIdentity={productId:item.product_id??null,dataDocId:item.data_docid??null,gid:item.gid??null};
  const providerIdentityValidation=validateProductInfoProviderIdentity({authorizedIdentity:productInfoAuthorization.providerIdentity,resultIdentity});
  const atlasValidation=assessDataForSeoProductEvidenceAgainstAtlas(item,atlasProduct,{brandAliases});
  if(atlasValidation.status==="CONTRADICTION")throw new Error(`SELLERS_PRODUCT_INFO_ATLAS_CONTRADICTION:${atlasValidation.contradictions.join(",")}`);
  const validation={schemaVersion:"1.0",status:"VALIDATED",lineage,providerIdentity:providerIdentityValidation,atlas:atlasValidation};
  const proposal=createSellersEnrichmentProposal({productInfoTaskId:lineage.productInfoTaskId,productInfoResult,productInfoAuthorization,createdAt,estimatedCostUsd});
  return freeze({...proposal,sourceProductInfoExecutionRunId:lineage.executionRunId,validation,validationDigest:digest(validation)});
}
