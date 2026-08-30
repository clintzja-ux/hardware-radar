import { createFreshnessPolicy } from "../FreshnessPolicy.js";
import { validateFreshnessPolicy } from "../FreshnessValidator.js";

export const PRODUCTION_FRESHNESS_POLICY_SCHEMA_VERSION = "1.0";
export const PRODUCTION_FRESHNESS_RESOLUTION = Object.freeze({ RESOLVED: "RESOLVED", MISSING: "MISSING", AMBIGUOUS: "AMBIGUOUS", SCOPE_MISMATCH: "SCOPE_MISMATCH", MALFORMED: "MALFORMED", UNSUPPORTED: "UNSUPPORTED" });
const freeze = value => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; };
const nonBlank = value => typeof value === "string" && value.trim() !== "";

export function createProductionFreshnessPolicy({ policyId, version, sourceId, retailerId, atlasProductIds = null, currentUntilMs, staleAfterMs, approvedForProduction = true } = {}) {
    const value = { schemaVersion: PRODUCTION_FRESHNESS_POLICY_SCHEMA_VERSION, policyType: "CURRENT_MARKET_PRODUCTION_FRESHNESS", policyId, version, sourceId, retailerId, atlasProductIds: atlasProductIds === null ? null : [...atlasProductIds], approvedForProduction, freshnessPolicy: createFreshnessPolicy({ policyId, version, currentUntilMs, staleAfterMs, description: "Explicit production current-market freshness policy." }) };
    const report = validateProductionFreshnessPolicy(value);
    if (!report.valid) throw new TypeError(report.reasons.join(","));
    return freeze(value);
}

export function validateProductionFreshnessPolicy(value) {
    const reasons = [];
    if (!value || typeof value !== "object" || Array.isArray(value)) return freeze({ valid: false, reasons: ["PRODUCTION_FRESHNESS_POLICY_MALFORMED"] });
    if (value.schemaVersion !== PRODUCTION_FRESHNESS_POLICY_SCHEMA_VERSION) reasons.push("PRODUCTION_FRESHNESS_POLICY_UNSUPPORTED");
    if (value.policyType !== "CURRENT_MARKET_PRODUCTION_FRESHNESS" || !nonBlank(value.policyId) || !/^\d+\.\d+\.\d+$/.test(value.version ?? "") || !nonBlank(value.sourceId) || !/^RETAILER-\d{4}$/.test(value.retailerId ?? "") || value.approvedForProduction !== true) reasons.push("PRODUCTION_FRESHNESS_POLICY_MALFORMED");
    if (value.atlasProductIds !== null && (!Array.isArray(value.atlasProductIds) || value.atlasProductIds.length === 0 || value.atlasProductIds.some(item => !nonBlank(item)))) reasons.push("PRODUCTION_FRESHNESS_POLICY_MALFORMED");
    if (!validateFreshnessPolicy(value.freshnessPolicy).valid || value.freshnessPolicy?.policyId !== value.policyId || value.freshnessPolicy?.version !== value.version) reasons.push("PRODUCTION_FRESHNESS_POLICY_MALFORMED");
    return freeze({ valid: reasons.length === 0, reasons: [...new Set(reasons)] });
}

export class ProductionFreshnessPolicyRepository {
    constructor({ policies = [] } = {}) { this.policies = structuredClone(policies); }
    resolve({ sourceId, retailerId, atlasProductId } = {}) {
        if (![sourceId, retailerId, atlasProductId].every(nonBlank)) return freeze({ status: PRODUCTION_FRESHNESS_RESOLUTION.SCOPE_MISMATCH, policy: null, reasons: ["PRODUCTION_FRESHNESS_POLICY_SCOPE_MISMATCH"] });
        const reports = this.policies.map(validateProductionFreshnessPolicy);
        if (reports.some(report => report.reasons.includes("PRODUCTION_FRESHNESS_POLICY_UNSUPPORTED"))) return freeze({ status: PRODUCTION_FRESHNESS_RESOLUTION.UNSUPPORTED, policy: null, reasons: ["PRODUCTION_FRESHNESS_POLICY_UNSUPPORTED"] });
        if (reports.some(report => !report.valid)) return freeze({ status: PRODUCTION_FRESHNESS_RESOLUTION.MALFORMED, policy: null, reasons: ["PRODUCTION_FRESHNESS_POLICY_MALFORMED"] });
        if (this.policies.length === 0) return freeze({ status: PRODUCTION_FRESHNESS_RESOLUTION.MISSING, policy: null, reasons: ["PRODUCTION_FRESHNESS_POLICY_MISSING"] });
        const sourcePolicies = this.policies.filter(policy => policy.sourceId === sourceId);
        const matches = sourcePolicies.filter(policy => policy.retailerId === retailerId && (policy.atlasProductIds === null || policy.atlasProductIds.includes(atlasProductId)));
        if (matches.length > 1) return freeze({ status: PRODUCTION_FRESHNESS_RESOLUTION.AMBIGUOUS, policy: null, reasons: ["PRODUCTION_FRESHNESS_POLICY_AMBIGUOUS"] });
        if (matches.length === 0) return freeze({ status: PRODUCTION_FRESHNESS_RESOLUTION.SCOPE_MISMATCH, policy: null, reasons: ["PRODUCTION_FRESHNESS_POLICY_SCOPE_MISMATCH"] });
        return freeze({ status: PRODUCTION_FRESHNESS_RESOLUTION.RESOLVED, policy: structuredClone(matches[0]), reasons: [] });
    }
}

export const defaultProductionFreshnessPolicyRepository = new ProductionFreshnessPolicyRepository();
