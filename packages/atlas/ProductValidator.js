const PRODUCT_VALIDATOR_VERSION = "1.0.0";

const TOP_LEVEL_KEYS = Object.freeze([
    "identity",
    "governance",
    "provenance",
    "validation",
    "extension"
]);

const ENUMS = Object.freeze({
    publicationStatus: ["PENDING", "READY", "REVIEW", "BLOCKED"],
    lifecycleStatus: ["DRAFT", "VERIFIED", "ACTIVE", "ARCHIVED"],
    engineeringValidationStatus: ["PENDING", "PASS", "WARN", "FAIL"],
    memoryType: ["DDR3", "DDR4", "DDR5", "LPDDR4", "LPDDR4X", "LPDDR5", "LPDDR5X", "OTHER"],
    formFactor: ["DIMM", "SO_DIMM", "CAMM2", "SOLDERED", "OTHER"],
    applicationClass: ["DESKTOP", "LAPTOP", "WORKSTATION", "SERVER", "EMBEDDED", "OTHER"],
    moduleType: ["UDIMM", "SO_DIMM", "RDIMM", "LRDIMM", "CUDIMM", "CSODIMM", "OTHER"],
    buffering: ["UNBUFFERED", "REGISTERED", "LOAD_REDUCED", "CLOCKED_UNBUFFERED", "UNKNOWN"],
    eccType: ["NONE", "ON_DIE_ONLY", "SIDEBAND_ECC", "CHIPKILL_OR_ADVANCED", "UNKNOWN"],
    profileSupport: ["NONE", "SUPPORTED", "PROFILE_INCLUDED", "UNKNOWN"]
});

function issue(code, path, message) {
    return Object.freeze({ code, path, message });
}

function isPlainObject(value) {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
        return false;
    }

    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
}

function isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
}

