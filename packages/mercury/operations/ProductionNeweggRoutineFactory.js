import crypto from "node:crypto";
import {mkdir,readFile,rename,rm,writeFile} from "node:fs/promises";
import {dirname,resolve} from "node:path";
import {FileSingleWriterRunLock,SINGLE_WRITER_LOCK_STATUSES} from "../runtime/FileSingleWriterRunLock.js";
import {NeweggRoutineProductionCommand,NEWEGG_ROUTINE_COMMAND_STAGES} from "./NeweggRoutineProductionCommand.js";
import {createRakutenFullCurrentRoutineOwner,createRetainedCommerceHistoryRoutineOwner} from "./NeweggRoutineAuthorityAdapters.js";
import {bindProductionNeweggRoutineSourceOwners} from "./NeweggRoutineSourceStageOwners.js";
import {bindProductionNeweggRoutineP1BOwners} from "./NeweggRoutineP1BStageOwners.js";
import {bindProductionNeweggRoutineDownstreamOwners} from "./NeweggRoutineDownstreamStageOwners.js";
import {bindProductionNeweggRoutinePreflightBindingQualificationOwners} from "./NeweggRoutinePreflightBindingQualificationOwners.js";

const terminal=new Set(["SUCCESS_RELEASE_READY","SUCCESS_NO_CHANGE"]);
const stable=value=>Array.isArray(value)?`[${value.map(stable).join(",")}]`:value&&typeof value==="object"?`{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`:JSON.stringify(value);
const digest=value=>crypto.createHash("sha256").update(stable(value)).digest("hex");
const clone=value=>structuredClone(value);

export const CANONICAL_STAGE_STATES=Object.freeze(["NOT_COMPLETED","COMPLETED","PARTIAL","CONFLICT"]);

export class CanonicalNeweggRoutineStageAdapter{
 constructor({stage,receiptOwner,executionOwner,authorityOwner=null,mutating=false,authorityRequired=mutating}={}){
  if(!NEWEGG_ROUTINE_COMMAND_STAGES.includes(stage)||typeof receiptOwner?.resolve!=="function"||typeof executionOwner?.execute!=="function")throw new TypeError("NEWEGG_CANONICAL_STAGE_ADAPTER_INVALID");
  if(authorityRequired&&typeof authorityOwner?.validate!=="function")throw new TypeError(`NEWEGG_CANONICAL_STAGE_AUTHORITY_OWNER_REQUIRED:${stage}`);Object.assign(this,{stage,receiptOwner,executionOwner,authorityOwner,mutating:Boolean(mutating),authorityRequired:Boolean(authorityRequired)});
 }
 async execute(context={}){
  const expected=context.input?.lineage;if(!expected?.artifactDigest||!expected?.sourceObservedAt)throw new Error(`NEWEGG_ROUTINE_LINEAGE_REQUIRED:${this.stage}`);
  const resolved=await this.receiptOwner.resolve(clone(context));
  if(!CANONICAL_STAGE_STATES.includes(resolved?.state))throw new Error(`NEWEGG_CANONICAL_RECEIPT_INVALID:${this.stage}`);
  if(resolved.state==="CONFLICT")throw new Error(`NEWEGG_CANONICAL_RECEIPT_CONFLICT:${this.stage}`);
  if(resolved.state==="PARTIAL")throw new Error(`NEWEGG_CANONICAL_RECEIPT_PARTIAL:${this.stage}`);
  if(resolved.state==="COMPLETED")return Object.freeze({status:"REPLAY",canonicalReceipt:clone(resolved.receipt),lineage:clone(expected)});
  if(this.authorityRequired&&await this.authorityOwner.validate({stage:this.stage,authority:clone(context.input?.stageAuthorities?.[this.stage]),context:clone(context)})!==true)throw new Error(`NEWEGG_ROUTINE_AUTHORITY_REQUIRED:${this.stage}`);
  const result=await this.executionOwner.execute(clone(context));
  const after=await this.receiptOwner.resolve(clone(context));
  if(after?.state!=="COMPLETED")throw new Error(`NEWEGG_CANONICAL_RECEIPT_NOT_DURABLE:${this.stage}`);
  return Object.freeze({...clone(result??{}),status:result?.status??"COMPLETED",canonicalReceipt:clone(after.receipt),lineage:clone(expected)});
 }
}

export class FileNeweggRoutineRunRepository{
 constructor({statePath,lock}={}){if(!statePath)throw new TypeError("NEWEGG_ROUTINE_RUN_STATE_PATH_REQUIRED");this.path=resolve(statePath);this.lock=lock??new FileSingleWriterRunLock({lockPath:`${this.path}.lock`});}
 async getState(){try{const state=JSON.parse(await readFile(this.path,"utf8"));if(state?.schemaVersion!=="1.0"||!Array.isArray(state.runs))throw new Error();return state;}catch(error){if(error?.code==="ENOENT")return{schemaVersion:"1.0",runs:[]};throw new Error("NEWEGG_ROUTINE_RUN_STATE_INVALID");}}
 async loadActive(){const state=await this.getState();return clone([...state.runs].reverse().find(run=>!terminal.has(run.status))??null);}
 async save(run){const outcome=await this.lock.runExclusive(async()=>{const state=await this.getState(),index=state.runs.findIndex(value=>value.runId===run.runId),runs=[...state.runs];if(index>=0)runs[index]=clone(run);else runs.push(clone(run));const next={schemaVersion:"1.0",runs};await mkdir(dirname(this.path),{recursive:true});const temp=`${this.path}.tmp-${process.pid}-${crypto.randomUUID()}`;try{await writeFile(temp,`${JSON.stringify(next,null,2)}\n`,{flag:"wx"});await rename(temp,this.path);}finally{await rm(temp,{force:true}).catch(()=>{});}return clone(run);});if(outcome.status!==SINGLE_WRITER_LOCK_STATUSES.COMPLETED)throw new Error("NEWEGG_ROUTINE_RUN_BUSY");return outcome.result;}
}

