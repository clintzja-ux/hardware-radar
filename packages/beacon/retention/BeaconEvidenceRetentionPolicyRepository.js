import {readFile} from "node:fs/promises";
import {createBeaconEvidenceRetentionPolicy} from "./BeaconEvidenceRetentionPolicy.js";
const defaultPolicyUrl=new URL("./policies/first-party-product-interest-90-day-policy.json",import.meta.url);
export class BeaconEvidenceRetentionPolicyRepository{constructor({policyUrl=defaultPolicyUrl,readJson=async url=>JSON.parse(await readFile(url,"utf8"))}={}){if(typeof readJson!=="function")throw new TypeError("BEACON_RETENTION_POLICY_REPOSITORY_INVALID");this.policyUrl=policyUrl;this.readJson=readJson;}async getPolicy(){let raw;try{raw=await this.readJson(this.policyUrl);const policy=createBeaconEvidenceRetentionPolicy(raw);if(JSON.stringify(policy)!==JSON.stringify(raw))throw new Error();return policy;}catch{throw new Error("BEACON_RETENTION_POLICY_STATE_INVALID");}}}
export default BeaconEvidenceRetentionPolicyRepository;
