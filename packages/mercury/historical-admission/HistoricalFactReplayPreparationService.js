import crypto from "node:crypto";

export const HISTORICAL_FACT_REPLAY_POLICY_VERSION = "MERCURY-HISTORY-058-REPLAY-1.0";

const stable = value => {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
};
const hash = value => crypto.createHash("sha256").update(stable(value)).digest("hex");
const freeze = value => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) freeze(child);
  }
  return value;
};
const nonBlank = value => typeof value === "string" && value.trim() !== "";
const sourceOf = record => record?.candidate?.marketEvidence?.source;
const evidenceOf = record => record?.candidate?.marketEvidence;

export function validateHistoricalFactReplayPlan(plan) {
  const errors = [];
  if (plan?.schemaVersion !== "1.0" || plan?.preparationType !== "HISTORICAL_FACT_REPLAY" || plan?.policyVersion !== HISTORICAL_FACT_REPLAY_POLICY_VERSION || plan?.factPolicyVersion !== "DF004-E2H-2.0-FACT") errors.push("HISTORICAL_FACT_REPLAY_SCHEMA_INVALID");
  if (!nonBlank(plan?.asOf) || !Number.isFinite(Date.parse(plan.asOf)) || plan.preparedAt !== plan.asOf) errors.push("HISTORICAL_FACT_REPLAY_TIME_INVALID");
  if (!Array.isArray(plan?.sourceCohorts) || !Array.isArray(plan?.inventory) || !Array.isArray(plan?.newFacts) || !plan?.counts || !plan?.authority) errors.push("HISTORICAL_FACT_REPLAY_CONTENT_INVALID");
  else {
    const inventoryIds=plan.inventory.map(value=>value?.evidenceId),newIds=plan.newFacts.map(value=>value?.evidenceId),expectedNew=plan.inventory.filter(value=>value?.classification==="NEW_FACT");
    if(new Set(inventoryIds).size!==inventoryIds.length||new Set(newIds).size!==newIds.length||expectedNew.length!==plan.newFacts.length||plan.counts.newFacts!==plan.newFacts.length||plan.counts.retained!==plan.inventory.length)errors.push("HISTORICAL_FACT_REPLAY_MEMBERSHIP_INVALID");
    for(const bound of plan.newFacts){const entry=plan.inventory.find(value=>value.evidenceId===bound.evidenceId);if(!entry||entry.expectedHistoricalObservationId!==bound.expectedHistoricalObservationId||entry.expectedObservationHash!==bound.expectedObservationHash||entry.candidateBindingDigest!==bound.candidateBindingDigest||entry.atlasProductId!==bound.atlasProductId||entry.source!==bound.source)errors.push("HISTORICAL_FACT_REPLAY_MEMBERSHIP_INVALID");}
  }
  const { replayPlanId, bindingDigest, ...material } = plan ?? {};
  const expected = hash(material);
  if (bindingDigest !== expected || replayPlanId !== `mer_histfactreplay_${expected.slice(0, 24)}`) errors.push("HISTORICAL_FACT_REPLAY_BINDING_INVALID");
  if (plan?.authority?.authorizationState !== "NOT_AUTHORIZED" || plan?.authority?.executionAuthorized !== false || plan?.authority?.historicalAdmissionPerformed !== false || plan?.authority?.providerCallsRequired !== 0 || plan?.authority?.paidTasksRequired !== 0 || plan?.authority?.providerSpendUsd !== 0) errors.push("HISTORICAL_FACT_REPLAY_AUTHORITY_INVALID");
  return freeze({ valid: errors.length === 0, errors });
}

function inventory(record, assessment, classification, reason = null, existingObservationId = null) {
  const evidence = evidenceOf(record);
  return {
    evidenceId: record.evidenceId,
    atlasProductId: assessment?.candidateBinding?.atlasProductId ?? record?.candidate?.identity?.atlasProductId ?? null,
    source: sourceOf(record),
    observationTime: evidence?.provenance?.observedAt ?? null,
    observedSeller: evidence?.seller?.name ?? null,
    itemPrice: evidence?.pricing?.basePrice ?? null,
    currency: evidence?.pricing?.currency ?? null,
    condition: evidence?.offer?.condition ?? null,
    shipping: evidence?.pricing?.shippingPrice ?? null,
    productResolutionState: assessment?.promotionAssessment?.productIdentity ?? record?.candidate?.identity?.outcome ?? null,
    merchantResolutionState: assessment?.promotionAssessment?.merchantIdentity ?? record?.merchantResolution?.outcome ?? null,
    comparabilityClassification: assessment?.comparabilityAssessment?.classification ?? null,
    factLevelEligible: Boolean(assessment?.factLevelHistoricalEligible),
    classification,
    reason,
    existingHistoricalObservationId: existingObservationId,
    expectedHistoricalObservationId: assessment?.candidateBinding?.historicalObservationId ?? null,
    assessmentId: assessment?.assessmentId ?? null,
    expectedObservationHash: assessment?.candidateBinding?.expectedObservationHash ?? null,
    candidateBindingDigest: assessment?.candidateBinding ? hash(assessment.candidateBinding) : null
  };
}

function existingMaterialMatches(existing, expected) {
  return existing?.observationId === expected?.observationId &&
    existing?.atlasProductId === expected?.atlasProductId &&
    existing?.observationTime === expected?.observationTime &&
    existing?.provenance?.retainedEvidenceId === expected?.provenance?.retainedEvidenceId &&
    existing?.provenance?.provider === expected?.provenance?.provider &&
    existing?.provenance?.source === expected?.provenance?.source &&
    existing?.provenance?.rawPayloadReference === expected?.provenance?.rawPayloadReference &&
    stable(existing?.market) === stable(expected?.market);
}

