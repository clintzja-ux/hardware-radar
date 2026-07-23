import assert from "node:assert/strict";
import ExtensionValidator from "../validators/ExtensionValidator.js";
import ValidationResult, {
    FORGE_EFFECTS,
    VALIDATION_RESULTS,
    VALIDATION_SEVERITIES
} from "../types/ValidationResult.js";

function createRuleSet({
    id = "ram",
    extension = "ram",
    rules = []
} = {}) {
    return {
        id,
        version: "1.0.0",
        rules,
        metadata: extension ? { extension } : {}
    };
}

function createRule({
    id = "RAM-001",
    severity = VALIDATION_SEVERITIES.HIGH,
    validate = () => true,
    ...overrides
} = {}) {
    return {
        id,
        severity,
        failureCode: `${id}_FAILED`,
        failureMessage: `${id} failed.`,
        validate,
        ...overrides
    };
}

const validator = new ExtensionValidator();
const subject = { id: "HR-RAM-001", memoryType: "DDR5" };

{
    const results = validator.validate({ subject, ruleSets: [] });
    assert.deepEqual(results, []);
}

{
    const results = validator.validate({
        subject,
        ruleSets: [createRuleSet({ rules: [createRule()] })]
    });

    assert.equal(results.length, 1);
    assert.equal(results[0] instanceof ValidationResult, true);
    assert.equal(results[0].result, VALIDATION_RESULTS.PASS);
    assert.equal(results[0].ruleId, "RAM-001");
    assert.equal(results[0].metadata.validator, "ExtensionValidator");
    assert.equal(results[0].metadata.ruleSetId, "ram");
}

{
    const results = validator.validate({
        subject,
        ruleSets: [createRuleSet({
            rules: [createRule({ validate: () => false })]
        })]
    });

    assert.equal(results[0].result, VALIDATION_RESULTS.FAIL);
    assert.equal(results[0].failureCode, "RAM-001_FAILED");
    assert.equal(results[0].forgeEffect, FORGE_EFFECTS.BLOCKED);
}

{
    const executionOrder = [];
    const results = validator.validate({
        subject,
        ruleSets: [
            createRuleSet({
                id: "ram",
                rules: [
                    createRule({
                        id: "RAM-001",
                        validate() {
                            executionOrder.push("RAM-001");
                            return true;
                        }
                    }),
                    createRule({
                        id: "RAM-002",
                        severity: VALIDATION_SEVERITIES.LOW,
                        validate() {
                            executionOrder.push("RAM-002");
                            return {
                                result: VALIDATION_RESULTS.WARN,
                                message: "Review recommended."
                            };
                        }
                    })
                ]
            }),
            createRuleSet({
                id: "ecc",
                extension: "ecc",
                rules: [createRule({
                    id: "ECC-001",
                    severity: VALIDATION_SEVERITIES.MEDIUM,
                    validate() {
                        executionOrder.push("ECC-001");
                        return false;
                    }
                })]
            })
        ]
    });

    assert.deepEqual(executionOrder, ["RAM-001", "RAM-002", "ECC-001"]);
    assert.deepEqual(results.map(({ ruleId }) => ruleId), executionOrder);
    assert.equal(results[1].result, VALIDATION_RESULTS.WARN);
    assert.equal(results[2].forgeEffect, FORGE_EFFECTS.REVIEW);
}

{
    let laterRuleExecuted = false;
    const results = validator.validate({
        subject,
        ruleSets: [createRuleSet({
            rules: [
                createRule({
                    id: "RAM-THROW-001",
                    severity: VALIDATION_SEVERITIES.MEDIUM,
                    validate() {
                        throw new Error("Extension rule exploded.");
                    }
                }),
                createRule({
                    id: "RAM-AFTER-ERROR",
                    validate() {
                        laterRuleExecuted = true;
                        return true;
                    }
                })
            ]
        })]
    });

    assert.equal(laterRuleExecuted, true);
    assert.equal(results.length, 2);
    assert.equal(results[0].result, VALIDATION_RESULTS.ERROR);
    assert.equal(results[0].failureCode, "EXTENSION_RULE_EXECUTION_ERROR");
    assert.equal(results[0].forgeEffect, FORGE_EFFECTS.REVIEW);
    assert.equal(results[1].result, VALIDATION_RESULTS.PASS);
}

{
    const results = validator.validate({
        subject,
        ruleSets: [createRuleSet({
            rules: [
                { id: "RAM-INVALID-001", severity: "HIGH" },
                createRule({ id: "RAM-VALID-002" })
            ]
        })]
    });

    assert.equal(results.length, 2);
    assert.equal(results[0].result, VALIDATION_RESULTS.ERROR);
    assert.match(results[0].evidence.errorMessage, /validate\(\)/);
    assert.equal(results[1].result, VALIDATION_RESULTS.PASS);
}

{
    const canonicalResult = ValidationResult.notApplicable({
        ruleId: "RAM-NA-001",
        severity: VALIDATION_SEVERITIES.INFO,
        message: "Not applicable."
    });

    const results = validator.validate({
        subject,
        ruleSets: [createRuleSet({
            rules: [createRule({
                id: "RAM-NA-001",
                validate: () => canonicalResult
            })]
        })]
    });

    assert.strictEqual(results[0], canonicalResult);
}

{
    const frozenSubject = Object.freeze({
        id: "HR-RAM-FROZEN",
        metadata: Object.freeze({ source: "test" })
    });
    const frozenRuleSet = Object.freeze({
        id: "ram-frozen",
        version: "1.0.0",
        metadata: Object.freeze({ extension: "ram" }),
        rules: Object.freeze([Object.freeze(createRule({ id: "RAM-FROZEN-001" }))])
    });

    const results = validator.validate({
        subject: frozenSubject,
        ruleSets: [frozenRuleSet],
        context: Object.freeze({ source: "test" })
    });

    assert.equal(results[0].result, VALIDATION_RESULTS.PASS);
    assert.equal(frozenSubject.id, "HR-RAM-FROZEN");
    assert.equal(frozenRuleSet.rules.length, 1);
}

assert.throws(
    () => validator.validate({ subject: null, ruleSets: [] }),
    /subject must be a plain object/
);

assert.throws(
    () => validator.validate({ subject, ruleSets: null }),
    /ruleSets must be an array/
);

console.log("ExtensionValidator tests passed.");
