export const ACQUISITION_PRIORITIES = Object.freeze({ HIGH: "HIGH", NORMAL: "NORMAL", LOW: "LOW", PAUSED: "PAUSED" });

function finiteNonNegative(value, field) {
  if (!Number.isFinite(value) || value < 0) throw new TypeError(`${field} must be a finite non-negative number.`);
  return value;
}
function positiveInteger(value, field) {
  if (!Number.isInteger(value) || value <= 0) throw new TypeError(`${field} must be a positive integer.`);
  return value;
}

export function createAcquisitionBudgetPolicy({
  enabled = false,
  maxPaidTasksPerRun = 1,
  maxSpendPerRunUsd = 0.001,
  maxSpendPerDayUsd = 0.01,
  automaticPaidRetries = 0,
  defaultRefreshCooldownMs = 6 * 60 * 60 * 1000
} = {}) {
  if (typeof enabled !== "boolean") throw new TypeError("enabled must be boolean.");
  positiveInteger(maxPaidTasksPerRun, "maxPaidTasksPerRun");
  finiteNonNegative(maxSpendPerRunUsd, "maxSpendPerRunUsd");
  finiteNonNegative(maxSpendPerDayUsd, "maxSpendPerDayUsd");
  if (automaticPaidRetries !== 0) throw new Error("AUTOMATIC_PAID_RETRIES_MUST_BE_ZERO");
  positiveInteger(defaultRefreshCooldownMs, "defaultRefreshCooldownMs");
  return Object.freeze({
    schemaVersion: "1.0",
    enabled,
    maxPaidTasksPerRun,
    maxSpendPerRunUsd,
    maxSpendPerDayUsd,
    automaticPaidRetries,
    defaultRefreshCooldownMs
  });
}