export class HistoricalFactReplayPreparationService {
  constructor({ evidenceRepository, historicalRepository, assessmentResolver } = {}) {
    if (!evidenceRepository?.getAll) throw new TypeError("evidenceRepository is required.");
    if (!historicalRepository?.getAll) throw new TypeError("historicalRepository is required.");
    if (typeof assessmentResolver !== "function") throw new TypeError("assessmentResolver is required.");
    Object.assign(this, { evidenceRepository, historicalRepository, assessmentResolver });
  }

  async prepare({ asOf, evidenceFilter = () => true } = {}) {
    if (!nonBlank(asOf) || !Number.isFinite(Date.parse(asOf))) throw new TypeError("HISTORICAL_FACT_REPLAY_AS_OF_INVALID");
    if (typeof evidenceFilter !== "function") throw new TypeError("HISTORICAL_FACT_REPLAY_FILTER_INVALID");
    const records = (await this.evidenceRepository.getAll()).filter(evidenceFilter).sort((a, b) => a.evidenceId.localeCompare(b.evidenceId));
    const historical = await this.historicalRepository.getAll();
    const byEvidence = new Map();
    for (const observation of historical) {
      const evidenceId = observation?.provenance?.retainedEvidenceId;
      if (!nonBlank(evidenceId) || byEvidence.has(evidenceId)) throw new Error("HISTORICAL_FACT_REPLAY_EXISTING_HISTORY_CONFLICT");
      byEvidence.set(evidenceId, observation);
    }
    const entries = [];
    for (const record of records) {
      try {
        const assessment = await this.assessmentResolver(record);
        if (assessment?.factLevelHistoricalEligible !== true) throw new Error(`HISTORICAL_FACT_REPLAY_ASSESSMENT_INELIGIBLE:${assessment?.factAssessment?.reasons?.[0] ?? "UNKNOWN"}`);
        if (assessment.canonicalEligible !== false || assessment.currentPriceEligible !== false || assessment.cheapestEligible !== false || assessment.pickEligible !== false || assessment.publicationEligible !== false) throw new Error("HISTORICAL_FACT_REPLAY_DOWNSTREAM_AUTHORITY_INVALID");
        const existing = byEvidence.get(record.evidenceId) ?? null;
        if (existing && !existingMaterialMatches(existing, assessment.expectedObservation)) {
          entries.push(inventory(record, assessment, "CONFLICT", "HISTORICAL_FACT_REPLAY_EXISTING_MATERIAL_CONFLICT", existing.observationId));
        } else {
          entries.push(inventory(record, assessment, existing ? "DUPLICATE_EXISTING_FACT" : "NEW_FACT", null, existing?.observationId ?? null));
        }
      } catch (error) {
        entries.push(inventory(record, null, "FACT_INELIGIBLE", String(error?.message ?? error)));
      }
    }
    if (entries.some(entry => entry.classification === "CONFLICT")) throw new Error(`HISTORICAL_FACT_REPLAY_CONFLICT:${entries.filter(entry => entry.classification === "CONFLICT").map(entry => entry.evidenceId).join(",")}`);
    const sources = [...new Set(entries.map(entry => entry.source))].sort().map(sourceId => {
      const values = entries.filter(entry => entry.source === sourceId);
      return {
        sourceId,
        retainedCount: values.length,
        factEligibleCount: values.filter(entry => entry.factLevelEligible).length,
        newFactCount: values.filter(entry => entry.classification === "NEW_FACT").length,
        duplicateCount: values.filter(entry => entry.classification === "DUPLICATE_EXISTING_FACT").length,
        blockedCount: values.filter(entry => entry.classification === "FACT_INELIGIBLE").length
      };
    });
    const material = {
      schemaVersion: "1.0",
      preparationType: "HISTORICAL_FACT_REPLAY",
      policyVersion: HISTORICAL_FACT_REPLAY_POLICY_VERSION,
      factPolicyVersion: "DF004-E2H-2.0-FACT",
      asOf,
      preparedAt: asOf,
      sourceCohorts: sources,
      inventory: entries,
      newFacts: entries.filter(entry => entry.classification === "NEW_FACT").map(entry => ({
        evidenceId: entry.evidenceId,
        expectedHistoricalObservationId: entry.expectedHistoricalObservationId,
        expectedObservationHash: entry.expectedObservationHash,
        candidateBindingDigest: entry.candidateBindingDigest,
        atlasProductId: entry.atlasProductId,
        source: entry.source
      })),
      counts: {
        retained: entries.length,
        factEligible: entries.filter(entry => entry.factLevelEligible).length,
        newFacts: entries.filter(entry => entry.classification === "NEW_FACT").length,
        duplicates: entries.filter(entry => entry.classification === "DUPLICATE_EXISTING_FACT").length,
        blocked: entries.filter(entry => entry.classification === "FACT_INELIGIBLE").length,
        conflicts: 0
      },
      authority: {
        authorizationState: "NOT_AUTHORIZED",
        executionAuthorized: false,
        providerCallsRequired: 0,
        paidTasksRequired: 0,
        providerSpendUsd: 0,
        historicalAdmissionPerformed: false,
        canonicalEligible: false,
        currentPriceEligible: false,
        cheapestEligible: false,
        pickEligible: false,
        publicationEligible: false
      }
    };
    const bindingDigest = hash(material);
    const plan = { ...material, replayPlanId: `mer_histfactreplay_${bindingDigest.slice(0, 24)}`, bindingDigest };
    const report = validateHistoricalFactReplayPlan(plan);
    if (!report.valid) throw new Error(`HISTORICAL_FACT_REPLAY_PLAN_INVALID:${report.errors.join(",")}`);
    return freeze(plan);
  }
}

export default HistoricalFactReplayPreparationService;
