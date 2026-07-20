Engineering Session 005 — Design Review

Component: ValidationRun.js

Status: Design Review (before implementation)

1. Purpose

ValidationRun represents one complete execution of Sentinel.

Not a rule.

Not a validator.

Not a decision.

A validation session.

Think of it like a database transaction.

One validation request comes in...

...one immutable record comes out.

ValidationRunner

        │

        ▼

ValidationRun

        │

   contains many

        ▼

ValidationResult
2. Responsibilities

ValidationRun should be responsible for:

✓ identifying the validation

✓ recording start/end times

✓ storing every ValidationResult

✓ calculating summary counts

✓ storing the final decision

✓ producing JSON for audit logging

It should not:

❌ execute rules

❌ decide rule severity

❌ publish anything

❌ know Atlas

❌ know Mercury

❌ know RAM

Those belong elsewhere.

3. Properties

I recommend the canonical model be:

ValidationRun

validationRunId

ruleSetVersion

configurationVersion

objectType

objectId

objectRevision

triggeredBy

startedAt

completedAt

results

overallDecision

summary

exceptionSetVersion

Notice there is no duplicated state.

For example:

criticalFailures

should not be stored.

It should always be computed from the results.

That prevents inconsistencies.

4. Public API

I recommend keeping it intentionally small.

constructor()

addResult()

complete()

isComplete()

getResults()

getFailures()

getWarnings()

getBlockingResults()

getSummary()

toJSON()

That's enough.

Anything more probably belongs in DecisionAggregator.

5. Invariants

This is the part many projects skip.

These should always be true.

Invariant 1
startedAt

must exist.

Invariant 2
completedAt

cannot exist before

startedAt
Invariant 3

After

complete()

the run becomes immutable.

No more

addResult()

allowed.

Invariant 4

Every stored object must be a

ValidationResult

not arbitrary JSON.

Invariant 5
overallDecision

may only be

READY

READY_WITH_WARNINGS

REVIEW

BLOCKED

No other values.

6. Summary Generation

Rather than storing numbers separately,

summary

should always be generated from the results.

For example:

{
  "pass": 84,
  "warn": 3,
  "fail": 1,
  "error": 0,
  "notApplicable": 12
}

That guarantees the summary can never drift away from the actual validation results.

7. Future Compatibility

This class should work unchanged for:

Atlas
Mercury
SSD
GPU
CPU
Motherboards
Power Supplies

That tells me we're designing at the right level of abstraction.

8. Testing Plan

Before we merge this session, we'll verify at least these scenarios:

Empty Run
Create a run with no results.
Ensure it reports zero counts and no completion time.
Successful Run
Add only PASS results.
Complete the run.
Verify the summary and overall decision.
Mixed Results
Add PASS, WARN, FAIL, and ERROR results.
Confirm the summary counts are correct.
Immutability
Complete the run.
Attempt to add another result.
Verify the operation is rejected.
Serialization
Export with toJSON().
Confirm all required fields are present and correctly formatted.
My recommendation

I think this design is solid enough to become the canonical ValidationRun API.

One additional engineering rule I'd like to adopt for the entire platform is:

Domain objects should never contain business logic that belongs to orchestration.

That means:

ValidationRun stores and reports state.
DecisionAggregator decides outcomes.
ValidationRunner coordinates execution.
Validators validate.

Each class has one clear responsibility, which will keep Sentinel maintainable as it grows.

If you're happy with this design review, the next step is to implement ValidationRun.js following this contract and then add the corresponding unit tests before we commit it.

Engineering Session 005

Title: Implement ValidationRun

Status: Approved for implementation

Objective

Implement the canonical ValidationRun domain object that represents a complete Sentinel validation execution.

Files Changed
public/data/sentinel/types/
    ValidationRun.js

No other files should change in this session.

Architecture

ValidationRun is a domain object.

It owns validation state.

It does not:

execute rules
calculate Forge decisions
know Atlas
know Mercury
know RAM

Those responsibilities belong to other components.

Its sole responsibility is to accurately represent a validation execution from start to finish.

Public API
constructor(options)

addResult(result)

complete(overallDecision)

isComplete()

getResults()

getFailures()

getWarnings()

getBlockingResults()

getSummary()

toJSON()
Core Properties
validationRunId

ruleSetVersion

configurationVersion

objectType

objectId

objectRevision

triggeredBy

startedAt

completedAt

results

overallDecision

exceptionSetVersion
Invariants

The implementation should enforce:

startedAt is always set.
completedAt cannot precede startedAt.
Completed runs are immutable.
Only ValidationResult instances may be added.
overallDecision must be one of:
READY
READY_WITH_WARNINGS
REVIEW
BLOCKED
Testing Checklist

Before committing, verify:

Create a new run.
Add multiple ValidationResult objects.
Generate summary counts.
Complete the run.
Confirm additional results cannot be added.
Serialize to JSON.
Verify all required fields are present.
Commit
git add public/data/sentinel/types/ValidationRun.js

git commit -m "feat(sentinel): implement ValidationRun"
One additional engineering recommendation

I think it's time to introduce a Definition of Ready and a Definition of Done for implementation sessions.

Definition of Ready

A session can begin only when:

The architecture is documented.
Responsibilities are agreed.
Public API is approved.
Tests are identified.
Definition of Done

A session is complete only when:

The implementation matches the approved design.
All planned tests pass.
No unrelated files were modified.
The engineering changelog is updated.
The code is committed and pushed.

This gives us a consistent standard for every future component, whether it's Atlas, Mercury, Sentinel, or Forge.