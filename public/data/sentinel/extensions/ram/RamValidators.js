import { VALIDATION_RESULTS } from "../../types/ValidationResult.js";

const PLACEHOLDER_VALUES = new Set([
    "unknown",
    "n/a",
    "na",
    "tbd",
    "-",
    "?",
    "not known",
    "not available",
    "unspecified"
]);

const APPROVED_UNKNOWN_ENUM_PATHS = new Set([
    "classification.buffering",
    "classification.eccType",
    "capacity.rankConfiguration",
    "performance.xmpSupport",
    "performance.expoSupport",
    "electrical.pmicLocation"
]);

const TIMING_FIELDS = Object.freeze([
    "casLatency",
    "tRcd",
    "tRp",
    "tRas"
]);

const CANONICAL_NUMERIC_FIELDS = Object.freeze([
    ["performance", "dataRateMtps"],
    ["electrical", "ratedVoltage"],
    ["electrical", "baseVoltage"],
    ["physical", "heightMm"],
    ["physical", "lengthMm"],
    ["physical", "widthMm"],
    ["physical", "moduleWeightGrams"],
    ["physical", "kitWeightGrams"]
]);

const NONCANONICAL_UNIT_ALIASES = Object.freeze({
    performance: ["speed", "speedMhz", "speedMHz", "speedMtS", "dataRate", "dataRateMhz"],
    electrical: ["voltage", "ratedVoltageV", "baseVoltageV"],
    physical: [
        "height",
        "length",
        "width",
        "heightInches",
        "lengthInches",
        "widthInches",
        "moduleWeight",
        "kitWeight",
        "moduleWeightKg",
        "kitWeightKg"
    ]
});

function pass(evidence = {}) {
    return {
        result: VALIDATION_RESULTS.PASS,
        evidence
    };
}

function fail(evidence = {}) {
    return {
        result: VALIDATION_RESULTS.FAIL,
        evidence
    };
}

function isPlainObject(value) {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
        return false;
    }

    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
}

function getRamData(subject) {
    if (!isPlainObject(subject)) {
        return null;
    }

    const data = subject.extension?.data;
    return isPlainObject(data) ? data : null;
}

function isPositiveInteger(value) {
    return Number.isInteger(value) && value > 0;
}

function normalizePlaceholder(value) {
    return value.trim().toLowerCase();
}

function collectUnsupportedPlaceholders(value, path = "", findings = []) {
    if (Array.isArray(value)) {
        value.forEach((entry, index) => {
            collectUnsupportedPlaceholders(entry, `${path}[${index}]`, findings);
        });
        return findings;
    }

    if (isPlainObject(value)) {
        for (const [key, entry] of Object.entries(value)) {
            const entryPath = path ? `${path}.${key}` : key;
            collectUnsupportedPlaceholders(entry, entryPath, findings);
        }
        return findings;
    }

    if (typeof value !== "string") {
        return findings;
    }

    const normalized = normalizePlaceholder(value);
    const isApprovedUnknownEnum =
        normalized === "unknown" && APPROVED_UNKNOWN_ENUM_PATHS.has(path);

    if (PLACEHOLDER_VALUES.has(normalized) && !isApprovedUnknownEnum) {
        findings.push({ path, value });
    }

    return findings;
}

/**
 * ATL-RAM-001 — Capacity invariant.
 */
export function validateCapacityInvariant(subject, context = {}) {
    void context;
    const data = getRamData(subject);
    const capacity = data?.capacity;
    const capacityGb = capacity?.capacityGb;
    const moduleCount = capacity?.moduleCount;
    const capacityPerModuleGb = capacity?.capacityPerModuleGb;
    const operandsValid =
        isPositiveInteger(capacityGb) &&
        isPositiveInteger(moduleCount) &&
        isPositiveInteger(capacityPerModuleGb);
    const expectedCapacityGb = operandsValid
        ? moduleCount * capacityPerModuleGb
        : null;
    const evidence = {
        capacityGb: capacityGb ?? null,
        moduleCount: moduleCount ?? null,
        capacityPerModuleGb: capacityPerModuleGb ?? null,
        expectedCapacityGb,
        operandsValid
    };

    return operandsValid && capacityGb === expectedCapacityGb
        ? pass(evidence)
        : fail(evidence);
}

/**
 * ATL-RAM-005 — Kit-state consistency.
 */
