const CATEGORY_VALIDATOR_VERSION = "1.0.0";

const REQUIRED_KEYS = Object.freeze([
    "categoryId", "schemaVersion", "slug", "displayName", "shortName",
    "description", "parentCategoryId", "status", "aliases", "productTypes",
    "provenance", "metadata"
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
    if (value.length < minItems) {
        errors.push(issue("ARRAY_TOO_SHORT", path, `Expected at least ${minItems} item(s).`));
    }
    const seen = new Set();
    value.forEach((entry, index) => {
        const entryPath = `${path}[${index}]`;
        if (!isNonEmptyString(entry)) {
            errors.push(issue("INVALID_ARRAY_ENTRY", entryPath, "Expected a non-empty string."));
            return;
        }
        if (pattern && !pattern.test(entry)) {
            errors.push(issue("PATTERN_MISMATCH", entryPath, "Value does not match the canonical format."));
        }
        const normalized = entry.trim().toLowerCase();
        if (seen.has(normalized)) {
            errors.push(issue("DUPLICATE_ARRAY_ENTRY", entryPath, `Duplicate value: ${entry}.`));
        }
        seen.add(normalized);
    });
}

export function validateCategory(category) {
    const errors = [];
    const warnings = [];

    if (!isPlainObject(category)) {
        errors.push(issue("INVALID_CATEGORY", "$", "Category must be a plain JSON object."));
    } else {
        for (const key of REQUIRED_KEYS) {
            if (!(key in category)) errors.push(issue("MISSING_FIELD", key, `Missing required field: ${key}.`));
        }
        for (const key of Object.keys(category)) {
            if (!REQUIRED_KEYS.includes(key)) errors.push(issue("UNEXPECTED_FIELD", key, `Unexpected field: ${key}.`));
        }

        if (!/^CAT-[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(category.categoryId ?? "")) {
            errors.push(issue("INVALID_CATEGORY_ID", "categoryId", "Expected canonical CAT-* identifier."));
        }
        if (!/^[0-9]+\.[0-9]+\.[0-9]+$/.test(category.schemaVersion ?? "")) {
            errors.push(issue("INVALID_SCHEMA_VERSION", "schemaVersion", "Expected semantic version."));
        }
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(category.slug ?? "")) {
            errors.push(issue("INVALID_SLUG", "slug", "Expected a lowercase kebab-case slug."));
        }
        for (const key of ["displayName", "shortName", "description"]) {
            if (!isNonEmptyString(category[key])) errors.push(issue("REQUIRED_STRING", key, "Expected a non-empty string."));
        }
        if (category.parentCategoryId !== null && !/^CAT-[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(category.parentCategoryId ?? "")) {
            errors.push(issue("INVALID_PARENT_CATEGORY_ID", "parentCategoryId", "Expected null or a canonical CAT-* identifier."));
        }
        if (!["ACTIVE", "INACTIVE", "ARCHIVED"].includes(category.status)) {
            errors.push(issue("INVALID_ENUM", "status", "Expected ACTIVE, INACTIVE, or ARCHIVED."));
        }
        validateStringArray(category.aliases, "aliases", errors);
        validateStringArray(category.productTypes, "productTypes", errors, {
            minItems: 1,
            pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/
        });

        if (!isPlainObject(category.provenance)) {
            errors.push(issue("REQUIRED_OBJECT", "provenance", "Expected an object."));
        } else {
            if (!isHttpsUrl(category.provenance.sourceUrl)) errors.push(issue("INVALID_HTTPS_URL", "provenance.sourceUrl", "Expected a valid HTTPS URL."));
            if (!isIsoDateTime(category.provenance.retrievedAt)) errors.push(issue("INVALID_DATETIME", "provenance.retrievedAt", "Expected an ISO 8601 date-time."));
            if (!isNonEmptyString(category.provenance.verifiedBy)) errors.push(issue("REQUIRED_STRING", "provenance.verifiedBy", "Expected a non-empty string."));
            if (!["VERIFIED", "PENDING", "REJECTED"].includes(category.provenance.verificationStatus)) errors.push(issue("INVALID_ENUM", "provenance.verificationStatus", "Invalid verification status."));
        }

        if (!isPlainObject(category.metadata)) {
            errors.push(issue("REQUIRED_OBJECT", "metadata", "Expected an object."));
        } else {
            if (!isIsoDateTime(category.metadata.createdAt)) errors.push(issue("INVALID_DATETIME", "metadata.createdAt", "Expected an ISO 8601 date-time."));
            if (!isIsoDateTime(category.metadata.updatedAt)) errors.push(issue("INVALID_DATETIME", "metadata.updatedAt", "Expected an ISO 8601 date-time."));
            if (isIsoDateTime(category.metadata.createdAt) && isIsoDateTime(category.metadata.updatedAt) && Date.parse(category.metadata.updatedAt) < Date.parse(category.metadata.createdAt)) {
                errors.push(issue("INVALID_DATE_ORDER", "metadata.updatedAt", "updatedAt must not precede createdAt."));
            }
        }
    }

    return Object.freeze({
        valid: errors.length === 0,
        errors: Object.freeze(errors),
        warnings: Object.freeze(warnings),
        validatorVersion: CATEGORY_VALIDATOR_VERSION
    });
}

function collectDuplicates(categories, label, getter, errors) {
    const seen = new Map();
    categories.forEach((category, index) => {
        for (const rawValue of getter(category)) {
            if (!isNonEmptyString(rawValue)) continue;
            const value = rawValue.trim().toLowerCase();
            if (seen.has(value)) errors.push(issue("DUPLICATE_REPOSITORY_IDENTITY", `${label}[${index}]`, `Duplicate ${label}: ${rawValue}.`));
            else seen.set(value, index);
        }
    });
}

export function validateCategoryRepository(categories) {
    if (!Array.isArray(categories)) throw new TypeError("categories must be an array.");
    const categoryReports = categories.map((category) => ({
        categoryId: category?.categoryId ?? null,
        report: validateCategory(category)
    }));
    const errors = categoryReports.flatMap(({ categoryId, report }) => report.errors.map((entry) => issue(entry.code, `${categoryId ?? "unknown"}:${entry.path}`, entry.message)));
    collectDuplicates(categories, "categoryId", (category) => [category?.categoryId], errors);
    collectDuplicates(categories, "slug", (category) => [category?.slug], errors);
    collectDuplicates(categories, "nameOrAlias", (category) => [category?.displayName, category?.shortName, ...(Array.isArray(category?.aliases) ? category.aliases : [])], errors);

    const ids = new Set(categories.map((category) => category?.categoryId));
    categories.forEach((category) => {
        if (category?.parentCategoryId && !ids.has(category.parentCategoryId)) {
            errors.push(issue("MISSING_PARENT_CATEGORY", `${category.categoryId}:parentCategoryId`, `Parent category not found: ${category.parentCategoryId}.`));
        }
        if (category?.parentCategoryId === category?.categoryId) {
            errors.push(issue("SELF_REFERENCING_CATEGORY", `${category.categoryId}:parentCategoryId`, "A category cannot be its own parent."));
        }
    });

    return Object.freeze({
        valid: errors.length === 0,
        errors: Object.freeze(errors),
        warnings: Object.freeze([]),
        categoryReports: Object.freeze(categoryReports),
        validatorVersion: CATEGORY_VALIDATOR_VERSION
    });
}

export { CATEGORY_VALIDATOR_VERSION };
