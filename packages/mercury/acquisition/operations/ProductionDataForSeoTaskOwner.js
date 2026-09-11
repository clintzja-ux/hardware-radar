import path from "node:path";
import { DataForSeoMerchantApiClient } from "../dataforseo/DataForSeoMerchantApiClient.js";
import { DataForSeoAcquisitionService } from "../dataforseo/DataForSeoAcquisitionService.js";
import { FileDataForSeoTaskLedger } from "../dataforseo/FileDataForSeoTaskLedger.js";
import { loadDataForSeoCredentials } from "../dataforseo/DataForSeoConfig.js";
import { ControlledAcquisitionExecutor } from "../execution/ControlledAcquisitionExecutor.js";
import { FileAcquisitionExecutionLedgerRepository } from "../execution/FileAcquisitionExecutionLedgerRepository.js";
import { FileLiveAuthorizationConsumptionRepository } from "../authorization/FileLiveAuthorizationConsumptionRepository.js";
import { SingleUseAuthorizedLiveAcquisitionExecutor } from "../authorization/SingleUseAuthorizedLiveAcquisitionExecutor.js";
import { createLiveAcquisitionAuthorization } from "../authorization/LiveAcquisitionAuthorization.js";
import { FileSingleWriterRunLock } from "../../runtime/FileSingleWriterRunLock.js";

const METHODS = Object.freeze({
  PRODUCTS: "createProductsTask",
  PRODUCT_INFO: "createProductInfoTask",
  SELLERS: "createSellersTask"
});

const CODES = Object.freeze({
  PRODUCTS: "E2B_ONLY_PRODUCTS_ALLOWED",
  PRODUCT_INFO: "E2D_ONLY_PRODUCT_INFO_ALLOWED",
  SELLERS: "E2E_ONLY_SELLERS_ALLOWED"
});

/**
 * Production composition only. Task policy, request construction, authorization,
 * budgets, retry rules and persistence remain in their certified owners.
 */
export function createProductionDataForSeoTaskOwner({
  operation,
  stateRoot = path.resolve(".forge-review/acquisition"),
  credentialLoader = loadDataForSeoCredentials,
  httpTransport,
  now = () => new Date().toISOString(),
  acquisitionService,
  executionRepository,
  consumptionRepository,
  runLock
} = {}) {
  if (!METHODS[operation]) throw new TypeError("DATAFORSEO_PRODUCTION_OPERATION_INVALID");
  const canonicalHttpTransport = httpTransport ?? (async ({ method, url, headers, body }) => {
    let response;
    try {
      response = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
    } catch (cause) {
      if (operation !== "PRODUCTS") throw cause;
      const error = new Error("PROVIDER_REQUEST_FAILED", { cause });
      error.failureStage = "DURING_PROVIDER_REQUEST";
      error.retryability = "RETRY_REQUIRES_OPERATOR_ACTION";
      throw error;
    }
    if (!response.ok) {
      const error = new Error(`HTTP_${response.status}`);
      if (operation === "PRODUCTS") {
        error.failureStage = "PROVIDER_REJECTED";
        error.failureClass = "PROVIDER_REJECTION";
        error.retryability = "REVIEW_REQUIRED";
      }
      throw error;
    }
    try {
      return await response.json();
    } catch (cause) {
      if (operation !== "PRODUCTS") throw cause;
      const error = new Error("PROVIDER_RESPONSE_INVALID", { cause });
      error.failureStage = "AFTER_PROVIDER_RESPONSE_BEFORE_TASK_PERSISTENCE";
      error.failureClass = "RUNTIME_FAILURE";
      error.retryability = "REVIEW_REQUIRED";
      throw error;
    }
  });
  const taskLedgerPath = path.join(stateRoot, "dataforseo-task-ledger.json");
  const canonicalExecutionRepository = executionRepository ?? new FileAcquisitionExecutionLedgerRepository({ filePath: path.join(stateRoot, "execution-ledger.json") });
  const canonicalConsumptionRepository = consumptionRepository ?? new FileLiveAuthorizationConsumptionRepository({ filePath: path.join(stateRoot, "live-authorization-consumptions.json") });
  const canonicalRunLock = runLock ?? new FileSingleWriterRunLock({ lockPath: path.join(stateRoot, "mercury-acquisition.lock") });

  const providerService = acquisitionService ?? (() => {
    let value;
    return {
      async invoke(method, execution) {
        if (!value) {
          let credentials;
          try { credentials = credentialLoader(); }
          catch (cause) {
            if (operation !== "PRODUCTS") throw cause;
            const error = new Error("DATAFORSEO_CONFIGURATION_UNAVAILABLE", { cause });
            error.failureStage = "BEFORE_PROVIDER_REQUEST";
            error.failureClass = "CONFIGURATION_OR_CONTRACT_FAILURE";
            error.retryability = "NON_RETRYABLE_CONFIGURATION_OR_CONTRACT_FAILURE";
            throw error;
          }
          const client = new DataForSeoMerchantApiClient({ login: credentials.login, password: credentials.password, transport: canonicalHttpTransport });
          value = new DataForSeoAcquisitionService({ client, ledger: new FileDataForSeoTaskLedger(taskLedgerPath) });
        }
        return value[method](execution);
      }
    };
  })();

  const transport = {
    execute: async (execution) => {
      if (execution.kind !== operation) throw new Error(CODES[operation]);
      const method = METHODS[operation];
      const task = typeof providerService.invoke === "function"
        ? await providerService.invoke(method, execution)
        : await providerService[method](execution);
      return { costUsd: task.costUsd, providerTaskId: task.taskId, status: task.createdStatus };
    }
  };
  const controlled = new ControlledAcquisitionExecutor({ runLock: canonicalRunLock, ledgerRepository: canonicalExecutionRepository, transport, now });
  const singleUse = new SingleUseAuthorizedLiveAcquisitionExecutor({ executor: controlled, consumptionRepository: canonicalConsumptionRepository, now });

  return Object.freeze({
    operation,
    stateRoot,
    taskLedgerPath,
    executionRepository: canonicalExecutionRepository,
    singleUseExecutor: singleUse,
    async execute({ request, authorizedAt = now() } = {}) {
      if (!request || request.plan?.decisions?.some((entry) => entry.decision === "APPROVED" && entry.execution?.kind !== operation)) {
        throw new Error(CODES[operation]);
      }
      const authorization = createLiveAcquisitionAuthorization({
        authorizationId: request.requestId,
        authorized: true,
        planId: request.planId,
        authorizedAt,
        expiresAt: request.expiresAt,
        maxSpendUsd: request.maxSpendUsd,
        maxPaidTasks: request.maxPaidTasks
      });
      return singleUse.execute({ plan: request.plan, authorization });
    }
  });
}
