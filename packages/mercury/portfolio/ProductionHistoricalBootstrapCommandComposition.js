import path from "node:path";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { ProductRepository } from "../../atlas/index.js";
import { FileAcquisitionCheckpointRepository, ProductsCheckpointReviewService } from "../acquisition/portfolio/AcquisitionCheckpoint.js";
import { FileAcquisitionExecutionLedgerRepository } from "../acquisition/execution/FileAcquisitionExecutionLedgerRepository.js";
import { FileDataForSeoPrepareArtifactRepository } from "../acquisition/operations/FileDataForSeoPrepareArtifactRepository.js";
import { createProductionProductsPrepareOwner, createProductionProductInfoPrepareOwner, createProductionSellersPrepareOwner } from "../acquisition/operations/ProductionDataForSeoPrepareOwners.js";
import { createProductionDataForSeoTaskOwner } from "../acquisition/operations/ProductionDataForSeoTaskOwner.js";
import { createProductionDataForSeoRetrievalOwner } from "../acquisition/operations/ProductionDataForSeoRetrievalOwner.js";
import { createProductionSellersDf003ProcessingOwner } from "../acquisition/operations/ProductionSellersDf003ProcessingOwner.js";
import { readGovernedSpendForUtcDay } from "../acquisition/planning/GovernedDailySpend.js";
import { defaultSourceRightsRegistry } from "../rights/SourceRightsRegistry.js";
import { FileHistoricalBootstrapCheckpointRepository } from "./HistoricalBootstrapCheckpoint.js";
import { FileHistoricalBootstrapContinuationRepository } from "./HistoricalBootstrapContinuation.js";
import { FileHistoricalBootstrapProviderResultRepository } from "./FileHistoricalBootstrapProviderResultRepository.js";
import { HistoricalBootstrapResultDispatcher } from "./HistoricalBootstrapResultDispatcher.js";
import { createProductionHistoricalBootstrapLifecycleService } from "./ProductionHistoricalBootstrapLifecycle.js";
import {
  ProductionHistoricalBootstrapResultBridge,
  createHistoricalBootstrapProductsResultAdapter,
  createHistoricalBootstrapProductInfoResultAdapter,
  createHistoricalBootstrapSellersResultAdapter
} from "./ProductionHistoricalBootstrapResultBridge.js";
import {
  createProductsIdentityProgressionOwner,
  createProductInfoIdentityProgressionOwner,
  createProductionHistoricalAdmissionOwner
} from "./ProductionHistoricalBootstrapLocalOwners.js";

const OPERATIONS = Object.freeze(["PRODUCTS", "PRODUCT_INFO", "SELLERS"]);

/**
 * Composition only: every policy, repository and mutation remains owned by the
 * previously certified Mercury component named here.
 */
