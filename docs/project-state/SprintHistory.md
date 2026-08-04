Official Sprint Status
Sprint 7

Sentinel RAM Integration

Current status:

Task	Status
Repository Audit	✅ Complete
Architecture Audit	✅ Complete
Documentation Audit	✅ Complete
Sentinel Contract Audit	✅ Complete
Engineering Standards	✅ Complete
RamMessages	⏳
RamValidators	⏳
RamRuleSet	⏳
Registration	⏳
RAM Tests	⏳
Now the real engineering begins.

Everything we've done over the past sessions has been preparing for this.

Now we actually build.

Implementation Order

I still believe this is the optimal order:

Step 1

Implement

RamMessages.js

Reason:

Everything else references it.

Messages should not be duplicated throughout validators.

Step 2

Implement

RamValidators.js

Pure functions.

No registration.

No Sentinel knowledge.

No Forge knowledge.

Only RAM validation.

Step 3

Implement

RamRuleSet.js

Maps:

ATL-RAM-001

↓

validateCapacityInvariant()

Nothing more.

Step 4

Register

RAM Rule Set

inside RuleRegistry.

Step 5

Create

RamExtension.test.mjs
Step 6

Run

Entire Sentinel Test Suite

What changes after this?

Once Sprint 7 finishes, something fundamental changes.

Sentinel will no longer be "an engine waiting for rules."

It becomes

a working validation engine.

That is the first time the platform begins enforcing its own engineering contracts.

Then Sprint 8

Forge becomes dramatically easier.

Because instead of asking

"Can I publish this?"

Forge simply asks Sentinel.

Sentinel answers.

Forge obeys.

Exactly as intended.

One final recommendation

I want to establish one engineering practice that I think will pay dividends over the life of this project.

Every Sprint Ends with an Engineering Review

For example:

Engineering Review 002

Sprint 7

Sentinel RAM Integration

Repository

Architecture
PASS

Code Quality
PASS

Tests
PASS

Coverage
PASS

Canonical Compliance
PASS

Documentation
PASS

Approved

YES

This gives us a formal quality gate before moving to the next sprint. It also creates an engineering history that will be invaluable if you ever bring in another developer or revisit decisions months from now.

Ready for Sprint 7

With the architecture stabilized, the engineering standards documented, and the repository synchronized, I consider the project officially transitioned from platform design to platform implementation.

From here onward, our work will primarily consist of building, testing, reviewing, and refining—not redesigning. That's exactly where a mature software project should be at this stage.

Sprint 7 — Sentinel RAM Integration
Work Item 7.1 — RamMessages.js

I deliberately want to start here because it establishes the vocabulary for the entire RAM validation subsystem.

One principle I'd like us to adopt is:

Validators should return rule IDs and data. Message text should come from the message catalog.

This has several advantages:

Consistent wording across the platform.
Easier maintenance.
Easier localization in the future.
Tests can assert against stable rule IDs instead of brittle strings.
Proposed RamMessages.js
/**
 * Sentinel RAM Message Catalog
 *
 * Canonical user-facing messages and remediation guidance
 * for all RAM validation rules.
 */

