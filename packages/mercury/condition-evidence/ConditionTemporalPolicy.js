export const CONDITION_TEMPORAL_POLICY_VERSION = "B-017A-1.0";
const freeze = value => { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.freeze(value); for (const child of Object.values(value)) freeze(child); } return value; };
const nonBlank = value => typeof value === "string" && value.trim() !== "";
export function createConditionTemporalPolicy({ policyId, version = "1.0.0", sourceId, retailerId, marketplace, primaryCurrentUntilMs, supplementalCurrentUntilMs, maxObservationSkewMs } = {}) {
    const value = { schemaVersion: "1.0", policyType: "SUPPLEMENTAL_CONDITION_TEMPORAL_COMPATIBILITY", policyId, version, sourceId, retailerId, marketplace, primaryCurrentUntilMs, supplementalCurrentUntilMs, maxObservationSkewMs };
    if (![policyId, sourceId, retailerId, marketplace].every(nonBlank) || !/^\d+\.\d+\.\d+$/.test(version) || ![primaryCurrentUntilMs, supplementalCurrentUntilMs, maxObservationSkewMs].every(value => Number.isFinite(value) && value >= 0)) throw new TypeError("SUPPLEMENTAL_CONDITION_TEMPORAL_POLICY_INVALID");
    return freeze(value);
}
export class ConditionTemporalPolicyRepository {
    constructor({ policies = [] } = {}) { this.policies = structuredClone(policies); }
    resolve({ sourceId, retailerId, marketplace } = {}) { const matches = this.policies.filter(policy => policy.sourceId === sourceId && policy.retailerId === retailerId && policy.marketplace === marketplace); if (matches.length === 0) return freeze({ status: "MISSING", policy: null, reasons: ["SUPPLEMENTAL_CONDITION_TEMPORAL_POLICY_MISSING"] }); if (matches.length > 1) return freeze({ status: "AMBIGUOUS", policy: null, reasons: ["SUPPLEMENTAL_CONDITION_TEMPORAL_POLICY_AMBIGUOUS"] }); try { return freeze({ status: "RESOLVED", policy: createConditionTemporalPolicy(matches[0]), reasons: [] }); } catch { return freeze({ status: "MALFORMED", policy: null, reasons: ["SUPPLEMENTAL_CONDITION_TEMPORAL_POLICY_MALFORMED"] }); } }
}
export function evaluateConditionTemporalCompatibility({ primaryObservedAt, supplementalObservedAt, evaluatedAt, policy } = {}) {
    if (![primaryObservedAt, supplementalObservedAt, evaluatedAt].every(value => typeof value === "string" && Number.isFinite(Date.parse(value))) || !policy) return freeze({ compatible: false, reasons: ["SUPPLEMENTAL_CONDITION_TEMPORAL_INPUT_INVALID"] });
    const primary = Date.parse(primaryObservedAt), supplemental = Date.parse(supplementalObservedAt), evaluated = Date.parse(evaluatedAt), reasons = [];
    if (evaluated < primary || evaluated < supplemental) reasons.push("SUPPLEMENTAL_CONDITION_FUTURE_EVIDENCE");
    if (evaluated - primary > policy.primaryCurrentUntilMs) reasons.push("SUPPLEMENTAL_CONDITION_PRIMARY_NOT_CURRENT");
    if (evaluated - supplemental > policy.supplementalCurrentUntilMs) reasons.push("SUPPLEMENTAL_CONDITION_EVIDENCE_NOT_CURRENT");
    if (Math.abs(primary - supplemental) > policy.maxObservationSkewMs) reasons.push("SUPPLEMENTAL_CONDITION_OBSERVATION_SKEW_EXCEEDED");
    return freeze({ compatible: reasons.length === 0, reasons, primaryAgeMs: evaluated - primary, supplementalAgeMs: evaluated - supplemental, observationSkewMs: Math.abs(primary - supplemental), policyId: policy.policyId, policyVersion: policy.version });
}
