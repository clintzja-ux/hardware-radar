import {
  assessGatewayCloudflareRuntimeReadiness,
  GATEWAY_CLOUDFLARE_WORKER_TARGET,
} from "../packages/gateway/index.js";

const status = assessGatewayCloudflareRuntimeReadiness({
  runtimeConfiguration: {},
  workerTarget: GATEWAY_CLOUDFLARE_WORKER_TARGET,
});

console.log("CLOUDFLARE GATEWAY RUNTIME CONFIGURATION");
console.log("");
console.log("Runtime provider:                 ", status.runtimeProvider);
console.log("Worker target configured:         ", status.workerTargetConfigured ? "YES" : "NO");
console.log("Account identifier configured:    ", status.accountIdentifierConfigured ? "YES" : "NO");
console.log("API token configured:             ", status.apiTokenConfigured ? "YES" : "NO");
console.log("Recipient runtime configured:     ", status.recipientConfigured ? "YES" : "NO");
console.log("D1 binding configured:            ", status.d1BindingConfigured ? "YES" : "NO");
console.log("Email binding configured:         ", status.emailBindingConfigured ? "YES" : "NO");
console.log("Monitoring deployment configured: ", status.monitoringDeploymentConfigured ? "YES" : "NO");
console.log("Verification runtime ready:       ", status.verificationRuntimeReady ? "YES" : "NO");
console.log("Gateway deployment ready:         ", status.gatewayDeploymentReady ? "YES" : "NO");
console.log("Production transport:             ", status.productionTransport);
console.log("Secrets displayed:                NO");
console.log("Network request:                  NONE");
console.log("Action executed:                  NO");
console.log("Actual spend:                     $0.000");
