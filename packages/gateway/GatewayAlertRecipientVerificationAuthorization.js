import {createHash} from "node:crypto";
import {createCloudflareEmailServiceProviderConfiguration} from "./CloudflareEmailServiceProviderConfiguration.js";
import {createGatewayAlertOperatorRecipientApproval} from "./GatewayAlertOperatorRecipientApproval.js";
import {createGatewayCloudflareRuntimeConfiguration} from "./GatewayCloudflareRuntimeConfiguration.js";
import {assessGatewayAlertRecipientVerificationTarget} from "./GatewayAlertRecipientVerificationTarget.js";

export const GATEWAY_ALERT_RECIPIENT_VERIFICATION_CONFIRMATION = "VERIFY-ALERT-RECIPIENT";
export const GATEWAY_ALERT_RECIPIENT_VERIFICATION_OPERATION = "CREATE_EMAIL_ROUTING_DESTINATION_VERIFICATION_REQUEST";

const keys = [
  "schemaVersion", "authorizationId", "authorizationType", "status", "operation",
  "approvalId", "providerConfigurationId", "runtimeConfigurationKey",
  "verificationAuthority", "destinationDigest", "accountIdentifierDigest", "createdAt",
  "expiresAt", "singleUse", "sendingAuthorized", "providerDeploymentAuthorized",
  "senderDomainAuthorized", "automaticRetry",
];
const freeze = value => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) freeze(child);
  }
  return value;
};
const hash = value => createHash("sha256").update(value).digest("hex");
const validTime = value => typeof value === "string" && Number.isFinite(Date.parse(value));

export function assertGatewayAlertRecipientVerificationConfirmation(value) {
  if (value !== GATEWAY_ALERT_RECIPIENT_VERIFICATION_CONFIRMATION) {
    throw new Error(`EXPLICIT_CONFIRMATION_REQUIRED:--confirm=${GATEWAY_ALERT_RECIPIENT_VERIFICATION_CONFIRMATION}`);
  }
  return true;
}

export function createGatewayAlertRecipientVerificationAuthorizationRequest({
  approval,
  providerConfiguration,
  runtimeConfiguration,
  target,
  createdAt = new Date().toISOString(),
  ttlMinutes = 15,
} = {}) {
  const governedApproval = createGatewayAlertOperatorRecipientApproval(approval);
  const provider = createCloudflareEmailServiceProviderConfiguration(providerConfiguration);
  const runtime = createGatewayCloudflareRuntimeConfiguration(runtimeConfiguration);
  const assessedTarget = assessGatewayAlertRecipientVerificationTarget(target);
  if (!validTime(createdAt) || !Number.isInteger(ttlMinutes) || ttlMinutes < 1 || ttlMinutes > 60) {
    throw new TypeError("ALERT_RECIPIENT_VERIFICATION_AUTHORIZATION_TIME_INVALID");
  }
  if (!runtime.recipientConfigured) throw new Error("RUNTIME_RECIPIENT_NOT_CONFIGURED");
  if (!assessedTarget.verificationActionAvailable) throw new Error(assessedTarget.reasons[0]);

  return runtime.withVerificationCredentials(({accountId}) => {
    const recipient = runtime.recipientRuntimeConfiguration().BEACON_ALERT_RECIPIENT;
    const destinationDigest = hash(recipient);
    const accountIdentifierDigest = hash(accountId);
    const binding = [
      governedApproval.approvalId,
      provider.configurationId,
      "BEACON_ALERT_RECIPIENT",
      governedApproval.verificationAuthority,
      destinationDigest,
      accountIdentifierDigest,
      GATEWAY_ALERT_RECIPIENT_VERIFICATION_OPERATION,
      createdAt,
    ];
    return freeze({
      schemaVersion: "1.1",
      authorizationId: `gw_recipient_verify_${hash(binding.join("|")).slice(0, 24)}`,
      authorizationType: "GATEWAY_ALERT_RECIPIENT_VERIFICATION",
      status: "PENDING_OPERATOR_APPROVAL",
      operation: GATEWAY_ALERT_RECIPIENT_VERIFICATION_OPERATION,
      approvalId: governedApproval.approvalId,
      providerConfigurationId: provider.configurationId,
      runtimeConfigurationKey: "BEACON_ALERT_RECIPIENT",
      verificationAuthority: governedApproval.verificationAuthority,
      destinationDigest,
      accountIdentifierDigest,
      createdAt: new Date(createdAt).toISOString(),
      expiresAt: new Date(Date.parse(createdAt) + ttlMinutes * 60000).toISOString(),
      singleUse: true,
      sendingAuthorized: false,
      providerDeploymentAuthorized: false,
      senderDomainAuthorized: false,
      automaticRetry: false,
    });
  });
}

