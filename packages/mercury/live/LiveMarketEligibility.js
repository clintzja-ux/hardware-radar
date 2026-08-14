import { evaluatePublicationEligibility } from "../publication/PublicationEligibility.js";
import { evaluateSourceRight } from "../rights/SourceRightsEvaluator.js";
import defaultLiveMarketPolicy from "./LiveMarketPolicy.js";

export function evaluateLiveMarketEligibility(observation, {
  product,
  retailer,
  freshness,
  confidence,
  storage = null,
  evaluatedAt = null,
  policy = defaultLiveMarketPolicy
} = {}) {
  const reasons = [];

  const requiredRights = policy.requiredRights ?? defaultLiveMarketPolicy.requiredRights;
  for (const capability of requiredRights) {
    const right = evaluateSourceRight(observation, capability);
    if (!right.allowed) reasons.push(right.reason ?? `SOURCE_RIGHT_NOT_ALLOWED:${capability}`);
  }

  const technical = evaluatePublicationEligibility(observation, {
    product,
    retailer,
    freshness,
    confidence,
    storage,
    evaluatedAt,
    policy,
    enforceSourceRights: false
  });
  reasons.push(...technical.reasons);

  const uniqueReasons = Object.freeze([...new Set(reasons)]);
  return Object.freeze({
    eligible: uniqueReasons.length === 0,
    reasons: uniqueReasons,
    policy: Object.freeze({ policyId: policy.policyId, version: policy.version })
  });
}

export default evaluateLiveMarketEligibility;
