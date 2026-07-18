Forge Engineering Standards v1.0

Status: Canonical Engineering Reference
Applies to: Forge Core, domain modules, validators, builders, exporters, UI integration, tests, and future automation
Companion document: Forge Architecture Bible

1. Purpose

This document defines how Forge must be engineered.

The Architecture Bible defines Forge’s mission and system structure. These standards define the implementation discipline required to preserve that architecture as the platform expands.

The objective is not merely clean code. The objective is a system that remains:

trustworthy,
deterministic,
explainable,
maintainable,
testable,
extensible across product categories.

Any implementation that weakens those properties should be reconsidered.

2. The Forge Laws

These laws are the highest-level engineering constraints.

Law 1 — One Responsibility per Service

Every service must have one clearly defined responsibility.

A class may coordinate related internal steps, but it must not own unrelated concerns.

Examples:

DerivedFieldService

May derive normalized or calculated values.

It must not:

validate required fields,
determine publication status,
create UI markup,
export JSON files.
EngineeringValidator

May inspect engineering relationships and produce observations.

It must not:

mutate input,
generate product IDs,
build Atlas records,
decide whether publication should proceed.
Law 2 — Business Rules Never Live in UI Code

UI code may:

collect input,
invoke services,
render results,
respond to user interaction.

UI code must not determine:

whether a RAM configuration is valid,
whether a record is publication-ready,
how scores or penalties are calculated,
which fields are required,
how product IDs are generated.

This is prohibited:

if (
    input.xmpSupported === false &&
    input.xmpVersion
) {
    showWarning("XMP contradiction");
}

The UI should instead render a warning already produced by the engineering layer.

Law 3 — Builders Never Validate

Builders convert trusted internal data into destination-specific structures.

Examples:

AtlasProductBuilder
MercuryObservationBuilder
CsvExporter
ApiExporter

Builders may format or map fields.

They must not determine whether those fields are correct.

This is prohibited:

if (!input.brand) {
    throw new Error("Brand is required.");
}

inside a builder.

Validation must already have occurred before the builder is called.

Law 4 — Validators Never Mutate

Validators inspect data and return observations.

They must never alter the product record.

This is prohibited:

if (!input.moduleCount) {
    input.moduleCount = 1;
}

A validator may report:

{
    code: "RAM005",
    severity: "warning",
    message: "Module count is missing."
}

Mutation and derivation belong elsewhere.

Law 5 — Every Decision Must Be Explainable

Forge must never produce a decision without supporting reasons.

This is insufficient:

{
    status: "REVIEW"
}

This is acceptable:

{
    status: "REVIEW",
    reasoning: [
        {
            code: "PUB002",
            message:
                "One or more engineering warnings require human review."
        }
    ]
}

A user, engineer, API client, or future automated system must be able to determine why Forge reached its conclusion.

Law 6 — Every Product Uses the Same Canonical Pipeline

No product may bypass validation or publication review.

The canonical flow is:

Input
  ↓
Normalization and Derivation
  ↓
Required Validation
  ↓
Engineering Validation
  ↓
Publication Readiness
  ↓
Builders
  ↓
Exports

Special product categories may contribute different rules, but they must not bypass the pipeline.

Law 7 — Domain Knowledge Stays Outside Forge Core

Forge Core must not contain rules specific to:

DDR5,
PCIe generations,
NAND types,
CPU sockets,
GPU power connectors,
camera lens mounts,
television panel technologies.

Those rules belong in category or domain modules.

Forge Core may understand generic concepts such as:

errors,
warnings,
confirmations,
readiness states,
decision reports,
export requests.
Law 8 — Trust Takes Priority Over Convenience

Forge must not infer uncertain facts merely to complete a record.

When information cannot be established reliably, Forge should:

leave the value unresolved,
recommend verification,
reduce confidence,
require review where appropriate.

Forge must never fabricate product information.

3. Canonical Pipeline Responsibilities
3.1 ProductForm

