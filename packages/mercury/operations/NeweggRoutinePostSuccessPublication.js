import crypto from "node:crypto";
import {mkdir,readFile,rename,rm,writeFile} from "node:fs/promises";
import path from "node:path";
import {FileSingleWriterRunLock,SINGLE_WRITER_LOCK_STATUSES} from "../runtime/FileSingleWriterRunLock.js";

const freeze=value=>Object.freeze(structuredClone(value));
const requiredStages=Object.freeze(["CERTIFICATION","RELEASE_CERTIFICATION"]);
const incompleteBootstrapStatuses=new Set(["INTENT_AUTHORIZED","ACQUISITION_COMPLETED","LINEAGE_PROMOTED"]);

export class FileNeweggRoutinePostSuccessPublicationRepository{
 constructor({statePath,lock}={}){if(!statePath)throw new TypeError("NEWEGG_POST_SUCCESS_PUBLICATION_STATE_PATH_REQUIRED");this.path=path.resolve(statePath);this.lock=lock??new FileSingleWriterRunLock({lockPath:`${this.path}.lock`});}
 async read(){try{const value=JSON.parse(await readFile(this.path,"utf8"));if(value?.schemaVersion!=="1.0"||typeof value.attempts!=="object")throw new Error();return value;}catch(error){if(error?.code==="ENOENT")return{schemaVersion:"1.0",attempts:{}};throw new Error("NEWEGG_POST_SUCCESS_PUBLICATION_STATE_INVALID");}}
 async get(runId){return freeze((await this.read()).attempts[runId]??null);}
 async record(runId,change){const result=await this.lock.runExclusive(async()=>{const state=await this.read(),prior=state.attempts[runId]??null,next=await change(freeze(prior));if(next?.runId!==runId)throw new Error("NEWEGG_POST_SUCCESS_PUBLICATION_RECEIPT_INVALID");state.attempts[runId]=structuredClone(next);await mkdir(path.dirname(this.path),{recursive:true});const temporary=`${this.path}.${process.pid}.${crypto.randomUUID()}.tmp`;try{await writeFile(temporary,`${JSON.stringify(state,null,2)}\n`,{encoding:"utf8",flag:"wx"});await rename(temporary,this.path);}finally{await rm(temporary,{force:true}).catch(()=>{});}return next;});if(result.status!==SINGLE_WRITER_LOCK_STATUSES.COMPLETED)throw new Error("NEWEGG_POST_SUCCESS_PUBLICATION_BUSY");return freeze(result.result);}
}

