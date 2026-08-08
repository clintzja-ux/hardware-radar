import { PROVENANCE_SCHEMA_VERSION } from "./Provenance.js";

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

function isUriOrNull(value) {
    if (value === null) return true;
    if (!isNonEmptyString(value)) return false;
    try {
        const parsed = new URL(value);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
        return false;
    }
}

function deepFreeze(value) {
    if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
    return value;
}

export function validateProvenance(provenance, { observationTime = null, sourceMethod = null, marketplace = null } = {}) {
    const errors = [];
    const warnings = [];

    if (!isPlainObject(provenance)) {
        errors.push(issue("PROVENANCE_INVALID", "provenance", "Provenance must be an object."));
        return deepFreeze({ valid: false, errors, warnings });
    }

    if (provenance.schemaVersion !== PROVENANCE_SCHEMA_VERSION) {
        errors.push(issue("PROVENANCE_SCHEMA_VERSION", "provenance.schemaVersion", `Expected provenance schema version ${PROVENANCE_SCHEMA_VERSION}.`));
    }

    for (const section of ["source", "acquisition", "transformation", "validation"]) {
        if (!isPlainObject(provenance[section])) errors.push(issue("PROVENANCE_SECTION_MISSING", `provenance.${section}`, `Missing provenance ${section} section.`));
    }

    const source = provenance.source;
    if (isPlainObject(source)) {
        if (!isNonEmptyString(source.name)) errors.push(issue("PROVENANCE_SOURCE_NAME", "provenance.source.name", "Source name is required."));
        if (!isUriOrNull(source.uri)) errors.push(issue("PROVENANCE_SOURCE_URI", "provenance.source.uri", "Source URI must be null or an absolute HTTP/HTTPS URI."));
        if (!isNonEmptyString(source.marketplace)) errors.push(issue("PROVENANCE_MARKETPLACE", "provenance.source.marketplace", "Source marketplace is required."));
        if (marketplace && source.marketplace !== marketplace) errors.push(issue("PROVENANCE_MARKETPLACE_MISMATCH", "provenance.source.marketplace", "Provenance marketplace must equal observation marketplace."));
    }

    const acquisition = provenance.acquisition;
    if (isPlainObject(acquisition)) {
        if (!isNonEmptyString(acquisition.method)) errors.push(issue("PROVENANCE_ACQUISITION_METHOD", "provenance.acquisition.method", "Acquisition method is required."));
        if (!isIsoDateTime(acquisition.retrievedAt)) errors.push(issue("PROVENANCE_RETRIEVED_AT", "provenance.acquisition.retrievedAt", "retrievedAt must be an ISO 8601 date-time."));
        if (!isNonEmptyString(acquisition.retrievedBy)) errors.push(issue("PROVENANCE_RETRIEVED_BY", "provenance.acquisition.retrievedBy", "retrievedBy is required."));
        if (sourceMethod && acquisition.method !== sourceMethod) errors.push(issue("PROVENANCE_SOURCE_METHOD_MISMATCH", "provenance.acquisition.method", "Provenance acquisition method must equal observation sourceMethod."));
        if (observationTime && isIsoDateTime(acquisition.retrievedAt) && Date.parse(acquisition.retrievedAt) !== Date.parse(observationTime)) {
            errors.push(issue("PROVENANCE_TIME_MISMATCH", "provenance.acquisition.retrievedAt", "Provenance retrievedAt must equal observationTime."));
        }
    }

    const transformation = provenance.transformation;
    if (isPlainObject(transformation)) {
        if (!isNonEmptyString(transformation.adapterId)) errors.push(issue("PROVENANCE_ADAPTER_ID", "provenance.transformation.adapterId", "Adapter ID is required."));
        if (!isNonEmptyString(transformation.adapterVersion)) errors.push(issue("PROVENANCE_ADAPTER_VERSION", "provenance.transformation.adapterVersion", "Adapter version is required."));
        if (!isIsoDateTime(transformation.normalizedAt)) errors.push(issue("PROVENANCE_NORMALIZED_AT", "provenance.transformation.normalizedAt", "normalizedAt must be an ISO 8601 date-time."));
        if (isIsoDateTime(acquisition?.retrievedAt) && isIsoDateTime(transformation.normalizedAt) && Date.parse(transformation.normalizedAt) < Date.parse(acquisition.retrievedAt)) {
            errors.push(issue("PROVENANCE_DATE_ORDER", "provenance.transformation.normalizedAt", "normalizedAt must not precede retrievedAt."));
        }
    }

    const validation = provenance.validation;
    if (isPlainObject(validation)) {
        if (!isNonEmptyString(validation.validatorVersion)) errors.push(issue("PROVENANCE_VALIDATOR_VERSION", "provenance.validation.validatorVersion", "Validator version is required."));
        if (!isNonEmptyString(validation.complianceRuleSetVersion)) errors.push(issue("PROVENANCE_RULESET_VERSION", "provenance.validation.complianceRuleSetVersion", "Compliance rule-set version is required."));
    }

    return deepFreeze({ valid: errors.length === 0, errors, warnings });
}

export default validateProvenance;
