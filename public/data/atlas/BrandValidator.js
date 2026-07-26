const BRAND_VALIDATOR_VERSION = "1.0.0";

const REQUIRED_KEYS = Object.freeze([
    "brandId",
    "schemaVersion",
    "slug",
    "displayName",
    "legalName",
    "country",
    "website",
    "manufacturerType",
    "status",
    "aliases",
    "supportedCategories",
    "provenance",
    "metadata"
]);

const ENUMS = Object.freeze({
    manufacturerType: [
        "HARDWARE_MANUFACTURER",
        "COMPONENT_MANUFACTURER",
        "OEM",
        "BRAND_OWNER",
        "OTHER"
    ],
    status: ["ACTIVE", "INACTIVE", "ARCHIVED"],
    verificationStatus: ["VERIFIED", "PENDING", "REJECTED"]
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

function isHttpsUrl(value) {
    if (!isNonEmptyString(value)) return false;

    try {
        const url = new URL(value);
        return url.protocol === "https:" && Boolean(url.hostname);
    } catch {
        return false;
    }
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
}

function validateStringArray(value, path, errors, pattern = null) {
    if (!Array.isArray(value)) {
        errors.push(issue("INVALID_ARRAY", path, "Expected an array."));
        return;
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
        } else {
            seen.add(normalized);
        }
    });
}

export function validateBrand(brand) {
    const errors = [];
    const warnings = [];

    if (!isPlainObject(brand)) {
        errors.push(issue("INVALID_BRAND", "$", "Brand must be a plain JSON object."));
    } else {
        for (const key of REQUIRED_KEYS) {
            if (!(key in brand)) {
                errors.push(issue("MISSING_FIELD", key, `Missing required field: ${key}.`));
            }
        }

        for (const key of Object.keys(brand)) {
            if (!REQUIRED_KEYS.includes(key)) {
                errors.push(issue("UNEXPECTED_FIELD", key, `Unexpected field: ${key}.`));
            }
        }

        requireString(brand, "brandId", "$", errors, /^BRAND-[A-Z0-9]+(?:-[A-Z0-9]+)*$/);
        requireString(brand, "schemaVersion", "$", errors, /^[0-9]+\.[0-9]+\.[0-9]+$/);
        requireString(brand, "slug", "$", errors, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
        requireString(brand, "displayName", "$", errors);
        requireString(brand, "legalName", "$", errors);
        requireString(brand, "country", "$", errors);
        requireEnum(brand, "manufacturerType", "$", errors, ENUMS.manufacturerType);
        requireEnum(brand, "status", "$", errors, ENUMS.status);

        if (!isHttpsUrl(brand.website)) {
            errors.push(issue("INVALID_HTTPS_URL", "website", "Expected a valid HTTPS URL."));
        }

        validateStringArray(brand.aliases, "aliases", errors);
        validateStringArray(
            brand.supportedCategories,
            "supportedCategories",
            errors,
            /^CAT-[A-Z0-9]+(?:-[A-Z0-9]+)*$/
        );

        if (!isPlainObject(brand.provenance)) {
            errors.push(issue("REQUIRED_OBJECT", "provenance", "Expected an object."));
        } else {
            if (!isHttpsUrl(brand.provenance.sourceUrl)) {
                errors.push(issue("INVALID_HTTPS_URL", "provenance.sourceUrl", "Expected a valid HTTPS URL."));
            }
            if (!isIsoDateTime(brand.provenance.retrievedAt)) {
                errors.push(issue("INVALID_DATETIME", "provenance.retrievedAt", "Expected an ISO 8601 date-time."));
            }
            requireString(brand.provenance, "verifiedBy", "provenance", errors);
            requireEnum(
                brand.provenance,
                "verificationStatus",
                "provenance",
                errors,
                ENUMS.verificationStatus
            );
        }

        if (!isPlainObject(brand.metadata)) {
            errors.push(issue("REQUIRED_OBJECT", "metadata", "Expected an object."));
        } else {
            if (!isIsoDateTime(brand.metadata.createdAt)) {
                errors.push(issue("INVALID_DATETIME", "metadata.createdAt", "Expected an ISO 8601 date-time."));
            }
            if (!isIsoDateTime(brand.metadata.updatedAt)) {
                errors.push(issue("INVALID_DATETIME", "metadata.updatedAt", "Expected an ISO 8601 date-time."));
            }
            if (
                isIsoDateTime(brand.metadata.createdAt) &&
                isIsoDateTime(brand.metadata.updatedAt) &&
                Date.parse(brand.metadata.updatedAt) < Date.parse(brand.metadata.createdAt)
            ) {
                errors.push(issue(
                    "INVALID_DATE_ORDER",
                    "metadata.updatedAt",
                    "updatedAt must not precede createdAt."
                ));
            }
        }
    }

    return Object.freeze({
        valid: errors.length === 0,
        errors: Object.freeze(errors),
        warnings: Object.freeze(warnings),
        validatorVersion: BRAND_VALIDATOR_VERSION
    });
}

function collectDuplicates(brands, path, getValues, errors) {
    const seen = new Map();

    brands.forEach((brand, index) => {
        const values = getValues(brand);

        for (const rawValue of values) {
            if (!isNonEmptyString(rawValue)) continue;

            const value = rawValue.trim().toLowerCase();
            if (seen.has(value)) {
                errors.push(issue(
                    "DUPLICATE_REPOSITORY_IDENTITY",
                    `${path}[${index}]`,
                    `Duplicate ${path}: ${rawValue}.`
                ));
            } else {
                seen.set(value, index);
            }
        }
    });
}

export function validateBrandRepository(brands) {
    if (!Array.isArray(brands)) {
        throw new TypeError("brands must be an array.");
    }

    const brandReports = brands.map((brand) => ({
        brandId: brand?.brandId ?? null,
        report: validateBrand(brand)
    }));

    const errors = brandReports.flatMap(({ brandId, report }) =>
        report.errors.map((entry) => issue(
            entry.code,
            `${brandId ?? "unknown"}:${entry.path}`,
            entry.message
        ))
    );

    collectDuplicates(brands, "brandId", (brand) => [brand?.brandId], errors);
    collectDuplicates(brands, "slug", (brand) => [brand?.slug], errors);
    collectDuplicates(brands, "displayName", (brand) => [brand?.displayName], errors);
    collectDuplicates(
        brands,
        "nameOrAlias",
        (brand) => [brand?.displayName, ...(Array.isArray(brand?.aliases) ? brand.aliases : [])],
        errors
    );

    return Object.freeze({
        valid: errors.length === 0,
        errors: Object.freeze(errors),
        warnings: Object.freeze([]),
        brandReports: Object.freeze(brandReports),
        validatorVersion: BRAND_VALIDATOR_VERSION
    });
}

export { BRAND_VALIDATOR_VERSION };
