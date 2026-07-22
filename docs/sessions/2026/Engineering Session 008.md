Engineering Session 008
Component
public/data/sentinel/core/ValidationRunner.js
Status

Design Review

Mission

This class is the orchestrator of Sentinel.

Everything we've built so far becomes connected here.

It should not contain validation logic.

Instead, it coordinates the work performed by the other components.

Responsibilities

ValidationRunner should:

create a ValidationRun
discover registered rule sets
execute validators
collect ValidationResult objects
aggregate the final decision
complete and seal the ValidationRun
return the immutable completed run

Nothing more.

Explicitly NOT responsible

ValidationRunner must never:

know RAM rules
know Atlas schemas
know Mercury observations
know Amazon requirements
perform rule validation itself
decide pass/fail policy

Those responsibilities already belong elsewhere.

Dependency Graph
ValidationRunner
        │
        ▼
RuleRegistry
        │
        ▼
CoreValidator
        │
        ▼
ExtensionValidator
        │
        ▼
ValidationResults
        │
        ▼
DecisionAggregator
        │
        ▼
ValidationRun.complete()

Notice that the runner simply coordinates the flow.

Constructor

I recommend dependency injection rather than creating dependencies internally.

new ValidationRunner({
    ruleRegistry,
    coreValidator,
    extensionValidator,
    decisionAggregator
})

Advantages:

testable
mockable
replaceable
future-proof
Public API

Keep it intentionally small.

run(product)

Returns

ValidationRun

No additional public methods unless we discover a genuine need later.

High-Level Flow
Create ValidationRun
        │
        ▼
Load registered rule sets
        │
        ▼
Run CoreValidator
        │
        ▼
Run ExtensionValidator
        │
        ▼
Collect ValidationResults
        │
        ▼
Aggregate decision
        │
        ▼
Complete ValidationRun
        │
        ▼
Return immutable ValidationRun

This exactly matches our architecture.

Error Policy

ValidationRunner should never crash because a validator throws an exception.

Instead:

Validator Exception
        │
        ▼
ValidationResult(ERROR)
        │
        ▼
Continue remaining validation

That makes Sentinel resilient.

Tests

We'll verify at least:

Test 1

No registered rule sets

Expected:

completed ValidationRun
READY
Test 2

Single PASS

Expected:

READY
Test 3

Validator throws exception

Expected:

ERROR ValidationResult
runner continues
Test 4

Mixed PASS/WARN/FAIL

Expected:

DecisionAggregator determines final state
Test 5

Run immutability

Returned ValidationRun cannot be modified.

Additional Improvement

This is also the right session to introduce the project's first root package.json and a unified Sentinel test runner.

That will let us execute:

npm test

instead of individual test files as the test suite grows.

Recommended Deliverables

Session 008 will include:

✅ ValidationRunner.js
✅ ValidationRunner.test.mjs
✅ run-all-tests.mjs
✅ package.json
✅ changelog entry
✅ PR-008
✅ commit message
Architectural assessment

After this session, Milestone A — Sentinel Core will be functionally complete.

We'll have moved from independent building blocks to a working validation pipeline. That, in my view, is the point where Sentinel becomes a real subsystem rather than a collection of well-designed classes.

I approve this design and recommend we implement it exactly as outlined.

Engineering Session 008 complete

Implemented:

public/data/sentinel/core/ValidationRunner.js

Added:

public/data/sentinel/tests/ValidationRunner.test.mjs
public/data/sentinel/tests/run-all-tests.mjs
package.json

The runner now:

creates canonical ValidationRun instances;
discovers registered rule sets through RuleRegistry;
executes injected core and extension validator stages;
collects only canonical ValidationResult objects;
converts validator exceptions into blocking ERROR results;
continues to later validation stages after an earlier stage fails;
filters extension rule sets when an extension is specified;
passes the active run to DecisionAggregator;
completes and seals the run with the resulting Sentinel decision;
supports injected clocks and ID factories for deterministic testing.

All tests passed:

Running Sentinel test suite...

DecisionAggregator tests passed.
RuleRegistry tests passed.
ValidationRunner tests passed.

Sentinel test suite passed: 3 files.