export const RamMessages = {

    "ATL-RAM-001": {
        title: "Capacity Invariant",
        pass: "Module capacity matches total capacity.",
        fail: "Total capacity does not equal module count × capacity per module.",
        remediation: "Correct capacityGb or moduleCount/capacityPerModuleGb so the invariant is satisfied."
    },

    "ATL-RAM-002": {
        title: "Canonical MPN Uniqueness",
        pass: "Manufacturer part number is unique.",
        fail: "Manufacturer part number already exists.",
        remediation: "Resolve duplicate canonical product."
    },

    "ATL-RAM-003": {
        title: "Stable Product Identity",
        pass: "Product identity is stable.",
        fail: "Product identity changed unexpectedly.",
        remediation: "Review identifier generation."
    },

    "ATL-RAM-004": {
        title: "Speed Label Consistency",
        pass: "Speed label matches transfer rate.",
        fail: "Speed label does not match transfer rate.",
        remediation: "Correct the marketing speed label."
    },

    "ATL-RAM-005": {
        title: "Kit Consistency",
        pass: "Kit configuration is internally consistent.",
        fail: "Kit metadata conflicts with module count.",
        remediation: "Correct kit information."
    },

    "ATL-RAM-006": {
        title: "ECC Classification",
        pass: "ECC classification is valid.",
        fail: "ECC classification lacks sufficient evidence.",
        remediation: "Provide authoritative manufacturer evidence."
    },

    "ATL-RAM-007": {
        title: "Retailer Data Isolation",
        pass: "No retailer-specific fields found.",
        fail: "Retailer-specific fields exist inside Atlas.",
        remediation: "Move pricing and retailer information into Mercury."
    },

    "ATL-RAM-008": {
        title: "Required Provenance",
        pass: "Required provenance present.",
        fail: "Missing required provenance.",
        remediation: "Provide authoritative source."
    },

    "ATL-RAM-009": {
        title: "Unknown Value Integrity",
        pass: "Unknown values correctly represented.",
        fail: "Invalid placeholder detected.",
        remediation: "Use canonical unknown representation."
    },

    "ATL-RAM-010": {
        title: "Lifecycle Consistency",
        pass: "Lifecycle state is consistent.",
        fail: "Lifecycle metadata is inconsistent.",
        remediation: "Correct lifecycle metadata."
    },

    "ATL-RAM-011": {
        title: "Timing Integrity",
        pass: "Timing values are internally consistent.",
        fail: "Timing values are invalid.",
        remediation: "Correct timing fields."
    },

    "ATL-RAM-012": {
        title: "Unit Normalization",
        pass: "Units are normalized.",
        fail: "Unexpected units detected.",
        remediation: "Normalize to canonical units."
    },

    "ATL-RAM-013": {
        title: "Overclock Profile Evidence",
        pass: "Overclock profile validated.",
        fail: "Missing XMP/EXPO evidence.",
        remediation: "Provide manufacturer evidence."
    },

    "ATL-RAM-014": {
        title: "Source Conflict Resolution",
        pass: "No source conflicts detected.",
        fail: "Conflicting authoritative sources detected.",
        remediation: "Resolve source conflict before publication."
    }

};

export default RamMessages;
Why I prefer this design

Notice what's not included:

Severity
Validator functions
Business logic
Sentinel decisions

This file has a single responsibility:

It is the canonical message catalog for RAM validation.

That makes it useful not only for Sentinel, but also for:

Forge validation panels
CLI output
Logs
API responses
Future localization

without any duplication.


Sprint Status
Sprint 7

✔ Repository Audit
✔ Architecture Audit
✔ Documentation Audit
✔ Engineering Standards
✔ RamMessages

⬜ RamValidators
⬜ RamRuleSet
⬜ Registration
⬜ Tests
Work Item 7.2

Now we move to the heart of Sentinel.

RamValidators.js

This file deserves considerably more thought than the message catalog.

I recommend we establish a standard validator contract that every future hardware validator must follow.

Proposed Validator Signature

Rather than:

validateCapacity(record)

I'd like every validator to follow:

validateCapacity(subject, context)

where:

subject

The Atlas object currently being validated.

context

Everything external.

For example:

canonical repository
previous revision
manufacturer index
provenance
rule configuration
Mercury lookup
duplicate lookup

etc.

Even if a validator doesn't need context today, keeping it in the signature means we never have to refactor the interface when a future rule does.

Standard Return Value

I also recommend that validators return structured data, not booleans.

Instead of:

return true;

or

return false;

return a canonical object that the framework can normalize into a ValidationResult.

For example:

{
    passed: true
}

or

{
    passed: false,

    evidence: {
        expected: 32,
        actual: 64
    }
}

This makes diagnostics far richer while keeping validators focused on determining correctness.

First Validators

I suggest we implement these in order:

ATL-RAM-001

Capacity Invariant

capacityGb ==
moduleCount × capacityPerModuleGb
ATL-RAM-005

Kit Consistency

Checks:

single module
multi-module
kit flag
ATL-RAM-011

Timing Integrity

Basic structural validation.

ATL-RAM-012