Responsibility: Collect user-entered values and convert them into a consistent internal input object.

May perform:

reading form controls,
basic string trimming,
checkbox conversion,
numeric parsing where explicitly defined,
collection of nested field groups.

Must not perform:

engineering validation,
derived calculations,
publication decisions,
Atlas or Mercury construction.
3.2 DerivedFieldService

Responsibility: Produce deterministic values derived from known input.

Examples:

capacity per module,
normalized memory type,
standard URL formatting,
calculated totals,
canonical text representations.

Requirements:

identical input must produce identical output,
derivation must be explainable,
original input should not be mutated unless mutation is an intentional and documented contract.

Preferred pattern:

const derivedInput =
    derivedFieldService.apply(input);

The service should return a new object where practical.

3.3 RequiredFieldValidator

Responsibility: Determine whether mandatory data required for generation is present and structurally valid.

It answers:

Can Forge create a valid product record from this input?

It should produce hard errors such as:

missing product name,
missing brand,
missing manufacturer URL,
invalid price,
missing retailer source URL.

Its output must be deterministic and structured.

3.4 EngineeringValidator

Responsibility: Evaluate whether the technical description is internally plausible and consistent.

It answers:

Does this product description make engineering sense?

Its observations may include:

warnings,
confirmations,
informational notes.

Examples:

capacity does not divide evenly by module count,
XMP version exists while XMP is disabled,
registered memory is marked unbuffered,
derived capacity has been verified.

Engineering warnings do not automatically mean the record is structurally invalid. They inform publication readiness.

3.5 ForgeValidator

Responsibility: Coordinate validation services and assemble the canonical Validation Report.

It may:

call required validation,
call engineering validation,
preserve compatibility fields,
aggregate warnings and errors.

It must not:

mutate input,
calculate publication readiness,
build exports,
contain UI logic.

Canonical output:

{
    valid: true,

    errors: [],

    warnings: [],

    engineering: {
        observations: [],
        warnings: [],
        confirmations: []
    }
}
3.6 PublicationReadinessEngine

Responsibility: Convert a Validation Report into a workflow decision.

It answers:

What should happen to this product record next?

Canonical statuses:

READY
REVIEW
BLOCKED

It must not duplicate validation logic.

It consumes validation conclusions rather than independently deciding whether fields or specifications are correct.

3.7 Builders

Responsibility: Convert approved internal data into destination-specific records.

Examples:

AtlasProductBuilder
MercuryObservationBuilder

Builders may:

map fields,
create nested structures,
apply destination formatting,
assign timestamps supplied by the orchestrator.

Builders must not:

validate,
derive engineering facts,
determine publication readiness,
read from the DOM.
3.8 ForgeGenerator

Responsibility: Orchestrate the end-to-end generation workflow.

It may coordinate:

DerivedFieldService
ForgeValidator
PublicationReadinessEngine
ForgeIdGenerator
AtlasProductBuilder
Mercury builder

It must remain thin.

ForgeGenerator should describe the workflow, not contain the underlying business rules.

4. Data Processing Order

The canonical order should be:

1. Receive raw input
2. Apply deterministic derivation
3. Validate the derived internal record
4. Evaluate publication readiness
5. Stop if BLOCKED
6. Generate IDs and timestamps
7. Build Atlas record
8. Build Mercury observation
9. Return generation result and reports

This is a refinement of the current pipeline.

Derived fields should generally be available before engineering validation because some validation rules depend on derived values.

For example:

totalCapacity ÷ moduleCount

should be derived before Forge verifies whether the result is plausible.

The preferred pipeline is therefore:

Raw Input
    ↓
DerivedFieldService
    ↓
ForgeValidator
    ↓
PublicationReadinessEngine
    ↓
Builders
5. Immutability Standard

Services should prefer returning new objects instead of modifying caller-owned objects.

Preferred:

