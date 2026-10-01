import path from "node:path";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { ProductRepository, RetailerRepository } from "../../atlas/index.js";
import { prepareProductEnrichmentFromProductsResult } from "../acquisition/enrichment/ProductEnrichmentPrepareService.js";
import { classifyDefaultAcquisitionRoute, DEFAULT_ACQUISITION_ROUTES } from "../acquisition/enrichment/DefaultAcquisitionRouting.js";
import { FileDataForSeoMarketEvidenceRepository } from "../market/dataforseo/persistence/FileDataForSeoMarketEvidenceRepository.js";
import { FileHistoricalObservationRepository } from "../historical-admission/persistence/FileHistoricalObservationRepository.js";
import { HistoricalObservationAdmissionService } from "../historical-admission/HistoricalObservationAdmissionService.js";
import { FileIdentityReviewDecisionRepository } from "../identity-review/persistence/FileIdentityReviewDecisionRepository.js";
import { resolveHistoricalRefreshAdmissionGovernance } from "../historical-admission/HistoricalRefreshAdmissionGovernance.js";
import { HistoricalObservationPortfolio } from "./HistoricalObservationPortfolio.js";
import { HistoricalRefreshCadencePolicyRepository } from "../historical-refresh/HistoricalRefreshCadencePolicyRepository.js";

const freeze = value => Object.freeze(structuredClone(value));

export function createProductsIdentityProgressionOwner() {
  return Object.freeze({
    async resolve({ atlasProduct, providerTaskId, providerResult } = {}) {
      const prepared = await prepareProductEnrichmentFromProductsResult({ atlasProduct, sourceTaskId: providerTaskId, productsResult: providerResult });
      const routing = classifyDefaultAcquisitionRoute({ resolution: prepared.resolution, directSellersLineageCertified: true });
      const status = routing.executableRoute === DEFAULT_ACQUISITION_ROUTES.READY_FOR_SELLERS
        ? "STRONG_UNIQUE"
        : routing.executableRoute === DEFAULT_ACQUISITION_ROUTES.READY_FOR_PRODUCT_INFO
          ? "ESCALATION_REQUIRED"
          : "BLOCKED_IDENTITY";
      const reviewAssessment = status === "STRONG_UNIQUE" ? {
        providerTaskId,
        identityState: "EXACT_OR_GOVERNED_MATCH",
        resultIdentity: prepared.resolution,
        reasons: []
      } : null;
      return freeze({ status, prepared, routing, reviewAssessment, paidTaskCreated: false, actualSpendUsd: 0 });
    }
  });
}

export function createProductInfoIdentityProgressionOwner() {
  return Object.freeze({
    async resolve({ retrievalOutcome } = {}) {
      if (!retrievalOutcome || typeof retrievalOutcome !== "object") throw new Error("PRODUCT_INFO_IDENTITY_OUTCOME_REQUIRED");
      const status = retrievalOutcome.sellersReadiness === "READY_FOR_SELLERS" && ["RESULT_RECEIVED", "DUPLICATE"].includes(retrievalOutcome.status)
        ? "STRONG_UNIQUE"
        : "BLOCKED_IDENTITY";
      if (status === "STRONG_UNIQUE" && retrievalOutcome.sellersProposal?.operation !== "SELLERS") throw new Error("PRODUCT_INFO_SELLERS_PROPOSAL_REQUIRED");
      return freeze({ status, resultId: retrievalOutcome.result?.resultId ?? null, sellersReadiness: retrievalOutcome.sellersReadiness ?? "NOT_ESTABLISHED", nextProposal: status === "STRONG_UNIQUE" ? retrievalOutcome.sellersProposal : null, paidTaskCreated: false, actualSpendUsd: 0 });
    }
  });
}

