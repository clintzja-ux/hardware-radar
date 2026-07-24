Hardware Radar Engineering Execution Standard

Document ID: HR-ENGINEERING-EXECUTION-STANDARDVersion: 1.0Status: CanonicalOwner: Mirabelle LabsPrimary Project: Hardware RadarEffective Date: 2026-07-24Last Updated: 2026-07-24

Revision History

Version

Date

Description

1.0

2026-07-24

Initial canonical execution standard for implementation, validation, testing, and extension development

1. Purpose

This document defines the implementation rules that govern day-to-day engineering work in Hardware Radar.

It translates the platform architecture and canonical data specifications into enforceable development conventions.

It is intentionally narrower than the Hardware Radar Engineering Handbook. The handbook defines engineering philosophy and broad working practices. This document defines how code, validators, rules, tests, and subsystem extensions must be implemented.

This document applies to:

Atlas;

Mercury;

Sentinel;

Forge;

Hardware Radar presentation code;

future platform subsystems and hardware extensions.

2. Document Precedence

When implementation sources disagree, use the following order of authority:

Canonical platform and subsystem specifications;

Canonical data models and rule specifications;

JSON Schemas and other executable contracts;

Validator and workflow implementations;

Canonical data records;

Tests, examples, fixtures, and comments.

A lower-ranked source must not silently redefine a higher-ranked source.

When a discrepancy is discovered, it must be documented and resolved. Code must not compensate for contradictory specifications through undocumented behavior.

3. Stable Subsystem Ownership

Each subsystem owns one class of responsibility.

Subsystem

Owns

Must Not Own

Atlas

Canonical product identity, specifications, provenance, lifecycle, and governance state

Retailer prices, stock, affiliate links, or market observations

Mercury

Retailer and market observations, including price, availability, promotions, and observation history

Canonical product truth or Atlas record mutation

Sentinel

Validation, compliance evaluation, rule execution, and publication eligibility decisions

Product editing, data mutation, publication workflow, or public presentation

Forge

Authoring, review, correction, approval, and publication workflow

Canonical truth outside approved Atlas writes or validation policy decisions

Hardware Radar

Presentation of approved data and user-facing experiences

Canonical data creation, validation policy, or market-observation ownership

Subsystem responsibilities must not migrate implicitly.

Any proposed transfer of ownership requires a formal architecture review and an Architecture Decision Record.

4. Repository and Directory Responsibilities

Folders represent responsibilities rather than file types.

4.1 Sentinel

public/data/sentinel/
├── config/
├── core/
├── extensions/
├── schemas/
├── tests/
├── types/
└── validators/

core/

Contains generic Sentinel engine infrastructure.

Current responsibilities include:

validation orchestration;

rule-set registration and discovery;

decision aggregation;

engine-level coordination.

Core modules must not contain RAM-, SSD-, GPU-, CPU-, retailer-, or presentation-specific business rules.

validators/

Contains generic validation executors and framework abstractions.

CoreValidator executes product-agnostic rules.

ExtensionValidator executes domain-extension rules.

These validators must remain generic. They may normalize rule outcomes, collect results, and handle execution failures, but they must not contain hardware-specific knowledge.

extensions/

Contains domain-specific rule packages.

extensions/
├── ram/
├── ssd/
├── gpu/
└── ...

Each extension owns only the rules and messages for its hardware family.

A RAM extension may understand RAM capacity, timings, DDR generation, ECC, and memory profiles. It must not define general Atlas identity rules or publication policy.

types/

Contains canonical Sentinel value objects and run models.

Shared result and run structures must be defined once and reused. Extension packages must not introduce competing validation-result formats.

tests/

Contains automated tests for Sentinel infrastructure and extensions.

Each production rule must be represented by deterministic automated tests.

config/

Contains Sentinel configuration that changes behavior without redefining architectural ownership.

Configuration must not be used to hide undocumented business logic.

schemas/

Contains executable schemas for Sentinel-owned configuration, run artifacts, or rule-set contracts when needed.

Atlas product schemas remain owned by Atlas.

5. Sentinel Validation Architecture

Sentinel follows this execution model:

Subject
  ↓
ValidationRunner
  ↓
CoreValidator
  ↓
ExtensionValidator
  ↓
ValidationResult collection
  ↓
DecisionAggregator
  ↓
Completed ValidationRun

Responsibilities are deliberately separated.

5.1 Validators Validate

Validators evaluate facts and return structured results.

Validators must not:

publish records;

change lifecycle state;

mutate Atlas or Mercury data;

approve editorial work;

select public recommendations;

return Forge workflow decisions directly.

5.2 The Decision Aggregator Decides

The DecisionAggregator converts the complete result set into a Sentinel decision according to documented policy.

Validation rules must not duplicate decision aggregation logic.

5.3 The Validation Runner Orchestrates

The ValidationRunner coordinates execution.

It must not contain domain business rules.

It should execute all applicable rules and collect the complete result set rather than stopping after the first failure, except where execution safety makes continuation impossible.

