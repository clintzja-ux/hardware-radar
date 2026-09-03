import {readFile} from "node:fs/promises";
import {createGatewayOperationalAlertPolicy} from "./GatewayOperationalAlertPolicy.js";
const defaultUrl=new URL("./policies/beacon-gateway-operational-alert-policy.json",import.meta.url);
export class GatewayOperationalAlertPolicyRepository{constructor({policyUrl=defaultUrl,readJson=async url=>JSON.parse(await readFile(url,"utf8"))}={}){if(typeof readJson!=="function")throw new TypeError("GATEWAY_ALERT_POLICY_REPOSITORY_INVALID");this.policyUrl=policyUrl;this.readJson=readJson;}async getPolicy(){try{const raw=await this.readJson(this.policyUrl),policy=createGatewayOperationalAlertPolicy(raw);if(JSON.stringify(policy)!==JSON.stringify(raw))throw new Error();return policy;}catch{throw new Error("GATEWAY_OPERATIONAL_ALERT_POLICY_STATE_INVALID");}}}
export default GatewayOperationalAlertPolicyRepository;
