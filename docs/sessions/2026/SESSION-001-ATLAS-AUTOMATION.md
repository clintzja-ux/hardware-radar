# Engineering Session 001

Date
2026-07-19

Sprint
Sprint 1

Epic
Core Platform Alignment

Status
In Progress

---

## Objective

Bring the current implementation of Atlas, Mercury, and Forge into alignment with the canonical engineering specifications before introducing new functionality.

The purpose of this sprint is not to add features.

The purpose is to ensure that every subsystem speaks the same language.

---

## Why This Sprint Exists

The engineering review found that:

- Atlas architecture is mature.
- Mercury architecture is appropriately scoped.
- Forge already contains significant engineering logic.
- The Atlas Data Dictionary is substantially ahead of the current implementation.
- Existing code reflects an earlier generation of the data model.

Rather than continuing to build on diverging foundations, this sprint establishes a single canonical platform model.

---

## Affected Subsystems

✓ Atlas

✓ Mercury

✓ Forge

---

## Canonical References

- PRODUCT_CONSTITUTION.md
- PROJECT_STATE.md
- ENGINEERING_HANDBOOK.md
- ATLAS-DATA-DICTIONARY.md

---

## Sprint Goal

By the end of this sprint:

Every subsystem should understand the same Atlas Product.

There should be one canonical product model.

There should be one validation strategy.

There should be one publication workflow.

---

## Deliverables

### Phase 1 — Platform Audit

Inventory every implementation that currently defines or transforms a product.

Includes:

- Atlas schemas
- Atlas repositories
- Atlas validators
- Forge builders
- Forge validators
- Derived field services
- Publication readiness engine
- Mercury observation schema

Output:

Platform Alignment Matrix

---

### Phase 2 — Canonical Mapping

Map every existing product field to its destination in the Atlas Data Dictionary.

Determine:

- Keep
- Rename
- Move
- Derive
- Remove

No code changes yet.

---

### Phase 3 — Gap Analysis

Identify:

Missing fields

Missing validation

Duplicate logic

Boundary violations

Technical debt

Implementation order

---

### Phase 4 — Implementation Backlog

Convert the Gap Analysis into engineering tasks.

Every task should:

- reference the engineering handbook
- reference the data dictionary
- identify affected subsystem(s)
- include a definition of done

---

## Out of Scope

No automation.

No Amazon integration.

No production ingestion.

No recommendation engine.

No AI.

No UI redesign.

---

## Success Criteria

✓ Atlas model fully mapped

✓ Mercury ownership confirmed

✓ Forge ownership confirmed

✓ Validation responsibilities documented

✓ Implementation backlog created

✓ Architecture and implementation synchronized

---

## Engineering Principles

Truth before speed.

Documentation drives implementation.

Subsystem boundaries remain explicit.

Complexity is introduced only when justified.

---

## Expected Outcome

A fully prioritized engineering roadmap that allows future development to proceed without architectural uncertainty.


The engineering roadmap I now recommend
Session 001
│
├── Platform Alignment Matrix
├── Gap Analysis
└── Implementation Backlog
        │
        ▼
Sprint 2
│
├── Atlas Core
├── Validation Engine
└── Derived Fields
        │
        ▼
Sprint 3
│
├── Migration Engine
├── Repository Layer
└── Testing
        │
        ▼
Sprint 4
│
├── Mercury Automation
└── Forge Publication Pipeline
        │
        ▼
Sprint 5+
│
├── Amazon Associates
├── Sentinel
├── Compass
└── Aurora
Why this direction?

When I first saw the documentation, I thought Atlas was the project. After reviewing the code, I no longer think that's true.

The project is the platform.

Atlas, Mercury, and Forge are already evolving together. The highest-value work isn't to make one subsystem better in isolation—it's to ensure they all operate from the same canonical model. Once that's done, every future feature becomes easier to build, easier to test, and much less likely to require refactoring.





PIC-001
Task 001 – Canonical Atlas Product Model

Everything else in the platform depends on this.

If we get this right, Forge, Mercury, Sentinel, Compass, Aurora, and the public site all become much easier to build.

Objective

Produce the single canonical Atlas Product Model that all software will use.

Not documentation.

Not pseudocode.

The actual engineering contract.

Think of this as the C header file, Java interface, or protobuf definition for the entire platform.

Nothing in Hardware Radar should ever disagree with this model again.

Deliverables

By the end of Task 001 we will have:

Atlas Product
│
├── Identity
├── Classification
├── Capacity
├── Performance
├── Electrical
├── Physical
├── Compatibility
├── Features
├── Retail Metadata
├── Governance
├── Provenance
└── Validation Metadata

This becomes the only model every subsystem understands.

Why this first?

Because right now I see three versions of the product:

Current JSON

↓

Forge Builder

↓

Atlas Data Dictionary

They're close.

They're not identical.

We eliminate that today.

Phase 1
Canonical Sections

I would freeze these.

identity
classification
capacity
performance
electrical
physical
compatibility
features
governance
provenance
validation

No subsystem can invent additional top-level sections.

Phase 2
Ownership

Every field needs an owner.

Example

Field	Owner
brand	Atlas
capacityGb	Atlas
moduleCount	Atlas
displayName	Forge (derived)
publicationStatus	Forge
retailerPrice	Mercury
lastSeen	Mercury
fieldSources	Atlas
validationErrors	Forge

Notice something?

Ownership becomes incredibly clear.

Phase 3
Derived vs Stored

One of the biggest improvements I want to make is identifying what should never be stored.

Example

Stored

speedMTs = 6000

Derived

speedLabel

↓

DDR5-6000

Stored

moduleCount = 2
capacityPerModuleGb = 16

Derived

capacityGb = 32

Stored

manufacturer = Corsair
series = Vengeance

Derived

displayName

The fewer stored values we have, the fewer synchronization bugs we'll ever fight.

Phase 4
Canonical IDs

I also want to freeze identifiers.

Example

atlasProductId

brandId

categoryId

generationId

formFactorId

chipsetId

Those IDs should never change once defined.

Phase 5
Extension Points

This is something I don't think we've discussed yet.

Atlas shouldn't become RAM-specific.

Instead

Atlas Product

↓

RAM Extension

↓

SSD Extension

↓

CPU Extension

↓

GPU Extension

So the core model should only contain fields common to every hardware product.

RAM-specific attributes belong in a RAM extension.

That will make Hardware Radar much easier to expand beyond memory.

Proposed Canonical Architecture

I would evolve Atlas into something like this:

AtlasProduct
│
├── Identity
│
├── Classification
│
├── Specifications
│   ├── Capacity
│   ├── Performance
│   ├── Electrical
│   ├── Physical
│   └── Compatibility
│
├── Features
│
├── Governance
│
├── Provenance
│
├── Validation
│
└── Extensions
      └── RAM

Notice the difference.

The first model is a RAM model.

This becomes a hardware model.

That's an important distinction because one of your long-term goals is for Hardware Radar to grow beyond RAM into a comprehensive hardware intelligence platform. We should avoid baking RAM assumptions into the core model when they can live cleanly in an extension.


Definition of Done

Task 001 is complete when:

✅ There is exactly one canonical AtlasProduct model.
✅ Atlas, Forge, and Mercury all reference that model.
✅ Every field has a documented owner.
✅ Every derived field is identified.
✅ Every stored field is justified.
✅ The core model is hardware-agnostic.
✅ RAM-specific details live in a RAM extension.
✅ Future hardware categories (SSDs, GPUs, CPUs, etc.) can be added without changing the core AtlasProduct.