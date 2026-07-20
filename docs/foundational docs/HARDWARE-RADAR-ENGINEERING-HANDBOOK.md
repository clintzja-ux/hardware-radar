# Hardware Radar Engineering Handbook

Document ID: HR-ENGINEERING-HANDBOOK
Version: 1.0
Status: Canonical
Owner: Mirabelle Labs
Primary Project: Hardware Radar
Website: https://cheapestram.com
Last Updated: 2026-07-19

---

# Revision History

| Version | Date | Description |
|----------|------|-------------|
| 1.0 | 2026-07-19 | Initial canonical engineering handbook |

---

# Table of Contents

1. Purpose
2. Engineering Philosophy
3. Engineering Principles
4. Current Platform
5. Technology Stack
6. Repository Organization
7. Engineering Workflow
8. Guiding Rule

(The remaining chapters continue in Part 2.)

---

# 1. Purpose

The Hardware Radar Engineering Handbook defines how the platform is engineered.

It establishes engineering philosophy, development practices, coding standards, repository organization, and decision-making principles.

This handbook is intentionally technology-agnostic wherever possible.

Frameworks, languages, databases, and tooling may evolve.

Engineering principles should not.

This handbook should evolve slowly.

Architecture Decision Records (ADRs) should capture technology decisions rather than replacing the principles contained here.

---

# 2. Engineering Philosophy

Hardware Radar is engineered according to one central philosophy:

> Choose the simplest solution that solves today's problem without preventing tomorrow's solution.

Every engineering decision should be evaluated against this principle.

Examples include:

• HTML before React

• JSON before PostgreSQL

• Static deployment before backend services

• Manual workflow before automation

• Automation before artificial intelligence

• Artificial intelligence only when measurable value exists

Complexity is not a feature.

Complexity is a cost.

Every additional layer of technology increases maintenance burden, onboarding difficulty, operational risk, and debugging effort.

New technology must therefore justify its existence.

---

# 3. Engineering Principles

## 3.1 Truth Before Speed

Correct systems outperform fast systems that produce incorrect results.

Engineering effort should prioritize correctness, maintainability, and traceability before delivery speed.

---

## 3.2 Simplicity Before Cleverness

Readable engineering is preferred over impressive engineering.

Future contributors should understand the system without requiring deep historical knowledge.

Avoid unnecessary abstractions.

Avoid speculative architecture.

Avoid solving problems that do not yet exist.

---

## 3.3 Evidence Before Assumption

Unknown values remain unknown.

Never invent:

- specifications
- pricing
- availability
- compatibility
- affiliate information
- retailer data

Absence of information is preferable to incorrect information.

---

## 3.4 Automation Must Be Earned

Automation should only be introduced after a process has been fully understood.

Before automating a workflow, confirm:

- inputs are known
- outputs are known
- validation exists
- failure cases are understood
- rollback is possible

Do not automate confusion.

---

## 3.5 Repository Is The Source of Truth

The repository represents the current state of Hardware Radar.

Documentation must reflect implementation.

Implementation should respect documented architecture.

If documentation and implementation disagree, resolve the inconsistency immediately.

---

## 3.6 Stable Ownership

Every subsystem owns one responsibility.

Subsystem boundaries exist to reduce complexity.

Responsibilities should never silently migrate between systems.

Current ownership:

Atlas

• Product truth

Mercury

• Market observations

Forge

• Publication workflow

Future systems will receive documented ownership when implemented.

---

## 3.7 User Trust Above Everything

Hardware Radar exists because users trust its recommendations.

Engineering decisions that weaken user trust should be rejected regardless of technical elegance.

Trust is earned through:

- transparency
- accuracy
- traceability
- consistency

---

# 4. Current Platform

Hardware Radar is a live public platform.

Website:

https://cheapestram.com

Current website status:

✔ Live

Current content:

Placeholder product information

Placeholder pricing

Public pages:

• Home

• DDR5

• DDR4

• Laptop RAM (SODIMM)

• About

• How We Choose

• Contact

• Affiliate Disclosure

• Custom 404

The engineering objective is not to build a website.

The website already exists.

The engineering objective is to evolve the website into an automated hardware intelligence platform.

---

## 4.1 Current Operational Systems

The following systems are operational.

### Atlas

Purpose

Canonical hardware knowledge.

Responsibilities

• Product catalog

• Hardware specifications

• Validation rules

Current Status

Operational.

Requires additional automation before production-scale use.

---

### Mercury

Purpose

Market observation.

Responsibilities

• Retailer observations

• Pricing

• Historical observations

Current Status

Operational.

Currently uses placeholder data.

Requires automated data collection.

---

### Forge

Purpose

Publishing workflow.

