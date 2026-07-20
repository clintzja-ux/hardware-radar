Status: Canonical Working Document

Owner: Engineering

Purpose: Synchronize architecture, documentation, and implementation.

1. Purpose

The Platform Alignment Matrix serves as the authoritative mapping between the canonical engineering specifications and the current implementation.

Unlike the Product Constitution or Engineering Handbook, this document is intentionally temporary. It exists only until the implementation fully reflects the documented architecture.

Once all alignment tasks have been completed, this document should become a historical engineering artifact.

2. Scope

This document covers the three core platform subsystems:

Atlas
Canonical Product Knowledge

↓

Mercury
Market Observations

↓

Forge
Authoring & Publication

Every engineering task performed during Platform Alignment must reference this document.

3. Current Platform Assessment
Subsystem	Architecture	Implementation	Alignment
Atlas	Mature	Partial	🟡
Mercury	Good	Early	🟢
Forge	Mature	Partial	🟡

Overall Platform Status

Architecture Complete

Implementation In Progress

4. Canonical Ownership Matrix
Atlas Owns
Product identity
Product specifications
Compatibility
Physical characteristics
Electrical characteristics
Capacity
Performance
Governance metadata
Provenance
Canonical validation
Product lifecycle

Atlas is the single source of truth.

Mercury Owns
Retail observations
Price history
Availability
Promotions
Shipping
Inventory status
Observation timestamps
Retail-specific metadata

Mercury never modifies Atlas.

Forge Owns
Product authoring
Data entry
Derived fields
Validation orchestration
Publication readiness
Static generation
Export
Publishing workflow

Forge never becomes the source of truth.

5. Product Lifecycle
Raw Engineering Input

↓

Forge Builder

↓

Atlas Product

↓

Atlas Validation

↓

Derived Fields

↓

Publication Readiness

↓

Published Product

↓

Mercury Observations

↓

Historical Analytics

This becomes the canonical lifecycle for every product.

6. Alignment Matrix
Area	         Current	    Canonical	             Action
Product JSON	  Legacy	   Data Dictionary	        Migrate
Schema	          Partial	    Canonical	            Expand
Validation	       Stub	        Full Rules	            Implement
Derived Fields	  Partial	    Canonical	            Expand
Publication	      Partial	    Canonical	            Refine
Mercury Links	   Basic	    Canonical IDs	        Verify

7. Engineering Backlog
EPIC-001

Core Platform Alignment

Task 001

Atlas Schema Alignment

Status

Not Started

Definition of Done

Atlas JSON schema matches the Data Dictionary.

Task 002

Canonical Product Migration

Status

Not Started

Definition of Done

Existing products migrate successfully.

Task 003

Validation Engine

Status

Not Started

Definition of Done

All ATLAS validation rules implemented.

Task 004

Derived Field Engine

Status

Partial

Definition of Done

All documented derived fields generated automatically.

Task 005

Forge Builder Alignment

Status

Partial

Definition of Done

Forge outputs only canonical Atlas records.

Task 006

Publication Readiness

Status

Partial

Definition of Done

Readiness determined solely through canonical validation.

Task 007

Mercury References

Status

Not Started

Definition of Done

Every observation references a canonical Atlas product.

Task 008

Repository Layer

Status

Partial

Definition of Done

Repositories operate exclusively on canonical models.

Task 009

Testing

Status

Not Started

Definition of Done

Validation, repositories, and publication pipeline covered by automated tests.

8. Definition of Complete

Platform Alignment is complete when:

Atlas Data Dictionary and Atlas schema are identical in intent.
Forge produces only canonical Atlas products.
Mercury consumes only canonical Atlas IDs.
Validation exists in one location.
Derived fields are generated automatically.
Publication readiness is deterministic.
No subsystem duplicates another subsystem's responsibilities.
9. Exit Criteria

This document can be archived when:

All alignment tasks are complete.
Architecture and implementation are synchronized.
Future work consists primarily of feature development rather than structural changes.

At that point, this document becomes part of the project's engineering history.

Where I think we go next

With this in place, I don't think we should create any more foundational documentation unless the platform itself changes in a significant way.

Instead, every future session can follow a much simpler pattern:

Pick the next engineering task from the Platform Alignment Matrix.
Implement it.
Write tests.
Update PROJECT_STATE.md if the platform has materially changed.
Commit the work.
Move to the next task.

That shifts the project from architecture mode into engineering mode, which is where I think Hardware Radar now belongs. Given what we've reviewed, the platform's vision, subsystem boundaries, and engineering principles are already well defined. The remaining work is primarily implementation, validation, and iteration rather than creating more high-level documents.