export const PROVENANCE_SCHEMA_VERSION = "1.0";

function requiredString(value, field) {
    if (typeof value !== "string" || value.trim().length === 0) {
        throw new TypeError(`${field} must be a non-empty string.`);
    }
    return value.trim();
}

function optionalString(value) {
    if (value === undefined || value === null || value === "") return null;
    if (typeof value !== "string") throw new TypeError("Optional provenance values must be strings when provided.");
    return value.trim();
}

function deepFreeze(value) {
    if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
    return value;
}

/**
 * Build the canonical Mercury provenance chain for an observation.
 * Provenance records facts about origin and processing only. It does not
 * calculate freshness, confidence, trust, or publication eligibility.
 */
export function createProvenance({
    source,
    acquisition,
    transformation,
    validation
}) {
    const provenance = {
        schemaVersion: PROVENANCE_SCHEMA_VERSION,
        source: {
            name: requiredString(source?.name, "source.name"),
            uri: optionalString(source?.uri),
            marketplace: requiredString(source?.marketplace, "source.marketplace")
        },
        acquisition: {
            method: requiredString(acquisition?.method, "acquisition.method"),
            retrievedAt: requiredString(acquisition?.retrievedAt, "acquisition.retrievedAt"),
            retrievedBy: requiredString(acquisition?.retrievedBy, "acquisition.retrievedBy"),
            requestId: optionalString(acquisition?.requestId),
            rawPayloadReference: optionalString(acquisition?.rawPayloadReference)
        },
        transformation: {
            adapterId: requiredString(transformation?.adapterId, "transformation.adapterId"),
            adapterVersion: requiredString(transformation?.adapterVersion, "transformation.adapterVersion"),
            normalizedAt: requiredString(transformation?.normalizedAt, "transformation.normalizedAt")
        },
        validation: {
            validatorVersion: requiredString(validation?.validatorVersion, "validation.validatorVersion"),
            complianceRuleSetVersion: requiredString(validation?.complianceRuleSetVersion, "validation.complianceRuleSetVersion")
        }
    };

    return deepFreeze(provenance);
}

export default createProvenance;