Responsibilities

• Content generation

• Website publication

• Build orchestration

Current Status

Operational.

Requires additional automation before production publishing.

---

## 4.2 Planned Systems

The following architectural components have been designed but are not yet implemented.

Affiliate Layer

Amazon Associates abstraction and future affiliate providers.

Sentinel

Validation and compliance engine.

Compass

Recommendation engine.

Aurora

Artificial intelligence assistant.

Beacon

Analytics and reporting.

Gateway

Public APIs.

These systems should not be partially implemented.

Each should be introduced only when its responsibilities are clearly defined.

---

# 5. Current Technology Stack

The handbook documents technologies currently in use.

Future technologies belong in Architecture Decision Records.

---

## Frontend

HTML5

CSS3

Modular Vanilla JavaScript

---

## Data

JSON

---

## Hosting

Cloudflare

---

## Deployment

GitHub Continuous Deployment

---

## Source Control

GitHub

---

## Domain

cheapestram.com

Registrar

GoDaddy

---

## Philosophy

Current technology choices are intentionally lightweight.

New technologies should be adopted only when they solve demonstrated engineering problems.

Technology is selected because it improves the platform—not because it is fashionable.

---

# 6. Repository Organization

The repository should remain understandable.

Organization should grow only when necessary.

Current structure:

docs/

architecture/

design/

content/

brand/

roadmap/

releases/

sessions/

Engineering documentation should remain the primary source of architectural knowledge.

---

## Canonical Documents

The repository contains four foundational documents.

START_HERE.md

Repository orientation.

PRODUCT_CONSTITUTION.md

Product philosophy.

PROJECT_STATE.md

Current project status.

ENGINEERING_HANDBOOK.md

Engineering standards.

Every contributor should understand these documents before making significant architectural changes.

---

# 7. Engineering Workflow

Every engineering session follows the same workflow.

1. Read START_HERE.md

2. Read PROJECT_STATE.md

3. Review subsystem documentation

4. Implement one focused improvement

5. Validate implementation

6. Update documentation if necessary

7. Commit changes

Large engineering efforts should be divided into small independently verifiable changes.

Incremental progress is preferred over large rewrites.

---

# 8. Guiding Rule

Whenever uncertainty exists, choose the option that:

• improves clarity

• preserves correctness

• reduces complexity

• protects user trust

If those goals conflict, protecting user trust always takes precedence.

---

End of Part 1

Continues with:

Part 2

Engineering Standards

Coding Standards

Data Standards

Atlas Standards

Mercury Standards

Forge Standards

Affiliate Engineering Standards

## Part 2

---

# 9. Coding Standards

The purpose of coding standards is consistency rather than personal preference.

Readable code is easier to debug, maintain, review, and extend.

Future contributors should understand the intent of a file within minutes.

---

## 9.1 General Principles

Code should be:

- readable
- predictable
- modular
- explicit
- testable

Avoid writing code that requires comments to explain basic behavior.

Good code explains itself through naming and structure.

---

## 9.2 Naming

Use descriptive names.

Good:

```javascript
calculateLowestPrice()

generateAffiliateLink()

normalizeAmazonListing()

validateRamCapacity()
```

Avoid:

```javascript
calc()

run()

temp()

thing()

data2()
```

---

## 9.3 File Naming

Use:

kebab-case

Examples

```
render-category.js

price-calculator.js

affiliate-generator.js

amazon-parser.js
```

---

## 9.4 Variable Naming

Use camelCase.

```
lowestPrice

productCapacity

affiliateId

priceHistory
```

Constants use UPPER_SNAKE_CASE.

```
MAX_RESULTS

DEFAULT_TIMEOUT

SUPPORTED_RETAILERS
```

---

## 9.5 Function Design

Functions should do one thing well.

Avoid:

- multiple unrelated responsibilities
- hidden side effects
- unnecessary parameters

Prefer:

```
parseAmazonListing()

↓

normalizeProduct()

↓

validateProduct()

↓

saveObservation()
```

rather than one large function performing every task.

---

## 9.6 Comments

Comments explain **why**, not **what**.

Bad

```javascript
// increase score

score++;
```

Good

```javascript
// Amazon occasionally reports temporary unavailable pricing.
// Ignore observations that cannot be verified.
```

---

# 10. Data Standards

Hardware Radar exists because users trust the data.

Data quality is therefore more important than software complexity.

---

## 10.1 Truth First

Unknown values remain unknown.

Never guess:

- specifications
- prices
- availability
- release dates
- retailer information

Missing information is preferable to incorrect information.

---

## 10.2 Canonical Data

Atlas owns canonical hardware information.

Examples:

Manufacturer

Model

Capacity

Speed

