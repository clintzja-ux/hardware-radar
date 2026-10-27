import crypto from "node:crypto";
import {mkdir,readFile,rename,rm,writeFile} from "node:fs/promises";
import path from "node:path";
import {createNeweggRetentionPlan,createNeweggRoutineHealthProjection} from "./NeweggRoutineSchedulingAndRetention.js";
import {createPrivateForgeOperationsEnvelope} from "./PrivateForgeOperationsTransport.js";

const downstreamStages=new Set(["RECOMPOSITION","CERTIFICATION","RELEASE_CERTIFICATION","RETENTION_ASSESSMENT","FORGE_PROJECTION","FORGE_TRANSPORT"]);
const stable=value=>Array.isArray(value)?`[${value.map(stable).join(",")}]`:value&&typeof value==="object"?`{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`:JSON.stringify(value);
const digest=value=>crypto.createHash("sha256").update(stable(value)).digest("hex");
const freeze=value=>Object.freeze(structuredClone(value));
const validDigest=value=>/^[a-f0-9]{64}$/i.test(value??"");

export class FileNeweggDownstreamReceiptRepository{
 constructor({root}={}){if(!root)throw new TypeError("NEWEGG_DOWNSTREAM_RECEIPT_ROOT_REQUIRED");this.root=path.resolve(root);}
 file(stage,bindingDigest){return path.join(this.root,`${stage.toLowerCase()}-${bindingDigest}.json`);}
 async resolve({stage,bindingDigest,artifactDigest,sourceObservedAt}={}){
  if(!downstreamStages.has(stage)||!validDigest(bindingDigest)||!validDigest(artifactDigest)||!Number.isFinite(Date.parse(sourceObservedAt)))throw new TypeError("NEWEGG_DOWNSTREAM_RECEIPT_KEY_INVALID");
  try{const value=JSON.parse(await readFile(this.file(stage,bindingDigest),"utf8")),receiptDigest=value.receiptDigest,semantic={...value};delete semantic.receiptDigest;
   if(value?.schemaVersion!=="1.0"||value.stage!==stage||value.bindingDigest!==bindingDigest||value.artifactDigest!==artifactDigest||value.sourceObservedAt!==new Date(sourceObservedAt).toISOString()||receiptDigest!==digest(semantic))return{state:"CONFLICT"};
   return{state:"COMPLETED",receipt:freeze(value)};
  }catch(error){if(error?.code==="ENOENT")return{state:"NOT_COMPLETED"};return{state:"PARTIAL"};}
 }
 async record({stage,bindingDigest,artifactDigest,sourceObservedAt,result}={}){
  const prior=await this.resolve({stage,bindingDigest,artifactDigest,sourceObservedAt});if(prior.state==="COMPLETED")return prior.receipt;if(prior.state!=="NOT_COMPLETED")throw new Error(`NEWEGG_DOWNSTREAM_RECEIPT_${prior.state}`);
  const semantic={schemaVersion:"1.0",stage,bindingDigest,artifactDigest,sourceObservedAt:new Date(sourceObservedAt).toISOString(),result:structuredClone(result)},value={...semantic,receiptDigest:digest(semantic)},target=this.file(stage,bindingDigest),temporary=`${target}.tmp-${process.pid}-${crypto.randomUUID()}`;
  await mkdir(this.root,{recursive:true});try{await writeFile(temporary,`${JSON.stringify(value,null,2)}\n`,{flag:"wx"});await rename(temporary,target);}finally{await rm(temporary,{force:true}).catch(()=>{});}return freeze(value);
 }
}

function owner({stage,receipts,execute}){
 if(!downstreamStages.has(stage)||!receipts?.resolve||!receipts?.record||typeof execute!=="function")throw new TypeError("NEWEGG_DOWNSTREAM_OWNER_INVALID");
 const key=context=>({stage,bindingDigest:context.input.bindingDigest,artifactDigest:context.input.lineage.artifactDigest,sourceObservedAt:context.input.lineage.sourceObservedAt});
 return{mutating:false,authorityRequired:false,receiptOwner:{resolve:context=>receipts.resolve(key(context))},executionOwner:{execute:async context=>{const result=await execute(context);const receipt=await receipts.record({...key(context),result});return freeze({status:"COMPLETED",receipt});}}};
}

export function createNeweggRoutineRecompositionOwner({service,receipts}={}){return owner({stage:"RECOMPOSITION",receipts,execute:async context=>{
 const result=await service.prepare({context:structuredClone(context)});if(!result?.candidateId||!result?.artifactId||!validDigest(result?.bindingDigest)||result.releaseAuthority!==false||result.deploymentAuthority!==false)throw new Error("NEWEGG_RECOMPOSITION_ZERO_AUTHORITY_REQUIRED");return result;
}});}

export function createNeweggRoutineCertificationOwner({service,receipts}={}){return owner({stage:"CERTIFICATION",receipts,execute:async context=>{
 const candidate=context.priorResults?.RECOMPOSITION?.canonicalReceipt?.result??context.priorResults?.RECOMPOSITION?.receipt?.result;if(!candidate)throw new Error("NEWEGG_SENTINEL_CANDIDATE_REQUIRED");const result=await service.certify({candidate:structuredClone(candidate),context:structuredClone(context)});
 if(result?.status!=="CERTIFIED"||result?.artifactBindingDigest!==candidate.bindingDigest||result.releaseAuthority!==false||result.deploymentAuthority!==false)throw new Error("NEWEGG_SENTINEL_BINDING_INVALID");return result;
}});}

