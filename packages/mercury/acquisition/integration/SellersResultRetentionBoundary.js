import crypto from "node:crypto";
import { assertSellersAuthorizationBinding } from "../enrichment/SellersEnrichmentAuthorization.js";

const freeze=value=>{if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;};
const one=(values,code)=>{if(values.length!==1)throw new Error(code);return values[0];};
const identity=value=>({productId:value?.productId??value?.product_id??null,dataDocId:value?.dataDocId??value?.data_docid??null,gid:value?.gid??null});
const digest=value=>crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");

export function validateSellersRetentionLineage({sellersTaskId,productInfoTaskId,sellersAuthorization,sellersProposal,taskLedger,executionRuns,authorizationConsumptions}={}){
  if(typeof sellersTaskId!=="string"||!sellersTaskId.trim())throw new Error("SELLERS_TASK_ID_REQUIRED");
  if(typeof productInfoTaskId!=="string"||!productInfoTaskId.trim())throw new Error("PRODUCT_INFO_TASK_ID_REQUIRED");
  if(!Array.isArray(taskLedger)||!Array.isArray(executionRuns)||!Array.isArray(authorizationConsumptions))throw new Error("SELLERS_RETENTION_LINEAGE_STATE_MALFORMED");
  assertSellersAuthorizationBinding({request:sellersAuthorization,proposal:sellersProposal});
  if(sellersAuthorization.sourceProductInfoTaskId!==productInfoTaskId||sellersProposal.sourceProductInfoTaskId!==productInfoTaskId)throw new Error("SELLERS_RETENTION_PRODUCT_INFO_TASK_SUBSTITUTION_BLOCKED");
  if(sellersAuthorization.atlasProductId!==sellersProposal.atlasProductId||sellersAuthorization.sourceProductsTaskId!==sellersProposal.sourceProductsTaskId||sellersAuthorization.sourceProductInfoAuthorizationId!==sellersProposal.sourceProductInfoAuthorizationId)throw new Error("SELLERS_RETENTION_PROPOSAL_LINEAGE_MISMATCH");
  const productInfoLineage=sellersProposal.validation?.lineage;
  if(sellersProposal.validation?.status!=="VALIDATED"||sellersProposal.validationDigest!==digest(sellersProposal.validation)||productInfoLineage?.status!=="VALIDATED"||productInfoLineage.productInfoTaskId!==productInfoTaskId||productInfoLineage.productInfoAuthorizationId!==sellersProposal.sourceProductInfoAuthorizationId||productInfoLineage.productInfoProposalId!==sellersProposal.sourceProductInfoProposalId||productInfoLineage.executionRunId!==sellersProposal.sourceProductInfoExecutionRunId||productInfoLineage.atlasProductId!==sellersProposal.atlasProductId||productInfoLineage.sourceProductsTaskId!==sellersProposal.sourceProductsTaskId)throw new Error("SELLERS_RETENTION_PRODUCT_INFO_LINEAGE_INVALID");

  const sellersTask=one(taskLedger.filter(entry=>entry?.taskId===sellersTaskId),"SELLERS_RETENTION_TASK_LINEAGE_NOT_UNIQUE");
  if(sellersTask.kind!=="SELLERS")throw new Error("SELLERS_RETENTION_TASK_OPERATION_MISMATCH");
  const productInfoTask=one(taskLedger.filter(entry=>entry?.taskId===productInfoTaskId),"SELLERS_RETENTION_PRODUCT_INFO_TASK_LINEAGE_NOT_UNIQUE");
  if(productInfoTask.kind!=="PRODUCT_INFO")throw new Error("SELLERS_RETENTION_PRODUCT_INFO_OPERATION_MISMATCH");
  const productsTask=one(taskLedger.filter(entry=>entry?.taskId===sellersProposal.sourceProductsTaskId),"SELLERS_RETENTION_PRODUCTS_TASK_LINEAGE_NOT_UNIQUE");
  if(productsTask.kind!=="PRODUCTS")throw new Error("SELLERS_RETENTION_PRODUCTS_OPERATION_MISMATCH");

  const consumption=one(authorizationConsumptions.filter(entry=>entry?.authorizationId===sellersAuthorization.requestId),"SELLERS_RETENTION_AUTHORIZATION_NOT_CONSUMED_EXACTLY_ONCE");
  if(consumption.planId!==sellersAuthorization.planId)throw new Error("SELLERS_RETENTION_CONSUMPTION_PLAN_MISMATCH");
  const run=one(executionRuns.filter(entry=>entry?.planId===sellersAuthorization.planId),"SELLERS_RETENTION_EXECUTION_LINEAGE_NOT_UNIQUE");
  if(run.status!=="COMPLETED")throw new Error("SELLERS_RETENTION_EXECUTION_NOT_COMPLETED");
  const completed=one((run.tasks??[]).filter(entry=>entry?.providerTaskId===sellersTaskId&&entry?.outcome==="COMPLETED"),"SELLERS_RETENTION_COMPLETED_TASK_LINEAGE_NOT_UNIQUE");
  if((run.tasks??[]).length!==1||run.plannedTasks!==1||run.attemptedTasks!==1||run.completedTasks!==1||run.failedTasks!==0)throw new Error("SELLERS_RETENTION_EXECUTION_TASK_CONFLICT");
  const decision=one((sellersAuthorization.plan?.decisions??[]).filter(entry=>entry?.decision==="APPROVED"),"SELLERS_RETENTION_AUTHORIZATION_PLAN_INVALID");
  if(decision.execution?.kind!=="SELLERS")throw new Error("SELLERS_RETENTION_AUTHORIZATION_OPERATION_MISMATCH");
  if(decision.candidateId!==`sellers:${sellersAuthorization.atlasProductId}:${sellersAuthorization.proposalId}`||completed.candidateId!==decision.candidateId)throw new Error("SELLERS_RETENTION_CANDIDATE_BINDING_MISMATCH");
  return freeze({schemaVersion:"1.0",status:"VALIDATED",sellersTaskId,productInfoTaskId,sellersAuthorizationId:sellersAuthorization.requestId,sellersPlanId:sellersAuthorization.planId,sellersProposalId:sellersProposal.proposalId,sellersExecutionRunId:run.runId,atlasProductId:sellersAuthorization.atlasProductId,sourceProductsTaskId:sellersAuthorization.sourceProductsTaskId,sourceProductInfoAuthorizationId:sellersAuthorization.sourceProductInfoAuthorizationId,sourceProductInfoExecutionRunId:sellersProposal.sourceProductInfoExecutionRunId,providerIdentity:structuredClone(sellersAuthorization.providerIdentity)});
}

