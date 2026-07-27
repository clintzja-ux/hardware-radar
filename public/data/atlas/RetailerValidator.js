const RETAILER_VALIDATOR_VERSION = "1.0.0";

const REQUIRED_KEYS = Object.freeze([
    "id", "name", "slug", "websiteUrl", "status", "regions",
    "supportedCurrencies", "affiliateProgram", "metadata"
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

function isIsoDateTime(value) {
    return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function isHttpsUrl(value) {
    if (!isNonEmptyString(value)) return false;
    try {
        const url = new URL(value);
        return url.protocol === "https:" && Boolean(url.hostname);
    } catch {
        return false;
    }
}

function validateStringArray(value, path, errors, { minItems = 0, pattern = null } = {}) {
    if (!Array.isArray(value)) {
        errors.push(issue("INVALID_ARRAY", path, "Expected an array."));
        return;
    }
    if (value.length < minItems) errors.push(issue("ARRAY_TOO_SHORT", path, `Expected at least ${minItems} item(s).`));
    const seen = new Set();
    value.forEach((entry, index) => {
        const entryPath = `${path}[${index}]`;
        if (!isNonEmptyString(entry)) {
            errors.push(issue("INVALID_ARRAY_ENTRY", entryPath, "Expected a non-empty string."));
            return;
        }
        if (pattern && !pattern.test(entry)) errors.push(issue("PATTERN_MISMATCH", entryPath, "Value does not match the canonical format."));
        const normalized = entry.trim().toLowerCase();
        if (seen.has(normalized)) errors.push(issue("DUPLICATE_ARRAY_ENTRY", entryPath, `Duplicate value: ${entry}.`));
        seen.add(normalized);
    });
}

export function validateRetailer(retailer) {
    const errors = [];
    const warnings = [];

    if (!isPlainObject(retailer)) {
        errors.push(issue("INVALID_RETAILER", "$", "Retailer must be a plain JSON object."));
    } else {
        for (const key of REQUIRED_KEYS) {
            if (!(key in retailer)) errors.push(issue("MISSING_FIELD", key, `Missing required field: ${key}.`));
        }
        for (const key of Object.keys(retailer)) {
            if (![...REQUIRED_KEYS, "logo"].includes(key)) errors.push(issue("UNEXPECTED_FIELD", key, `Unexpected field: ${key}.`));
        }
        if (!/^RETAILER-[0-9]{4}$/.test(retailer.id ?? "")) errors.push(issue("INVALID_RETAILER_ID", "id", "Expected RETAILER-0000 format."));
        if (!isNonEmptyString(retailer.name)) errors.push(issue("REQUIRED_STRING", "name", "Expected a non-empty string."));
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(retailer.slug ?? "")) errors.push(issue("INVALID_SLUG", "slug", "Expected a lowercase kebab-case slug."));
        if (!isHttpsUrl(retailer.websiteUrl)) errors.push(issue("INVALID_HTTPS_URL", "websiteUrl", "Expected a valid HTTPS URL."));
        if (!["active", "inactive", "restricted", "unknown"].includes(retailer.status)) errors.push(issue("INVALID_ENUM", "status", "Invalid retailer status."));
        validateStringArray(retailer.regions, "regions", errors, { minItems: 1, pattern: /^[A-Z]{2}$/ });
        validateStringArray(retailer.supportedCurrencies, "supportedCurrencies", errors, { pattern: /^[A-Z]{3}$/ });

        if (!isPlainObject(retailer.affiliateProgram)) {
            errors.push(issue("REQUIRED_OBJECT", "affiliateProgram", "Expected an object."));
        } else {
            if (typeof retailer.affiliateProgram.available !== "boolean") errors.push(issue("REQUIRED_BOOLEAN", "affiliateProgram.available", "Expected a boolean."));
            if (!["active", "pending", "not-enrolled", "unavailable", "unknown"].includes(retailer.affiliateProgram.status)) errors.push(issue("INVALID_ENUM", "affiliateProgram.status", "Invalid affiliate program status."));
            if ("network" in retailer.affiliateProgram && retailer.affiliateProgram.network !== null && !isNonEmptyString(retailer.affiliateProgram.network)) errors.push(issue("INVALID_OPTIONAL_STRING", "affiliateProgram.network", "Expected null or a non-empty string."));
            if ("disclosureRequired" in retailer.affiliateProgram && typeof retailer.affiliateProgram.disclosureRequired !== "boolean") errors.push(issue("INVALID_OPTIONAL_BOOLEAN", "affiliateProgram.disclosureRequired", "Expected a boolean."));
        }

        if (retailer.logo !== undefined && retailer.logo !== null) {
            if (!isPlainObject(retailer.logo)) errors.push(issue("INVALID_LOGO", "logo", "Expected null or an object."));
            else {
                if (!isNonEmptyString(retailer.logo.url)) errors.push(issue("REQUIRED_STRING", "logo.url", "Expected a non-empty string."));
                if (!isNonEmptyString(retailer.logo.alt)) errors.push(issue("REQUIRED_STRING", "logo.alt", "Expected a non-empty string."));
            }
        }

        if (!isPlainObject(retailer.metadata)) {
            errors.push(issue("REQUIRED_OBJECT", "metadata", "Expected an object."));
        } else {
            if (!isIsoDateTime(retailer.metadata.createdAt)) errors.push(issue("INVALID_DATETIME", "metadata.createdAt", "Expected an ISO 8601 date-time."));
            if (!isIsoDateTime(retailer.metadata.updatedAt)) errors.push(issue("INVALID_DATETIME", "metadata.updatedAt", "Expected an ISO 8601 date-time."));
            validateStringArray(retailer.metadata.sourceReferences, "metadata.sourceReferences", errors, { minItems: 1 });
            if (isIsoDateTime(retailer.metadata.createdAt) && isIsoDateTime(retailer.metadata.updatedAt) && Date.parse(retailer.metadata.updatedAt) < Date.parse(retailer.metadata.createdAt)) errors.push(issue("INVALID_DATE_ORDER", "metadata.updatedAt", "updatedAt must not precede createdAt."));
        }
    }

    return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors), warnings: Object.freeze(warnings), validatorVersion: RETAILER_VALIDATOR_VERSION });
}