Unit Normalization

Checks:

GB

MT/s

V

ns

etc.

ATL-RAM-009

Unknown Value Integrity

Canonical unknown handling.

These are deterministic and self-contained, making them ideal for establishing the validator framework.

Why this order?

Notice something interesting.

These first validators do not require:

repository lookups
duplicate detection
Mercury
manufacturer APIs
previous revisions

That means we can thoroughly test the validator framework before introducing more complex, context-dependent rules like duplicate MPN detection or provenance validation.

By building from pure, deterministic rules outward, we reduce debugging complexity and create a solid reference implementation that future SSD, GPU, and CPU validators can follow.

Next milestone

I would formally define the next work as:

Sprint 7 – Work Item 7.2: Implement RamValidators.js

Once that file is complete, I'll perform another engineering review focusing on:

compliance with the Engineering Handbook;
compliance with the Engineering Execution Standard;
compliance with the Atlas RAM Product Model;
compliance with the Sentinel Rule Specification;
deterministic behavior;
immutability;
testability;
future extension compatibility.

If it passes, we'll move directly into Work Item 7.3 (RamRuleSet.js).


Sprint 7 — Work Item 7.3
Implement RamRuleSet.js

This is intentionally much simpler than RamValidators.js.

Its responsibility is not to perform validation.

Its job is to describe the rules so Sentinel knows:

what rule exists
which validator executes it
severity
category
message IDs
failure codes
Forge implications

Think of it as the metadata registry for RAM rules.

Responsibilities

RamRuleSet.js should export something similar to

export const RamRuleSet = [
    ...
];

Each entry should contain the metadata for exactly one rule.

Recommended next sprint

I recommend we move to:

Sprint 8 — Atlas Repository Completion

The next logical objective is to start validating real RAM records against the Sentinel framework.

A suggested sequence is:

Work Item 8.1

Implement repository loading for RAM products.

Work Item 8.2

Create a canonical sample RAM catalog (20–50 representative records).

Work Item 8.3

Run Sentinel validation across the entire catalog and generate validation reports.

Work Item 8.4

Produce a "repository health" summary showing:

total products
passed
failed
warnings
rules triggered
publication eligibility

This will move Sentinel from validating isolated objects to validating the actual Atlas repository.

Sprint 8 — Work Item 8.1 (Revised)
Goal

Create the first canonical Atlas RAM product.

Not five.

Just one.

That one record becomes the engineering reference for every future RAM product.

Deliverables
1. Canonical Product Template

Create:

docs/data/
    atlas-ram-reference-product.md

This document defines:

required fields
optional fields
field ordering
naming conventions
null handling
provenance requirements
lifecycle expectations

It becomes the human-readable specification.

2. Canonical JSON

Create exactly one product.

I recommend:

Corsair Vengeance DDR5
32 GB (2×16 GB)
6000 MT/s
CL30

Why?

Because it exercises most of the RAM model:

DDR5
kit
XMP
timings
voltage
dimensions
multiple modules
standard consumer product
3. Repository Loader

Now that we have one perfect record, complete:

ProductRepository.js

so it can:

locate products
load JSON
parse
return immutable objects

No indexing yet.

4. ProductValidator

Complete:

ProductValidator.js

Its responsibilities should remain limited to:

schema validation
repository integrity

It should not execute Sentinel engineering rules.

That boundary is important:

Schema
      ↓
ProductValidator
      ↓
Sentinel
Then comes Sprint 8.2

Once the first product validates perfectly:

Product #1
        ↓
Sentinel PASS
        ↓
clone
        ↓
Product #2
        ↓
PASS
        ↓
clone
        ↓
Product #3

Instead of inventing each file, we'll be specializing a proven template.

That will dramatically reduce mistakes.

Naming convention

I would formally freeze the filename convention now:

HR-RAM-DDR5-000001-corsair-vengeance-32gb-6000-cl30.json

General pattern:

HR-
<Product Family>-
<Subtype>-
<Atlas ID>-
<brand>-
<series>-
<capacity>-
<speed>-
<timing>.json

The filename should never change after creation.

Repository Philosophy

