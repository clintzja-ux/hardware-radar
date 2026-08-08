export const MANIFEST_VALIDATOR_VERSION = "1.0.0";

const COLLECTIONS = Object.freeze([
    { name: "products", idField: "atlasProductId" },
    { name: "brands", idField: "brandId" },
    { name: "categories", idField: "categoryId" },
    { name: "retailers", idField: "retailerId" }
]);

function issue(code, path, message) {
    return Object.freeze({ code, path, message });
}

function isPlainObject(value) {
    if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
}

function isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
}

export function validateManifest(manifest) {
    const errors = [];
    const warnings = [];

    if (!isPlainObject(manifest)) {
        errors.push(issue("INVALID_MANIFEST", "$", "Atlas manifest must be a plain JSON object."));
        return Object.freeze({
            validatorVersion: MANIFEST_VALIDATOR_VERSION,
            valid: false,
            errors: Object.freeze(errors),
            warnings: Object.freeze(warnings)
        });
    }

    for (const field of ["atlasVersion", "coreSchemaVersion", "repositoryStatus", "generatedAt"]) {
        if (!isNonEmptyString(manifest[field])) {
            errors.push(issue("REQUIRED_STRING", field, `${field} must be a non-empty string.`));
        }
    }

    if (manifest.generatedAt && Number.isNaN(Date.parse(manifest.generatedAt))) {
        errors.push(issue("INVALID_DATETIME", "generatedAt", "generatedAt must be an ISO 8601 date-time."));
    }

    if (!isPlainObject(manifest.counts)) {
        errors.push(issue("INVALID_COUNTS", "counts", "Manifest counts must be an object."));
    }

    for (const { name, idField } of COLLECTIONS) {
        const collection = manifest[name];

        if (!Array.isArray(collection)) {
            errors.push(issue("MISSING_COLLECTION", name, `${name} must be an array.`));
            continue;
        }

        const seenIds = new Set();
        const seenPaths = new Set();

        collection.forEach((entry, index) => {
            const path = `${name}[${index}]`;
            if (!isPlainObject(entry)) {
                errors.push(issue("INVALID_ENTRY", path, "Manifest entry must be an object."));
                return;
            }

            if (!isNonEmptyString(entry[idField])) {
                errors.push(issue("MISSING_ENTRY_ID", `${path}.${idField}`, `${idField} must be a non-empty string.`));
            } else {
                const normalizedId = entry[idField].trim().toLowerCase();
                if (seenIds.has(normalizedId)) {
                    errors.push(issue("DUPLICATE_ENTRY_ID", `${path}.${idField}`, `Duplicate ${idField}: ${entry[idField]}.`));
                }
                seenIds.add(normalizedId);
            }

            if (!isNonEmptyString(entry.path)) {
                errors.push(issue("MISSING_ENTRY_PATH", `${path}.path`, "path must be a non-empty string."));
            } else {
                const normalizedPath = entry.path.trim().toLowerCase();
                if (seenPaths.has(normalizedPath)) {
                    errors.push(issue("DUPLICATE_ENTRY_PATH", `${path}.path`, `Duplicate manifest path: ${entry.path}.`));
                }
                seenPaths.add(normalizedPath);
            }
        });

        const declaredCount = manifest.counts?.[name];
        if (!Number.isInteger(declaredCount) || declaredCount < 0) {
            errors.push(issue("INVALID_COUNT", `counts.${name}`, `counts.${name} must be a non-negative integer.`));
        } else if (declaredCount !== collection.length) {
            errors.push(issue(
                "COUNT_MISMATCH",
                `counts.${name}`,
                `counts.${name} is ${declaredCount}, but ${collection.length} entries are registered.`
            ));
        }
    }

    return Object.freeze({
        validatorVersion: MANIFEST_VALIDATOR_VERSION,
        valid: errors.length === 0,
        errors: Object.freeze(errors),
        warnings: Object.freeze(warnings)
    });
}