export class NeweggRoutinePostSuccessPublicationBinding{
 constructor({enabled=false,mandateId,productionCheckoutRoot,routineHealthRepository,bootstrapRepository,candidateOwner,publicationAuthorityRepository,receiptRepository,publicationCommand,now=()=>new Date().toISOString()}={}){if(!routineHealthRepository?.get||!bootstrapRepository?.read||!candidateOwner?.discover||!publicationAuthorityRepository?.inspect||!receiptRepository?.get||!receiptRepository?.record||!publicationCommand?.run)throw new TypeError("NEWEGG_POST_SUCCESS_PUBLICATION_OWNERS_REQUIRED");Object.assign(this,{enabled,mandateId,productionCheckoutRoot,routineHealthRepository,bootstrapRepository,candidateOwner,publicationAuthorityRepository,receiptRepository,publicationCommand,now});}
 async execute({schedulerResult}={}){
  if(this.enabled!==true)return freeze({status:"POST_SUCCESS_PUBLICATION_DISABLED",publicationInvoked:false,nextAction:"SEPARATE_OPERATOR_ACTIVATION_REQUIRED"});
  if(schedulerResult?.status!=="COMPLETED")return freeze({status:"POST_SUCCESS_PUBLICATION_NOT_ELIGIBLE",publicationInvoked:false,nextAction:"PRESERVE_ROUTINE_RESULT"});
  if(!this.mandateId||!this.productionCheckoutRoot)throw new Error("POST_SUCCESS_PUBLICATION_CONFIGURATION_REQUIRED");
  const health=await this.routineHealthRepository.get(),runId=health?.lastSuccessfulRun?.runId,completed=new Set(health?.lastSuccessfulRun?.completedStages??[]);
  if(!runId||schedulerResult.routineRunId!==runId||!["SUCCESS","SUCCESS_WITH_PRODUCT_EXCEPTIONS"].includes(health?.status)||requiredStages.some(stage=>!completed.has(stage))||health?.releaseReadiness?.state!=="CERTIFIED_ZERO_AUTHORITY")throw new Error("POST_SUCCESS_PUBLICATION_CANONICAL_COMPLETION_REQUIRED");
  const bootstrap=await this.bootstrapRepository.read(),operations=Object.values(bootstrap.operations??{}),operation=operations.find(value=>value.routineResult?.runId===runId);
  if(!operation||operation.status!=="ROUTINE_COMPLETED"||operations.some(value=>incompleteBootstrapStatuses.has(value.status)))throw new Error("POST_SUCCESS_PUBLICATION_BOOTSTRAP_INCOMPLETE");
  const candidate=await this.candidateOwner.discover();
  if(!candidate||candidate.trigger?.runId!==runId||candidate.sentinelStatus!=="CERTIFIED"||candidate.sourceRightsEligible!==true)throw new Error("POST_SUCCESS_PUBLICATION_CANDIDATE_INVALID");
  if(candidate.alreadyDeployed!==true&&Date.parse(this.now())>=Date.parse(candidate.freshUntil))throw new Error("PUBLICATION_CANDIDATE_EXPIRED");
  const authority=await this.publicationAuthorityRepository.inspect(),mandate=authority.mandates.find(value=>value.mandateId===this.mandateId);
  if(!mandate||mandate.status!=="ENABLED")throw new Error(mandate?`PUBLICATION_MANDATE_${mandate.status}`:"PUBLICATION_MANDATE_NOT_FOUND");
  const conflictingOperation=authority.operations.find(value=>value.candidateId===candidate.candidateId&&value.status!=="LIVE_ACCEPTED");if(conflictingOperation)throw new Error("POST_SUCCESS_PUBLICATION_OPERATION_CONFLICT");
  const existing=await this.receiptRepository.get(runId);if(existing)return freeze({status:"POST_SUCCESS_PUBLICATION_ALREADY_EVALUATED",publicationInvoked:false,runId,candidateId:candidate.candidateId,priorStatus:existing.status,nextAction:"INSPECT_PUBLICATION_RECEIPT"});
  const startedAt=this.now();await this.receiptRepository.record(runId,prior=>{if(prior)throw new Error("POST_SUCCESS_PUBLICATION_ALREADY_EVALUATED");return{schemaVersion:"1.0",runId,candidateId:candidate.candidateId,artifactId:candidate.artifactId,certificationId:candidate.certificationId,bindingDigest:candidate.bindingDigest,mandateId:this.mandateId,productionCheckoutRoot:path.resolve(this.productionCheckoutRoot),status:"INVOCATION_RECORDED",attempts:1,startedAt,automaticRetry:false};});
  try{const result=await this.publicationCommand.run({mandateId:this.mandateId,root:path.resolve(this.productionCheckoutRoot)}),completedAt=this.now();return this.receiptRepository.record(runId,prior=>({...prior,status:result?.status??"PUBLICATION_COMPLETED",completedAt,result:{status:result?.status??null,candidateId:result?.candidateId??candidate.candidateId,releaseId:result?.releaseId??null},nextAction:result?.status==="ALREADY_DEPLOYED_CANDIDATE"?"NONE":"INSPECT_PUBLICATION_HEALTH"}));}
  catch(error){const failure=error?.code??error?.message??"PUBLICATION_FAILED";await this.receiptRepository.record(runId,prior=>({...prior,status:"PUBLICATION_FAILED_REVIEW_REQUIRED",completedAt:this.now(),failure,nextAction:"STOP_AND_REVIEW",automaticRetry:false}));return freeze({status:"PUBLICATION_FAILED_REVIEW_REQUIRED",publicationInvoked:true,runId,candidateId:candidate.candidateId,failure,nextAction:"STOP_AND_REVIEW",automaticRetry:false});}
 }
}