5.4 Rule Registry Owns Discovery

The RuleRegistry owns rule-set registration, uniqueness, lookup, and deterministic discovery.

Extension code must not bypass the registry through ad hoc hard-coded rule lists inside the runner.

6. Validator Responsibilities

6.1 CoreValidator

CoreValidator is generic only.

It may validate or execute rules concerning universal product requirements, including:

canonical identity structure;

revision structure;

schema-version presence;

universal governance requirements;

universal provenance requirements;

generic execution safety.

It must not contain RAM-specific fields or logic.

6.2 ExtensionValidator

ExtensionValidator is generic only.

It executes rule sets associated with a registered extension and normalizes their results.

It must not contain rules for any particular extension.

6.3 Domain Validators

Domain validators contain hardware-family-specific validation logic.

Examples:

RamValidators — RAM only;

SsdValidators — SSD only;

GpuValidators — GPU only.

Domain validators must not duplicate rules already enforced by Atlas schemas or universal Sentinel core rules unless the duplicate check is explicitly required for defense in depth and is documented.

6.4 Pure and Deterministic Behavior

Validator functions must be:

deterministic for the same subject, context, and configuration;

side-effect free;

explicit about required external context;

safe to run repeatedly;

independent of UI state;

independent of execution order unless the rule specification explicitly requires ordering.

Validators must not mutate the subject or context passed to them.

7. Rule Naming and Identity

Every executable rule must have a stable, unique identifier.

7.1 Format

<SUBSYSTEM>-<DOMAIN>-<NUMBER>

Current Sentinel RAM convention:

ATL-RAM-001
ATL-RAM-002
ATL-RAM-003

The numeric component uses three digits and is never reused.

7.2 Stability

Rule IDs are permanent identifiers.

A rule ID must not change merely because:

its message is rewritten;

remediation guidance improves;

implementation is refactored;

severity is adjusted through an approved policy change.

When a rule’s semantic meaning changes materially, create a new rule ID or formally version the rule set.

7.3 Single Canonical Prefix

Executable code, canonical specifications, tests, logs, and Forge displays must use one canonical ID form.

Aliases may be documented temporarily during migration, but executable rule sets must not emit multiple IDs for the same rule.

8. Rule-Set Requirements

Each rule set must declare, at minimum:

a stable rule-set ID;

a semantic version;

applicable extension or scope metadata;

an ordered collection of rules;

sufficient metadata for registry discovery and auditability.

Each rule must declare, at minimum:

rule ID;

severity;

validation function;

failure code or equivalent stable diagnostic identifier;

user-facing message source;

Forge effect or policy metadata when required by the canonical Sentinel contract;

remediation guidance when failure is actionable.

Rule definitions should remain declarative. Detailed validation logic belongs in validator functions, not in the rule catalog.

9. Messages and Remediation

Each domain extension should centralize stable messages and remediation guidance.

For RAM:

RamMessages.js

Message catalogs exist to prevent duplicated or inconsistent wording across:

rules;

tests;

Forge validation output;

logs;

support documentation.

Message catalogs must not contain validation logic.

Messages should be:

factual;

specific;

actionable;

free of unsupported assumptions;

stable enough for testing and operational use.

A failure message should explain what is wrong. Remediation should explain how to correct or investigate it.

10. Validation Result Requirements

All rules must return outcomes compatible with the canonical ValidationResult contract.

Extensions must not create competing result models.

A validation result should preserve enough information to determine:

which rule ran;

whether it passed, failed, or was not applicable;

severity;

failure code;

message;

relevant evidence;

expected and actual values when useful;

remediation;

Forge effect;

rule and extension metadata.

Exceptions must be converted into explicit execution-failure results. They must not disappear silently or be treated as successful validation.

11. Context-Dependent Validation

A rule may depend on external context when the subject alone is insufficient.

Examples include:

manufacturer part-number uniqueness;

stable identifier comparison against an earlier revision;

repository-wide duplicate detection;

source-evidence evaluation;

unresolved source conflicts;

lifecycle transition history.

Such rules must declare and validate their context requirements.

They must not fake a definitive pass when required context is absent.

Depending on the canonical rule specification, missing context should produce one of:

SKIP or NOT_APPLICABLE;

an explicit insufficient-evidence result;

a warning;

a review or blocking failure.

The chosen behavior must be documented by the rule.

12. Testing Standards

Every executable rule must have automated coverage.

12.1 Minimum Rule Coverage

Each rule requires at least:

one positive test;

one negative test.

Where relevant, also include:

boundary-value tests;

missing-value tests;

explicit-unknown tests;

malformed-type tests;

context-missing tests;

exception-handling tests;

regression tests for previously discovered defects.

12.2 Test Layers

Sentinel testing should include:

Unit tests

Test validator functions and core components in isolation.

Rule-set tests

Confirm rule metadata, IDs, severities, ordering, and validator bindings.

Integration tests