export function createProductionHistoricalAdmissionOwner({
  stateRoot = path.resolve(".forge-review/acquisition"),
  mercuryRoot = path.resolve(".forge-review/mercury"),
  identityRoot = path.resolve(".forge-review/identity-review"),
  admissionService,
  portfolioProjector,
  now = () => new Date().toISOString(),
  readJson = async resource => JSON.parse(await readFile(resource instanceof URL ? fileURLToPath(resource) : resource, "utf8"))
} = {}) {
  let service = admissionService;
  let project = portfolioProjector;
  const evidenceState = path.join(stateRoot, "dataforseo-market-evidence.json");
  const historicalState = path.join(mercuryRoot, "historical-observations.json");
  const decisionState = path.join(identityRoot, "identity-review-decisions.json");
  const refreshResultState = path.join(stateRoot, "historical-refresh-result-latest.json");
  const refreshPlanState = path.join(stateRoot, "historical-refresh-plan.json");
  const retentionState = path.join(stateRoot, "sellers-df003-retention-latest.json");
  const sellersProposalState = path.join(stateRoot, "sellers-enrichment-proposal.json");

  const compose = () => {
    if (service) return;
    const evidenceRepository = new FileDataForSeoMarketEvidenceRepository({ statePath: evidenceState });
    const historicalRepository = new FileHistoricalObservationRepository({ statePath: historicalState });
    const productRepository = new ProductRepository({ readJson });
    const retailerRepository = new RetailerRepository({ readJson });
    const resolveChain = async record => {
      const retention = await readJson(retentionState), envelope = await readJson(sellersProposalState), proposal = envelope.proposal;
      if (!retention.integrations?.some(value => value.evidenceId === record.evidenceId)) throw new Error("HISTORICAL_EVIDENCE_NOT_BOUND_TO_RETENTION_AUDIT");
      const direct = proposal?.identityLineageType === "DIRECT_PRODUCTS_STRONG_IDENTITY";
      if ((direct ? retention.productInfoTaskId != null || proposal.sourceProductInfoTaskId != null : retention.productInfoTaskId !== proposal?.sourceProductInfoTaskId) || proposal?.atlasProductId !== record.candidate?.identity?.atlasProductId) throw new Error("HISTORICAL_ACQUISITION_CHAIN_MISMATCH");
      return { identityLineageType: direct ? "DIRECT_PRODUCTS_STRONG_IDENTITY" : "PRODUCT_INFO_VALIDATED", productsTaskId: proposal.sourceProductsTaskId, productInfoTaskId: direct ? null : retention.productInfoTaskId, sellersTaskId: retention.sellersTaskId };
    };
    const resolveRefresh = async record => {
      let refreshResult;
      try { refreshResult = await readJson(refreshResultState); }
      catch (error) { if (error?.code === "ENOENT") return null; throw error; }
      if (!refreshResult.identityReuse?.some(value => value?.targetEvidenceId === record.evidenceId)) return null;
      return resolveHistoricalRefreshAdmissionGovernance({ targetRecord: record, evidenceRepository, refreshResult, refreshPlan: await readJson(refreshPlanState) });
    };
    service = new HistoricalObservationAdmissionService({ evidenceRepository, decisionRepository: new FileIdentityReviewDecisionRepository({ statePath: decisionState, requireExisting: true }), productRepository, retailerRepository, historicalRepository, acquisitionChainResolver: resolveChain, refreshGovernanceResolver: resolveRefresh, now });
    project = project ?? (asOf => new HistoricalObservationPortfolio({ productRepository, historicalRepository, evidenceRepository, cadencePolicyRepository: new HistoricalRefreshCadencePolicyRepository() }).query({ asOf }));
  };

  return Object.freeze({
    paths: freeze({ evidenceState, historicalState, decisionState, refreshResultState, refreshPlanState, retentionState, sellersProposalState }),
    async process({ evidenceId, admittedBy, asOf = now() } = {}) {
      compose();
      try {
        const admission = await service.admit({ evidenceId, admittedBy });
        const portfolio = project ? await project(asOf) : null;
        return freeze({ status: admission.status === "DUPLICATE" ? "DUPLICATE" : "ADMITTED", admission, portfolio, paidTaskCreated: false, actualSpendUsd: 0, canonicalEligible: false, publicationEligible: false });
      } catch (error) {
        const message = String(error?.message ?? "");
        const status = message.includes("SOURCE_RIGHTS") ? "BLOCKED_RIGHTS"
          : message.includes("COMPARAB") || message.includes("BUNDLE") || message.includes("CONDITIONAL") ? "BLOCKED_COMPARABILITY"
            : message.includes("IDENTITY") || message.includes("NOT_ELIGIBLE") ? "BLOCKED_IDENTITY" : "ADMISSION_FAILED";
        return freeze({ status, reason: message || "ADMISSION_FAILED", paidTaskCreated: false, actualSpendUsd: 0, canonicalEligible: false, publicationEligible: false });
      }
    }
  });
}