Generation

Interface

Memory type

Mercury must never overwrite Atlas truth.

---

## 10.3 Observational Data

Mercury owns observations.

Examples:

Retailer

Price

Stock

URL

Observation time

Marketplace

Observations are snapshots.

They are not product truth.

---

## 10.4 Derived Data

Derived values should be reproducible.

Example

```
capacityGb

=

moduleCount

×

capacityPerModuleGb
```

Whenever practical, derive values rather than storing duplicate information.

---

## 10.5 Validation

Every important value should be validated.

Example

If

```
2 × 16 GB

≠

64 GB
```

validation should fail.

Silent corruption is unacceptable.

---

# 11. Atlas Engineering Standards

Atlas is the authoritative knowledge base.

Atlas answers:

"What is this product?"

Atlas does **not** answer:

"What does Amazon currently charge?"

---

## Atlas Responsibilities

Atlas owns:

- manufacturers
- product families
- specifications
- compatibility
- validation rules
- product identity

Atlas should never contain retailer-specific information.

---

## Atlas Philosophy

One product.

One truth.

Many observations.

---

## Atlas Evolution

Atlas should become increasingly automated.

Automation should improve:

- product ingestion

- specification validation

- duplicate detection

- taxonomy

without weakening product quality.

---

# 12. Mercury Engineering Standards

Mercury records observations.

Mercury answers:

"What is happening in the market?"

---

## Mercury Responsibilities

Mercury owns:

- retailer observations

- pricing

- stock

- timestamps

- retailer metadata

- observation history

---

## Mercury Philosophy

Observations are temporary.

Truth is permanent.

---

## Observation Rules

Every observation should preserve:

- retailer

- marketplace

- timestamp

- source

- URL

- retrieval method

Observations should never overwrite Atlas.

---

## Automation

Mercury automation should focus on:

- observation collection

- observation freshness

- observation validation

- historical tracking

---

# 13. Forge Engineering Standards

Forge publishes Hardware Radar.

Forge answers:

"What should users see?"

---

## Forge Responsibilities

Forge owns:

- website generation

- publication

- build workflow

- page rendering

- publishing automation

Forge does not own product truth.

Forge does not own retailer observations.

---

## Forge Philosophy

Publishing should always be reproducible.

The same inputs should produce the same outputs.

---

## Publication Rules

Before publishing:

Validate data.

Generate pages.

Verify affiliate links.

Check disclosures.

Publish.

If validation fails,

publication stops.

---

# 14. Affiliate Engineering Standards

Affiliate links exist to support Hardware Radar.

They must never influence product truth.

---

## Principles

Products are selected because they are good.

Affiliate links are attached afterwards.

Never reverse this order.

---

## Amazon Integration

Amazon Associates will become the first affiliate provider.

The implementation should support future providers without redesign.

Affiliate generation should therefore remain isolated from Atlas and Mercury.

---

## Compliance

Every published affiliate page must include:

- disclosure

- valid affiliate links

- accurate product information

Affiliate links should never alter product rankings.

---

## Future Affiliate Layer

The Affiliate Layer will eventually become its own subsystem.

Responsibilities will include:

- provider abstraction

- link generation

- compliance

- campaign management

- provider expansion

Until then,

Forge should implement only the minimum functionality required for Amazon Associates.

---

End of Part 2

Continues in Part 3:

• Git Standards

• Testing Standards

• Documentation Standards

• Security Standards

• Performance Standards

• Accessibility

• Complexity Budget

• Definition of Done

• Future Evolution

• Canonical Engineering Statement

 Hardware Radar Engineering Handbook

## Part 3

---

# 15. Git Standards

Version control preserves the engineering history of Hardware Radar.

Every commit should tell a clear story.

---

## 15.1 Branch Strategy

Until team size or deployment frequency requires otherwise, use a simple branching strategy.

Primary branch:

```
main
```

Feature branches:

```
feature/amazon-affiliate

feature/atlas-validation

feature/price-history
```

Bug fixes:

```
fix/mobile-layout

fix/rendering-error
```

Documentation:

```
docs/engineering-handbook

docs/project-state
```

---

## 15.2 Commit Messages

Commits should describe intent.

Preferred format:

```
feat(atlas): add RAM capacity validation

fix(mercury): prevent duplicate observations

docs(handbook): update engineering philosophy

refactor(forge): simplify page generation
```

Each commit should represent one logical change.

---

## 15.3 Pull Requests

Pull requests should answer:

- What changed?
- Why?
- How was it tested?
- Does documentation require updates?
- Can the change be safely reversed?

---

# 16. Testing Standards

Testing exists to protect user trust.

Every critical business rule should be verifiable.

---

## 16.1 Testing Philosophy

