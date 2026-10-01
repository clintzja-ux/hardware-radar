import crypto from "node:crypto";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { ProductRepository, RetailerRepository } from "../packages/atlas/index.js";
import {
  assessHistoricalFactEligibility,
  assessHistoricalOfferComparability,
  defaultSourceRightsRegistry,
  FileDataForSeoMarketEvidenceRepository,
  FileDataForSeoTaskLedger,
  FileHistoricalBootstrapProviderResultRepository,
  FileHistoricalFactReplayAuthorizationRepository,
  FileHistoricalObservationRepository,
  FileIdentityReviewDecisionRepository,
  HistoricalFactReplayPreparationService,
  HistoricalObservationAdmissionService,
  resolveGovernedInitialAcquisitionPromotionContext,
  validateHistoricalObservation
} from "../packages/mercury/index.js";
import { FileSingleWriterRunLock } from "../packages/mercury/runtime/FileSingleWriterRunLock.js";

const stable = value => {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
};
const hash = value => crypto.createHash("sha256").update(stable(value)).digest("hex");
const at = (value, route) => route.split(".").reduce((current, key) => current?.[key], value);
const requiredRights = ["acquisition.api", "retention.historical", "retention.durableAuditMetadata", "derivation.historicalAnalytics"];

export const parseHistoricalFactReplayArgs = values => new Map(values.map(value => {
  const index = value.indexOf("=");
  return index < 0 ? [value, true] : [value.slice(0, index), value.slice(index + 1)];
}));

