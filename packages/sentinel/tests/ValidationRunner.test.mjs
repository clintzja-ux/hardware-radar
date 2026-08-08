import assert from "node:assert/strict";
import DecisionAggregator from "../core/DecisionAggregator.js";
import RuleRegistry from "../core/RuleRegistry.js";
import ValidationRunner from "../core/ValidationRunner.js";
import ValidationResult, {
    FORGE_EFFECTS,
    VALIDATION_SEVERITIES
} from "../types/ValidationResult.js";
import {
    SENTINEL_DECISIONS,
    VALIDATION_OBJECT_TYPES
} from "../types/ValidationRun.js";

const STARTED_AT = "2026-07-22T15:00:00.000Z";
const COMPLETED_AT = "2026-07-22T15:00:01.000Z";

function createClock() {
    const values = [STARTED_AT, COMPLETED_AT];
    return () => values.shift() ?? COMPLETED_AT;
}

function createRuleSet({
    id = "core",
    version = "1.0.0",
    extension = null
} = {}) {
    return {
        id,
        version,
        rules: [{ id: `${id.toUpperCase()}-001` }],
        metadata: extension ? { extension } : {}
    };
}

function createRunner({
    registry = new RuleRegistry(),
    coreValidator = null,
    extensionValidator = null
} = {}) {
    return new ValidationRunner({
        ruleRegistry: registry,
        coreValidator,
        extensionValidator,
        decisionAggregator: new DecisionAggregator(),
        idFactory: () => "val_runner_test",
        clock: createClock()
    });
}

function pass(ruleId) {
    return ValidationResult.pass({
        ruleId,
        severity: VALIDATION_SEVERITIES.INFO,
        message: "Rule passed."
    });
}

function warn(ruleId) {
    return ValidationResult.warn({
        ruleId,
        severity: VALIDATION_SEVERITIES.LOW,
        message: "Rule warning."
    });
}

function fail(ruleId, severity, forgeEffect) {
    return ValidationResult.fail({
        ruleId,
        severity,
        failureCode: `${ruleId}_FAILED`,
        message: "Rule failed.",
        forgeEffect
    });
}

{
    const run = createRunner().run({ id: "HR-RAM-EMPTY" });

    assert.equal(run.isComplete(), true);
    assert.equal(run.overallDecision, SENTINEL_DECISIONS.READY);
    assert.equal(run.getResults().length, 0);
    assert.equal(run.ruleSetVersion, "none");
    assert.equal(Object.isFrozen(run), true);
}

{
    const registry = new RuleRegistry();
    registry.register(createRuleSet());

    let receivedPayload = null;
    const coreValidator = {
        validate(payload) {
            receivedPayload = payload;
            return pass("CORE-PASS-001");
        }
    };

    const run = createRunner({ registry, coreValidator }).run(
        { id: "HR-RAM-001", revision: 3 },
        {
            objectType: VALIDATION_OBJECT_TYPES.ATLAS_RECORD,
            triggeredBy: "test:validation-runner"
        }
    );

    assert.equal(run.overallDecision, SENTINEL_DECISIONS.READY);
    assert.equal(run.objectRevision, 3);
    assert.equal(run.ruleSetVersion, "core@1.0.0");
    assert.equal(run.getResults()[0].ruleId, "CORE-PASS-001");
    assert.equal(receivedPayload.subject.id, "HR-RAM-001");
    assert.equal(receivedPayload.ruleSets.length, 1);
}

{
    const registry = new RuleRegistry();
    registry.register(createRuleSet());
    registry.register(createRuleSet({
        id: "ram",
        extension: "ram"
    }));

    let extensionRuleSets = null;
    const runner = createRunner({
        registry,
        coreValidator: {
            validate() {
                return [
                    pass("CORE-PASS-002"),
                    warn("CORE-WARN-001")
                ];
            }
        },
        extensionValidator: {
            validate({ ruleSets }) {
                extensionRuleSets = ruleSets;
                return fail(
                    "RAM-MEDIUM-001",
                    VALIDATION_SEVERITIES.MEDIUM,
                    FORGE_EFFECTS.REVIEW
                );
            }
        }
    });

    const run = runner.run(
        { id: "HR-RAM-002" },
        { extension: "ram" }
    );

    assert.equal(run.overallDecision, SENTINEL_DECISIONS.REVIEW);
    assert.equal(run.getResults().length, 3);
    assert.deepEqual(
        extensionRuleSets.map(({ id }) => id),
        ["ram"]
    );
}

{
    const registry = new RuleRegistry();
    registry.register(createRuleSet());
    registry.register(createRuleSet({
        id: "ram",
        extension: "ram"
    }));

    let extensionExecuted = false;
    const runner = createRunner({
        registry,
        coreValidator: {
            validate() {
                throw new Error("Core validator exploded.");
            }
        },
        extensionValidator: {
            validate() {
                extensionExecuted = true;
                return pass("RAM-PASS-AFTER-ERROR");
            }
        }
    });

    const run = runner.run(
        { id: "HR-RAM-003" },
        { extension: "ram" }
    );
    const results = run.getResults();

    assert.equal(extensionExecuted, true);
    assert.equal(run.overallDecision, SENTINEL_DECISIONS.BLOCKED);
    assert.equal(results.length, 2);
    assert.equal(results[0].ruleId, "SENTINEL-EXECUTION-CORE");
    assert.equal(results[0].failureCode, "VALIDATOR_EXECUTION_ERROR");
    assert.equal(results[1].ruleId, "RAM-PASS-AFTER-ERROR");
}

{
    const registry = new RuleRegistry();
    registry.register(createRuleSet());

    const run = createRunner({
        registry,
        coreValidator: {
            validate() {
                return { invalid: true };
            }
        }
    }).run({ id: "HR-RAM-004" });

    assert.equal(run.overallDecision, SENTINEL_DECISIONS.BLOCKED);
    assert.equal(run.getResults()[0].result, "ERROR");
}

{
    const registry = new RuleRegistry();
    registry.register(createRuleSet());

    const run = createRunner({
        registry,
        coreValidator: {
            validate() {
                return pass("CORE-PASS-IMMUTABLE");
            }
        }
    }).run({ id: "HR-RAM-005" });

    assert.throws(
        () => run.addResult(pass("LATE-RESULT")),
        /immutable/
    );
    assert.equal(run.startedAt, STARTED_AT);
    assert.equal(run.completedAt, COMPLETED_AT);
}

assert.throws(
    () => new ValidationRunner({ ruleRegistry: {} }),
    /requires a RuleRegistry instance/
);

assert.throws(
    () => createRunner().run(null),
    /subject must be an object/
);

assert.throws(
    () => createRunner().run({ name: "Missing ID" }),
    /requires options.objectId or a subject id/
);

console.log("ValidationRunner tests passed.");