export function validateKitStateConsistency(subject, context = {}) {
    void context;
    const data = getRamData(subject);
    const moduleCount = data?.capacity?.moduleCount;
    const isKit = data?.classification?.isKit;
    const operandsValid = isPositiveInteger(moduleCount) && typeof isKit === "boolean";
    const expectedIsKit = isPositiveInteger(moduleCount)
        ? moduleCount > 1
        : null;
    const evidence = {
        moduleCount: moduleCount ?? null,
        isKit: typeof isKit === "boolean" ? isKit : null,
        expectedIsKit,
        operandsValid
    };

    return operandsValid && isKit === expectedIsKit
        ? pass(evidence)
        : fail(evidence);
}

/**
 * ATL-RAM-009 — Unknown-value integrity.
 */
export function validateUnknownValueIntegrity(subject, context = {}) {
    void context;
    const data = getRamData(subject);

    if (!data) {
        return fail({
            unsupportedPlaceholders: [],
            ramDataAvailable: false
        });
    }

    const unsupportedPlaceholders = collectUnsupportedPlaceholders(data);
    const evidence = {
        unsupportedPlaceholders,
        ramDataAvailable: true
    };

    return unsupportedPlaceholders.length === 0
        ? pass(evidence)
        : fail(evidence);
}

/**
 * ATL-RAM-011 — Timing-value integrity.
 */
export function validateTimingValueIntegrity(subject, context = {}) {
    void context;
    const performance = getRamData(subject)?.performance;
    const timingValues = Object.fromEntries(
        TIMING_FIELDS.map((field) => [field, performance?.[field] ?? null])
    );
    const primaryTimings = performance?.primaryTimings ?? null;
    const presentTimingCount = TIMING_FIELDS.filter(
        (field) => timingValues[field] !== null
    ).length;
    const allUnknown = presentTimingCount === 0;
    const allPresent = presentTimingCount === TIMING_FIELDS.length;
    const valuesValid = allPresent && TIMING_FIELDS.every(
        (field) => isPositiveInteger(timingValues[field])
    );
    const expectedPrimaryTimings = valuesValid
        ? TIMING_FIELDS.map((field) => timingValues[field]).join("-")
        : null;
    const tupleValid = allUnknown
        ? primaryTimings === null
        : valuesValid && primaryTimings === expectedPrimaryTimings;
    const evidence = {
        ...timingValues,
        primaryTimings,
        expectedPrimaryTimings,
        presentTimingCount,
        timingValuesValid: allUnknown || valuesValid,
        timingTupleValid: tupleValid
    };

    return (allUnknown || allPresent) && (allUnknown || valuesValid) && tupleValid
        ? pass(evidence)
        : fail(evidence);
}

/**
 * ATL-RAM-012 — Unit normalization.
 */
export function validateUnitNormalization(subject, context = {}) {
    void context;
    const data = getRamData(subject);

    if (!data) {
        return fail({
            invalidCanonicalFields: [],
            noncanonicalFields: [],
            ramDataAvailable: false
        });
    }

    const invalidCanonicalFields = [];
    for (const [sectionName, fieldName] of CANONICAL_NUMERIC_FIELDS) {
        const value = data[sectionName]?.[fieldName];
        if (value !== undefined && value !== null && typeof value !== "number") {
            invalidCanonicalFields.push({
                path: `${sectionName}.${fieldName}`,
                value
            });
        }
    }

    const noncanonicalFields = [];
    for (const [sectionName, aliases] of Object.entries(NONCANONICAL_UNIT_ALIASES)) {
        const section = data[sectionName];
        if (!isPlainObject(section)) {
            continue;
        }

        for (const alias of aliases) {
            if (Object.prototype.hasOwnProperty.call(section, alias)) {
                noncanonicalFields.push({
                    path: `${sectionName}.${alias}`,
                    value: section[alias]
                });
            }
        }
    }

    const evidence = {
        invalidCanonicalFields,
        noncanonicalFields,
        ramDataAvailable: true
    };

    return invalidCanonicalFields.length === 0 && noncanonicalFields.length === 0
        ? pass(evidence)
        : fail(evidence);
}

export default Object.freeze({
    validateCapacityInvariant,
    validateKitStateConsistency,
    validateUnknownValueIntegrity,
    validateTimingValueIntegrity,
    validateUnitNormalization
});
