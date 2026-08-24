import {readFile} from "node:fs/promises";
import {createGatewayOperationalMonitoringPolicy} from "./GatewayOperationalMonitoringPolicy.js";
const defaultPolicyUrl=new URL("./policies/beacon-gateway-operational-monitoring-policy.json",import.meta.url);
export class GatewayOperationalMonitoringPolicyRepository{constructor({policyUrl=defaultPolicyUrl,readJson=async url=>JSON.parse(await readFile(url,"utf8"))}={}){if(typeof readJson!=="function")throw new TypeError("GATEWAY_MONITORING_POLICY_REPOSITORY_INVALID");this.policyUrl=policyUrl;this.readJson=readJson;}async getPolicy(){try{const raw=await this.readJson(this.policyUrl),policy=createGatewayOperationalMonitoringPolicy(raw);if(JSON.stringify(policy)!==JSON.stringify(raw))throw new Error();return policy;}catch{throw new Error("GATEWAY_OPERATIONAL_MONITORING_POLICY_STATE_INVALID");}}}
export default GatewayOperationalMonitoringPolicyRepository;
