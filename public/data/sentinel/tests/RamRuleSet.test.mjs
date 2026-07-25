import assert from "node:assert/strict";
import RuleRegistry from "../core/RuleRegistry.js";
import ExtensionValidator from "../validators/ExtensionValidator.js";
import {
    FORGE_EFFECTS,
    VALIDATION_RESULTS,
    VALIDATION_SEVERITIES
} from "../types/ValidationResult.js";
import RamMessages from "../extensions/ram/RamMessages.js";
import RamRuleSet, {
    RULE_CATEGORIES
} from "../extensions/ram/RamRuleSet.js";

const EXPECTED_RULE_IDS = [
    "ATL-RAM-001",
    "ATL-RAM-005",
    "ATL-RAM-009",
    "ATL-RAM-011",
    "ATL-RAM-012"
];
const VALID_SEVERITIES = new Set(Object.values(VALIDATION_SEVERITIES));
const VALID_CATEGORIES = new Set(Object.values(RULE_CATEGORIES));
const VALID_FORGE_EFFECTS = new Set(Object.values(FORGE_EFFECTS));

assert.equal(RamRuleSet.id, "atlas-ram");
assert.equal(RamRuleSet.version, "1.0.0");
assert.equal(RamRuleSet.extension, "ram");
assert.equal(RamRuleSet.metadata.extension, "ram");
assert.equal(RamRuleSet.rules.length, 5);
assert.deepEqual(
    RamRuleSet.rules.map(({ ruleId }) => ruleId),
    EXPECTED_RULE_IDS
);

assert.equal(Object.isFrozen(RamRuleSet), true);
assert.equal(Object.isFrozen(RamRuleSet.rules), true);
assert.equal(Object.isFrozen(RamRuleSet.metadata), true);

const ids = RamRuleSet.rules.map(({ ruleId }) => ruleId);
assert.equal(new Set(ids).size, ids.length, "RAM rule IDs must be unique.");

for (const rule of RamRuleSet.rules) {
    assert.equal(rule.id, rule.ruleId);
    assert.equal(typeof rule.validate, "function");
    assert.equal(VALID_SEVERITIES.has(rule.severity), true);
    assert.equal(VALID_CATEGORIES.has(rule.category), true);
    assert.equal(VALID_FORGE_EFFECTS.has(rule.forgeEffect), true);
    assert.equal(rule.domain, "ATLAS");
    assert.equal(rule.status, "ACTIVE");
    assert.equal(rule.automationLevel, "AUTOMATED");
    assert.equal(rule.owner, "Sentinel");
    assert.equal(rule.introducedInVersion, RamRuleSet.version);
    assert.equal(rule.messageKey, rule.ruleId);
    assert.ok(RamMessages[rule.messageKey]);
    assert.equal(rule.title, RamMessages[rule.messageKey].title);
    assert.equal(rule.passMessage, RamMessages[rule.messageKey].pass);
    assert.equal(rule.failureMessage, RamMessages[rule.messageKey].fail);
    assert.equal(rule.remediation, RamMessages[rule.messageKey].remediation);
    assert.equal(typeof rule.failureCode, "string");
    assert.ok(rule.failureCode.length > 0);
    assert.equal(Object.isFrozen(rule), true);
    assert.equal(Object.isFrozen(rule.inputs), true);
    assert.equal(Object.isFrozen(rule.evidenceFields), true);
    assert.equal(Object.isFrozen(rule.testCases), true);
}

assert.deepEqual(
    RamRuleSet.rules.map(({ severity }) => severity),
    [
        VALIDATION_SEVERITIES.CRITICAL,
        VALIDATION_SEVERITIES.HIGH,
        VALIDATION_SEVERITIES.HIGH,
        VALIDATION_SEVERITIES.HIGH,
        VALIDATION_SEVERITIES.MEDIUM
    ]
);
assert.deepEqual(
    RamRuleSet.rules.map(({ forgeEffect }) => forgeEffect),
    [
        FORGE_EFFECTS.BLOCKED,
        FORGE_EFFECTS.BLOCKED,
        FORGE_EFFECTS.BLOCKED,
        FORGE_EFFECTS.BLOCKED,
        FORGE_EFFECTS.REVIEW
    ]
);

{
    const registry = new RuleRegistry();
    const registered = registry.register(RamRuleSet);

    assert.equal(registry.size, 1);
    assert.strictEqual(registry.get("atlas-ram"), registered);
    assert.deepEqual(registry.getByExtension("ram"), [registered]);
    assert.equal(registered.rules.length, 5);
}

{
    const validSubject = Object.freeze({
        extension: Object.freeze({
            data: Object.freeze({
                capacity: Object.freeze({
                    capacityGb: 32,
                    moduleCount: 2,
                    capacityPerModuleGb: 16,
                    rankConfiguration: "UNKNOWN"
                }),
                classification: Object.freeze({
                    isKit: true,
                    buffering: "UNKNOWN",
                    eccType: "UNKNOWN"
                }),
                performance: Object.freeze({
                    dataRateMtps: 6000,
                    casLatency: 30,
                    tRcd: 36,
                    tRp: 36,
                    tRas: 76,
                    primaryTimings: "30-36-36-76",
                    xmpSupport: "UNKNOWN",
                    expoSupport: "UNKNOWN"
                }),
                electrical: Object.freeze({
                    ratedVoltage: 1.35,
                    baseVoltage: 1.1,
                    pmicLocation: "UNKNOWN"
                }),
                physical: Object.freeze({
                    heightMm: 35,
                    lengthMm: 133.35,
                    widthMm: 7,
                    moduleWeightGrams: 45,
                    kitWeightGrams: 90
                })
            })
        })
    });
    const results = new ExtensionValidator().validate({
        subject: validSubject,
        ruleSets: [RamRuleSet],
        context: Object.freeze({ source: "RamRuleSet.test" })
    });

    assert.equal(results.length, 5);
    assert.deepEqual(
        results.map(({ ruleId }) => ruleId),
        EXPECTED_RULE_IDS
    );
    assert.equal(
        results.every(({ result }) => result === VALIDATION_RESULTS.PASS),
        true
    );
}

console.log("RAM rule set tests passed.");
