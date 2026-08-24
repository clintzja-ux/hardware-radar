import {inspect} from "node:util";
import {createGatewayCloudflareRuntimeConfiguration} from "./GatewayCloudflareRuntimeConfiguration.js";

const INPUT_KEYS = Object.freeze([
  "CLOUDFLARE_ACCOUNT_ID",
  "CLOUDFLARE_API_TOKEN",
  "BEACON_ALERT_RECIPIENT",
]);

export class GatewayCloudflareVerificationOperatorInput {
  #runtimeConfiguration;

  constructor(input = {}) {
    if (!input || typeof input !== "object" || Array.isArray(input) ||
      Object.keys(input).some(key => !INPUT_KEYS.includes(key))) {
      throw new TypeError("GATEWAY_CLOUDFLARE_VERIFICATION_OPERATOR_INPUT_INVALID");
    }
    this.#runtimeConfiguration = createGatewayCloudflareRuntimeConfiguration(input);
    this.schemaVersion = "1.0";
    this.inputType = "GATEWAY_CLOUDFLARE_VERIFICATION_OPERATOR_INPUT";
    this.accountIdentifierSource = "EPHEMERAL_OPERATOR_INPUT";
    this.apiTokenSource = "EPHEMERAL_OPERATOR_SECRET";
    this.recipientSource = "SERVER_SIDE_RUNTIME";
    this.accountIdentifierConfigured = this.#runtimeConfiguration.accountIdentifierConfigured;
    this.apiTokenConfigured = this.#runtimeConfiguration.apiTokenConfigured;
    this.recipientConfigured = this.#runtimeConfiguration.recipientConfigured;
    Object.freeze(this);
  }

  withRuntimeConfiguration(callback) {
    if (typeof callback !== "function") {
      throw new TypeError("GATEWAY_CLOUDFLARE_OPERATOR_INPUT_CONSUMER_INVALID");
    }
    return this.#runtimeConfiguration.withVerificationCredentials(({accountId, apiToken}) =>
      callback(Object.freeze({
        CLOUDFLARE_ACCOUNT_ID: accountId,
        CLOUDFLARE_API_TOKEN: apiToken,
        ...this.#runtimeConfiguration.recipientRuntimeConfiguration(),
      })));
  }

  toJSON() {
    return {
      schemaVersion: this.schemaVersion,
      inputType: this.inputType,
      accountIdentifierSource: this.accountIdentifierSource,
      apiTokenSource: this.apiTokenSource,
      recipientSource: this.recipientSource,
      accountIdentifierConfigured: this.accountIdentifierConfigured,
      apiTokenConfigured: this.apiTokenConfigured,
      recipientConfigured: this.recipientConfigured,
      valuesDisplayed: false,
    };
  }

  [inspect.custom]() {
    return this.toJSON();
  }
}

export function createGatewayCloudflareVerificationOperatorInput(input = {}) {
  return input instanceof GatewayCloudflareVerificationOperatorInput
    ? input
    : new GatewayCloudflareVerificationOperatorInput(input);
}

export default createGatewayCloudflareVerificationOperatorInput;
