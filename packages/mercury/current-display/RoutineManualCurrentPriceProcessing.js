import { deriveCurrentDisplayComparison } from "./CurrentDisplaySnapshot.js";
import { validateManualSnapshotPreparation, MANUAL_SNAPSHOT_AUTHORIZE_CONFIRMATION, MANUAL_SNAPSHOT_EXECUTE_CONFIRMATION } from "./ManualCurrentPriceSnapshotExecution.js";

export const ROUTINE_MANUAL_PROCESSING_POLICY_VERSION = "ROUTINE-MANUAL-OBSERVATION-PROGRESSION-P1-1.0";
const freeze = value => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; };
const submitted = preparation => preparation?.binding?.operatorEvidence?.submittedForProcessing === true || (
  preparation?.binding?.operatorEvidence?.submittedForProcessing === undefined && preparation?.binding?.operatorEvidence?.acquisitionMode === "MANUAL" &&
  preparation?.binding?.evidenceReference?.startsWith("manual-workbook:")
);
const reason = error => String(error?.message ?? error).split(":")[0];

export class RoutineManualCurrentPriceProcessingService {
  constructor({ preparationRepository, snapshotExecutionService, executionRepository, snapshotRepository, historyService, productResolver, retailerResolver, destinationResolver, now = () => new Date().toISOString() } = {}) {
    if (!preparationRepository?.getById || !snapshotExecutionService?.previewAuthorization || !snapshotExecutionService?.authorize || !snapshotExecutionService?.execute || !executionRepository?.getExecutionByPreparation || !snapshotRepository?.getState || !historyService?.assess || !historyService?.admit || !productResolver || !retailerResolver || !destinationResolver) throw new TypeError("ROUTINE_MANUAL_PROCESSING_DEPENDENCY_REQUIRED");
    Object.assign(this, { preparationRepository, snapshotExecutionService, executionRepository, snapshotRepository, historyService, productResolver, retailerResolver, destinationResolver, now });
  }

  async assess({ preparationId, asOf = this.now() } = {}) {
    let preparation;
    try { preparation = validateManualSnapshotPreparation(await this.preparationRepository.getById(preparationId)); }
    catch (error) { return freeze({ preparationId, classification: "REVIEW_REQUIRED", current: { state: "REVIEW_REQUIRED", reasons: [reason(error)] }, history: { state: "REVIEW_REQUIRED", reasons: [reason(error)] } }); }
    const b = preparation.binding, baseReasons = [];
    if (!submitted(preparation) || !b.observedBy?.trim()) baseReasons.push("MANUAL_OBSERVATION_NOT_SUBMITTED_REVIEWED");
    const [product, retailer, destination] = await Promise.all([this.productResolver(b.atlasProductId), this.retailerResolver(b.retailerId), this.destinationResolver(b.destinationId)]);
    const historyAssessment = this.historyService.assess({ preparation, product, retailer, destination });
    let preview = null, currentReasons = [...baseReasons], currentState = "ROUTINE_READY";
    try {
      preview = await this.snapshotExecutionService.previewAuthorization({ preparationId, asOf });
      const predecessorSource = preview.predecessor.offer?.sourceIdentity?.sourceId ?? null;
      if (predecessorSource && predecessorSource !== b.sourceId) currentReasons.push("CURRENT_SOURCE_CONFLICT_REVIEW_REQUIRED");
      if (b.itemPriceEligible !== true) currentReasons.push(...(b.comparisonReasons?.length ? b.comparisonReasons : ["CURRENT_ITEM_PRICE_NOT_ELIGIBLE"]));
    } catch (error) {
      const code = reason(error);
      if (code === "OBSERVATION_STALE_AT_EXECUTION") currentState = "STALE_FOR_CURRENT";
      else currentReasons.push(code);
    }
    if (currentReasons.length) currentState = "REVIEW_REQUIRED";
    const historyState = baseReasons.length || !historyAssessment.eligible ? "REVIEW_REQUIRED" : "ROUTINE_READY";
    const classification = currentState === "ROUTINE_READY" && historyState === "ROUTINE_READY" ? "ROUTINE_READY"
      : currentState === "STALE_FOR_CURRENT" && historyState === "ROUTINE_READY" ? "STALE_FOR_CURRENT_BUT_HISTORY_ELIGIBLE"
      : "REVIEW_REQUIRED";
    return freeze({ policyVersion: ROUTINE_MANUAL_PROCESSING_POLICY_VERSION, preparationId, preparation, classification, current: { state: currentState, reasons: [...new Set(currentReasons)], predecessor: preview?.predecessor ?? null }, history: { state: historyState, reasons: [...new Set([...baseReasons, ...historyAssessment.reasons])], assessment: historyAssessment }, context: { product, retailer, destination } });
  }

