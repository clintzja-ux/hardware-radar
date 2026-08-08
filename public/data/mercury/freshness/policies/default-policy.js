import { createFreshnessPolicy } from "../../FreshnessPolicy.js";

const MINUTE_MS = 60 * 1000;

// Development/default policy for proving the M004 mechanism.
// Retailer- or compliance-specific production thresholds are intentionally deferred.
export const defaultFreshnessPolicy = createFreshnessPolicy({
    policyId: "mer_freshness_default",
    version: "1.0.0",
    currentUntilMs: 30 * MINUTE_MS,
    staleAfterMs: 120 * MINUTE_MS,
    description: "Default Mercury development freshness policy."
});

export default defaultFreshnessPolicy;