Test behavior.

Do not test implementation details.

Good test:

> "RAM capacity validation rejects inconsistent products."

Poor test:

> "Function validateRamCapacity() returns line 43."

---

## 16.2 Testing Priorities

Highest priority:

- validation rules
- product identity
- price calculations
- affiliate generation
- publication workflow

Lower priority:

- visual styling
- internal helper functions

---

## 16.3 Regression Prevention

Every production bug should result in a test whenever practical.

A bug fixed once should remain fixed.

---

# 17. Documentation Standards

Documentation is part of engineering.

Incomplete documentation is incomplete engineering.

---

## Documentation Principles

Update documentation whenever changing:

- architecture
- workflow
- subsystem ownership
- data models
- validation rules
- public behavior

---

## Canonical Documents

Only one canonical document should exist for each topic.

Examples:

Product philosophy

↓

PRODUCT_CONSTITUTION.md

Engineering standards

↓

ENGINEERING_HANDBOOK.md

Current status

↓

PROJECT_STATE.md

Repository orientation

↓

START_HERE.md

Avoid duplicate documentation.

---

## Architecture Decision Records

Meaningful technical decisions should be recorded using ADRs.

Each ADR should explain:

- Context
- Decision
- Alternatives considered
- Consequences

---

# 18. Security Standards

Security protects users, data, and trust.

---

## Principles

Never commit:

- secrets
- passwords
- API keys
- tokens
- credentials

Use environment variables for sensitive configuration.

---

## Least Privilege

Systems should receive only the permissions required to perform their responsibilities.

---

## Dependencies

Before adding a dependency ask:

1. Is it necessary?

2. Is it maintained?

3. Is it secure?

4. Can we replace it ourselves if necessary?

5. Does it reduce more complexity than it introduces?

---

# 19. Performance Standards

Optimize measured bottlenecks.

Do not optimize hypothetical problems.

---

Performance priorities today:

1. Fast page loading

2. Accurate product rendering

3. Efficient JSON processing

4. Small frontend bundles

5. Responsive mobile experience

---

Future priorities may include:

- database optimization

- caching

- asynchronous processing

- distributed services

when the platform genuinely requires them.

---

# 20. Accessibility Standards

Hardware Radar should be usable by everyone.

Where practical, public pages should meet WCAG 2.2 AA recommendations.

Priorities include:

- keyboard navigation

- semantic HTML

- sufficient contrast

- accessible forms

- descriptive headings

- meaningful alt text

Accessibility should be considered during development rather than added afterwards.

---

# 21. Operational Readiness

Before releasing significant functionality verify:

✓ Data validated

✓ Affiliate links correct

✓ Disclosures visible

✓ Documentation updated

✓ Website renders correctly

✓ Mobile layout verified

✓ No broken navigation

✓ No broken links

✓ Rollback understood

Shipping should never surprise engineering.

---

# 22. Complexity Budget

Every new technology introduces cost.

New complexity must justify itself.

---

Examples

Introduce a database when JSON is no longer sufficient.

Introduce background workers when synchronous processing becomes impractical.

Introduce APIs when static generation cannot satisfy product requirements.

Introduce AI only when it measurably improves automation or user decision-making.

Never introduce technology simply because it is popular.

---

# 23. Definition of Done

A task is complete only when:

✓ Implementation is correct

✓ User trust is preserved

✓ Validation passes

✓ Documentation is current

✓ Engineering standards are followed

✓ Testing is appropriate

✓ The change is understandable by future contributors

"Works on my machine."

is not a definition of done.

---

# 24. Future Evolution

Hardware Radar will continue evolving.

The platform should remain adaptable without sacrificing clarity.

Future engineering efforts may include:

Affiliate Layer

↓

Sentinel

↓

Production data pipeline

↓

Recommendation Engine (Compass)

↓

Artificial Intelligence (Aurora)

↓

Analytics (Beacon)

↓

Public APIs (Gateway)

Each subsystem should be introduced only when its responsibilities are fully understood.

The architecture should evolve incrementally.

---

# 25. Canonical Engineering Statement

Build for clarity.

Preserve truth.

Respect subsystem boundaries.

Validate before publishing.

Keep documentation synchronized with implementation.

Automate only what is understood.

Introduce complexity only when simplicity is no longer sufficient.

Protect user trust above everything else.

---

# Closing Statement

The goal of this handbook is not to prescribe every engineering decision.

Its purpose is to establish the principles that guide those decisions.

Technologies will change.

Frameworks will change.

Programming languages will change.

Engineering principles should remain stable.

Every contribution to Hardware Radar should leave the platform:

- simpler

- clearer

- more trustworthy

than it was before.

---

End of Document