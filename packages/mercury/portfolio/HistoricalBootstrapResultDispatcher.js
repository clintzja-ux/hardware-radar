import crypto from "node:crypto";
import {projectHistoricalBootstrapCheckpoint} from "./HistoricalBootstrapCheckpoint.js";

const stable=value=>Array.isArray(value)?`[${value.map(stable).join(",")}]`:value&&typeof value==="object"?`{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`:JSON.stringify(value);
const digest=value=>crypto.createHash("sha256").update(stable(value)).digest("hex");
const deepFreeze=value=>{if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))deepFreeze(child)}return value};
const freeze=value=>deepFreeze(structuredClone(value));

export const HISTORICAL_BOOTSTRAP_RESULT_REFERENCE_VERSION="MERCURY-HISTORY-032-1.0";

export function createHistoricalBootstrapResultReference({operation,providerTaskId,canonicalResultId,resultDigest,providerStatus="AVAILABLE",paidActionIntentId,recordedAt}={}){
 if(!["PRODUCTS","PRODUCT_INFO","SELLERS","AMAZON_PRODUCTS","AMAZON_ASIN","AMAZON_SELLERS"].includes(operation)||![providerTaskId,canonicalResultId,resultDigest,recordedAt].every(value=>typeof value==="string"&&value.trim())||!Number.isFinite(Date.parse(recordedAt)))throw new Error("RESULT_REFERENCE_INVALID");
 const binding={operation,providerTaskId,canonicalResultId,resultDigest,providerStatus,paidActionIntentId:paidActionIntentId??null};
 return freeze({schemaVersion:"1.0",policyVersion:HISTORICAL_BOOTSTRAP_RESULT_REFERENCE_VERSION,resultReferenceId:`mer_resultref_${digest(binding).slice(0,24)}`,...binding,bindingDigest:digest(binding),recordedAt});
}

export class HistoricalBootstrapResultDispatcher{
 constructor({resultRepository,checkpointRepository,progressionOwners,now=()=>new Date().toISOString()}={}){if(!resultRepository?.getById||!checkpointRepository?.append||!progressionOwners)throw new TypeError("HISTORY_032_RESULT_DISPATCH_DEPENDENCIES_REQUIRED");Object.assign(this,{resultRepository,checkpointRepository,progressionOwners,now});}
 async dispatch({checkpoint}={}){
  const projection=projectHistoricalBootstrapCheckpoint({checkpoint});
  if(projection.cohortState!=="RESULT_AVAILABLE")throw new Error("RESULT_DISPATCH_NOT_READY");
  const resultEvent=[...checkpoint.events].reverse().find(event=>event.type==="RESULT_AVAILABLE"),taskEvent=[...checkpoint.events].reverse().find(event=>event.type==="TASK_CREATED");
  const reference=await this.resultRepository.getById(resultEvent?.resultReference);
  if(!reference)throw new Error("RESULT_REFERENCE_NOT_FOUND");
  if(reference.bindingDigest!==digest({operation:reference.operation,providerTaskId:reference.providerTaskId,canonicalResultId:reference.canonicalResultId,resultDigest:reference.resultDigest,providerStatus:reference.providerStatus,paidActionIntentId:reference.paidActionIntentId})||reference.resultDigest!==resultEvent.resultDigest||reference.operation!==projection.currentStage||reference.providerTaskId!==projection.providerTaskId||reference.providerTaskId!==taskEvent?.providerTaskId||reference.paidActionIntentId!==taskEvent?.paidActionIntentId)throw new Error("RESULT_LINEAGE_CONFLICT");
  const owner=this.progressionOwners[reference.operation];
  if(typeof owner?.process!=="function")throw new Error("RESULT_OPERATION_UNSUPPORTED");
  const progression=await owner.process({checkpoint,projection,resultReference:reference});
  if(!progression||typeof progression.status!=="string")throw new Error("RESULT_PROGRESSION_INVALID");
  const nextStageReference=progression.nextStageReference??null;
  const terminal=reference.operation==="SELLERS";
  return this.checkpointRepository.append(projection.checkpointId,{eventId:`progression:${reference.resultReferenceId}`,type:terminal?"LOCAL_TERMINAL":"RESULT_REVIEWED",at:this.now(),productIndex:projection.productIndex,...(terminal?{outcome:progression.status}:{identityStatus:progression.status,nextStageReference})});
 }
}
