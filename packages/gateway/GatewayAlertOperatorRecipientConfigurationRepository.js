import {readFile} from "node:fs/promises";
import {createGatewayAlertOperatorRecipientConfiguration} from "./GatewayAlertOperatorRecipientConfiguration.js";
const defaultUrl=new URL("./policies/gateway-alert-operator-recipient.json",import.meta.url);
export class GatewayAlertOperatorRecipientConfigurationRepository{constructor({configurationUrl=defaultUrl,readJson=async url=>JSON.parse(await readFile(url,"utf8"))}={}){if(typeof readJson!=="function")throw new TypeError("GATEWAY_RECIPIENT_REPOSITORY_INVALID");this.configurationUrl=configurationUrl;this.readJson=readJson;}async getConfiguration(){try{const raw=await this.readJson(this.configurationUrl),configuration=createGatewayAlertOperatorRecipientConfiguration(raw);if(JSON.stringify(configuration)!==JSON.stringify(raw))throw new Error();return configuration;}catch{throw new Error("GATEWAY_ALERT_OPERATOR_RECIPIENT_STATE_INVALID");}}}
export default GatewayAlertOperatorRecipientConfigurationRepository;
