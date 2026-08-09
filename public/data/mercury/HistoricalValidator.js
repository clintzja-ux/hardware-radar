export const HISTORICAL_VALIDATOR_VERSION = "1.0.0";

export function validateHistoricalQuery(query = {}) {
    const errors = [];
    if (!query || typeof query !== "object" || Array.isArray(query)) errors.push("QUERY_MUST_BE_OBJECT");
    else {
        if (typeof query.atlasProductId !== "string" || query.atlasProductId.trim().length === 0) errors.push("ATLAS_PRODUCT_ID_REQUIRED");
        for (const field of ["currency", "condition", "retailerId", "marketplace"]) {
            if (query[field] != null && (typeof query[field] !== "string" || query[field].trim().length === 0)) errors.push(`${field.toUpperCase()}_INVALID`);
        }
        if (query.currency != null && !/^[A-Z]{3}$/.test(query.currency)) errors.push("CURRENCY_INVALID");
    }
    return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors), validatorVersion: HISTORICAL_VALIDATOR_VERSION });
}
