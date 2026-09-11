import path from "node:path";
import { readFile } from "node:fs/promises";
import { ProductRepository, RetailerRepository } from "../../../atlas/index.js";
import { DataForSeoAtlasResolver } from "../../resolution/dataforseo/DataForSeoAtlasResolver.js";
import { DataForSeoAcquisitionResultProcessor } from "../integration/DataForSeoAcquisitionResultProcessor.js";
import { FileDataForSeoMarketEvidenceRepository } from "../../market/dataforseo/persistence/FileDataForSeoMarketEvidenceRepository.js";
import { FileDataForSeoTaskLedger } from "../dataforseo/FileDataForSeoTaskLedger.js";
import { FileAcquisitionExecutionLedgerRepository } from "../execution/FileAcquisitionExecutionLedgerRepository.js";
import { FileLiveAuthorizationConsumptionRepository } from "../authorization/FileLiveAuthorizationConsumptionRepository.js";
import { SellersResultDf003RetentionService } from "../integration/SellersResultDf003RetentionService.js";
import { validateSellersRetentionLineage, validateSellersRetentionResults } from "../integration/SellersResultRetentionBoundary.js";
import { createGovernedInitialAcquisitionIdentityProjection } from "../../identity-review/GovernedInitialAcquisitionIdentityProjection.js";

export function createProductionSellersDf003ProcessingOwner({ stateRoot = path.resolve(".forge-review/acquisition"), evidencePath, readJson = async resource => JSON.parse(await readFile(resource, "utf8")) } = {}) {
  const taskRepository = new FileDataForSeoTaskLedger(path.join(stateRoot, "dataforseo-task-ledger.json"));
  const executionRepository = new FileAcquisitionExecutionLedgerRepository({ filePath: path.join(stateRoot, "execution-ledger.json") });
  const consumptionRepository = new FileLiveAuthorizationConsumptionRepository({ filePath: path.join(stateRoot, "live-authorization-consumptions.json") });
  const canonicalEvidencePath = evidencePath ? path.resolve(evidencePath) : path.join(stateRoot, "dataforseo-market-evidence.json");
  return Object.freeze({
    evidencePath: canonicalEvidencePath,
    async process({ sellersTaskId, productInfoTaskId = null, sellersResult, productInfoResult = null } = {}) {
      const sellersAuthorization = await readJson(path.join(stateRoot, "sellers-authorization-request.json"));
      const prepared = await readJson(path.join(stateRoot, "sellers-enrichment-proposal.json"));
      const sellersProposal = prepared.proposal ?? prepared;
      const direct = sellersProposal.identityLineageType === "DIRECT_PRODUCTS_STRONG_IDENTITY";
      if (typeof sellersTaskId !== "string") throw new Error("SELLERS_TASK_ID_REQUIRED");
      if (!direct && typeof productInfoTaskId !== "string") throw new Error("PRODUCT_INFO_TASK_ID_REQUIRED");
      if (direct && productInfoTaskId != null) throw new Error("DIRECT_PRODUCTS_LINEAGE_REJECTS_PRODUCT_INFO_TASK");
      const executionRuns = await executionRepository.getAll();
      const lineage = validateSellersRetentionLineage({ sellersTaskId, productInfoTaskId, sellersAuthorization, sellersProposal, taskLedger: taskRepository.getAll(), executionRuns, authorizationConsumptions: await consumptionRepository.getAll() });
      if (Number(sellersResult?.cost ?? 0) !== 0 || (!direct && Number(productInfoResult?.cost ?? 0) !== 0)) throw new Error("DF003_RETENTION_RETRIEVAL_MUST_BE_ZERO_COST");
      const governance = validateSellersRetentionResults({ lineage, sellersResult, productInfoResult });
      const productRepository = new ProductRepository({ readJson });
      const retailerRepository = new RetailerRepository({ readJson });
      const atlasProduct = await productRepository.loadProduct(lineage.atlasProductId);
      const evidenceRepository = new FileDataForSeoMarketEvidenceRepository({ statePath: canonicalEvidencePath });
      const resultProcessor = new DataForSeoAcquisitionResultProcessor({ atlasResolver: new DataForSeoAtlasResolver({ productRepository }), evidenceRepository, retailers: async () => retailerRepository.getAll() });
      const result = await new SellersResultDf003RetentionService({ resultProcessor }).retain({
        sellersResult, productInfoResult, sellersTaskId, productInfoTaskId,
        observedAt: executionRuns.find(run => run.runId === lineage.sellersExecutionRunId).finishedAt,
        providerIdentity: sellersAuthorization.providerIdentity,
        candidateId: sellersAuthorization.plan.decisions.find(entry => entry.decision === "APPROVED").candidateId,
        governedAcquisition: { createProjection: ({ sellerItem, rawPayloadReference }) => createGovernedInitialAcquisitionIdentityProjection({ governance, sellersProposal, atlasProduct, sellerItem, rawPayloadReference }) }
      });
      return Object.freeze({ result, governance, lineage, atlasProduct, direct });
    }
  });
}
