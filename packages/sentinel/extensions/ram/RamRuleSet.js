import {
    FORGE_EFFECTS,
    VALIDATION_SEVERITIES
} from "../../types/ValidationResult.js";
import RamMessages from "./RamMessages.js";
import {
    validateCapacityInvariant,
    validateKitStateConsistency,
    validateTimingValueIntegrity,
    validateUnitNormalization,
    validateUnknownValueIntegrity
} from "./RamValidators.js";

const RULE_SET_VERSION = "1.0.0";
const OWNER = "Sentinel";
const OBJECT_TYPES = Object.freeze(["ATLAS_RECORD"]);

const RULE_STATUS = Object.freeze({
    ACTIVE: "ACTIVE"
});

const AUTOMATION_LEVEL = Object.freeze({
    AUTOMATED: "AUTOMATED"
});

const RULE_CATEGORIES = Object.freeze({
    INTEGRITY: "INTEGRITY",
    CONSISTENCY: "CONSISTENCY",
    DATA_QUALITY: "DATA_QUALITY",
    NORMALIZATION: "NORMALIZATION"
});

function messageFor(ruleId) {
    const message = RamMessages[ruleId];

    if (!message) {
        throw new Error(`Missing RAM message catalog entry for ${ruleId}.`);
    }

    return message;
}

function createRule({
    ruleId,
    category,
    severity,
    failureCode,
    forgeEffect,
    validate,
    inputs,
    condition,
    passCriteria,
    evidenceFields,
    testCases
}) {
    const message = messageFor(ruleId);

    return Object.freeze({
        ruleId,
        id: ruleId,
        title: message.title,
        domain: "ATLAS",
        category,
        objectTypes: OBJECT_TYPES,
        sourceRequirements: Object.freeze([]),
        severity,
        status: RULE_STATUS.ACTIVE,
        automationLevel: AUTOMATION_LEVEL.AUTOMATED,
        inputs: Object.freeze([...inputs]),
        condition,
        passCriteria,
        failureCode,
        messageKey: ruleId,
        passMessage: message.pass,
        failureMessage: message.fail,
        forgeEffect,
        remediation: message.remediation,
        evidenceFields: Object.freeze([...evidenceFields]),
        testCases: Object.freeze([...testCases]),
        introducedInVersion: RULE_SET_VERSION,
        owner: OWNER,
        validate
    });
}

const rules = Object.freeze([
    createRule({
        ruleId: "ATL-RAM-001",
        category: RULE_CATEGORIES.INTEGRITY,
        severity: VALIDATION_SEVERITIES.CRITICAL,
        failureCode: "CAPACITY_INVARIANT_FAILED",
        forgeEffect: FORGE_EFFECTS.BLOCKED,
        validate: validateCapacityInvariant,
        inputs: [
            "extension.data.capacity.capacityGb",
            "extension.data.capacity.moduleCount",
            "extension.data.capacity.capacityPerModuleGb"
        ],
        condition: "capacityGb = moduleCount × capacityPerModuleGb",
        passCriteria: "All capacity operands are positive integers and the capacity invariant is satisfied.",
        evidenceFields: [
            "capacityGb",
            "moduleCount",
            "capacityPerModuleGb",
            "expectedCapacityGb",
            "operandsValid"
        ],
        testCases: ["SEN-TC-001", "SEN-TC-002"]
    }),
    createRule({
        ruleId: "ATL-RAM-005",
        category: RULE_CATEGORIES.CONSISTENCY,
        severity: VALIDATION_SEVERITIES.HIGH,
        failureCode: "KIT_STATE_MISMATCH",
        forgeEffect: FORGE_EFFECTS.BLOCKED,
        validate: validateKitStateConsistency,
        inputs: [
            "extension.data.capacity.moduleCount",
            "extension.data.classification.isKit"
        ],
        condition: "moduleCount > 1 requires isKit = true; moduleCount = 1 requires isKit = false.",
        passCriteria: "Kit classification matches the module count.",
        evidenceFields: [
            "moduleCount",
            "isKit",
            "expectedIsKit",
            "operandsValid"
        ],
        testCases: ["RAM-RULE-005-PASS", "RAM-RULE-005-FAIL"]
    }),
    createRule({
        ruleId: "ATL-RAM-009",
        category: RULE_CATEGORIES.DATA_QUALITY,
        severity: VALIDATION_SEVERITIES.HIGH,
        failureCode: "UNSUPPORTED_INFERENCE_DETECTED",
        forgeEffect: FORGE_EFFECTS.BLOCKED,
        validate: validateUnknownValueIntegrity,
        inputs: ["extension.data"],
        condition: "Unknown optional values use null unless a canonical enum explicitly permits UNKNOWN.",
        passCriteria: "No unsupported placeholder values are present.",
        evidenceFields: ["unsupportedPlaceholders", "ramDataAvailable"],
        testCases: ["RAM-RULE-009-PASS", "RAM-RULE-009-FAIL"]
    }),
    createRule({
        ruleId: "ATL-RAM-011",
        category: RULE_CATEGORIES.INTEGRITY,
        severity: VALIDATION_SEVERITIES.HIGH,
        failureCode: "TIMING_DATA_INVALID",
        forgeEffect: FORGE_EFFECTS.BLOCKED,
        validate: validateTimingValueIntegrity,
        inputs: [
            "extension.data.performance.casLatency",
            "extension.data.performance.tRcd",
            "extension.data.performance.tRp",
            "extension.data.performance.tRas",
            "extension.data.performance.primaryTimings"
        ],
        condition: "Timing components are positive integers and primaryTimings matches casLatency-tRcd-tRp-tRas.",
        passCriteria: "Timing fields are all null, or all structured timing values and the canonical tuple are valid.",
        evidenceFields: [
            "casLatency",
            "tRcd",
            "tRp",
            "tRas",
            "primaryTimings",
            "expectedPrimaryTimings",
            "presentTimingCount",
            "timingValuesValid",
            "timingTupleValid"
        ],
        testCases: ["RAM-RULE-011-PASS", "RAM-RULE-011-FAIL"]
    }),
    createRule({
        ruleId: "ATL-RAM-012",
        category: RULE_CATEGORIES.NORMALIZATION,
        severity: VALIDATION_SEVERITIES.MEDIUM,
        failureCode: "UNIT_NORMALIZATION_FAILED",
        forgeEffect: FORGE_EFFECTS.REVIEW,
        validate: validateUnitNormalization,
        inputs: [
            "extension.data.performance",
            "extension.data.electrical",
            "extension.data.physical"
        ],
        condition: "Canonical numeric fields use Atlas units and noncanonical unit aliases are absent.",
        passCriteria: "Canonical unit-bearing fields are numeric or null and no duplicate alternative unit fields exist.",
        evidenceFields: [
            "invalidCanonicalFields",
            "noncanonicalFields",
            "ramDataAvailable"
        ],
        testCases: ["RAM-RULE-012-PASS", "RAM-RULE-012-FAIL"]
    })
]);

export const RamRuleSet = Object.freeze({
    id: "atlas-ram",
    version: RULE_SET_VERSION,
    extension: "ram",
    rules,
    metadata: Object.freeze({
        extension: "ram",
        domain: "ATLAS",
        owner: OWNER,
        status: RULE_STATUS.ACTIVE,
        description: "Deterministic Sentinel validation rules for the Atlas RAM extension."
    })
});

export { RULE_CATEGORIES };
export default RamRuleSet;