apply(input) {
    return {
        ...input,
        capacityPerModule:
            this.calculateCapacityPerModule(input)
    };
}

Avoid:

apply(input) {
    input.capacityPerModule =
        this.calculateCapacityPerModule(input);

    return input;
}

Immutability provides:

clearer data ownership,
easier debugging,
safer tests,
fewer hidden side effects,
better compatibility with batch processing.

Mutation is permitted only when:

it is intentionally part of the service contract,
the behavior is documented,
tests explicitly verify it.
6. Report Standards

Forge should use structured reports rather than unstructured message arrays wherever possible.

6.1 Validation Observation

Canonical shape:

{
    code: "RAM001",

    severity: "warning",

    field: "moduleCount",

    title: "Capacity divisibility",

    message:
        "Total capacity is not evenly divisible by module count.",

    rationale:
        "Commercial memory kits normally contain equal-capacity modules."
}

Required fields:

code
severity
message

Recommended fields:

field
title
rationale
metadata
6.2 Decision Reason

Canonical shape:

{
    code: "PUB002",

    type: "warning",

    message:
        "Engineering observations require human review.",

    sourceCodes: [
        "RAM001",
        "RAM002"
    ]
}

A decision reason should reference relevant observations rather than copying all their text.

6.3 Publication Decision Report

Canonical Version 1 shape:

{
    status: "READY",

    confidence: "HIGH",

    score: 100,

    blockers: [],

    recommendations: [],

    reasoning: [],

    summary: {
        requiredValidationPassed: true,
        engineeringWarningCount: 0,
        engineeringConfirmationCount: 1
    }
}

The initial version should remain intentionally compact.

Fields may be added later, but existing meanings must remain stable.

7. Status Definitions
READY

A record is READY when:

required validation passes,
no review-triggering engineering warnings exist,
no publication blocker exists.

Meaning:

The record may proceed through the standard publication workflow.

READY does not necessarily mean every optional field is complete.

REVIEW

A record is REVIEW when:

required validation passes,
generation is technically possible,
one or more observations warrant human verification.

Meaning:

The record is structurally valid but should receive human review before publication.

Version 1 may still generate Atlas and Mercury outputs for a REVIEW record, provided the UI clearly displays the review status.

BLOCKED

A record is BLOCKED when:

required validation fails,
a critical contradiction exists,
generation would create an invalid or untrustworthy record.

Meaning:

Atlas and Mercury outputs must not be created.

8. Confidence Definitions

Confidence describes the strength of Forge’s conclusion, not the status itself.

HIGH

Forge has sufficient verified and internally consistent information to support its decision strongly.

MEDIUM

The decision is reasonable, but one or more unresolved observations reduce certainty.

LOW

The record contains missing, invalid, contradictory, or insufficient information.

Initial deterministic mapping:

READY   → HIGH
REVIEW  → MEDIUM
BLOCKED → LOW

More nuanced confidence calculations may be introduced later, but they must remain deterministic and explainable.

9. Scoring Standard

The score is supporting evidence. It must never override status rules.

For example:

Required validation failure

must always produce:

BLOCKED

even if a numeric score would otherwise remain high.

Version 1 scoring

Start at:

100

Suggested penalties:

Required validation failure:
score becomes 0

Each engineering warning:
-5

Clamp the result:

Math.max(0, Math.min(100, score))

Initial score interpretation:

95–100  Excellent
85–94   Strong
70–84   Needs Review
0–69    Unready

These labels are informational only.

Publication status remains rule-driven.

10. Rule Codes and Stability

Once a rule code has been released, its meaning must not be silently changed.

Reserved ranges:

GEN001–GEN099
General warnings and errors

GEN100–GEN199
General confirmations and information

PUB001–PUB099
Publication decision reasons

RAM001–RAM099
RAM warnings and errors

RAM100–RAM199
RAM confirmations and information

SSD001–SSD099
SSD warnings and errors

SSD100–SSD199
SSD confirmations and information

