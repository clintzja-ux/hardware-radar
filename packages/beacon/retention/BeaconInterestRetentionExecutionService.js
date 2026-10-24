import {createBeaconEvidenceRetentionPolicy} from "./BeaconEvidenceRetentionPolicy.js";
const freeze=value=>{if(value&&typeof value==="object"&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;};
export class BeaconInterestRetentionExecutionService{
 constructor({collectionRepository,policy}={}){if(!collectionRepository?.deleteExpired)throw new TypeError("BEACON_RETENTION_EXECUTION_REPOSITORY_REQUIRED");this.collectionRepository=collectionRepository;this.policy=createBeaconEvidenceRetentionPolicy(policy);}
 async execute({asOf,batchSize=500}={}){if(typeof asOf!=="string"||!Number.isFinite(Date.parse(asOf))||new Date(asOf).toISOString()!==asOf||!Number.isSafeInteger(batchSize)||batchSize<1||batchSize>1000)throw new TypeError("BEACON_RETENTION_EXECUTION_INPUT_INVALID");const cutoffInclusive=new Date(Date.parse(asOf)-this.policy.retentionMs).toISOString(),result=await this.collectionRepository.deleteExpired({cutoffInclusive,batchSize});return freeze({...result,policyId:this.policy.policyId,asOf,retentionTimestampField:this.policy.retentionTimestampField,retentionMs:this.policy.retentionMs,scope:structuredClone(this.policy.scope),automaticExecution:false});}
}
export default BeaconInterestRetentionExecutionService;
