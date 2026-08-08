import { validateProvenance as validateCanonicalProvenance } from "./ProvenanceValidator.js";
const OBSERVATION_VALIDATOR_VERSION = "mercury-observation-validator-1.0.0";

const TOP_LEVEL_KEYS = Object.freeze([
    "observationId",
    "schemaVersion",
    "atlasProductId",
    "retailerId",
    "marketplace",
    "observationTime",
    "sourceMethod",
    "lifecycleStatus",
    "validationStatus",
    "supersedesObservationId",
    "expiresAt",
    "offer",
    "provenance",
    "compliance",
    "metadata"
]);

const ENUMS = Object.freeze({
    sourceMethod: Object.freeze(["API", "MANUAL", "FEED", "IMPORT", "AUTOMATED_CHECK"]),
    lifecycleStatus: Object.freeze(["DISCOVERED", "RETRIEVED", "VALIDATED", "PUBLISHABLE", "PUBLISHED", "SUPERSEDED", "ARCHIVED"]),
    validationStatus: Object.freeze(["PASS", "WARN", "FAIL"]),
    availability: Object.freeze(["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK", "PREORDER", "BACKORDER", "DISCONTINUED", "UNKNOWN"]),
    condition: Object.freeze(["NEW", "OPEN_BOX", "MANUFACTURER_REFURBISHED", "SELLER_REFURBISHED", "USED"]),
    sellerType: Object.freeze(["MANUFACTURER", "AUTHORIZED_RESELLER", "RETAILER", "MARKETPLACE", "UNKNOWN"])
});

function deepFreeze(value) {
    if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
    return value;
}

function issue(code, path, message) {
    return Object.freeze({ code, path, message });
}

function isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
}

function isIsoDateTime(value) {
    return isNonEmptyString(value) && Number.isFinite(Date.parse(value)) && value.includes("T");
}

function isUri(value) {
    if (!isNonEmptyString(value)) return false;
    try {
        const parsed = new URL(value);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
        return false;
    }
}

function requireString(parent, key, path, errors, pattern = null) {
    const value = parent?.[key];
    const fieldPath = path ? `${path}.${key}` : key;
    if (!isNonEmptyString(value)) {
        errors.push(issue("MISSING_STRING", fieldPath, "Expected a non-empty string."));
        return value;
    }
    if (pattern && !pattern.test(value)) {
        errors.push(issue("PATTERN_MISMATCH", fieldPath, "Value does not match the canonical format."));
    }
    return value;
}

function requireEnum(parent, key, path, errors, values) {
    const value = parent?.[key];
    if (!values.includes(value)) {
        errors.push(issue("INVALID_ENUM", `${path}.${key}`, `Expected one of: ${values.join(", ")}.`));
    }
    return value;
}

function requireObject(parent, key, path, errors) {
    const value = parent?.[key];
    const fieldPath = path ? `${path}.${key}` : key;
    if (!isPlainObject(value)) {
        errors.push(issue("MISSING_OBJECT", fieldPath, "Expected an object."));
        return null;
    }
    return value;
}

function validateTopLevel(observation, errors) {
    if (!isPlainObject(observation)) {
        errors.push(issue("INVALID_OBSERVATION", "$", "Observation must be a plain JSON object."));
        return false;
    }
    for (const key of TOP_LEVEL_KEYS) {
        if (!(key in observation)) errors.push(issue("MISSING_TOP_LEVEL_FIELD", key, `Missing top-level field: ${key}.`));
    }
    for (const key of Object.keys(observation)) {
        if (!TOP_LEVEL_KEYS.includes(key)) errors.push(issue("UNEXPECTED_TOP_LEVEL_FIELD", key, `Unexpected top-level field: ${key}.`));
    }
    return true;
}

