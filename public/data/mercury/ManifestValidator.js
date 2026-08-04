function deepFreeze(value) {
    if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
    return value;
}

function issue(code, path, message) {
    return Object.freeze({ code, path, message });
}

export function validateMercuryManifest(manifest) {
    const errors = [];
    const warnings = [];

    if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
        return deepFreeze({ valid: false, errors: [issue("INVALID_MANIFEST", "$", "Mercury manifest must be an object.")], warnings });
    }
    if (!Array.isArray(manifest.observations)) errors.push(issue("MISSING_COLLECTION", "observations", "Mercury manifest requires an observations array."));
    if (!manifest.counts || !Number.isInteger(manifest.counts.observations)) errors.push(issue("INVALID_COUNT", "counts.observations", "Expected an integer observation count."));

    if (Array.isArray(manifest.observations)) {
        if (manifest.counts?.observations !== manifest.observations.length) {
            errors.push(issue("COUNT_MISMATCH", "counts.observations", "Observation count does not match the manifest collection."));
        }
        const ids = new Set();
        const paths = new Set();
        for (const [index, entry] of manifest.observations.entries()) {
            const path = `observations[${index}]`;
            for (const key of ["observationId", "atlasProductId", "retailerId", "path"]) {
                if (typeof entry?.[key] !== "string" || entry[key].trim().length === 0) errors.push(issue("MISSING_ENTRY_FIELD", `${path}.${key}`, "Expected a non-empty string."));
            }
            const id = entry?.observationId?.toLowerCase();
            const resourcePath = entry?.path?.toLowerCase();
            if (id) {
                if (ids.has(id)) errors.push(issue("DUPLICATE_ENTRY_ID", `${path}.observationId`, `Duplicate manifest observation ID: ${entry.observationId}.`));
                ids.add(id);
            }
            if (resourcePath) {
                if (paths.has(resourcePath)) errors.push(issue("DUPLICATE_ENTRY_PATH", `${path}.path`, `Duplicate manifest path: ${entry.path}.`));
                paths.add(resourcePath);
            }
        }
    }

    return deepFreeze({ valid: errors.length === 0, errors, warnings });
}