Execute registered rule sets through ValidationRunner and verify canonical ValidationResult and ValidationRun outputs.

Decision tests

Verify that complete result sets produce the expected READY, READY_WITH_WARNINGS, REVIEW, or BLOCKED decision.

Canonical-record tests

Validate approved Atlas reference records and intentionally invalid fixtures.

12.3 Test Isolation

Tests must not depend on:

network access;

current retailer prices;

system clock values without controlled injection;

execution order across test files;

mutable production data.

12.4 Test Runner

The full Sentinel suite must remain runnable through the repository’s canonical test command.

npm test

A new Sentinel extension is not complete until it is included in the full test runner.

13. Coding Conventions

13.1 Required Conventions

Use ES modules consistently with the repository configuration.

Prefer small, named functions with one responsibility.

Use explicit return structures.

Preserve stable public interfaces.

Validate inputs at system boundaries.

Fail explicitly rather than silently.

Keep domain constants and message catalogs centralized.

Use comments to explain rationale, not obvious syntax.

Keep unknown values explicit; do not fabricate defaults that imply knowledge.

Preserve immutable historical observations.

13.2 Prohibited Patterns

No hardware-specific business logic in ValidationRunner.

No RAM-specific logic in CoreValidator or ExtensionValidator.

No publication decision logic inside domain validators.

No Atlas mutation inside Sentinel.

No Mercury observation mutation by validators.

No retailer fields inside Atlas canonical product records.

No duplicated rule IDs.

No validator that silently catches an error and returns success.

No rule behavior that exists only in comments or developer memory.

No deep coupling between public presentation code and Sentinel internals.

13.3 Side Effects

Validation code must not:

write files;

call publication services;

update repositories;

change the subject;

change context objects;

trigger network requests;

modify global state.

External evidence must be collected before validation or supplied through controlled context interfaces.

14. Schema and Validator Boundaries

JSON Schema and Sentinel rules have related but distinct responsibilities.

JSON Schema should enforce:

structure;

required fields;

primitive types;

allowed enumerations;

basic formats;

simple numeric or string constraints.

Sentinel should enforce:

cross-field invariants;

repository-wide uniqueness;

provenance sufficiency;

lifecycle consistency;

evidence-backed classifications;

source-conflict policy;

publication eligibility.

Do not move complex governance policy into JSON Schema merely because it is technically possible.

Do not duplicate simple structural schema validation across many domain rules without a documented reason.

15. Change Control

15.1 Non-Breaking Changes

Typically include:

new tests;

clearer messages;

additional remediation guidance;

internal refactoring that preserves contracts;

new rules with new IDs;

new extension packages;

performance improvements that do not change outcomes.

15.2 Potentially Breaking Changes

Include:

changing a rule’s semantic meaning;

changing result structures;

changing decision aggregation policy;

changing rule-set discovery behavior;

changing ownership boundaries;

removing or reusing rule IDs;

changing required context;

modifying public module interfaces.

Potentially breaking changes require:

documented rationale;

compatibility assessment;

test updates;

migration plan when applicable;

Architecture Decision Record or Engineering Decision Record when architectural or contractual.

16. Definition of Done for a New Validation Rule

A rule is complete only when all of the following are true:

The rule exists in the canonical rule specification.

The rule has one stable canonical ID.

Severity and publication effect are documented.

The validator is deterministic and side-effect free.

Required context is explicit.

Messages and remediation are centralized.

Positive and negative tests pass.

Boundary and missing-context tests exist where relevant.

The rule is included in the correct registered rule set.

The full Sentinel test suite passes.

Documentation and implementation use the same terminology.

17. Definition of Done for a New Hardware Extension

A hardware extension is complete only when:

Its Atlas extension model is canonical.

Its executable schema is implemented and tested.

Its Sentinel rule specification is canonical.

Its message catalog is implemented.

Its validator functions are implemented.

Its rule set is implemented and registered.

Every rule has positive and negative automated tests.

Canonical valid records pass.

Intentionally invalid records fail with expected diagnostics.

Decision aggregation produces expected publication outcomes.

Forge can display the results without extension-specific workarounds.

The full repository test suite passes.

The implementation has completed an engineering review.

18. Current Sentinel RAM Implementation Target

The immediate implementation sequence is:

implement RamMessages.js;

implement pure validation functions in RamValidators.js;

implement the declarative rule catalog in RamRuleSet.js;

register the RAM rule set through the existing registry/bootstrap path;

add RAM extension unit and integration tests;

include the RAM tests in run-all-tests.mjs;

validate canonical Atlas RAM records;

verify final Sentinel decisions;

update the canonical specifications where identifier or terminology inconsistencies remain.

The existing generic Sentinel framework is considered stable unless implementation evidence reveals a specific defect.

19. Guiding Rule

Extend the existing platform contracts before inventing new abstractions.

The purpose of this standard is not to maximize process. It is to keep the system understandable, testable, traceable, and safe as Hardware Radar expands from RAM into additional hardware categories.