function collectDuplicates(retailers, label, getter, errors) {
    const seen = new Map();
    retailers.forEach((retailer, index) => {
        for (const rawValue of getter(retailer)) {
            if (!isNonEmptyString(rawValue)) continue;
            const value = rawValue.trim().toLowerCase();
            if (seen.has(value)) errors.push(issue("DUPLICATE_REPOSITORY_IDENTITY", `${label}[${index}]`, `Duplicate ${label}: ${rawValue}.`));
            else seen.set(value, index);
        }
    });
}

export function validateRetailerRepository(retailers) {
    if (!Array.isArray(retailers)) throw new TypeError("retailers must be an array.");
    const retailerReports = retailers.map((retailer) => ({ retailerId: retailer?.id ?? null, report: validateRetailer(retailer) }));
    const errors = retailerReports.flatMap(({ retailerId, report }) => report.errors.map((entry) => issue(entry.code, `${retailerId ?? "unknown"}:${entry.path}`, entry.message)));
    collectDuplicates(retailers, "id", (retailer) => [retailer?.id], errors);
    collectDuplicates(retailers, "slug", (retailer) => [retailer?.slug], errors);
    collectDuplicates(retailers, "name", (retailer) => [retailer?.name], errors);
    collectDuplicates(retailers, "websiteUrl", (retailer) => [retailer?.websiteUrl], errors);
    return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors), warnings: Object.freeze([]), retailerReports: Object.freeze(retailerReports), validatorVersion: RETAILER_VALIDATOR_VERSION });
}

export { RETAILER_VALIDATOR_VERSION };