function validateCore(observation, errors) {
    requireString(observation, "observationId", "", errors, /^mer_obs_[0-9]{9}$/);
    requireString(observation, "schemaVersion", "", errors, /^[0-9]+\.[0-9]+(?:\.[0-9]+)?$/);
    requireString(observation, "atlasProductId", "", errors, /^[a-z][a-z0-9]*(?:_[a-z0-9]+)+$/);
    requireString(observation, "retailerId", "", errors, /^RETAILER-[0-9]{4}$/);
    requireString(observation, "marketplace", "", errors, /^[a-z0-9.-]+$/);
    requireEnum(observation, "sourceMethod", "$", errors, ENUMS.sourceMethod);
    requireEnum(observation, "lifecycleStatus", "$", errors, ENUMS.lifecycleStatus);
    requireEnum(observation, "validationStatus", "$", errors, ENUMS.validationStatus);

    if (!isIsoDateTime(observation.observationTime)) {
        errors.push(issue("INVALID_DATETIME", "observationTime", "Expected an ISO 8601 date-time."));
    }
    if (observation.expiresAt !== null && !isIsoDateTime(observation.expiresAt)) {
        errors.push(issue("INVALID_DATETIME", "expiresAt", "Expected null or an ISO 8601 date-time."));
    }
    if (observation.supersedesObservationId !== null &&
        (!isNonEmptyString(observation.supersedesObservationId) || !/^mer_obs_[0-9]{9}$/.test(observation.supersedesObservationId))) {
        errors.push(issue("INVALID_OBSERVATION_REFERENCE", "supersedesObservationId", "Expected null or a canonical Mercury observation ID."));
    }
    if (observation.expiresAt !== null && isIsoDateTime(observation.observationTime) && isIsoDateTime(observation.expiresAt) &&
        Date.parse(observation.expiresAt) <= Date.parse(observation.observationTime)) {
        errors.push(issue("INVALID_DATE_ORDER", "expiresAt", "expiresAt must be later than observationTime."));
    }
}

function validateOffer(observation, errors) {
    const offer = requireObject(observation, "offer", "$", errors);
    if (!offer) return;
    if (typeof offer.price !== "number" || !Number.isFinite(offer.price) || offer.price <= 0) {
        errors.push(issue("INVALID_PRICE", "offer.price", "Expected a finite price greater than zero."));
    }
    requireString(offer, "currency", "offer", errors, /^[A-Z]{3}$/);
    requireEnum(offer, "availability", "offer", errors, ENUMS.availability);
    requireEnum(offer, "condition", "offer", errors, ENUMS.condition);
    requireEnum(offer, "sellerType", "offer", errors, ENUMS.sellerType);
    if (!isUri(offer.sourceUrl)) errors.push(issue("INVALID_URI", "offer.sourceUrl", "Expected an absolute HTTP or HTTPS URL."));

    const shipping = requireObject(offer, "shipping", "offer", errors);
    if (shipping) {
        if (typeof shipping.costKnown !== "boolean") errors.push(issue("INVALID_BOOLEAN", "offer.shipping.costKnown", "Expected a boolean."));
        if (shipping.cost !== null && (typeof shipping.cost !== "number" || shipping.cost < 0)) errors.push(issue("INVALID_SHIPPING_COST", "offer.shipping.cost", "Expected null or a non-negative number."));
        if (shipping.currency !== null && (!isNonEmptyString(shipping.currency) || !/^[A-Z]{3}$/.test(shipping.currency))) errors.push(issue("INVALID_CURRENCY", "offer.shipping.currency", "Expected null or a three-letter currency code."));
    }
    const affiliate = requireObject(offer, "affiliate", "offer", errors);
    if (affiliate && typeof affiliate.isAffiliateLink !== "boolean") errors.push(issue("INVALID_BOOLEAN", "offer.affiliate.isAffiliateLink", "Expected a boolean."));
}

function validateProvenance(observation, errors) {
    const report = validateCanonicalProvenance(observation.provenance, {
        observationTime: observation.observationTime,
        sourceMethod: observation.sourceMethod,
        marketplace: observation.marketplace
    });
    for (const entry of report.errors) errors.push(issue(entry.code, entry.path, entry.message));
}