export function validateGatewayAlertRecipientVerificationAuthorization(input = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input) || input.schemaVersion !== "1.1" ||
    !/^gw_recipient_verify_[a-f0-9]{24}$/.test(input.authorizationId) ||
    input.authorizationType !== "GATEWAY_ALERT_RECIPIENT_VERIFICATION" ||
    input.status !== "PENDING_OPERATOR_APPROVAL" ||
    input.operation !== GATEWAY_ALERT_RECIPIENT_VERIFICATION_OPERATION ||
    typeof input.approvalId !== "string" || typeof input.providerConfigurationId !== "string" ||
    input.runtimeConfigurationKey !== "BEACON_ALERT_RECIPIENT" ||
    input.verificationAuthority !== "CLOUDFLARE_EMAIL_DESTINATION_VERIFICATION" ||
    !/^[a-f0-9]{64}$/.test(input.destinationDigest) ||
    !/^[a-f0-9]{64}$/.test(input.accountIdentifierDigest) ||
    !validTime(input.createdAt) || !validTime(input.expiresAt) ||
    Date.parse(input.expiresAt) <= Date.parse(input.createdAt) || input.singleUse !== true ||
    input.sendingAuthorized !== false || input.providerDeploymentAuthorized !== false ||
    input.senderDomainAuthorized !== false || input.automaticRetry !== false ||
    Object.keys(input).some(key => !keys.includes(key))) {
    throw new TypeError("ALERT_RECIPIENT_VERIFICATION_AUTHORIZATION_INVALID");
  }
  return freeze(structuredClone(input));
}

export function assertGatewayAlertRecipientVerificationBinding({
  authorization,
  approval,
  providerConfiguration,
  runtimeConfiguration,
  asOf,
} = {}) {
  const request = validateGatewayAlertRecipientVerificationAuthorization(authorization);
  const governedApproval = createGatewayAlertOperatorRecipientApproval(approval);
  const provider = createCloudflareEmailServiceProviderConfiguration(providerConfiguration);
  const runtime = createGatewayCloudflareRuntimeConfiguration(runtimeConfiguration);
  if (!validTime(asOf)) throw new TypeError("ALERT_RECIPIENT_VERIFICATION_AS_OF_INVALID");
  if (Date.parse(asOf) >= Date.parse(request.expiresAt)) {
    throw new Error("ALERT_RECIPIENT_VERIFICATION_AUTHORIZATION_EXPIRED");
  }
  if (!runtime.recipientConfigured) throw new Error("ALERT_RECIPIENT_VERIFICATION_AUTHORIZATION_BINDING_INVALID");

  return runtime.withVerificationCredentials(({accountId}) => {
    const recipient = runtime.recipientRuntimeConfiguration().BEACON_ALERT_RECIPIENT;
    if (request.approvalId !== governedApproval.approvalId ||
      request.providerConfigurationId !== provider.configurationId ||
      request.verificationAuthority !== governedApproval.verificationAuthority ||
      request.destinationDigest !== hash(recipient) ||
      request.accountIdentifierDigest !== hash(accountId)) {
      throw new Error("ALERT_RECIPIENT_VERIFICATION_AUTHORIZATION_BINDING_INVALID");
    }
    return request;
  });
}
