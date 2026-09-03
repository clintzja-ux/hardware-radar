import {readFile} from "node:fs/promises";
import {createBeaconGatewayAbuseControlPolicy} from "./BeaconGatewayAbuseControlPolicy.js";
const defaultPolicyUrl=new URL("./policies/beacon-product-interest-abuse-control-policy.json",import.meta.url);
export class BeaconGatewayAbuseControlPolicyRepository{constructor({policyUrl=defaultPolicyUrl,readJson=async url=>JSON.parse(await readFile(url,"utf8"))}={}){if(typeof readJson!=="function")throw new TypeError("BEACON_GATEWAY_ABUSE_CONTROL_REPOSITORY_INVALID");this.policyUrl=policyUrl;this.readJson=readJson;}async getPolicy(){try{const raw=await this.readJson(this.policyUrl),policy=createBeaconGatewayAbuseControlPolicy(raw);if(JSON.stringify(policy)!==JSON.stringify(raw))throw new Error();return policy;}catch{throw new Error("BEACON_GATEWAY_ABUSE_CONTROL_POLICY_STATE_INVALID");}}}
export default BeaconGatewayAbuseControlPolicyRepository;
