import {mkdir,readFile,rename,writeFile} from "node:fs/promises";
import {dirname,resolve} from "node:path";
import {validateHistoricalObservation} from "../HistoricalObservation.js";

const VERSION="1.0";const initial=()=>({version:VERSION,sequence:0,records:{},idempotency:{}});const clone=value=>structuredClone(value);const frozen=value=>{if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))frozen(child);}return value;};
export class FileHistoricalObservationRepository{
  constructor({statePath}={}){if(!statePath)throw new TypeError("statePath is required.");this.statePath=resolve(statePath);this.queue=Promise.resolve();}
  async _lock(fn){const task=this.queue.then(fn,fn);this.queue=task.catch(()=>{});return task;}
  async _read(){try{const state=JSON.parse(await readFile(this.statePath,"utf8"));if(state?.version!==VERSION||!Number.isInteger(state.sequence)||typeof state.records!=="object"||typeof state.idempotency!=="object")throw new Error("HISTORICAL_OBSERVATION_STATE_INVALID");for(const record of Object.values(state.records)){const report=validateHistoricalObservation(record);if(!report.valid)throw new Error("HISTORICAL_OBSERVATION_STATE_INVALID");}return state;}catch(error){if(error?.code==="ENOENT")return initial();throw error;}}
  async _commit(state){await mkdir(dirname(this.statePath),{recursive:true});const temp=`${this.statePath}.tmp-${process.pid}-${Date.now()}`;await writeFile(temp,`${JSON.stringify(state,null,2)}\n`,"utf8");await rename(temp,this.statePath);}
  async findByIdempotencyKey(key){const state=await this._read();const id=state.idempotency[key];return id?frozen(clone(state.records[id])):null;}
  async accept(record,idempotencyKey){return this._lock(async()=>{const report=validateHistoricalObservation(record);if(!report.valid)throw new Error(`HISTORICAL_OBSERVATION_INVALID:${report.errors.join(" ")}`);if(record.metadata.idempotencyKey!==idempotencyKey)throw new Error("HISTORICAL_IDEMPOTENCY_BINDING_INVALID");const state=await this._read();const existing=state.idempotency[idempotencyKey];if(existing)return frozen({status:"DUPLICATE",observationId:existing});if(state.records[record.observationId])throw new Error("HISTORICAL_OBSERVATION_ID_CONFLICT");state.sequence+=1;state.records[record.observationId]=clone(record);state.idempotency[idempotencyKey]=record.observationId;await this._commit(state);return frozen({status:"ADMITTED",observationId:record.observationId});});}
  async getById(id){const record=(await this._read()).records[id];return record?frozen(clone(record)):null;}
  async getAll(){return frozen(Object.values((await this._read()).records).map(x=>frozen(clone(x))));}
}
export default FileHistoricalObservationRepository;
