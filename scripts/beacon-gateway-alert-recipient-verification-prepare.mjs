import path from "node:path";
import {
  CloudflareEmailServiceProviderConfigurationRepository,
  createGatewayCloudflareVerificationOperatorInput,
  FileGatewayAlertRecipientVerificationAuthorizationRepository,
  GatewayAlertOperatorRecipientApprovalRepository,
  GatewayAlertRecipientVerificationPrepareService,
} from "../packages/gateway/index.js";

const operatorInput = createGatewayCloudflareVerificationOperatorInput({
  ...(process.env.CLOUDFLARE_ACCOUNT_ID === undefined ? {} : {CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID}),
  ...(process.env.CLOUDFLARE_API_TOKEN === undefined ? {} : {CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN}),
  ...(process.env.BEACON_ALERT_RECIPIENT === undefined ? {} : {BEACON_ALERT_RECIPIENT: process.env.BEACON_ALERT_RECIPIENT}),
});
const service = new GatewayAlertRecipientVerificationPrepareService({
  approvalRepository: new GatewayAlertOperatorRecipientApprovalRepository(),
  providerConfigurationRepository: new CloudflareEmailServiceProviderConfigurationRepository(),
  authorizationRepository: new FileGatewayAlertRecipientVerificationAuthorizationRepository({
    filePath: path.resolve(".forge-review/gateway-alert-recipient-verification-authorizations.json"),
  }),
});
const result = operatorInput.accountIdentifierConfigured && operatorInput.apiTokenConfigured
  ? await operatorInput.withRuntimeConfiguration(runtimeConfiguration => service.prepare({runtimeConfiguration}))
  : await service.prepare({runtimeConfiguration: {}});

console.log("ALERT RECIPIENT VERIFICATION PREPARE");
console.log("");
console.log("Recipient approval:             ", result.recipientApproval);
console.log("Recipient value:                REDACTED");
console.log("Provider:                       ", result.provider);
console.log("Verification authority:        ", result.verificationAuthority);
console.log("Current verification:           ", result.currentVerification);
console.log("Provider deployed:              ", result.providerDeployed ? "YES" : "NO");
console.log("Sending enabled:                ", result.sendingEnabled ? "YES" : "NO");
console.log("Verification action available:  ", result.verificationActionAvailable ? "YES" : "NO");
console.log("Blocking prerequisite:          ", result.blockingPrerequisites.join(", ") || "NONE");
console.log("Authorization ID:               ", result.authorization?.authorizationId ?? "NOT_CREATED");
console.log("Network request:                NONE");
console.log("Verification requested:         NO");
console.log("Email sent:                     NO");
console.log("Actual spend:                   $0.000");
