import assert from "node:assert/strict";
import CoreValidator from "../validators/CoreValidator.js";
import ValidationResult, {
    FORGE_EFFECTS,
    VALIDATION_RESULTS,
    VALIDATION_SEVERITIES
} from "../types/ValidationResult.js";

function createRuleSet({
    id = "core",
    extension = null,
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
    id = "CORE-001",
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

const validator = new CoreValidator();
const subject = { id: "HR-TEST-001", name: "Test Product" };

{
    const results = validator.validate({
        subject,
        ruleSets: [],
        context: {}
    });

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
    assert.equal(results[0].ruleId, "CORE-001");
    assert.equal(results[0].forgeEffect, FORGE_EFFECTS.NONE);
}

{
    const results = validator.validate({
        subject,
        ruleSets: [createRuleSet({
            rules: [createRule({ validate: () => false })]
        })]
    });

    assert.equal(results[0].result, VALIDATION_RESULTS.FAIL);
    assert.equal(results[0].failureCode, "CORE-001_FAILED");
    assert.equal(results[0].forgeEffect, FORGE_EFFECTS.BLOCKED);
}

{
    const executionOrder = [];
    const results = validator.validate({
        subject,
        ruleSets: [
            createRuleSet({
                id: "core-a",
                rules: [
                    createRule({
                        id: "CORE-A-001",
                        validate() {
                            executionOrder.push("CORE-A-001");
                            return true;
                        }
                    }),
                    createRule({
                        id: "CORE-A-002",
                        severity: VALIDATION_SEVERITIES.LOW,
                        validate() {
                            executionOrder.push("CORE-A-002");
                            return {
                                result: VALIDATION_RESULTS.WARN,
                                message: "Review recommended."
                            };
                        }
                    })
                ]
            }),
            createRuleSet({
                id: "core-b",
                rules: [createRule({
                    id: "CORE-B-001",
                    validate() {
                        executionOrder.push("CORE-B-001");
                        return false;
                    }
                })]
            })
        ]
    });

    assert.deepEqual(executionOrder, [
        "CORE-A-001",
        "CORE-A-002",
        "CORE-B-001"
    ]);
    assert.deepEqual(
        results.map(({ ruleId }) => ruleId),
        executionOrder
    );
    assert.equal(results[1].result, VALIDATION_RESULTS.WARN);
}

{
    let laterRuleExecuted = false;
    const results = validator.validate({
        subject,
        ruleSets: [createRuleSet({
            rules: [
                createRule({
                    id: "CORE-THROW-001",
                    severity: VALIDATION_SEVERITIES.MEDIUM,
                    validate() {
                        throw new Error("Rule exploded.");
                    }
                }),
                createRule({
                    id: "CORE-AFTER-ERROR",
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
    assert.equal(results[0].ruleId, "CORE-THROW-001");
    assert.equal(results[0].failureCode, "CORE_RULE_EXECUTION_ERROR");
    assert.equal(results[0].forgeEffect, FORGE_EFFECTS.REVIEW);
    assert.equal(results[1].result, VALIDATION_RESULTS.PASS);
}

{
    const results = validator.validate({
        subject,
        ruleSets: [createRuleSet({
            rules: [
                { id: "CORE-INVALID-001", severity: "HIGH" },
                createRule({ id: "CORE-VALID-002" })
            ]
        })]
    });

    assert.equal(results.length, 2);
    assert.equal(results[0].result, VALIDATION_RESULTS.ERROR);
    assert.match(results[0].evidence.errorMessage, /validate\(\)/);
    assert.equal(results[1].result, VALIDATION_RESULTS.PASS);
}

{
    const results = validator.validate({
        subject,
        ruleSets: [
            createRuleSet({
                id: "core",
                rules: [createRule({ id: "CORE-ONLY-001" })]
            }),
            createRuleSet({
                id: "ram",
                extension: "ram",
                rules: [createRule({
                    id: "RAM-SHOULD-NOT-RUN",
                    validate() {
                        throw new Error("Extension rule was executed by core.");
                    }
                })]
            })
        ]
    });

    assert.deepEqual(
        results.map(({ ruleId }) => ruleId),
        ["CORE-ONLY-001"]
    );
}

{
    const canonicalResult = ValidationResult.notApplicable({
        ruleId: "CORE-NA-001",
        severity: VALIDATION_SEVERITIES.INFO,
        message: "Not applicable."
    });

    const results = validator.validate({
        subject,
        ruleSets: [createRuleSet({
            rules: [createRule({
                id: "CORE-NA-001",
                validate: () => canonicalResult
            })]
        })]
    });

    assert.strictEqual(results[0], canonicalResult);
}

assert.throws(
    () => validator.validate({ subject: null, ruleSets: [] }),
    /subject must be a plain object/
);

assert.throws(
    () => validator.validate({ subject, ruleSets: null }),
    /ruleSets must be an array/
);

console.log("CoreValidator tests passed.");