CPU001–CPU099
CPU warnings and errors

CPU100–CPU199
CPU confirmations and information

GPU001–GPU099
GPU warnings and errors

GPU100–GPU199
GPU confirmations and information

MON001–MON099
Monitor warnings and errors

MON100–MON199
Monitor confirmations and information

When a rule becomes obsolete:

mark it deprecated,
retain its documentation,
do not assign its code to a different rule.
11. Rule Documentation Standard

Every formal engineering rule should eventually include:

Code
Title
Category
Severity
Purpose
Condition
Rationale
Affected fields
Example passing case
Example failing case
Introduced version
Deprecated version, if applicable

Example:

## RAM001 — Capacity Divisibility Check

Category: RAM  
Severity: Warning  
Introduced: Forge v0.2

### Purpose

Verify that total kit capacity divides evenly by module count.

### Condition

Raise the observation when:

totalCapacity % moduleCount !== 0

### Rationale

Commercial memory kits normally contain modules with equal capacities.

### Passing example

32 GB total, 2 modules → 16 GB per module

### Failing example

32 GB total, 3 modules → 10.67 GB per module
12. Error Handling Philosophy

Forge should distinguish among:

User data errors

Examples:

missing required field,
invalid price,
contradictory specification.

These belong in reports and should not normally throw exceptions.

Programming errors

Examples:

unavailable service dependency,
malformed internal template,
unexpected null object,
unsupported operation.

These may throw exceptions because they represent defects or failed assumptions.

External system errors

Future examples:

manufacturer lookup fails,
retailer API unavailable,
image download fails.

These should produce explicit operational errors or recommendations. Forge must not silently substitute invented values.

13. Naming Conventions
Classes

Use PascalCase:

ForgeValidator
EngineeringValidator
PublicationReadinessEngine
AtlasProductBuilder
Methods and variables

Use camelCase:

validateInput()
evaluate()
createFailedResult()
engineeringWarnings
Constants

Use uppercase snake case when immutable and module-wide:

const PUBLICATION_STATUS = {
    READY: "READY",
    REVIEW: "REVIEW",
    BLOCKED: "BLOCKED"
};
Files

Use one primary exported class per file.

Preferred:

PublicationReadinessEngine.js
EngineeringValidator.js
AtlasProductBuilder.js

Avoid vague names:

helpers.js
utils.js
misc.js
common.js

A shared utility file is permitted only when its responsibility is specific and coherent.

14. Method Design

Methods should:

perform one coherent operation,
use descriptive names,
avoid hidden state,
accept explicit dependencies,
return predictable structures.

Prefer:

evaluate(validationReport)

over:

process(data)

Prefer:

calculateScore(validationReport)

over:

doScore()
15. Dependency Standards

Dependencies should be visible in constructors.

Example:

export class ForgeGenerator {
    constructor({
        validator = new ForgeValidator(),
        readinessEngine =
            new PublicationReadinessEngine(),
        atlasBuilder =
            new AtlasProductBuilder()
    } = {}) {
        this.validator = validator;
        this.readinessEngine =
            readinessEngine;
        this.atlasBuilder = atlasBuilder;
    }
}

Dependency injection is not mandatory for every early service, but future testability should remain possible.

Services must not access global UI state or DOM elements.

16. Testing Standards

Every business rule requires tests.

Minimum test levels:

Unit tests

Test services independently.

Examples:

RequiredFieldValidator
EngineeringValidator
PublicationReadinessEngine
ForgeIdGenerator
DerivedFieldService
Integration tests

Test the canonical pipeline.

Examples:

valid product produces Atlas and Mercury outputs,
required error produces BLOCKED,
engineering warning produces REVIEW,
clean record produces READY,
generated filenames remain correct.
Regression tests

Every corrected defect should receive a test when practical.

A bug should not be considered fully resolved until the failure condition is reproducible and protected.

Required PublicationReadinessEngine cases

