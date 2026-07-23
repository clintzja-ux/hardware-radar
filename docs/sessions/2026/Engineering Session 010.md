Engineering Session 010
Component
public/data/sentinel/validators/ExtensionValidator.js
Why this class exists

CoreValidator validates everything every product shares.

ExtensionValidator validates what makes one product category unique.

For example:

Product

↓

CoreValidator
        │
        ├── id exists
        ├── schema exists
        ├── metadata exists
        └── version valid

↓

ExtensionValidator
        │
        ├── RAM
        ├── CPU
        ├── GPU
        ├── SSD
        └── Motherboard

The runner doesn't care what extension exists.

It simply asks:

"Is there an extension validator?"

Responsibilities

ExtensionValidator should:

execute extension rule sets
support multiple extensions
normalize results
convert exceptions into ERROR
remain deterministic
never aggregate decisions
never mutate ValidationRuns

Exactly the same philosophy as CoreValidator.

Public API
validate(product, extensionRuleSets)

Returns

ValidationResult[]
Extension discovery

Notice something elegant about our architecture now.

ValidationRunner never needs to know RAM exists.

Instead:

RuleRegistry

↓

returns

[
    CoreRuleSet,
    RamRuleSet
]

ValidationRunner separates them.

CoreValidator receives:

CoreRuleSet

ExtensionValidator receives:

RamRuleSet

Tomorrow that becomes:

CpuRuleSet
GpuRuleSet
SsdRuleSet

No code changes.

Only registration.

That means we've achieved one of our original architectural goals: new product categories should be added through configuration and rule registration, not by modifying the engine.

Multiple extensions

One product could eventually belong to multiple extensions.

For example:

Server Memory

↓

RAM

+

ECC

or

Motherboard

↓

PCIe

+

DDR5

+

WiFi

ExtensionValidator should simply execute every applicable rule set.

Error policy

Exactly the same as CoreValidator.

If one rule throws:

ERROR ValidationResult

↓

continue remaining rules

Never abort validation.

Tests

We'll verify:

No extension rule sets
Single extension
Multiple extensions
Mixed PASS/FAIL
Exception handling
Deterministic ordering
Invalid rule definitions
Returned canonical ValidationResults

Deliverables

Session 010

ExtensionValidator.js
ExtensionValidator.test.mjs
run-all-tests.mjs update

Documentation:

Changelog
PR-010
Commit message

Engineering Session 010
Status

Approved for implementation

Component
public/data/sentinel/validators/ExtensionValidator.js
Design Refinement

I want to make one small improvement before implementation.

Instead of accepting:

validate(product, extensionRuleSets)

I'd like the API to accept:

validate(product, ruleSets)

where ruleSets is simply an array.

Why?

Because ValidationRunner has already selected the applicable extension rule sets.

ExtensionValidator shouldn't care whether those rules are for:

RAM
CPU
GPU
SSD
Display
Network
Future extensions

It should simply execute the supplied rule sets.

That makes it completely domain-independent.

Responsibilities

The validator should:

iterate supplied rule sets
execute every rule
normalize results into canonical ValidationResult
convert thrown exceptions into ERROR
continue after failures
preserve deterministic ordering
never mutate inputs
never aggregate

Exactly the same philosophy as CoreValidator.

Rule execution contract

Every rule continues to implement:

{
    id,
    severity,
    message,
    validate(product)
}

The validator should not inspect business semantics.

It only executes.

Processing model
ValidationRunner
        │
        ▼
ExtensionValidator
        │
        ▼
ValidationResult[]

Simple.

Error model

One bad rule must never stop validation.

Rule throws
        │
        ▼
ERROR ValidationResult
        │
        ▼
Continue

This has become a consistent Sentinel design principle, and I think we should preserve it everywhere.

Tests

We'll verify:

empty rule set list
single rule set
multiple rule sets
mixed PASS/FAIL
exception handling
malformed rule definitions
deterministic ordering
canonical ValidationResult output
Deliverables

Session 010

ExtensionValidator.js
ExtensionValidator.test.mjs
run-all-tests.mjs update

Documentation:

Changelog
PR-010
Commit
EDR Recommendation

I think this session deserves another architectural decision.