  async processOne({ preparationId, processedAt = this.now(), processedBy = "ROUTINE_MANUAL_PROCESSOR" } = {}) {
    const assessment = await this.assess({ preparationId, asOf: processedAt });
    const identity = { atlasProductId: assessment.preparation?.binding?.atlasProductId ?? null, retailer: assessment.preparation?.binding?.retailer ?? null };
    if (assessment.classification === "REVIEW_REQUIRED" && assessment.history.state !== "ROUTINE_READY") return freeze({ preparationId, ...identity, status: "REVIEW_REQUIRED", current: { status: "NOT_PROCESSED", reasons: assessment.current.reasons }, history: { status: "NOT_PROCESSED", reasons: assessment.history.reasons }, exceptions: [...new Set([...assessment.current.reasons, ...assessment.history.reasons])], nextOperatorAction: "REVIEW_EXCEPTION" });
    const preparation = assessment.preparation;
    let current = { status: assessment.current.state === "STALE_FOR_CURRENT" ? "STALE_NOT_CURRENT" : assessment.current.state === "REVIEW_REQUIRED" ? "REVIEW_REQUIRED" : "NOT_PROCESSED", reasons: assessment.current.reasons };
    if (assessment.current.state === "ROUTINE_READY") {
      const prior = await this.executionRepository.getExecutionByPreparation(preparationId);
      if (prior) current = { status: "ALREADY_PROCESSED", executionId: prior.executionId, snapshotId: prior.resultSnapshotId };
      else {
        const authorization = await this.snapshotExecutionService.authorize({ preparationId, authorizedBy: "ROUTINE_MANUAL_PROCESSOR", reason: "Ready + reviewed deterministic routine progression", confirmation: MANUAL_SNAPSHOT_AUTHORIZE_CONFIRMATION, createdAt: processedAt });
        const executed = await this.snapshotExecutionService.execute({ authorizationId: authorization.authorization.authorizationId, executedBy: processedBy, confirmation: MANUAL_SNAPSHOT_EXECUTE_CONFIRMATION, executedAt: processedAt });
        current = { status: executed.status === "ALREADY_EXECUTED" ? "ALREADY_PROCESSED" : "UPDATED", authorizationId: authorization.authorization.authorizationId, executionId: executed.execution.executionId, snapshotId: executed.execution.resultSnapshotId };
      }
    }
    let history;
    if (assessment.history.state === "ROUTINE_READY") {
      const result = await this.historyService.admit({ preparation, ...assessment.context, admittedAt: processedAt, admittedBy: processedBy });
      history = { status: result.status === "DUPLICATE" ? "ALREADY_RETAINED" : "RETAINED", observationId: result.observationId };
    } else history = { status: "NOT_RETAINED", reasons: assessment.history.reasons };
    const snapshot = (await this.snapshotRepository.getState()).current;
    const offers = snapshot?.offers?.filter(value => value.atlasProductId === preparation.binding.atlasProductId && value.comparisonEligible) ?? [];
    const comparison = offers.length >= 2 ? deriveCurrentDisplayComparison(snapshot, preparation.binding.atlasProductId) : { status: offers.length === 1 ? "SINGLE_RETAILER_CURRENT" : "UNAVAILABLE", cheapest: null, offers };
    const status = current.status === "STALE_NOT_CURRENT" ? "HISTORY_RETAINED_CURRENT_STALE" : current.status === "REVIEW_REQUIRED" ? "HISTORY_RETAINED_CURRENT_REVIEW_REQUIRED" : current.status === "ALREADY_PROCESSED" && history.status === "ALREADY_RETAINED" ? "ALREADY_PROCESSED" : "ROUTINE_PROGRESSED";
    return freeze({ preparationId, ...identity, status, current, history, comparison: { status: comparison.status, retailer: comparison.cheapest?.retailer ?? null, itemPriceUsd: comparison.cheapest?.priceUsd ?? null, offerCount: comparison.offers.length }, exceptions: current.status === "REVIEW_REQUIRED" ? assessment.current.reasons : [], nextOperatorAction: current.status === "REVIEW_REQUIRED" ? "REVIEW_CURRENT_SOURCE_EXCEPTION" : "NONE" });
  }

  async processCohort({ preparationIds, processedAt = this.now(), processedBy = "ROUTINE_MANUAL_PROCESSOR" } = {}) {
    if (!Array.isArray(preparationIds) || !preparationIds.length) throw new Error("ROUTINE_MANUAL_COHORT_REQUIRED");
    const results = [];
    for (const preparationId of [...new Set(preparationIds)]) {
      try { results.push(await this.processOne({ preparationId, processedAt, processedBy })); }
      catch (error) { results.push(freeze({ preparationId, atlasProductId: null, retailer: null, status: "FAILED_SAFE", current: { status: "NOT_PROCESSED" }, history: { status: "NOT_PROCESSED" }, exceptions: [reason(error)], nextOperatorAction: "INSPECT_FAILED_MEMBER" })); }
    }
    return freeze({ attempted: results.length, routineProgressed: results.filter(value => ["ROUTINE_PROGRESSED", "HISTORY_RETAINED_CURRENT_STALE", "HISTORY_RETAINED_CURRENT_REVIEW_REQUIRED"].includes(value.status)).length, alreadyProcessed: results.filter(value => value.status === "ALREADY_PROCESSED").length, reviewRequired: results.filter(value => value.status === "REVIEW_REQUIRED" || value.status === "HISTORY_RETAINED_CURRENT_REVIEW_REQUIRED").length, incomplete: results.filter(value => value.exceptions.includes("MANUAL_OBSERVATION_NOT_SUBMITTED_REVIEWED")).length, failedSafe: results.filter(value => value.status === "FAILED_SAFE").length, currentUpdated: results.filter(value => value.current.status === "UPDATED").length, historyRetained: results.filter(value => value.history.status === "RETAINED").length, comparisonsAvailable: results.filter(value => value.comparison?.status === "AVAILABLE").length, results });
  }
}
