export const LIVE_MARKET_POLICY_SCHEMA_VERSION = "1.0";

export function createLiveMarketPolicy({
  policyId = "hardware-radar-live-market",
  version = "1.0.0",
  requiredRights = ["live.currentObservation", "live.comparison", "live.publicDisplay"],
  allowedFreshnessStatuses = ["CURRENT"],
  allowedConfidenceStatuses = ["HIGH"],
  allowedAvailabilityStatuses = ["IN_STOCK"],
  allowedConditions = ["NEW"]
} = {}) {
  return Object.freeze({
    schemaVersion: LIVE_MARKET_POLICY_SCHEMA_VERSION,
    policyId,
    version,
    requiredRights: Object.freeze([...requiredRights]),
    allowedFreshnessStatuses: Object.freeze([...allowedFreshnessStatuses]),
    allowedConfidenceStatuses: Object.freeze([...allowedConfidenceStatuses]),
    allowedAvailabilityStatuses: Object.freeze([...allowedAvailabilityStatuses]),
    allowedConditions: Object.freeze([...allowedConditions])
  });
}

export default createLiveMarketPolicy();