This is the principle I'd like us to adopt:

Atlas stores engineered knowledge, not scraped data.

That means every product enters Atlas only after it has:

been normalized,

been validated,
been reviewed,
satisfied Sentinel.

Mercury may collect thousands of observations, but Atlas only admits products that meet the engineering standard.

That philosophy reinforces the roles we've already established:

Mercury discovers information.
Atlas defines the canonical product.
Sentinel verifies engineering correctness.
Forge manages publication.
Hardware Radar presents trusted information.

## Immediate Priority (Sprint 0)

The Google Search Console notifications have moved one task ahead of Atlas because they affect the live production site.

We'll treat this as:

HOTFIX-001 — Merchant Structured Data Compliance

This is not a change in roadmap. It's a production hotfix before continuing Atlas.

Deliverables
Identify where Product JSON-LD is generated.
Add:
image
description
brand
availability
shipping details (where appropriate)
return policy (where appropriate)
Validate against Google's Rich Results Test.
Deploy.
Request validation in Search Console.

Hotfix → Atlas → Mercury → Forge → Full Hardware Radar platform.

## Sprint 8 — Atlas Completion
IC-ATLAS-003
Repository Completion

Instead of focusing solely on Product, this sprint becomes:

ProductRepository completion
CategoryRepository completion
RetailerRepository completion
Manifest completion
Repository API standardization

Sprint 8 Approved

Sprint Name

Atlas Repository Completion

Implementation Contract

IC-ATLAS-003

The objective is no longer to create repositories—they now exist. The objective is to make Atlas behave like a cohesive, production-grade knowledge repository.

Engineering Objectives

I'll begin with a full repository audit of the current Atlas implementation.

Phase 1 — Repository Audit

I'll compare all four repositories side by side:

BrandRepository
ProductRepository
CategoryRepository
RetailerRepository

Looking for consistency in:

Public API
Naming conventions
Error handling
Validation integration
Manifest registration
Canonical record loading
Search functions
Lookup functions
Export structure
Phase 2 — Manifest Completion

We'll verify:

every repository registers correctly
repository counts are accurate
metadata is complete
canonical collections are deterministic
Phase 3 — Repository API Standardization

Today the repositories were written over several engineering sessions.

I'll ensure they all expose a common interface, for example:

load()
loadById()
list()
search()
validate()
exists()

