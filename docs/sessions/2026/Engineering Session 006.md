Engineering Session 006
Component
DecisionAggregator.js
Status

Design Review

Why this component exists

This is one of the most important pieces of Sentinel.

It answers one question:

"Given all of the ValidationResults, what is Sentinel's final decision?"

Notice something important...

It doesn't perform validation.

It doesn't know RAM.

It doesn't know Amazon.

It only understands the outcomes of validation.

Think of it as the judge after all the witnesses have testified.

Responsibilities

DecisionAggregator is responsible for:

✓ reading ValidationResults

✓ counting outcomes

✓ applying severity policy

✓ producing the canonical Forge decision

✓ generating decision statistics

✓ exposing blocking rule IDs

It is not responsible for:

✗ running validators

✗ modifying ValidationRuns

✗ repairing data

✗ writing audit logs

Input

One completed ValidationRun.

ValidationRun

↓

DecisionAggregator
Output

One immutable decision object.

For example:

{
  "decision": "BLOCKED",
  "validationRunId": "val_001",
  "ruleSetVersion": "0.1",
  "summary": {
    "criticalFailures": 2,
    "highFailures": 0,
    "mediumFailures": 1,
    "warnings": 4
  },
  "blockingRuleIds": [
    "ATL-RAM-001",
    "AMZ-CONTENT-002"
  ],
  "reviewRuleIds": [
    "ATL-RAM-010"
  ]
}

Notice this matches our Sentinel specification almost exactly.

Public API

I recommend keeping it intentionally small.

DecisionAggregator

aggregate(validationRun)

buildSummary(results)

getBlockingRules(results)

getReviewRules(results)

Nothing more.

Decision Policy

The implementation should exactly match the Sentinel Rule Specification.

Condition	Decision
Any CRITICAL FAIL	BLOCKED
Any CRITICAL ERROR	BLOCKED
Any HIGH FAIL	BLOCKED
Any HIGH ERROR	BLOCKED
Any MEDIUM FAIL	REVIEW
Any MEDIUM ERROR	REVIEW
Only LOW WARNINGS	READY_WITH_WARNINGS
PASS / NOT_APPLICABLE only	READY

One source of truth.

No hidden rules.

Invariants

The aggregator must never:

mutate the ValidationRun
mutate ValidationResults
invent failures
discard applicable results
downgrade severity

Its output must be deterministic.

The same ValidationRun should always produce the same decision.

Testing Plan

Before we merge Session 006, we'll verify at least these cases:

Test 1

Only PASS results

Expected:

READY
Test 2

PASS + WARN

Expected:

READY_WITH_WARNINGS
Test 3

MEDIUM FAIL

Expected:

REVIEW
Test 4

HIGH FAIL

Expected:

BLOCKED
Test 5

CRITICAL ERROR

Expected:

BLOCKED
Test 6

Mixed severities

Verify:

summary counts
blocking rule IDs
review rule IDs
final decision

New Engineering Workflow (Canonical)

I recommend we formally adopt this as our development process.

Before every implementation session

You:

implement previous session
commit
push
upload latest repository ZIP

I:

inspect the repository
verify architecture
implement one component
produce:
updated source file(s)
tests
changelog entry
EDR (if required)
commit message

No assumptions.

No stale code.

No merge surprises.

I want to add one more practice

I'd also like to begin treating each implementation as a Pull Request, even though you're currently the only developer.

Each session will include something like:

PR-006

Title:
Implement DecisionAggregator

Summary:
Implements the canonical Sentinel decision aggregation engine.

Files Changed:
- DecisionAggregator.js

Tests:
✓ PASS only
✓ PASS + WARN
✓ MEDIUM FAIL
✓ HIGH FAIL
✓ CRITICAL ERROR
✓ Mixed severity

Risk:
Low

Breaking Changes:
None

Review Status:
Approved

That gives us a permanent engineering record of every significant change.

Phase 2 has officially begun

I actually think we're building something much larger than a price comparison website now.

The architecture we've established—Atlas → Mercury → Sentinel → Forge—is generic enough that it could support entirely different domains in the future. Hardware Radar just happens to be the first application built on top of it.

That doesn't change our immediate goal, but it's a sign that we've made good architectural decisions.

Next step

With the repository now synchronized, our next implementation session will be:

Engineering Session 006

Component: DecisionAggregator.js
Goal: Implement the deterministic aggregation engine that converts a completed ValidationRun into the canonical Forge decision (READY, READY_WITH_WARNINGS, REVIEW, or BLOCKED).

We'll continue with the same discipline we've established:

Design (approved ✅)
Implementation
Tests
Changelog
EDR (where needed)
Commit
Push

I think this workflow is sustainable for the remainder of the project and will scale well as Atlas, Mercury, Sentinel, and Forge continue to grow.


Sentinel Engine

Implemented:

types/
    ✅ ValidationResult
    ✅ ValidationRun

core/
    ✅ DecisionAggregator
    ⏳ RuleRegistry
    ⏳ ValidationRunner

validators/
    ⏳ CoreValidator
    ⏳ ExtensionValidator