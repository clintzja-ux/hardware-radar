import crypto from "node:crypto";
import {mkdir,readFile,rename,writeFile} from "node:fs/promises";
import {dirname,resolve} from "node:path";
import {createHistoricalBootstrapResultReference} from "./HistoricalBootstrapResultDispatcher.js";

const stable=v=>Array.isArray(v)?`[${v.map(stable).join(",")}]`:v&&typeof v==="object"?`{${Object.keys(v).sort().map(k=>`${JSON.stringify(k)}:${stable(v[k])}`).join(",")}}`:JSON.stringify(v);
const digest=v=>crypto.createHash("sha256").update(stable(v)).digest("hex"),clone=structuredClone;
const deepFreeze=v=>{if(v&&typeof v==="object"&&!Object.isFrozen(v)){Object.freeze(v);for(const child of Object.values(v))deepFreeze(child)}return v},freeze=v=>deepFreeze(clone(v));
export const HISTORICAL_BOOTSTRAP_PROVIDER_RESULT_VERSION="MERCURY-HISTORY-034-1.0";

export function createHistoricalBootstrapProviderResult({operation,sourceId="DATAFORSEO_GOOGLE_SHOPPING",providerTaskId,paidActionIntentId,checkpointId,atlasProductId,productIndex,providerStatus="AVAILABLE",operationResult,retrievedAt}={}){
 if(!["PRODUCTS","PRODUCT_INFO","SELLERS"].includes(operation)||![sourceId,providerTaskId,paidActionIntentId,checkpointId,atlasProductId,retrievedAt].every(x=>typeof x==="string"&&x.trim())||!Number.isInteger(productIndex)||productIndex<0||!Number.isFinite(Date.parse(retrievedAt))||operationResult==null)throw new Error("BOOTSTRAP_PROVIDER_RESULT_INVALID");
 const identity={operation,sourceId,providerTaskId,paidActionIntentId},resultDigest=digest(operationResult),canonicalResultId=`mer_providerresult_${digest(identity).slice(0,24)}`;
 const reference=createHistoricalBootstrapResultReference({operation,providerTaskId,canonicalResultId,resultDigest,providerStatus,paidActionIntentId,recordedAt:retrievedAt});
 return freeze({schemaVersion:"1.0",policyVersion:HISTORICAL_BOOTSTRAP_PROVIDER_RESULT_VERSION,canonicalResultId,...identity,checkpointId,atlasProductId,productIndex,providerStatus,retrievedAt,resultDigest,operationResult,resultReference:reference});
}

export class FileHistoricalBootstrapProviderResultRepository{
 constructor({statePath}={}){if(!statePath)throw new TypeError("BOOTSTRAP_PROVIDER_RESULT_STATE_PATH_REQUIRED");this.statePath=resolve(statePath);this.q=Promise.resolve()}
 async _read(){try{const s=JSON.parse(await readFile(this.statePath,"utf8"));if(s?.version!=="1.0"||!s.results||!s.references||!s.byTaskIntent||!s.progressions)throw new Error("BOOTSTRAP_PROVIDER_RESULT_STATE_INVALID");return s}catch(e){if(e.code==="ENOENT")return{version:"1.0",results:{},references:{},byTaskIntent:{},progressions:{}};throw e}}
 async _write(s){await mkdir(dirname(this.statePath),{recursive:true});const temp=`${this.statePath}.${process.pid}.${crypto.randomUUID()}.tmp`;await writeFile(temp,`${JSON.stringify(s,null,2)}\n`);await rename(temp,this.statePath)}
 async record(record){const run=async()=>{const s=await this._read(),key=`${record.providerTaskId}:${record.paidActionIntentId}`,priorId=s.byTaskIntent[key],prior=s.results[record.canonicalResultId];if(prior){if(stable(prior)!==stable(record))throw new Error("BOOTSTRAP_PROVIDER_RESULT_CONFLICT");return freeze(prior)}if(priorId&&priorId!==record.canonicalResultId)throw new Error("BOOTSTRAP_PROVIDER_RESULT_CONFLICT");s.results[record.canonicalResultId]=clone(record);s.references[record.resultReference.resultReferenceId]=clone(record.resultReference);s.byTaskIntent[key]=record.canonicalResultId;await this._write(s);return freeze(record)};const x=this.q.then(run,run);this.q=x.catch(()=>{});return x}
 async getById(id){const value=(await this._read()).references[id];return value?freeze(value):null}
 async getCanonicalResultById(id){const value=(await this._read()).results[id];return value?freeze(value):null}
 async getByTaskIntent(providerTaskId,paidActionIntentId){const s=await this._read(),id=s.byTaskIntent[`${providerTaskId}:${paidActionIntentId}`];return id?freeze(s.results[id]):null}
 async findByTask(providerTaskId){const rows=Object.values((await this._read()).results).filter(x=>x.providerTaskId===providerTaskId);if(rows.length>1)throw new Error("BOOTSTRAP_PROVIDER_RESULT_LINEAGE_CONFLICT");return rows[0]?freeze(rows[0]):null}
 async recordProgression({resultReferenceId,status,progression}={}){const run=async()=>{const s=await this._read();if(!s.references[resultReferenceId])throw new Error("RESULT_REFERENCE_NOT_FOUND");const id=`mer_progression_${digest({resultReferenceId,status,progression}).slice(0,24)}`,value={schemaVersion:"1.0",policyVersion:HISTORICAL_BOOTSTRAP_PROVIDER_RESULT_VERSION,progressionId:id,resultReferenceId,status,progressionDigest:digest(progression),progression:clone(progression)};const prior=Object.values(s.progressions).find(x=>x.resultReferenceId===resultReferenceId);if(prior){if(stable(prior)!==stable(value))throw new Error("BOOTSTRAP_RESULT_PROGRESSION_CONFLICT");return freeze(prior)}s.progressions[id]=value;await this._write(s);return freeze(value)};const x=this.q.then(run,run);this.q=x.catch(()=>{});return x}
 async getProgressionByResultReference(id){const rows=Object.values((await this._read()).progressions).filter(x=>x.resultReferenceId===id);if(rows.length>1)throw new Error("BOOTSTRAP_RESULT_PROGRESSION_CONFLICT");return rows[0]?freeze(rows[0]):null}
}