export function createProductionNeweggRoutineStageOwners({owners}={}){
 if(!owners||typeof owners!=="object")throw new TypeError("NEWEGG_ROUTINE_CANONICAL_OWNERS_REQUIRED");
 return Object.fromEntries(NEWEGG_ROUTINE_COMMAND_STAGES.map(stage=>{
  const owner=owners[stage];if(!owner)throw new TypeError(`NEWEGG_ROUTINE_CANONICAL_OWNER_REQUIRED:${stage}`);
  return[stage,new CanonicalNeweggRoutineStageAdapter({stage,receiptOwner:owner.receiptOwner,executionOwner:owner.executionOwner,authorityOwner:owner.authorityOwner,mutating:owner.mutating,authorityRequired:owner.authorityRequired})];
 }));
}

export function createProductionNeweggRoutineCommand({statePath,owners,now}={}){
 const runRepository=new FileNeweggRoutineRunRepository({statePath}),stageOwners=createProductionNeweggRoutineStageOwners({owners});
 const overlapOwner={assess:async({activeRun})=>activeRun&&!terminal.has(activeRun.status)?{state:"BLOCKED_ACTIVE_RUN"}:{state:"DUE"}};
 const command=new NeweggRoutineProductionCommand({runRepository,overlapOwner,stageOwners,now}),executionLock=new FileSingleWriterRunLock({lockPath:`${resolve(statePath)}.execution.lock`});
 return Object.freeze({runRepository,stageOwners,async execute(input){const outcome=await executionLock.runExclusive(()=>command.execute(input));if(outcome.status!==SINGLE_WRITER_LOCK_STATUSES.COMPLETED)return Object.freeze({schemaVersion:"1.0",command:"mercury:newegg:routine",outcome:"BLOCKED_ACTIVE_RUN",success:false,exitCode:2,providerCalls:0,paidTasks:0,actualSpendUsd:0,releaseAuthority:false,deploymentAuthority:false});return outcome.result;}});
}

export function bindProductionNeweggRoutineMarketAuthorities({owners,currentSnapshotRepository,historicalRepository,historyStateReader,historyExecutionService}={}){
 if(!owners||typeof owners!=="object")throw new TypeError("NEWEGG_ROUTINE_CANONICAL_OWNERS_REQUIRED");
 return Object.freeze({...owners,CURRENT:createRakutenFullCurrentRoutineOwner({currentSnapshotRepository}),HISTORY:createRetainedCommerceHistoryRoutineOwner({historicalRepository,historyStateReader,executionService:historyExecutionService})});
}

export function createNeweggRoutineBinding(input={}){
 const lineage=input.lineage;if(!/^[a-f0-9]{64}$/i.test(lineage?.artifactDigest??"")||!Number.isFinite(Date.parse(lineage?.sourceObservedAt))||!lineage?.catalogStateId||!lineage?.currentPredecessor||!lineage?.historyPredecessor||!lineage?.rightsDigest)throw new TypeError("NEWEGG_ROUTINE_BINDING_INPUT_INVALID");
 return digest({lineage,mode:input.mode??"PRODUCTION"});
}

export function composeProductionNeweggRoutineOwners(input={}){
 let owners=input.owners??{};
 owners=bindProductionNeweggRoutineSourceOwners({owners,transport:input.transport,projection:input.catalogProjection,receiptRoot:input.sourceReceiptRoot,acquisitionAuthorityOwner:input.acquisitionAuthorityOwner});
 owners=bindProductionNeweggRoutinePreflightBindingQualificationOwners({owners,receiptRoot:input.assessmentReceiptRoot,rightsOwner:input.rightsOwner,capacityOwner:input.capacityOwner,retentionOwner:input.retentionSafetyOwner,configurationOwner:input.configurationOwner,currentPreparationService:input.currentPreparationService,historyPreparationService:input.historyPreparationService});
 owners=bindProductionNeweggRoutineP1BOwners({owners,currentPreparationService:input.currentPreparationService,historyPreparationService:input.historyPreparationService,qaService:input.qaService});
 owners=bindProductionNeweggRoutineMarketAuthorities({owners,currentSnapshotRepository:input.currentSnapshotRepository,historicalRepository:input.historicalRepository,historyStateReader:input.historyStateReader,historyExecutionService:input.historyExecutionService});
 owners=bindProductionNeweggRoutineDownstreamOwners({owners,receiptRoot:input.downstreamReceiptRoot,recompositionService:input.recompositionService,certificationService:input.certificationService,releaseReadinessService:input.releaseReadinessService,inventoryOwner:input.inventoryOwner,capacityOwner:input.capacityOwner,healthRepository:input.healthRepository,forgeTransport:input.forgeTransport,now:input.now});
 createProductionNeweggRoutineStageOwners({owners});
 return Object.freeze(owners);
}
