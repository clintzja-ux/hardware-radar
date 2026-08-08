const FRESHNESS_POLICY_SCHEMA_VERSION = "1.0";

function deepFreeze(value) {
    if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
    return value;
}

export function createFreshnessPolicy({
    policyId,
    version,
    currentUntilMs,
    staleAfterMs,
    description = null
}) {
    return deepFreeze({
        schemaVersion: FRESHNESS_POLICY_SCHEMA_VERSION,
        policyId,
        version,
        currentUntilMs,
        staleAfterMs,
        description
    });
}

export { FRESHNESS_POLICY_SCHEMA_VERSION };