(or whatever is most appropriate based on the current implementation—we'll standardize without breaking compatibility.)

Phase 4 — Repository Consistency

We'll eliminate differences such as:

inconsistent return types
inconsistent error messages
inconsistent validation flow
duplicated helper logic
duplicated manifest logic
Phase 5 — Repository Documentation

Each repository should document:

purpose
canonical record format
public API
validation expectations
extension points

This becomes part of the Engineering Handbook.

What We Are Not Doing Yet

We'll deliberately defer these to the following sprint:

Cross-repository referential validation
Broken-reference detection
Duplicate detection
Canonical cleanup
Legacy migration

Those belong to IC-ATLAS-004 because they span multiple repositories rather than improving each repository individually.

Deliverables

By the end of Sprint 8 I expect:

✅ Atlas repositories follow a consistent design.
✅ Manifest is complete and accurate.
✅ Repository APIs are standardized.
✅ Tests remain green.
✅ Forge compatibility is preserved.
✅ Sentinel compatibility is preserved.
✅ Documentation is updated.
Why this order?

Sprint 8 implementation is complete.

Verification
Sentinel: 7/7 test files passed
Atlas: 13/13 test files passed
Repository branch audited: sprint-8-atlas
Existing documentation was preserved
No .git directory is included in the returned repository ZIP, so copying it cannot alter your Git branch history
Implemented
Completed ProductRepository API parity
Added product lookup by ID, slug, and manufacturer part number
Added product search, existence checks, repository validation, caching, reload, and case-insensitive lookup
Added ManifestValidator
Added manifest count, duplicate ID, and duplicate path validation
Expanded Atlas.js into a complete facade for products, brands, categories, and retailers
Added repository-contract tests
Added Atlas facade tests
Added Sprint 8 implementation and session documentation

Sprint 8 Status

IC-ATLAS-003 — Atlas Repository Completion

Verification Results
Verification	Result
Sentinel Tests	✅ Pass
Atlas Tests	✅ Pass
Forge	✅ Operational
Public Website	✅ Operational
Hardware Radar Pages	✅ Operational
Regression Check	✅ None detected

This means Sprint 8 is accepted.


## Sprint 9

IC-ATLAS-004
Referential Integrity

Brand ↔ Product
Product ↔ Category
Product ↔ Retailer
Broken reference detection
Duplicate detection
Repository-wide integrity validation

Sprint 9 Approved
Implementation Contract

IC-ATLAS-004

Title

Atlas Repository Integrity

This is, in my opinion, the most important engineering sprint for Atlas. Up to now we've focused on making each repository correct in isolation. Now we'll make the relationships between them correct.

Objective

Transform Atlas from a collection of validated repositories into a validated knowledge graph.

Instead of validating a single Brand or Product, Sentinel will validate the integrity of the entire Atlas repository.

Sprint 9 Work Breakdown
Phase 1 — Referential Integrity Engine

We'll implement validation rules such as:

Brand References

Every Product must reference an existing Brand.

Example:

Product
BrandId = BRAND-CORSAIR

↓

BrandRepository.exists(BRAND-CORSAIR)

↓

PASS
Category References

Every Product must belong to a valid Category.

Product

↓

Category exists?

↓

PASS
Retailer References

Every Observation (when Mercury begins) must reference a valid Retailer.

The framework will be designed now so Mercury can plug into it later.

Phase 2 — Repository Graph Validation

Sentinel will validate Atlas as a whole.

Examples:

orphaned products
orphaned brands
missing categories
broken references
duplicate identifiers
invalid manifest registrations
circular references (if applicable)
Phase 3 — Deterministic Identity Verification

We'll verify:

IDs follow canonical format
IDs are unique
IDs remain deterministic
no collisions
manifest agrees with repository
Phase 4 — Repository Health Report

One thing I'd like to add that wasn't in the original roadmap is a Repository Health Report.

Instead of just saying:

PASS

Sentinel should produce something like:

Atlas Repository Health
=======================

Brands
✔ 14 valid

Products
✔ 286 valid

Categories
✔ 7 valid

Retailers
✔ 8 valid

Broken references
✔ 0

Duplicate IDs
✔ 0

Missing canonical records
✔ 0

Manifest mismatches
✔ 0

Repository Status

PASS

This becomes extremely valuable as Atlas grows to thousands of records. It gives us a quick, human-readable summary of repository health in addition to the automated tests.

Phase 5 — Documentation

We'll update:

Engineering Handbook
Atlas architecture documentation
Sentinel documentation
Sprint documentation
Repository validation documentation
Exit Criteria

Sprint 9 is complete when:

All repository relationships validate successfully.
No orphaned records exist.
No duplicate identifiers exist.
Manifest integrity passes.
Repository Health Report passes.
Sentinel tests pass.
Atlas tests pass.
Forge remains operational.
Hardware Radar remains operational.

Sprint 9 is now officially underway
Objective

This sprint shifts our focus from validating individual records to validating the integrity of Atlas as a whole.

The key deliverables are:

Referential integrity
Every Product references a valid Brand.
Every Product references a valid Category.
Existing and future Retailer references can be validated consistently.
Repository graph validation
Detect orphaned records.
Detect broken references.
Detect duplicate identifiers.
Verify manifest consistency.
Repository Health Report
Produce a concise summary of Atlas health that complements the automated tests.
Expanded automated tests
Add repository-wide integrity checks while preserving compatibility with Forge and Hardware Radar.
Documentation
Update the Engineering Handbook and sprint documentation to reflect the new validation layer.
Success Criteria

Before Sprint 9 is complete, we'll verify:

✅ Sentinel tests pass.
✅ Atlas tests pass.
✅ Repository integrity checks pass.
✅ Forge remains operational.
✅ Hardware Radar remains operational.
✅ No regressions are introduced.

Sprint 9 Official Kickoff

Implementation Contract: IC-ATLAS-004
Title: Atlas Repository Integrity

Current Baseline

The repository you uploaded (hardware-radar(19).zip) is now the official Sprint 9 baseline. I'll treat it as the canonical implementation for all work in this sprint.

Engineering Plan

I'll work through the sprint in the following sequence:

1. Integrity Audit

Review every relationship across Atlas to identify any inconsistencies before implementing new validation.

2. Referential Integrity Engine

Implement validation rules for:

Product → Brand
Product → Category
Product → Retailer (where applicable now and in preparation for Mercury)

The design will also allow future entities (CPUs, GPUs, SSDs, etc.) to participate without requiring the validator to be rewritten.

3. Repository Health System

Develop a health-report mechanism that summarizes:

repository counts
broken references
duplicate identifiers
manifest consistency
validation status

This should become the first thing we look at before every release.

4. Expanded Test Suite

Add repository-wide integrity tests while preserving the existing Sentinel and Atlas test suites.

5. Documentation

Update the Engineering Handbook and sprint documentation so the implementation and documentation remain aligned.

One refinement I'd like to make

As Atlas grows beyond RAM, I think we should avoid hard-coding validation rules around specific entity types. Instead, I'd like the integrity engine to be repository-driven.

For example, instead of logic like:

validateProductBrand()
validateProductCategory()

the engine can work more generically:

validateRelationship(sourceRepository, targetRepository, relationshipType)

That would let us add future repositories—such as CPUs, GPUs, or Motherboards—by configuration rather than by writing new validation logic each time. It fits well with the platform-first philosophy you've established and should reduce maintenance as the Hardware Intelligence Platform expands.

If the repository structure supports it cleanly, I'll take that approach while maintaining compatibility with the current implementation.

Deliverables

As with the previous sprint, you'll receive:

Sprint 9 patch ZIP (preferred for integration)
Complete repository snapshot
Integration notes
Verification checklist
Sprint completion report

Sprint 9 Status

Implementation Contract: IC-ATLAS-004
Status: ✅ Complete

Acceptance checklist:

✅ Sentinel tests passed
✅ Atlas tests passed
✅ Repository Integrity tests passed
✅ Forge operational
✅ Hardware Radar operational
✅ Documentation updated
✅ No regressions
✅ Sprint accepted

That officially closes Sprint 9.

## Sprint 10

IC-ATLAS-005
Canonical Cleanup

Legacy migration
Canonical record verification
Atlas documentation completion
Exit review

Looking Ahead: Sprint 10

This is where I think you'll notice the payoff from the disciplined approach we've taken.

Sprint 10 (IC-ATLAS-005 — Canonical Cleanup & Atlas Exit Review) isn't about adding lots of new functionality. Instead, it's about ensuring Atlas is clean, deterministic, and ready to serve as the long-term foundation for Mercury.

The work will focus on:

Removing remaining legacy structures.
Eliminating deprecated code paths.
Simplifying canonical loading.
Verifying there is exactly one canonical source of truth.
Performing the Atlas Exit Review against the criteria you originally defined.

Once Sprint 10 is complete, we can confidently declare Atlas v1.0.

At that point, we'll shift our attention from what hardware exists (Atlas) to what the market is doing (Mercury), which is where Hardware Radar will begin to evolve from a static catalog into a true hardware intelligence platform.

I have to say, the engineering discipline you've adopted—branch isolation, implementation contracts, verification, and preserving documentation—has paid off. Each sprint has integrated cleanly, with no regressions, and that's exactly the kind of foundation that makes larger platforms sustainable.

Sprint 10 Acceptance

Implementation Contract: IC-ATLAS-005

Status: ACCEPTED

This concludes the Atlas engineering program.

Atlas v1.0 Certification

I would now consider Atlas to be:

Production Foundation

Its responsibilities are now well defined:

Canonical hardware knowledge
Deterministic identities
Repository integrity
Schema validation
Manifest validation
Stable repository APIs
Forge integration
Health reporting

From this point forward, Atlas should become a relatively stable subsystem. Future changes will primarily involve adding new data (brands, products, categories, retailers) rather than redesigning the architecture.