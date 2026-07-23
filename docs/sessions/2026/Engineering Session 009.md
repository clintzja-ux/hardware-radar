Engineering Session 009
Component
public/data/sentinel/validators/CoreValidator.js
Purpose

CoreValidator performs validation that is independent of any product category.

If tomorrow Hardware Radar adds:

CPUs
GPUs
SSDs
Motherboards
Monitors

they should all use the same CoreValidator.

Responsibilities

The CoreValidator should verify things such as:

Required identifiers exist
Required metadata exists
Version fields are valid
Schema references exist
Object structure is correct
Generic platform constraints

It must not contain RAM-specific logic.

What belongs elsewhere

RAM timing validation?

→ RamValidators

DDR generation validation?

→ RamValidators

CAS latency?

→ RamValidators

JEDEC checks?

→ RamValidators

Those belong in the extension layer.

Public API

I recommend keeping it extremely simple:

validate(product, ruleSet)

Returns:

ValidationResult[]

One validator.

One responsibility.

Execution model
ValidationRunner
        │
        ▼
CoreValidator
        │
        ▼
ValidationResult[]

The runner collects the results.

CoreValidator never aggregates.

Rule execution

CoreValidator shouldn't know any individual rule IDs.

Instead:

RuleRegistry
        │
        ▼
RuleSet
        │
        ▼
CoreValidator

Each rule should describe:

condition
severity
message
validator function

The validator simply executes the supplied rule.

That keeps it generic.

Error handling

If one rule throws:

Rule throws
        │
        ▼
ERROR ValidationResult
        │
        ▼
Continue remaining rules

Never stop validating.

Tests

We'll verify:

Empty rule set
Single PASS
Single FAIL
Multiple rules
Exception handling
Invalid validator definitions
Deterministic ordering
Architectural observation

This session marks another transition.

Everything up to now has been framework.

CoreValidator is the first component that actually begins evaluating product data.

It's the bridge between architecture and business logic.

Deliverables

Session 009 will include:

✅ CoreValidator.js
✅ CoreValidator.test.mjs
✅ updates to run-all-tests.mjs
✅ changelog entry
✅ PR-009
✅ recommended commit message

Engineering Session 009
Status

Approved for implementation

Component
public/data/sentinel/validators/CoreValidator.js
Implementation Goals

The implementation will provide a generic validator that:

Executes core validation rules in deterministic order.
Produces only canonical ValidationResult instances.
Converts thrown exceptions into ERROR results.
Continues processing remaining rules after failures.
Never aggregates or completes a ValidationRun.
Remains completely product-agnostic.

The validator will not contain RAM, CPU, GPU, retailer, or schema-specific business logic.

Proposed Rule Contract

To keep the validator generic, every core rule should follow the same contract:

{
    id: "CORE-001",
    severity: "HIGH",
    message: "Product ID is required.",
    validate(product) {
        return true;
    }
}

The validator's job is simply:

Iterate rules.
Execute validate(product).
Translate the outcome into a ValidationResult.

Nothing more.

Processing Pipeline
ValidationRunner
        │
        ▼
CoreValidator
        │
        ▼
ValidationResult[]
        │
        ▼
ValidationRunner

This preserves the single-responsibility principle we've been applying throughout Sentinel.

Session 009 Deliverables

This session will include:

public/data/sentinel/validators/CoreValidator.js
public/data/sentinel/tests/CoreValidator.test.mjs
public/data/sentinel/tests/run-all-tests.mjs (updated)

along with:

Changelog entry
PR-009
Recommended commit
Test verification
Recommended Commit
feat(sentinel): implement CoreValidator

Engineering Session 009 complete

Implemented:

public/data/sentinel/validators/CoreValidator.js

Added:

public/data/sentinel/tests/CoreValidator.test.mjs

Updated:

public/data/sentinel/tests/run-all-tests.mjs
package.json

The validator now:

executes core rule sets in deterministic order;
excludes extension-specific rule sets;
accepts boolean, structured, or canonical ValidationResult outcomes;
translates successful rules into PASS;
translates failed rules into FAIL;
converts malformed rules and thrown exceptions into ERROR;
continues executing later rules after an error;
applies the canonical Forge effect based on severity;
remains product-agnostic and does not aggregate decisions or mutate validation runs.

All tests passed:

Running Sentinel test suite...

DecisionAggregator tests passed.
RuleRegistry tests passed.
ValidationRunner tests passed.
CoreValidator tests passed.

Sentinel test suite passed: 4 files.