export function createNeweggRoutineReleaseReadinessOwner({service,receipts}={}){return owner({stage:"RELEASE_CERTIFICATION",receipts,execute:async context=>{
 const certification=context.priorResults?.CERTIFICATION?.canonicalReceipt?.result??context.priorResults?.CERTIFICATION?.receipt?.result,result=await service.assess({certification:structuredClone(certification),context:structuredClone(context)});
 if(!certification||result?.state!=="CERTIFIED_ZERO_AUTHORITY"||result.releaseAuthority!==false||result.deploymentAuthority!==false)throw new Error("NEWEGG_RELEASE_READINESS_INVALID");return result;
}});}

export function createNeweggRoutineRetentionOwner({inventoryOwner,capacityOwner,receipts}={}){return owner({stage:"RETENTION_ASSESSMENT",receipts,execute:async context=>{
 const capacity=await capacityOwner.assess({context:structuredClone(context)});if(capacity?.sufficient!==true)throw Object.assign(new Error("NEWEGG_STORAGE_CAPACITY_HOLD"),{code:"NEWEGG_STORAGE_CAPACITY_HOLD"});const inventory=await inventoryOwner.inspect({context:structuredClone(context)}),plan=createNeweggRetentionPlan({asOf:inventory.asOf,entries:inventory.entries,currentCatalogId:inventory.currentCatalogId,predecessorCatalogId:inventory.predecessorCatalogId});return{capacity,plan,automaticDeletion:false,deletedArtifacts:0};
}});}

export function createNeweggRoutineForgeProjectionOwner({healthRepository,receipts,now=()=>new Date().toISOString()}={}){return owner({stage:"FORGE_PROJECTION",receipts,execute:async context=>{
 const results=context.priorResults,retention=results.RETENTION_ASSESSMENT?.canonicalReceipt?.result??results.RETENTION_ASSESSMENT?.receipt?.result,qa=results.QA?.canonicalReceipt??results.QA?.receipt??results.QA,current=results.CURRENT?.canonicalReceipt??results.CURRENT?.receipt??results.CURRENT,history=results.HISTORY?.canonicalReceipt??results.HISTORY?.receipt??results.HISTORY,certification=results.CERTIFICATION?.canonicalReceipt?.result??results.CERTIFICATION?.receipt?.result,releaseReadiness=results.RELEASE_CERTIFICATION?.canonicalReceipt?.result??results.RELEASE_CERTIFICATION?.receipt?.result;
 const qualification=results.QUALIFICATION?.canonicalReceipt?.result??results.QUALIFICATION?.receipt?.result,exceptions=(qualification?.history?.exceptions??[]).map(value=>({...value,type:"IDENTITY_REVIEW_REQUIRED"}));
 const projection=createNeweggRoutineHealthProjection({asOf:now(),status:exceptions.length?"SUCCESS_WITH_PRODUCT_EXCEPTIONS":"SUCCESS",lastSuccessfulRun:{runId:context.run.runId,completedStages:[...context.run.completedStages,"FORGE_PROJECTION"]},lastAttemptedRun:{runId:context.run.runId,runningStage:"FORGE_PROJECTION"},schedule:{state:"OPERATOR_TRIGGERED",due:false,overlapPrevented:false,nextExpectedAt:null,automaticExecution:false},full:{digest:context.input.lineage.artifactDigest,observedAt:context.input.lineage.sourceObservedAt},catalog:{stateId:context.input.lineage.catalogStateId},coverage:{productLocalExceptions:exceptions.length,excludedProducts:new Set(exceptions.map(value=>value.atlasProductId)).size},current:current??null,history:history??null,qa:qa??null,releaseReadiness:{...releaseReadiness,certificationId:certification?.certificationId??null},providerCalls:results.ACQUISITION?.providerCalls??0,actualSpendUsd:0,exceptions,storage:retention??null});
 await healthRepository.put(projection);return projection;
}});}

export function createNeweggRoutineForgeTransportOwner({transport,receipts,now=()=>new Date().toISOString()}={}){return owner({stage:"FORGE_TRANSPORT",receipts,execute:async context=>{
 const projection=context.priorResults?.FORGE_PROJECTION?.canonicalReceipt?.result??context.priorResults?.FORGE_PROJECTION?.receipt?.result;if(!projection)throw new Error("NEWEGG_FORGE_PROJECTION_REQUIRED");const envelope=createPrivateForgeOperationsEnvelope({projection,createdAt:now()}),delivered=await transport.publish(envelope);return{...delivered,readOnly:true,releaseAuthority:false,deploymentAuthority:false};
}});}

export function bindProductionNeweggRoutineDownstreamOwners({owners,receiptRoot,recompositionService,certificationService,releaseReadinessService,inventoryOwner,capacityOwner,healthRepository,forgeTransport,now}={}){
 if(!owners||typeof owners!=="object")throw new TypeError("NEWEGG_ROUTINE_CANONICAL_OWNERS_REQUIRED");const receipts=new FileNeweggDownstreamReceiptRepository({root:receiptRoot});return Object.freeze({...owners,RECOMPOSITION:createNeweggRoutineRecompositionOwner({service:recompositionService,receipts}),CERTIFICATION:createNeweggRoutineCertificationOwner({service:certificationService,receipts}),RELEASE_CERTIFICATION:createNeweggRoutineReleaseReadinessOwner({service:releaseReadinessService,receipts}),RETENTION_ASSESSMENT:createNeweggRoutineRetentionOwner({inventoryOwner,capacityOwner,receipts}),FORGE_PROJECTION:createNeweggRoutineForgeProjectionOwner({healthRepository,receipts,now}),FORGE_TRANSPORT:createNeweggRoutineForgeTransportOwner({transport:forgeTransport,receipts,now})});
}
