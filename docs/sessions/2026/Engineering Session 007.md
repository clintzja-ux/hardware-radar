Engineering Session 007
Component
public/data/sentinel/core/RuleRegistry.js
Objective

Create the canonical registry responsible for managing Sentinel rule sets.

One of our original architectural goals was that ValidationRunner should never have to know which rule sets exist. RuleRegistry is the abstraction that enables that.

Responsibilities

RuleRegistry should:

Register rule sets.
Prevent duplicate registrations.
Retrieve rule sets by identifier.
Enumerate all registered rule sets.
Filter rule sets by extension (e.g., ram, cpu, gpu in the future).
Validate the minimum rule set contract.
Remain independent of any specific domain.

It should not:

Execute rules.
Perform validation.
Aggregate decisions.
Modify rule sets after registration.
Minimum Rule Set Contract

To keep the registry generic, I recommend that every rule set expose at least:

{
    id: "ram",
    version: "1.0.0",
    rules: [...],
    metadata: { ... }
}

The registry should validate these required fields before accepting a registration.

Public API
class RuleRegistry {

    register(ruleSet)

    unregister(id)

    has(id)

    get(id)

    getAll()

    getByExtension(extension)

    clear()

}

This is intentionally small. We can always extend it later if a real use case emerges.

Internal Storage

I recommend using a Map keyed by rule set ID.

Advantages:

O(1) lookup.
Guaranteed uniqueness.
Predictable iteration.
Straightforward serialization if needed.
Invariants

The registry should enforce:

IDs are unique.
Rule sets are immutable once registered (freeze or clone).
Registration order is preserved.
getAll() returns a defensive copy, not the internal collection.
Tests

We'll validate at least:

Register a valid rule set.
Reject duplicate IDs.
Retrieve by ID.
Verify has().
Retrieve all rule sets.
Filter by extension.
Unregister successfully.
Reject malformed rule sets.
Ensure returned collections cannot mutate internal state.
Dependency Graph

After Session 007, Sentinel will look like this:

ValidationRunner
        │
        ▼
 RuleRegistry
        │
        ▼
 RuleSet
        │
        ▼
 Validators
        │
        ▼
ValidationResults
        │
        ▼
DecisionAggregator
        │
        ▼
ValidationRun.complete()

This is the orchestration flow we've been working toward since we first defined the Sentinel architecture.

Looking Ahead

Once RuleRegistry is complete, ValidationRunner becomes much simpler. Its responsibility will be limited to:

Create a ValidationRun.
Ask RuleRegistry for the registered rule sets.
Execute validators against those rule sets.
Collect ValidationResult objects.
Call DecisionAggregator.
Complete and seal the ValidationRun.

Each class remains focused on a single responsibility, which should make the engine easier to extend when Atlas grows to include CPUs, GPUs, SSDs, motherboards, and additional domains.

I think we're in a very good position to begin Session 007 following the same implementation-review-commit cycle we've established.