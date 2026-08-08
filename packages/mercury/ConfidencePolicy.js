const CONFIDENCE_POLICY_SCHEMA_VERSION = "1.0";

function deepFreeze(value) {
    if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
    return value;
}

export function createConfidencePolicy({
    policyId,
    version,
    high,
    medium,
    defaultStatus = "LOW",
    description = null
}) {
    return deepFreeze({
        schemaVersion: CONFIDENCE_POLICY_SCHEMA_VERSION,
        policyId,
        version,
        classifications: {
            HIGH: high,
            MEDIUM: medium
        },
        defaultStatus,
        description
    });
}

export { CONFIDENCE_POLICY_SCHEMA_VERSION };