function validateCompliance(observation, errors) {
    const compliance = requireObject(observation, "compliance", "$", errors);
    if (!compliance) return;
    requireString(compliance, "licenseContext", "compliance", errors);
    for (const key of ["requiredDisclosureShown", "requiredPriceDisclaimerShown", "retailerContentDisclaimerShown"]) {
        if (typeof compliance[key] !== "boolean") errors.push(issue("INVALID_BOOLEAN", `compliance.${key}`, "Expected a boolean."));
    }
}

function validateMetadata(observation, errors) {
    const metadata = requireObject(observation, "metadata", "$", errors);
    if (!metadata) return;
    if (!isIsoDateTime(metadata.createdAt)) errors.push(issue("INVALID_DATETIME", "metadata.createdAt", "Expected an ISO 8601 date-time."));
    requireString(metadata, "createdBy", "metadata", errors);
}

export function createObservationIdentityTuple(observation) {
    if (!isPlainObject(observation)) throw new TypeError("observation must be an object.");
    const fields = ["atlasProductId", "retailerId", "marketplace", "observationTime", "sourceMethod"];
    for (const field of fields) {
        if (!isNonEmptyString(observation[field])) throw new TypeError(`${field} must be a non-empty string.`);
    }
    return fields.map((field) => observation[field].trim().toLowerCase()).join("|");
}

export function validateObservation(observation) {
    const errors = [];
    const warnings = [];
    if (validateTopLevel(observation, errors)) {
        validateCore(observation, errors);
        validateOffer(observation, errors);
        validateProvenance(observation, errors);
        validateCompliance(observation, errors);
        validateMetadata(observation, errors);
    }
    return deepFreeze({
        valid: errors.length === 0,
        errors,
        warnings,
        validatorVersion: OBSERVATION_VALIDATOR_VERSION
    });
}

export function validateObservationRepository(observations, { atlasProductIds = null, retailerIds = null } = {}) {
    if (!Array.isArray(observations)) throw new TypeError("observations must be an array.");
    const errors = [];
    const warnings = [];
    const reports = observations.map((observation) => ({
        observationId: observation?.observationId ?? null,
        report: validateObservation(observation)
    }));

    for (const { observationId, report } of reports) {
        for (const entry of report.errors) {
            errors.push(issue(entry.code, `${observationId ?? "unknown"}.${entry.path}`, entry.message));
        }
    }

    const seenIds = new Set();
    const seenTuples = new Set();
    for (const observation of observations) {
        const id = observation?.observationId;
        if (isNonEmptyString(id)) {
            const normalizedId = id.toLowerCase();
            if (seenIds.has(normalizedId)) errors.push(issue("DUPLICATE_OBSERVATION_ID", id, `Duplicate observation ID: ${id}.`));
            seenIds.add(normalizedId);
        }
        try {
            const tuple = createObservationIdentityTuple(observation);
            if (seenTuples.has(tuple)) errors.push(issue("DUPLICATE_OBSERVATION_TUPLE", id ?? "unknown", "Duplicate observation identity tuple."));
            seenTuples.add(tuple);
        } catch {
            // Structural validation reports the missing tuple fields.
        }

        if (atlasProductIds instanceof Set && isNonEmptyString(observation?.atlasProductId) && !atlasProductIds.has(observation.atlasProductId.toLowerCase())) {
            errors.push(issue("UNKNOWN_ATLAS_PRODUCT", id ?? "unknown", `Atlas product does not exist: ${observation.atlasProductId}.`));
        }
        if (retailerIds instanceof Set && isNonEmptyString(observation?.retailerId) && !retailerIds.has(observation.retailerId.toLowerCase())) {
            errors.push(issue("UNKNOWN_RETAILER", id ?? "unknown", `Retailer does not exist: ${observation.retailerId}.`));
        }
    }

    return deepFreeze({
        valid: errors.length === 0,
        errors,
        warnings,
        observationReports: reports,
        validatorVersion: OBSERVATION_VALIDATOR_VERSION
    });
}

export { OBSERVATION_VALIDATOR_VERSION };
