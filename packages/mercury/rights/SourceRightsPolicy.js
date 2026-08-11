export const RIGHTS_STATES = Object.freeze({
  ALLOWED: "ALLOWED",
  BLOCKED: "BLOCKED",
  CONDITIONAL: "CONDITIONAL",
  CLARIFICATION_REQUIRED: "CLARIFICATION_REQUIRED",
  NOT_APPLICABLE: "NOT_APPLICABLE"
});

export const SOURCE_RIGHTS_SCHEMA_VERSION = "1.0";

export const SOURCE_RIGHTS_CAPABILITIES = Object.freeze({
  ACQUIRE_API: "acquisition.api",
  ACQUIRE_MANUAL: "acquisition.manual",
  ACQUIRE_IMPORT: "acquisition.import",
  LIVE_OBSERVATION: "live.currentObservation",
  PUBLIC_DISPLAY: "live.publicDisplay",
  COMPARISON: "live.comparison",
  HISTORICAL_RETENTION: "retention.historical",
  DERIVED_ANALYTICS: "derivation.analytics",
  HISTORICAL_ANALYTICS: "derivation.historicalAnalytics"
});

export function isExplicitlyAllowed(state) { return state === RIGHTS_STATES.ALLOWED; }
export function isUnresolvedRight(state) { return state === RIGHTS_STATES.CONDITIONAL || state === RIGHTS_STATES.CLARIFICATION_REQUIRED; }
