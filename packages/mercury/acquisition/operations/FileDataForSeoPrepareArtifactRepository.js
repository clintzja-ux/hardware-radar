import crypto from "node:crypto";
import {mkdir,readFile,rename,writeFile} from "node:fs/promises";
import {dirname,resolve} from "node:path";

const stable=v=>Array.isArray(v)?`[${v.map(stable).join(",")}]`:v&&typeof v==="object"?`{${Object.keys(v).sort().map(k=>`${JSON.stringify(k)}:${stable(v[k])}`).join(",")}}`:JSON.stringify(v);
const digest=v=>crypto.createHash("sha256").update(stable(v)).digest("hex"),clone=structuredClone,deepFreeze=v=>{if(v&&typeof v==="object"&&!Object.isFrozen(v)){Object.freeze(v);for(const child of Object.values(v))deepFreeze(child)}return v},freeze=v=>deepFreeze(clone(v));
const required=(v,c)=>{if(typeof v!=="string"||!v.trim())throw new Error(c);return v.trim()};

export const DATAFORSEO_PREPARE_ARTIFACT_VERSION="MERCURY-HISTORY-032-1.0";

export function createDataForSeoPrepareArtifact({operation,source="DATAFORSEO_GOOGLE_SHOPPING",atlasProductId,productIndex=null,paidActionIntentId=null,bootstrapCheckpointId=null,bootstrapArtifactId=null,originatingCheckpointSequence=null,prepareArtifact,authorizationRequest,preparedAt}={}){
 if(!["PRODUCTS","PRODUCT_INFO","SELLERS"].includes(operation))throw new Error("PREPARE_ARTIFACT_OPERATION_INVALID");required(atlasProductId,"PREPARE_ARTIFACT_PRODUCT_REQUIRED");required(preparedAt,"PREPARE_ARTIFACT_PREPARED_AT_REQUIRED");if(!Number.isFinite(Date.parse(preparedAt)))throw new Error("PREPARE_ARTIFACT_PREPARED_AT_INVALID");if(!prepareArtifact||!authorizationRequest?.requestId)throw new Error("PREPARE_AUTHORIZATION_REFERENCE_NOT_FOUND");
 const bootstrap=paidActionIntentId!=null;if(bootstrap&&(!/^mer_histbootintent_[a-f0-9]{24}$/.test(paidActionIntentId)||!bootstrapCheckpointId||!bootstrapArtifactId||!Number.isInteger(originatingCheckpointSequence)||originatingCheckpointSequence<1||!Number.isInteger(productIndex)||productIndex<0))throw new Error("PREPARE_ARTIFACT_BOOTSTRAP_BINDING_INVALID");
 const logical={operation,source,atlasProductId,productIndex,paidActionIntentId,bootstrapCheckpointId,bootstrapArtifactId,originatingCheckpointSequence},material={...logical,prepareArtifact,authorizationRequest,preparedAt},bindingDigest=digest(material),prepareArtifactId=`mer_prepare_${digest(logical).slice(0,24)}`;
 return freeze({schemaVersion:"1.0",policyVersion:DATAFORSEO_PREPARE_ARTIFACT_VERSION,prepareArtifactId,bindingDigest,...material,authorizationRequestId:authorizationRequest.requestId,proposalDigest:authorizationRequest.proposalDigest??digest(authorizationRequest.plan)});
}

export class FileDataForSeoPrepareArtifactRepository{
 constructor({statePath}={}){if(!statePath)throw new TypeError("statePath required");this.statePath=resolve(statePath);this.q=Promise.resolve()}
 async _read(){try{const s=JSON.parse(await readFile(this.statePath,"utf8"));if(s?.version!=="1.0"||!s.artifacts||!s.byIntent)throw new Error("PREPARE_ARTIFACT_STATE_INVALID");return s}catch(e){if(e.code==="ENOENT")return{version:"1.0",artifacts:{},byIntent:{}};throw e}}
 async _write(s){await mkdir(dirname(this.statePath),{recursive:true});const t=`${this.statePath}.${process.pid}.${crypto.randomUUID()}.tmp`;await writeFile(t,`${JSON.stringify(s,null,2)}\n`);await rename(t,this.statePath)}
 async record(value){const run=async()=>{const s=await this._read(),prior=s.artifacts[value.prepareArtifactId],intent=value.paidActionIntentId?s.byIntent[value.paidActionIntentId]:null;if(prior){if(stable(prior)!==stable(value))throw new Error("PREPARE_ARTIFACT_CONFLICT");return freeze(prior)}if(intent&&intent!==value.prepareArtifactId)throw new Error("PREPARE_ARTIFACT_CONFLICT");s.artifacts[value.prepareArtifactId]=clone(value);if(value.paidActionIntentId)s.byIntent[value.paidActionIntentId]=value.prepareArtifactId;await this._write(s);return freeze(value)};const x=this.q.then(run,run);this.q=x.catch(()=>{});return x}
 async getById(id){const v=(await this._read()).artifacts[id];return v?freeze(v):null}
 async getByPaidActionIntentId(id){const s=await this._read(),key=s.byIntent[id];return key?freeze(s.artifacts[key]):null}
 async getAuthorizationById(id){const values=Object.values((await this._read()).artifacts).filter(v=>v.authorizationRequestId===id);if(values.length>1)throw new Error("PREPARE_AUTHORIZATION_REFERENCE_CONFLICT");return values[0]?freeze(values[0].authorizationRequest):null}
}
