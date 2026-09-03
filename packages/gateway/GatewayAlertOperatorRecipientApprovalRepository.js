import {readFile} from "node:fs/promises";
import {createGatewayAlertOperatorRecipientApproval} from "./GatewayAlertOperatorRecipientApproval.js";
const defaultUrl=new URL("./policies/gateway-alert-operator-recipient-approval.json",import.meta.url);
export class GatewayAlertOperatorRecipientApprovalRepository{constructor({configurationUrl=defaultUrl,readJson=async url=>JSON.parse(await readFile(url,"utf8"))}={}){if(typeof readJson!=="function")throw new TypeError("GATEWAY_RECIPIENT_APPROVAL_REPOSITORY_INVALID");this.configurationUrl=configurationUrl;this.readJson=readJson;}async getApproval(){try{const raw=await this.readJson(this.configurationUrl),approval=createGatewayAlertOperatorRecipientApproval(raw);if(JSON.stringify(approval)!==JSON.stringify(raw))throw new Error();return approval;}catch{throw new Error("GATEWAY_ALERT_OPERATOR_RECIPIENT_APPROVAL_STATE_INVALID");}}}
export default GatewayAlertOperatorRecipientApprovalRepository;
