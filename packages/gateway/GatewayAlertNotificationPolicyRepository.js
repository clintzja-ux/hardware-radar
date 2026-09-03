import {readFile} from "node:fs/promises";
import {createGatewayAlertNotificationPolicy} from "./GatewayAlertNotificationPolicy.js";
const defaultUrl=new URL("./policies/beacon-gateway-alert-notification-policy.json",import.meta.url);
export class GatewayAlertNotificationPolicyRepository{constructor({policyUrl=defaultUrl,readJson=async url=>JSON.parse(await readFile(url,"utf8"))}={}){if(typeof readJson!=="function")throw new TypeError("GATEWAY_NOTIFICATION_POLICY_REPOSITORY_INVALID");this.policyUrl=policyUrl;this.readJson=readJson;}async getPolicy(){try{const raw=await this.readJson(this.policyUrl),policy=createGatewayAlertNotificationPolicy(raw);if(JSON.stringify(policy)!==JSON.stringify(raw))throw new Error();return policy;}catch{throw new Error("GATEWAY_ALERT_NOTIFICATION_POLICY_STATE_INVALID");}}}
export default GatewayAlertNotificationPolicyRepository;
