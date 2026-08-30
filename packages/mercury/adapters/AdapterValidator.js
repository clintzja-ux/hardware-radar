import { RETAILER_ADAPTER_REQUIRED_METHODS } from "./interfaces/RetailerAdapter.js";

export const ADAPTER_VALIDATOR_VERSION = "mercury-adapter-validator-1.0.0";
export const ADAPTER_STATUSES = Object.freeze(["ACTIVE", "DISABLED", "EXPERIMENTAL"]);
export const ADAPTER_CAPABILITIES = Object.freeze(["NORMALIZE_OFFER"]);

function issue(code, path, message) {
    return Object.freeze({ code, path, message });
}

function isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
}

function deepFreeze(value) {
    if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
    return value;
}

export function validateAdapterManifestEntry(entry, { retailerIds = null } = {}) {
    const errors = [];
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        errors.push(issue("INVALID_ADAPTER_MANIFEST", "$", "Adapter manifest entry must be an object."));
    } else {
        if (!isNonEmptyString(entry.adapterId) || !/^mer_adapter_[a-z0-9_]+$/.test(entry.adapterId)) {
            errors.push(issue("INVALID_ADAPTER_ID", "adapterId", "Expected mer_adapter_<name>."));
        }
        if (!isNonEmptyString(entry.version) || !/^\d+\.\d+\.\d+$/.test(entry.version)) {
            errors.push(issue("INVALID_ADAPTER_VERSION", "version", "Expected semantic version X.Y.Z."));
        }
        if (!isNonEmptyString(entry.retailerId) || !/^RETAILER-\d{4}$/.test(entry.retailerId)) {
            errors.push(issue("INVALID_RETAILER_ID", "retailerId", "Expected canonical Atlas retailer ID."));
        }
        if (retailerIds instanceof Set && isNonEmptyString(entry.retailerId) && !retailerIds.has(entry.retailerId.toLowerCase())) {
            errors.push(issue("UNKNOWN_RETAILER", "retailerId", `Retailer does not exist in Atlas: ${entry.retailerId}.`));
        }
        if (!Array.isArray(entry.marketplaces) || entry.marketplaces.length === 0 || entry.marketplaces.some((value) => !isNonEmptyString(value))) {
            errors.push(issue("INVALID_MARKETPLACES", "marketplaces", "Expected at least one marketplace."));
        }
        if (!Array.isArray(entry.sourceMethods) || entry.sourceMethods.length === 0 || entry.sourceMethods.some((value) => !isNonEmptyString(value))) {
            errors.push(issue("INVALID_SOURCE_METHODS", "sourceMethods", "Expected at least one source method."));
        }
        if (entry.compatibleNormalizationVersions !== undefined && (!Array.isArray(entry.compatibleNormalizationVersions) || entry.compatibleNormalizationVersions.length === 0 || entry.compatibleNormalizationVersions.some((value) => !isNonEmptyString(value)))) {
            errors.push(issue("INVALID_COMPATIBLE_NORMALIZATION_VERSIONS", "compatibleNormalizationVersions", "Expected a non-empty array of normalization versions when supplied."));
        }
        if (!Array.isArray(entry.capabilities) || entry.capabilities.length === 0) {
            errors.push(issue("INVALID_CAPABILITIES", "capabilities", "Expected at least one declared capability."));
        } else {
            for (const capability of entry.capabilities) {
                if (!ADAPTER_CAPABILITIES.includes(capability)) errors.push(issue("UNKNOWN_CAPABILITY", "capabilities", `Unknown capability: ${capability}.`));
            }
        }
        if (!ADAPTER_STATUSES.includes(entry.status)) errors.push(issue("INVALID_ADAPTER_STATUS", "status", `Expected one of: ${ADAPTER_STATUSES.join(", ")}.`));
    }
    return deepFreeze({ valid: errors.length === 0, errors, warnings: [], validatorVersion: ADAPTER_VALIDATOR_VERSION });
}

export function validateAdapter(adapter, options = {}) {
    const errors = [];
    if (!adapter || typeof adapter !== "object") {
        errors.push(issue("INVALID_ADAPTER", "$", "Adapter must be an object instance."));
    } else {
        for (const method of RETAILER_ADAPTER_REQUIRED_METHODS) {
            if (typeof adapter[method] !== "function") errors.push(issue("MISSING_ADAPTER_METHOD", method, `Adapter must implement ${method}().`));
        }
        if (typeof adapter.getMetadata === "function") {
            const manifestReport = validateAdapterManifestEntry(adapter.getMetadata(), options);
            errors.push(...manifestReport.errors);
        }
    }
    return deepFreeze({ valid: errors.length === 0, errors, warnings: [], validatorVersion: ADAPTER_VALIDATOR_VERSION });
}

export function validateAdapterManifest(manifest, options = {}) {
    const errors = [];
    if (!manifest || typeof manifest !== "object" || !Array.isArray(manifest.adapters)) {
        errors.push(issue("INVALID_ADAPTER_MANIFEST", "$", "Adapter manifest must contain an adapters array."));
    } else {
        const ids = new Set();
        for (const entry of manifest.adapters) {
            const report = validateAdapterManifestEntry(entry, options);
            errors.push(...report.errors.map((error) => issue(error.code, `${entry?.adapterId ?? "unknown"}.${error.path}`, error.message)));
            if (isNonEmptyString(entry?.adapterId)) {
                const id = entry.adapterId.toLowerCase();
                if (ids.has(id)) errors.push(issue("DUPLICATE_ADAPTER_ID", entry.adapterId, `Duplicate adapter ID: ${entry.adapterId}.`));
                ids.add(id);
            }
        }
    }
    return deepFreeze({ valid: errors.length === 0, errors, warnings: [], validatorVersion: ADAPTER_VALIDATOR_VERSION });
}