function isIsoDateTime(value) {
    return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function requireObject(parent, key, path, errors) {
    const value = parent?.[key];

    if (!isPlainObject(value)) {
        errors.push(issue("REQUIRED_OBJECT", `${path}.${key}`, "Expected an object."));
        return null;
    }

    return value;
}

function requireString(parent, key, path, errors, pattern = null) {
    const value = parent?.[key];
    const fieldPath = `${path}.${key}`;

    if (!isNonEmptyString(value)) {
        errors.push(issue("REQUIRED_STRING", fieldPath, "Expected a non-empty string."));
        return null;
    }

    if (pattern && !pattern.test(value)) {
        errors.push(issue("PATTERN_MISMATCH", fieldPath, "Value does not match the canonical format."));
    }

    return value;
}

function requireEnum(parent, key, path, errors, values) {
    const value = parent?.[key];

    if (!values.includes(value)) {
        errors.push(issue(
            "INVALID_ENUM",
            `${path}.${key}`,
            `Expected one of: ${values.join(", ")}.`
        ));
    }

    return value;
}

function requirePositiveInteger(parent, key, path, errors) {
    const value = parent?.[key];

    if (!Number.isInteger(value) || value < 1) {
        errors.push(issue("INVALID_POSITIVE_INTEGER", `${path}.${key}`, "Expected a positive integer."));
    }

    return value;
}

function validateTopLevel(product, errors) {
    if (!isPlainObject(product)) {
        errors.push(issue("INVALID_PRODUCT", "$", "Product must be a plain JSON object."));
        return false;
    }

    for (const key of TOP_LEVEL_KEYS) {
        if (!(key in product)) {
            errors.push(issue("MISSING_TOP_LEVEL_SECTION", key, `Missing top-level section: ${key}.`));
        }
    }

    for (const key of Object.keys(product)) {
        if (!TOP_LEVEL_KEYS.includes(key)) {
            errors.push(issue("UNEXPECTED_TOP_LEVEL_SECTION", key, `Unexpected top-level section: ${key}.`));
        }
    }

    return true;
}

function validateIdentity(product, errors) {
    const identity = requireObject(product, "identity", "$", errors);
    if (!identity) return;

    requireString(identity, "atlasProductId", "identity", errors, /^[a-z][a-z0-9]*(?:_[a-z0-9]+)+$/);
    requireString(identity, "schemaVersion", "identity", errors, /^[0-9]+\.[0-9]+(?:\.[0-9]+)?$/);
    requireString(identity, "productType", "identity", errors, /^[a-z][a-z0-9_]*$/);
    requirePositiveInteger(identity, "recordRevision", "identity", errors);
    requireString(identity, "createdBy", "identity", errors);
    requireString(identity, "updatedBy", "identity", errors);
    requireString(identity, "brand", "identity", errors);
    requireString(identity, "manufacturer", "identity", errors);
    requireString(identity, "modelName", "identity", errors);
    requireString(identity, "manufacturerPartNumber", "identity", errors);
    requireString(identity, "displayName", "identity", errors);
    requireString(identity, "slug", "identity", errors, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);

    if (!isIsoDateTime(identity.createdAt)) {
        errors.push(issue("INVALID_DATETIME", "identity.createdAt", "Expected an ISO 8601 date-time."));
    }

    if (!isIsoDateTime(identity.updatedAt)) {
        errors.push(issue("INVALID_DATETIME", "identity.updatedAt", "Expected an ISO 8601 date-time."));
    }

    if (isIsoDateTime(identity.createdAt) && isIsoDateTime(identity.updatedAt) &&
        Date.parse(identity.updatedAt) < Date.parse(identity.createdAt)) {
        errors.push(issue("INVALID_DATE_ORDER", "identity.updatedAt", "updatedAt must not precede createdAt."));
    }
}

function validateGovernance(product, errors) {
    const governance = requireObject(product, "governance", "$", errors);
    if (!governance) return;

    requireEnum(governance, "publicationStatus", "governance", errors, ENUMS.publicationStatus);
    requireEnum(governance, "lifecycleStatus", "governance", errors, ENUMS.lifecycleStatus);
    requireEnum(governance, "engineeringValidationStatus", "governance", errors, ENUMS.engineeringValidationStatus);

    if (typeof governance.humanReviewRequired !== "boolean") {
        errors.push(issue("INVALID_BOOLEAN", "governance.humanReviewRequired", "Expected a boolean."));
    }
}

function validateProvenance(product, errors) {
    const provenance = requireObject(product, "provenance", "$", errors);
    if (!provenance) return;

    if (!isPlainObject(provenance.fieldSources) || Object.keys(provenance.fieldSources).length === 0) {
        errors.push(issue("MISSING_FIELD_PROVENANCE", "provenance.fieldSources", "At least one field source is required."));
        return;
    }

    for (const [fieldPath, sources] of Object.entries(provenance.fieldSources)) {
        if (!Array.isArray(sources) || sources.length === 0) {
            errors.push(issue("INVALID_SOURCE_LIST", `provenance.fieldSources.${fieldPath}`, "Expected a non-empty source array."));
            continue;
        }

        sources.forEach((source, index) => {
            const path = `provenance.fieldSources.${fieldPath}[${index}]`;
            if (!isPlainObject(source)) {
                errors.push(issue("INVALID_SOURCE", path, "Source reference must be an object."));
                return;
            }

            for (const key of ["sourceId", "sourceType", "sourceLocator", "retrievedAt", "verifiedBy", "verificationStatus"]) {
                if (!isNonEmptyString(source[key])) {
                    errors.push(issue("MISSING_SOURCE_FIELD", `${path}.${key}`, "Expected a non-empty string."));
                }
            }

            if (source.retrievedAt && !isIsoDateTime(source.retrievedAt)) {
                errors.push(issue("INVALID_DATETIME", `${path}.retrievedAt`, "Expected an ISO 8601 date-time."));
            }
        });
    }
}

function validateRamExtension(product, errors) {
    const extension = requireObject(product, "extension", "$", errors);
    if (!extension) return;

    if (extension.extensionType !== "ram" || product.identity?.productType !== "ram") {
        errors.push(issue("EXTENSION_TYPE_MISMATCH", "extension.extensionType", "RAM product must use the ram extension type."));
    }

    requireString(extension, "schemaVersion", "extension", errors, /^[0-9]+\.[0-9]+(?:\.[0-9]+)?$/);
    const data = requireObject(extension, "data", "extension", errors);
    if (!data) return;

    const classification = requireObject(data, "classification", "extension.data", errors);
    if (classification) {
        requireEnum(classification, "memoryType", "extension.data.classification", errors, ENUMS.memoryType);
        requireEnum(classification, "formFactor", "extension.data.classification", errors, ENUMS.formFactor);
        requireEnum(classification, "applicationClass", "extension.data.classification", errors, ENUMS.applicationClass);
        requireEnum(classification, "moduleType", "extension.data.classification", errors, ENUMS.moduleType);
        requireEnum(classification, "buffering", "extension.data.classification", errors, ENUMS.buffering);
        requireEnum(classification, "eccType", "extension.data.classification", errors, ENUMS.eccType);
        if (typeof classification.isKit !== "boolean") {
            errors.push(issue("INVALID_BOOLEAN", "extension.data.classification.isKit", "Expected a boolean."));
        }
    }

    const capacity = requireObject(data, "capacity", "extension.data", errors);
    if (capacity) {
        requirePositiveInteger(capacity, "capacityGb", "extension.data.capacity", errors);
        requirePositiveInteger(capacity, "moduleCount", "extension.data.capacity", errors);
        requirePositiveInteger(capacity, "capacityPerModuleGb", "extension.data.capacity", errors);
    }

    const performance = requireObject(data, "performance", "extension.data", errors);
    if (performance) {
        requirePositiveInteger(performance, "dataRateMtps", "extension.data.performance", errors);
        requireString(performance, "speedLabel", "extension.data.performance", errors, /^[A-Z0-9]+-[0-9]+$/);
        requireEnum(performance, "xmpSupport", "extension.data.performance", errors, ENUMS.profileSupport);
        requireEnum(performance, "expoSupport", "extension.data.performance", errors, ENUMS.profileSupport);
    }

    requireObject(data, "electrical", "extension.data", errors);

    const physical = requireObject(data, "physical", "extension.data", errors);
    if (physical) {
        if (typeof physical.heatSpreader !== "boolean") {
            errors.push(issue("INVALID_BOOLEAN", "extension.data.physical.heatSpreader", "Expected a boolean."));
        }
        if (typeof physical.rgbLighting !== "boolean") {
            errors.push(issue("INVALID_BOOLEAN", "extension.data.physical.rgbLighting", "Expected a boolean."));
        }
    }

    requireObject(data, "compatibility", "extension.data", errors);
}

export function validateProduct(product) {
    const errors = [];
    const warnings = [];

    if (validateTopLevel(product, errors)) {
        validateIdentity(product, errors);
        validateGovernance(product, errors);
        validateProvenance(product, errors);
        validateRamExtension(product, errors);
    }

    return Object.freeze({
        valid: errors.length === 0,
        errors: Object.freeze(errors),
        warnings: Object.freeze(warnings),
        validatorVersion: PRODUCT_VALIDATOR_VERSION
    });
}

export function validateRepository(products) {
    if (!Array.isArray(products)) {
        throw new TypeError("products must be an array.");
    }

    const productReports = products.map((product) => ({
        atlasProductId: product?.identity?.atlasProductId ?? null,
        report: validateProduct(product)
    }));
    const errors = productReports.flatMap(({ atlasProductId, report }) =>
        report.errors.map((entry) => issue(
            entry.code,
            `${atlasProductId ?? "unknown"}:${entry.path}`,
            entry.message
        ))
    );

    const uniqueFields = [
        ["identity.atlasProductId", (product) => product?.identity?.atlasProductId?.toLowerCase()],
        ["identity.slug", (product) => product?.identity?.slug?.toLowerCase()],
        ["identity.manufacturerPartNumber", (product) => {
            const manufacturer = product?.identity?.manufacturer?.toLowerCase();
            const mpn = product?.identity?.manufacturerPartNumber?.toLowerCase();
            return manufacturer && mpn ? `${manufacturer}:${mpn}` : null;
        }]
    ];

    for (const [path, getValue] of uniqueFields) {
        const seen = new Map();

        products.forEach((product, index) => {
            const value = getValue(product);
            if (!value) return;

            if (seen.has(value)) {
                errors.push(issue(
                    "DUPLICATE_REPOSITORY_IDENTITY",
                    `${path}[${index}]`,
                    `Duplicate ${path}: ${value}.`
                ));
            } else {
                seen.set(value, index);
            }
        });
    }

    return Object.freeze({
        valid: errors.length === 0,
        errors: Object.freeze(errors),
        warnings: Object.freeze([]),
        productReports: Object.freeze(productReports),
        validatorVersion: PRODUCT_VALIDATOR_VERSION
    });
}

export { PRODUCT_VALIDATOR_VERSION };