At minimum:

valid=false
→ BLOCKED / LOW / score 0

valid=true and zero engineering warnings
→ READY / HIGH / score 100

valid=true and one engineering warning
→ REVIEW / MEDIUM / score 95

valid=true and multiple engineering warnings
→ REVIEW / MEDIUM / score reduced accordingly

score never below 0
17. UI Integration Standards

The UI must render reports; it must not reinterpret them.

Preferred:

renderPublicationStatus(
    result.publication
);

The UI may choose visual presentation:

badges,
icons,
accordions,
progress displays,
grouped sections.

It may not independently change:

REVIEW

into:

READY

based on local logic.

18. Export Standards

Exported data must be based on the same approved internal record used by validation and readiness evaluation.

Do not:

validate one object,
mutate the object,
export a materially different object.

The report and exported record must describe the same product state.

Future exports should include traceability metadata where appropriate:

{
    generatedBy: "Forge",
    forgeVersion: "0.2.0",
    publicationStatus: "READY",
    evaluatedAt: "..."
}

This should be added only when destination schemas permit it.

19. Versioning Standards

Forge should eventually maintain three related versions:

Application version
Schema version
Rule-set version

Example:

{
    forgeVersion: "0.3.0",
    atlasSchemaVersion: "1.0",
    engineeringRuleSet: "RAM-1.2"
}

This enables historical records to be interpreted correctly after rules evolve.

20. Architectural Change Process

Before implementing a major feature, document:

Problem
Proposed owner
Inputs
Outputs
Dependencies
Failure behavior
Testing requirements
Future category implications

A major feature should not enter implementation until these questions are resolved.

Examples of major features:

plugin architecture,
batch import,
AI specification suggestions,
manufacturer data lookup,
confidence calculation,
approval workflows,
rule configuration,
additional product domains.
21. Definition of Done

A Forge feature is complete when:

its responsibility is clearly owned,
its inputs and outputs are stable,
business logic is outside the UI,
errors and decisions are explainable,
tests cover expected behavior,
existing Atlas and Mercury behavior remains intact,
documentation is updated,
the code is committed and pushed.

A feature is not complete merely because it appears to work in the browser.

22. Immediate Architectural Decision

Before implementing PublicationReadinessEngine, the generation order should be corrected.

Current order:

Validate raw input
    ↓
Apply derived fields

Target order:

Apply derived fields
    ↓
Validate derived input
    ↓
Evaluate publication readiness

The upcoming implementation should therefore modify ForgeGenerator.generateProduct() to:

generateProduct(input) {
    const derivedInput =
        this.derivedFieldService.apply(input);

    const validation =
        this.validator.validateInput(
            derivedInput
        );

    const publication =
        this.publicationReadinessEngine.evaluate(
            validation
        );

    if (
        publication.status === "BLOCKED"
    ) {
        return this.createFailedResult({
            validation,
            publication
        });
    }

    // Generate Atlas and Mercury from derivedInput.
}

This preserves a crucial guarantee:

The object that is evaluated is the object that is exported.

Sprint 7.2F.3 Implementation Contract

The first PublicationReadinessEngine version should support only the rules we have already agreed upon.

Input
ValidationReport
Output
DecisionReport
Rules
Required validation failed
→ BLOCKED
→ LOW confidence
→ score 0

Required validation passed
and no engineering warnings
→ READY
→ HIGH confidence
→ score 100

Required validation passed
and engineering warnings exist
→ REVIEW
→ MEDIUM confidence
→ score = 100 - (5 × warning count)
Explicit exclusions from Version 1

Do not yet add:

optional-field completeness scoring,
retailer freshness scoring,
manufacturer verification,
AI confidence,
category-specific publication policies,
configurable penalty weights,
automatic approval,
historical score tracking.

Those capabilities should be introduced only after the basic decision contract is stable.

Sprint 10.x — Rename ForgeValidator → ValidationEngine (no behavior changes).