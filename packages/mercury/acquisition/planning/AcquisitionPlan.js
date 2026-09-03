import crypto from "node:crypto";
import { ACQUISITION_PRIORITIES } from "./AcquisitionBudgetPolicy.js";

export const ACQUISITION_PLAN_DECISIONS = Object.freeze({ APPROVED: "APPROVED", SKIPPED: "SKIPPED" });
export const ACQUISITION_SKIP_REASONS = Object.freeze({ DISABLED: "DISABLED", PAUSED: "PAUSED", COOLDOWN: "COOLDOWN", TASK_LIMIT: "TASK_LIMIT", RUN_BUDGET: "RUN_BUDGET", DAILY_BUDGET: "DAILY_BUDGET" });
const priorityRank = { HIGH: 0, NORMAL: 1, LOW: 2, PAUSED: 3 };
function validIso(value) { return typeof value === "string" && Number.isFinite(Date.parse(value)); }
function freeze(value) { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; }
function clone(value) { return structuredClone(value); }
function money(value) { return Math.round((value + Number.EPSILON) * 1e9) / 1e9; }
function stableId(input) { return `acqplan_${crypto.createHash("sha256").update(JSON.stringify(input)).digest("hex").slice(0,24)}`; }

export function createAcquisitionPlan({ candidates = [], policy, spentTodayUsd = 0, plannedAt = new Date().toISOString() } = {}) {
  if (!policy) throw new TypeError("policy is required.");
  if (!Array.isArray(candidates)) throw new TypeError("candidates must be an array.");
  if (!validIso(plannedAt)) throw new TypeError("plannedAt must be a valid ISO timestamp.");
  if (!Number.isFinite(spentTodayUsd) || spentTodayUsd < 0) throw new TypeError("spentTodayUsd must be non-negative.");

  const normalized = candidates.map((candidate, index) => {
    if (!candidate || typeof candidate !== "object") throw new TypeError(`candidate ${index} must be an object.`);
    if (!candidate.candidateId) throw new TypeError(`candidate ${index} candidateId is required.`);
    const priority = candidate.priority ?? ACQUISITION_PRIORITIES.NORMAL;
    if (!(priority in priorityRank)) throw new TypeError(`candidate ${candidate.candidateId} has invalid priority.`);
    const estimatedCostUsd = Number(candidate.estimatedCostUsd);
    if (!Number.isFinite(estimatedCostUsd) || estimatedCostUsd < 0) throw new TypeError(`candidate ${candidate.candidateId} estimatedCostUsd must be non-negative.`);
    const cooldownMs = candidate.refreshCooldownMs ?? policy.defaultRefreshCooldownMs;
    if (!Number.isInteger(cooldownMs) || cooldownMs <= 0) throw new TypeError(`candidate ${candidate.candidateId} refreshCooldownMs must be positive.`);
    if (candidate.lastObservedAt != null && !validIso(candidate.lastObservedAt)) throw new TypeError(`candidate ${candidate.candidateId} lastObservedAt must be ISO or null.`);
    return { ...clone(candidate), priority, estimatedCostUsd, refreshCooldownMs: cooldownMs, _index: index };
  }).sort((a,b) => priorityRank[a.priority]-priorityRank[b.priority] || a._index-b._index);

  let approvedTasks = 0, approvedSpend = 0;
  const decisions = [];
  for (const candidate of normalized) {
    let reason = null;
    if (!policy.enabled) reason = ACQUISITION_SKIP_REASONS.DISABLED;
    else if (candidate.priority === ACQUISITION_PRIORITIES.PAUSED) reason = ACQUISITION_SKIP_REASONS.PAUSED;
    else if (candidate.lastObservedAt && Date.parse(plannedAt)-Date.parse(candidate.lastObservedAt) < candidate.refreshCooldownMs) reason = ACQUISITION_SKIP_REASONS.COOLDOWN;
    else if (approvedTasks >= policy.maxPaidTasksPerRun) reason = ACQUISITION_SKIP_REASONS.TASK_LIMIT;
    else if (money(approvedSpend + candidate.estimatedCostUsd) > policy.maxSpendPerRunUsd) reason = ACQUISITION_SKIP_REASONS.RUN_BUDGET;
    else if (money(spentTodayUsd + approvedSpend + candidate.estimatedCostUsd) > policy.maxSpendPerDayUsd) reason = ACQUISITION_SKIP_REASONS.DAILY_BUDGET;

    const approved = reason == null;
    if (approved) { approvedTasks += 1; approvedSpend = money(approvedSpend + candidate.estimatedCostUsd); }
    decisions.push({ candidateId: candidate.candidateId, priority: candidate.priority, estimatedCostUsd: candidate.estimatedCostUsd, decision: approved ? ACQUISITION_PLAN_DECISIONS.APPROVED : ACQUISITION_PLAN_DECISIONS.SKIPPED, reason, rationale: candidate.rationale ?? null, execution: candidate.execution == null ? null : clone(candidate.execution) });
  }
  const body = { schemaVersion:"1.0", plannedAt, policy:clone(policy), spentTodayUsd:money(spentTodayUsd), approvedTaskCount:approvedTasks, estimatedApprovedSpendUsd:approvedSpend, decisions };
  return freeze({ planId: stableId(body), ...body });
}
