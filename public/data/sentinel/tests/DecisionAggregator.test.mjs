import assert from "node:assert/strict";
import DecisionAggregator from "../core/DecisionAggregator.js";
import ValidationResult, {
    FORGE_EFFECTS,
    VALIDATION_SEVERITIES
} from "../types/ValidationResult.js";
import ValidationRun, {
    SENTINEL_DECISIONS,
    VALIDATION_OBJECT_TYPES
} from "../types/ValidationRun.js";

function createRun(id = "val_test_001") {
    return new ValidationRun({
        validationRunId: id,
        ruleSetVersion: "0.1.0",
        configurationVersion: "0.1.0",
        objectType: VALIDATION_OBJECT_TYPES.ATLAS_RECORD,
        objectId: "atlas_ram_test",
        objectRevision: 1,
        triggeredBy: "test:decision-aggregator",
        startedAt: "2026-07-20T15:00:00.000Z"
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

function error(ruleId, severity, forgeEffect) {
    return ValidationResult.error({
        ruleId,
        severity,
        failureCode: `${ruleId}_ERROR`,
        message: "Rule execution failed.",
        forgeEffect
    });
}

const aggregator = new DecisionAggregator();

{
    const run = createRun("val_ready");
    run.addResult(pass("TEST-PASS-001"));

    const decision = aggregator.aggregate(run);

    assert.equal(decision.decision, SENTINEL_DECISIONS.READY);
    assert.equal(decision.summary.passes, 1);
    assert.deepEqual(decision.blockingRuleIds, []);
}

{
    const run = createRun("val_warn");
    run.addResult(pass("TEST-PASS-002"));
    run.addResult(warn("TEST-WARN-001"));

    const decision = aggregator.aggregate(run);

    assert.equal(
        decision.decision,
        SENTINEL_DECISIONS.READY_WITH_WARNINGS
    );
    assert.equal(decision.summary.warnings, 1);
    assert.deepEqual(decision.warningRuleIds, ["TEST-WARN-001"]);
}

{
    const run = createRun("val_review");
    run.addResult(fail(
        "TEST-MEDIUM-001",
        VALIDATION_SEVERITIES.MEDIUM,
        FORGE_EFFECTS.REVIEW
    ));

    const decision = aggregator.aggregate(run);

    assert.equal(decision.decision, SENTINEL_DECISIONS.REVIEW);
    assert.deepEqual(decision.reviewRuleIds, ["TEST-MEDIUM-001"]);
}

{
    const run = createRun("val_blocked_high");
    run.addResult(fail(
        "TEST-HIGH-001",
        VALIDATION_SEVERITIES.HIGH,
        FORGE_EFFECTS.BLOCKED
    ));

    const decision = aggregator.aggregate(run);

    assert.equal(decision.decision, SENTINEL_DECISIONS.BLOCKED);
    assert.deepEqual(decision.blockingRuleIds, ["TEST-HIGH-001"]);
}

{
    const run = createRun("val_blocked_critical_error");
    run.addResult(error(
        "TEST-CRITICAL-001",
        VALIDATION_SEVERITIES.CRITICAL,
        FORGE_EFFECTS.BLOCKED
    ));

    const decision = aggregator.aggregate(run);

    assert.equal(decision.decision, SENTINEL_DECISIONS.BLOCKED);
    assert.equal(decision.summary.criticalFailures, 1);
}

{
    const run = createRun("val_mixed");
    run.addResult(pass("TEST-PASS-003"));
    run.addResult(warn("TEST-WARN-002"));
    run.addResult(fail(
        "TEST-MEDIUM-002",
        VALIDATION_SEVERITIES.MEDIUM,
        FORGE_EFFECTS.REVIEW
    ));
    run.addResult(error(
        "TEST-HIGH-002",
        VALIDATION_SEVERITIES.HIGH,
        FORGE_EFFECTS.BLOCKED
    ));

    const before = run.toJSON();
    const first = aggregator.aggregate(run);
    const second = aggregator.aggregate(run);
    const after = run.toJSON();

    assert.deepEqual(first, second);
    assert.deepEqual(before, after);
    assert.equal(first.decision, SENTINEL_DECISIONS.BLOCKED);
    assert.equal(first.summary.totalResults, 4);
    assert.equal(first.summary.highFailures, 1);
    assert.equal(first.summary.mediumFailures, 1);
    assert.equal(first.summary.warnings, 1);
    assert.deepEqual(first.blockingRuleIds, ["TEST-HIGH-002"]);
    assert.deepEqual(first.reviewRuleIds, ["TEST-MEDIUM-002"]);
    assert.ok(Object.isFrozen(first));
    assert.ok(Object.isFrozen(first.summary));
    assert.ok(Object.isFrozen(first.blockingRuleIds));
}

{
    const run = createRun("val_low_failure");
    run.addResult(fail(
        "TEST-LOW-001",
        VALIDATION_SEVERITIES.LOW,
        FORGE_EFFECTS.WARN
    ));

    const decision = aggregator.aggregate(run);

    assert.equal(
        decision.decision,
        SENTINEL_DECISIONS.READY_WITH_WARNINGS
    );
    assert.equal(decision.summary.lowFailures, 1);
    assert.deepEqual(decision.warningRuleIds, ["TEST-LOW-001"]);
}

assert.throws(
    () => aggregator.aggregate({}),
    /requires a ValidationRun instance/
);

console.log("DecisionAggregator tests passed.");
