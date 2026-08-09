const PUBLICATION_POLICY_SCHEMA_VERSION = "1.0";

export function createPublicationPolicy({
    policyId = "hardware-radar-market-publication",
    version = "1.0.0",
    allowedFreshnessStatuses = ["CURRENT"],
    allowedConfidenceStatuses = ["HIGH"],
    allowedAvailabilityStatuses = ["IN_STOCK"],
    allowedConditions = ["NEW"]
} = {}) {
    return Object.freeze({
        schemaVersion: PUBLICATION_POLICY_SCHEMA_VERSION,
        policyId,
        version,
        allowedFreshnessStatuses: Object.freeze([...allowedFreshnessStatuses]),
        allowedConfidenceStatuses: Object.freeze([...allowedConfidenceStatuses]),
        allowedAvailabilityStatuses: Object.freeze([...allowedAvailabilityStatuses]),
        allowedConditions: Object.freeze([...allowedConditions])
    });
}

export { PUBLICATION_POLICY_SCHEMA_VERSION };
export default createPublicationPolicy();