export function validateSellersRetentionResults({lineage,sellersResult,productInfoResult}={}){
  if(lineage?.status!=="VALIDATED")throw new Error("SELLERS_RETENTION_VALIDATED_LINEAGE_REQUIRED");
  if(!sellersResult||typeof sellersResult!=="object"||Array.isArray(sellersResult)||!productInfoResult||typeof productInfoResult!=="object"||Array.isArray(productInfoResult))throw new Error("SELLERS_RETENTION_RESULT_ENVELOPE_MALFORMED");
  if(sellersResult.id!==lineage.sellersTaskId)throw new Error("SELLERS_RETENTION_SELLERS_RESPONSE_TASK_MISMATCH");
  if(productInfoResult.id!==lineage.productInfoTaskId)throw new Error("SELLERS_RETENTION_PRODUCT_INFO_RESPONSE_TASK_MISMATCH");
  if(Number(sellersResult.cost??0)!==0||Number(productInfoResult.cost??0)!==0)throw new Error("DF003_RETENTION_RETRIEVAL_MUST_BE_ZERO_COST");
  if(!Array.isArray(sellersResult.result)||sellersResult.result.length!==1||!sellersResult.result[0]||!Array.isArray(sellersResult.result[0].items))throw new Error("SELLERS_RETENTION_SELLERS_RESULT_MALFORMED");
  const productItems=productInfoResult?.result?.[0]?.items;
  if(!Array.isArray(productItems)||productItems.length!==1||!productItems[0]||typeof productItems[0]!=="object")throw new Error("SELLERS_RETENTION_PRODUCT_INFO_RESULT_MALFORMED");

  const expected=identity(lineage.providerIdentity),productInfo=identity(productItems[0]),sellersBlock=identity(sellersResult.result[0]);
  const comparisons=[];
  for(const field of ["productId","dataDocId","gid"]){
    const authorized=expected[field],info=productInfo[field],sellers=sellersBlock[field];
    for(const [side,value] of [["PRODUCT_INFO",info],["SELLERS",sellers]])if(authorized!=null&&value!=null&&String(authorized)!==String(value))throw new Error(`SELLERS_RETENTION_${side}_${field.toUpperCase()}_DRIFT`);
    if(info!=null&&sellers!=null&&String(info)!==String(sellers))throw new Error(`SELLERS_RETENTION_PROVIDER_${field.toUpperCase()}_CONTRADICTION`);
    comparisons.push({field,authorizationToProductInfo:authorized!=null&&info!=null?"MATCH":"UNKNOWN",authorizationToSellers:authorized!=null&&sellers!=null?"MATCH":"UNKNOWN",productInfoToSellers:info!=null&&sellers!=null?"MATCH":"UNKNOWN",authorized,productInfo:info,sellers});
  }
  if(!comparisons.some(entry=>entry.authorizationToProductInfo==="MATCH"))throw new Error("SELLERS_RETENTION_PROVIDER_IDENTITY_UNPROVEN");
  return freeze({schemaVersion:"1.0",status:"VALIDATED",lineage,providerIdentity:{status:"VALIDATED",comparisons}});
}