export function createProductionHistoricalBootstrapCommandService({
  stateRoot = path.resolve(".forge-review/mercury/history-bootstrap"),
  acquisitionRoot = path.resolve(".forge-review/acquisition"),
  identityRoot = path.resolve(".forge-review/identity-review"),
  mercuryRoot = path.resolve(".forge-review/mercury"),
  now = () => new Date().toISOString(),
  credentialLoader,
  httpTransport
} = {}) {
  const readJson = async resource => JSON.parse(await readFile(resource instanceof URL ? fileURLToPath(resource) : resource, "utf8"));
  const products = new ProductRepository({ readJson });
  const atlas = { products };
  const checkpoints = new FileHistoricalBootstrapCheckpointRepository({ statePath: path.join(stateRoot, "checkpoints.json") });
  const continuations = new FileHistoricalBootstrapContinuationRepository({ statePath: path.join(stateRoot, "continuations.json") });
  const prepares = new FileDataForSeoPrepareArtifactRepository({ statePath: path.join(stateRoot, "prepare-artifacts.json") });
  const results = new FileHistoricalBootstrapProviderResultRepository({ statePath: path.join(stateRoot, "provider-results.json") });
  const executions = new FileAcquisitionExecutionLedgerRepository({ filePath: path.join(acquisitionRoot, "execution-ledger.json") });
  const spendResolver = evaluationTime => readGovernedSpendForUtcDay({ executionRepository: executions, evaluationTime });
  const prepareOwners = {
    PRODUCTS: createProductionProductsPrepareOwner({ atlas, executionRepository: executions, prepareArtifactRepository: prepares, now }),
    PRODUCT_INFO: createProductionProductInfoPrepareOwner({ proposalEnvelopePath: path.join(acquisitionRoot, "product-enrichment-proposal.json"), executionRepository: executions, prepareArtifactRepository: prepares, now }),
    SELLERS: createProductionSellersPrepareOwner({ proposalEnvelopePath: path.join(acquisitionRoot, "sellers-enrichment-proposal.json"), executionRepository: executions, prepareArtifactRepository: prepares, now })
  };
  const taskOwners = Object.fromEntries(OPERATIONS.map(operation => [operation, createProductionDataForSeoTaskOwner({ operation, stateRoot: acquisitionRoot, credentialLoader, httpTransport, executionRepository: executions, now })]));
  const taskSpecificOwner = Object.freeze({
    async execute({ request, authorizedAt } = {}) {
      const operation = request?.plan?.decisions?.find(value => value.decision === "APPROVED")?.execution?.kind;
      const owner = taskOwners[operation];
      if (!owner) throw new Error("HISTORY_041_TASK_OPERATION_INVALID");
      const value = await owner.execute({ request, authorizedAt });
      if (value.status !== "COMPLETED") throw new Error(`HISTORY_041_PAID_EXECUTION_NOT_COMPLETED:${value.status ?? "UNKNOWN"}`);
      const run = value.execution?.run;
      const providerTaskId = run?.tasks?.[0]?.providerTaskId;
      if (!providerTaskId || !run?.runId) throw new Error("HISTORY_041_PAID_EXECUTION_RESULT_INVALID");
      return Object.freeze({ providerTaskId, taskAuthorizationId: request.requestId, executionRunId: run.runId, actualSpendUsd: run.actualSpendUsd });
    }
  });
  const retrievalOwners = Object.fromEntries(OPERATIONS.map(operation => [operation, createProductionDataForSeoRetrievalOwner({ operation, credentialLoader, httpTransport })]));
  const resultBridge = new ProductionHistoricalBootstrapResultBridge({ resultRepository: results, retrievalOwners, now });
  const reviewRepository = new FileAcquisitionCheckpointRepository({ rootPath: path.join(acquisitionRoot, "portfolio") });
  const progressionOwners = {
    PRODUCTS: createHistoricalBootstrapProductsResultAdapter({ resultRepository: results, atlasProducts: products, progressionOwner: createProductsIdentityProgressionOwner(), productsReviewOwner: new ProductsCheckpointReviewService({ repository: reviewRepository, now }) }),
    PRODUCT_INFO: createHistoricalBootstrapProductInfoResultAdapter({ resultRepository: results, progressionOwner: createProductInfoIdentityProgressionOwner() }),
    SELLERS: createHistoricalBootstrapSellersResultAdapter({ resultRepository: results, processingOwner: createProductionSellersDf003ProcessingOwner({ stateRoot: acquisitionRoot }), prepareArtifactRepository: prepares, historicalOwner: createProductionHistoricalAdmissionOwner({ stateRoot: acquisitionRoot, mercuryRoot, identityRoot, now, readJson }) })
  };
  const resultDispatcher = new HistoricalBootstrapResultDispatcher({ resultRepository: results, checkpointRepository: checkpoints, progressionOwners, now });
  return createProductionHistoricalBootstrapLifecycleService({ stateRoot, checkpointRepository: checkpoints, continuationRepository: continuations, prepareOwners, prepareArtifactRepository: prepares, proposalRepository: results, resultBridge, resultDispatcher, rightsRegistry: defaultSourceRightsRegistry, spendResolver, taskSpecificOwner, now });
}