export function createHistoricalFactReplayRuntime(args) {
  const location = (name, fallback) => path.resolve(String(args.get(name) || fallback));
  const readJson = async resource => JSON.parse(await readFile(resource instanceof URL ? fileURLToPath(resource) : resource, "utf8"));
  const evidenceRepository = new FileDataForSeoMarketEvidenceRepository({ statePath: location("--evidence-state", ".forge-review/acquisition/dataforseo-market-evidence.json") });
  const historicalRepository = new FileHistoricalObservationRepository({ statePath: location("--historical-state", ".forge-review/mercury/historical-observations.json") });
  const decisionRepository = new FileIdentityReviewDecisionRepository({ statePath: location("--decision-state", ".forge-review/identity-review/identity-review-decisions.json"), requireExisting: true });
  const productRepository = new ProductRepository({ readJson });
  const retailerRepository = new RetailerRepository({ readJson });
  const taskLedger = new FileDataForSeoTaskLedger(location("--task-ledger", ".forge-review/acquisition/dataforseo-task-ledger.json"));
  const resultRepository = new FileHistoricalBootstrapProviderResultRepository({ statePath: location("--amazon-result-state", ".forge-review/mercury/amazon-provider-results.json") });
  const pilotState = location("--amazon-pilot-state", ".forge-review/mercury/amazon-pilot-artifacts.json");
  const retentionState = location("--retention-state", ".forge-review/acquisition/sellers-df003-retention-latest.json");
  const proposalState = location("--sellers-proposal", ".forge-review/acquisition/sellers-enrichment-proposal.json");
  const planPath = location("--plan", ".forge-review/mercury/historical-fact-replay-plan.json");
  const pilotId = String(args.get("--amazon-pilot-id") || "").trim();

  let contextPromise;
  async function context() {
    if (!contextPromise) contextPromise = (async () => {
      const [pilotEnvelope, tasks, evidenceRecords, history, retentionAudit, sellersProposalEnvelope] = await Promise.all([
        readJson(pilotState), taskLedger.getAll(), evidenceRepository.getAll(), historicalRepository.getAll(), readJson(retentionState), readJson(proposalState)
      ]);
      await Promise.all([decisionRepository.getAll(), decisionRepository.getAllRemediations()]);
      let matches = pilotEnvelope.artifacts?.filter(value => value.pilotPreparationId === pilotId) ?? [];
      if (!pilotId) {
        const plan = await readJson(planPath), plannedEvidenceIds = new Set(plan.newFacts?.map(value => value.evidenceId) ?? []), amazonTaskIds = new Set(evidenceRecords.filter(value => plannedEvidenceIds.has(value.evidenceId) && value.candidate?.marketEvidence?.source === "DATAFORSEO_AMAZON").map(value => value.candidate.marketEvidence.provenance.sourceTaskId));
        matches = (pilotEnvelope.artifacts ?? []).filter(value => { const ids = new Set(value.perProductAcceptanceArtifacts?.map(item => item.acceptanceArtifactId) ?? []), sellers = new Set(tasks.filter(task => ids.has(task.checkpointId) && task.kind === "AMAZON_SELLERS").map(task => task.taskId)); return amazonTaskIds.size > 0 && [...amazonTaskIds].every(id => sellers.has(id)); });
      }
      if (matches.length !== 1) throw new Error("AMAZON_PILOT_ARTIFACT_NOT_FOUND_OR_CONFLICTING");
      const pilot = matches[0];
      const childIds = new Set(pilot.perProductAcceptanceArtifacts.map(value => value.acceptanceArtifactId));
      const pilotTasks = tasks.filter(value => childIds.has(value.checkpointId));
      const sellersTaskIds = new Set(pilotTasks.filter(value => value.kind === "AMAZON_SELLERS").map(value => value.taskId));
      return { pilot, childIds, pilotTasks, sellersTaskIds, evidenceRecords, history, retentionAudit, sellersProposalEnvelope };
    })();
    return contextPromise;
  }

  async function amazonChain(record) {
    const state = await context();
    const evidence = record.candidate.marketEvidence;
    const sellersTask = state.pilotTasks.find(value => value.kind === "AMAZON_SELLERS" && value.taskId === evidence.provenance.sourceTaskId);
    if (!sellersTask) throw new Error("HISTORICAL_FACT_REPLAY_AMAZON_TASK_NOT_IN_PILOT");
    const productsTask = state.pilotTasks.find(value => value.kind === "AMAZON_PRODUCTS" && value.checkpointId === sellersTask.checkpointId);
    if (!productsTask) throw new Error("HISTORICAL_FACT_REPLAY_AMAZON_PRODUCTS_LINEAGE_MISSING");
    const result = await resultRepository.findByTask(sellersTask.taskId);
    if (!result || result.canonicalResultId !== evidence.provenance.immutableProviderResultId || result.resultDigest !== evidence.provenance.immutableProviderResultDigest) throw new Error("HISTORICAL_FACT_REPLAY_AMAZON_RESULT_LINEAGE_INVALID");
    return {
      type: "AMAZON_INITIAL_ACQUISITION",
      sourceId: "DATAFORSEO_AMAZON",
      productsTaskId: productsTask.taskId,
      sellersTaskId: sellersTask.taskId,
      governedAsin: evidence.providerIdentity?.asin,
      immutableSellersResultId: result.canonicalResultId,
      immutableSellersResultDigest: result.resultDigest,
      sourceRightsProfileDigest: result.sourceRightsProfileDigest
    };
  }

  const initialAcquisitionCompositionResolver = async ({ record, evidenceRecords }) => {
    if (record.candidate?.marketEvidence?.source !== "DATAFORSEO_GOOGLE_SHOPPING") return null;
    const state = await context();
    return resolveGovernedInitialAcquisitionPromotionContext({ record, evidenceRecords, retentionAudit: state.retentionAudit, sellersProposalEnvelope: state.sellersProposalEnvelope, productRepository });
  };
  const acquisitionChainResolver = async record => {
    if (record.candidate?.marketEvidence?.source === "DATAFORSEO_AMAZON") return amazonChain(record);
    const state = await context();
    const existing = state.history.find(value => value.provenance?.retainedEvidenceId === record.evidenceId);
    if (existing) return existing.provenance.acquisition;
    throw new Error("HISTORICAL_FACT_REPLAY_GOOGLE_ACQUISITION_LINEAGE_MISSING");
  };
  const admissionService = new HistoricalObservationAdmissionService({ evidenceRepository, decisionRepository, productRepository, retailerRepository, historicalRepository, acquisitionChainResolver, initialAcquisitionCompositionResolver });

  async function assessExisting(record, existing) {
    const report = validateHistoricalObservation(existing);
    if (!report.valid) throw new Error("HISTORICAL_FACT_REPLAY_EXISTING_HISTORY_INVALID");
    const product = await productRepository.getById(existing.atlasProductId);
    if (product?.identity?.atlasProductId !== existing.atlasProductId) throw new Error("HISTORICAL_FACT_REPLAY_ATLAS_PRODUCT_MISSING");
    const evidence = record.candidate.marketEvidence;
    const rights = defaultSourceRightsRegistry.require(evidence.source);
    if (requiredRights.some(capability => at(rights, capability) !== "ALLOWED")) throw new Error("HISTORICAL_FACT_REPLAY_RIGHTS_DENIED");
    const factAssessment = assessHistoricalFactEligibility({ record, productProjection: { state: "VERIFIED", atlasProductId: existing.atlasProductId } });
    if (!factAssessment.factLevelHistoricalEligible) throw new Error(`HISTORICAL_ADMISSION_NOT_ELIGIBLE:${factAssessment.reasons[0]}`);
    const comparabilityAssessment = assessHistoricalOfferComparability({ record });
    const expectedObservation = {
      ...structuredClone(existing),
      observationId: existing.observationId,
      atlasProductId: existing.atlasProductId,
      observationTime: evidence.provenance.observedAt,
      market: {
        ...structuredClone(existing.market),
        sourceUrl: evidence.seller?.url ?? existing.market.sourceUrl,
        basePrice: evidence.pricing.basePrice,
        totalPrice: evidence.pricing.totalPrice ?? null,
        shipping: evidence.pricing.shippingPrice,
        tax: evidence.pricing.tax,
        currency: evidence.pricing.currency,
        condition: evidence.offer.condition,
        availability: evidence.offer.availability,
        ...(evidence.offer.delivery ? { delivery: structuredClone(evidence.offer.delivery) } : {})
      },
      provenance: { ...structuredClone(existing.provenance), retainedEvidenceId: record.evidenceId, provider: evidence.provider, source: evidence.source, rawPayloadReference: evidence.provenance.rawPayloadReference }
    };
    const candidateBinding = { evidenceId: record.evidenceId, atlasProductId: existing.atlasProductId, historicalObservationId: existing.observationId, expectedObservationHash: hash(expectedObservation) };
    return {
      schemaVersion: "1.1",
      assessmentId: `mer_histassess_${hash(candidateBinding).slice(0, 24)}`,
      policyVersion: "DF004-E2J-3.0+DF004-E2H-2.0-FACT+MERCURY-HISTORY-018-1.0",
      promotionAssessment: { productIdentity: "VERIFIED", merchantIdentity: existing.retailerId ? "REGISTERED" : record.merchantResolution?.outcome },
      factAssessment,
      comparabilityAssessment,
      candidateBinding,
      expectedObservation,
      factLevelHistoricalEligible: true,
      canonicalEligible: false,
      currentPriceEligible: false,
      cheapestEligible: false,
      pickEligible: false,
      publicationEligible: false
    };
  }

  const assessmentResolver = async record => {
    const state = await context();
    const existing = state.history.find(value => value.provenance?.retainedEvidenceId === record.evidenceId);
    return existing ? assessExisting(record, existing) : admissionService.assess({ evidenceId: record.evidenceId });
  };
  const selectedRecords = async () => {
    const state = await context();
    return state.evidenceRecords.filter(record => record.candidate?.marketEvidence?.source === "DATAFORSEO_GOOGLE_SHOPPING" || (record.candidate?.marketEvidence?.source === "DATAFORSEO_AMAZON" && state.sellersTaskIds.has(record.candidate.marketEvidence.provenance.sourceTaskId)));
  };
  const selectedEvidenceRepository = { getAll: selectedRecords };
  const preparationService = new HistoricalFactReplayPreparationService({ evidenceRepository: selectedEvidenceRepository, historicalRepository, assessmentResolver });
  const authorizationPath = location("--authorization-state", ".forge-review/mercury/historical-fact-replay-authorizations.json");
  const planLoader = async expectedId => { const plan = await readJson(planPath); if (plan.replayPlanId !== expectedId) throw new Error("HISTORICAL_FACT_REPLAY_PLAN_ID_MISMATCH"); return plan; };
  const authorizationRepository = new FileHistoricalFactReplayAuthorizationRepository({ statePath: authorizationPath });
  const executionLock = new FileSingleWriterRunLock({ lockPath: `${authorizationPath}.execute.lock` });
  const boundAssessmentResolver = async ({ evidenceId }) => { const record = await evidenceRepository.getById(evidenceId); if (!record) throw new Error(`HISTORICAL_FACT_REPLAY_EVIDENCE_NOT_FOUND:${evidenceId}`); return assessmentResolver(record); };
  return { location, readJson, evidenceRepository, historicalRepository, decisionRepository, preparationService, selectedRecords, assessmentResolver: boundAssessmentResolver, admissionService, planLoader, authorizationRepository, executionLock };
}
