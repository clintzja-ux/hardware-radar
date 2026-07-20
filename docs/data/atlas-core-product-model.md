ATLAS CORE PRODUCT MODEL

Document ID: ATLAS-CORE-PRODUCT-MODEL

Version: 1.0

Status: Canonical

Owner: Mirabelle Labs

Applies To:

Atlas
Forge
Mercury
Sentinel
Compass
Aurora
Hardware Radar
1. Purpose

The Atlas Core Product Model defines the hardware-independent engineering contract for every product managed by the Hardware Radar platform.

It establishes the canonical structure, ownership boundaries, lifecycle, governance, provenance, validation, and publication rules shared by all Atlas products.

Hardware-specific specifications are intentionally excluded from the Core Product Model and are instead defined through Product Extensions.

The Atlas Core answers one question:

What is an Atlas Product?

Product Extensions answer:

What makes this hardware unique?

2. Architecture

Atlas is divided into two layers.

Atlas Product

│

├── Atlas Core
│
│     Identity
│     Governance
│     Provenance
│     Validation
│
└── Product Extension
      RAM
      SSD
      CPU
      GPU
      Motherboard
      Storage
      Networking
      Cooling
      ...

The Core remains stable.

Extensions evolve independently.

3. Core Design Principles
ACP-001 — Hardware Independence

The Core shall never contain hardware-specific engineering fields.

ACP-002 — Single Source of Truth

Every product has exactly one canonical Atlas record.

ACP-003 — Stable Identity

Identifiers never depend on retailers, affiliate programs, URLs, or pricing.

ACP-004 — Extensibility

New hardware categories extend Atlas.

They never modify Atlas Core.

ACP-005 — Explicit Ownership

Every field belongs to exactly one subsystem.

No field has multiple owners.

ACP-006 — Reproducibility

Derived values must always be reproducible.

ACP-007 — Traceability

Every publishable fact must have provenance.

ACP-008 — Single Ownership

Every field, process, validation rule, and lifecycle transition has exactly one authoritative owner. Other subsystems may consume or derive information, but they must never redefine or duplicate ownership.

4. Canonical Product Structure

Every Atlas Product contains:

Atlas Product

identity

governance

provenance

validation

extension

No additional top-level sections are permitted.

Extensions own everything beneath extension.

5. Identity

Identity represents immutable product identity.

Required fields:

atlasProductId

schemaVersion

productType

recordRevision

createdAt

updatedAt

createdBy

updatedBy

Identity must remain stable throughout the product lifecycle.

6. Governance

Governance describes the editorial and engineering state of a product.

Examples:

publicationStatus

lifecycleStatus

engineeringStatus

reviewStatus

changeReason

Governance does not describe hardware.

7. Provenance

Every publishable field must be traceable to evidence.

Minimum provenance requirements:

Source

Retrieval Date

Verification Status

Reviewer

Evidence Type

No product should become publishable without provenance.

8. Validation

Validation is independent of any hardware category.

The Core defines:

validation lifecycle
severity
blocking behaviour
warning behaviour

Product Extensions define hardware-specific validation rules.

Example:

Core

Required field missing

RAM Extension

Capacity mismatch

SSD Extension

Interface mismatch
9. Versioning

Every Atlas Product includes:

schemaVersion

recordRevision

Versioning supports:

migration
backward compatibility
auditing
rollback
10. Publication

Publication is determined exclusively through validation.

Publication states:

PENDING

READY

REVIEW

BLOCKED

Neither Forge nor Mercury may bypass publication rules.

11. Product Lifecycle
Draft

↓

Validated

↓

Reviewed

↓

Published

↓

Updated

↓

Archived

Every transition must be auditable.

12. Product Extensions

Atlas Core intentionally contains no hardware specifications.

Every hardware family supplies its own extension.

Examples:

RAM Extension

SSD Extension

CPU Extension

GPU Extension

Motherboard Extension

Power Supply Extension

Cooling Extension

Networking Extension

Extensions inherit the Core lifecycle automatically.

13. Extension Registration

Every extension must declare:

Extension Name

Schema Version

Owner

Validator

Repository

Migration Strategy

This allows Atlas to discover new hardware categories without modifying the Core.

14. Cross-Subsystem Ownership
Subsystem	Responsibility
Atlas	Canonical product truth
Forge	Product authoring and publication
Mercury	Market observations
Sentinel	Engineering validation
Compass	Recommendations
Aurora	AI reasoning
Hardware Radar	Presentation

Responsibilities must never overlap.

15. Canonical Ownership Rules

Atlas owns:

product identity
lifecycle
provenance
governance
canonical specifications

Mercury owns:

retailer observations
prices
stock
shipping
promotions

Forge owns:

editing
publication
derived fields
workflow

Sentinel owns:

validation
engineering rules
policy enforcement
16. Migration Rules

Future schema revisions must preserve:

Atlas Product ID
provenance
revision history

Migration scripts must never silently discard verified information.

17. Definition of Done

The Atlas Core Product Model is complete when:

every subsystem references the Core
extensions inherit the Core
no hardware-specific fields exist in the Core
ownership boundaries are explicit
publication workflow is standardized
provenance is mandatory
validation lifecycle is defined
extension registration is operational
18. Canonical Summary
Atlas Core defines what every hardware product has in common.

Product Extensions define what makes each hardware category unique.

Atlas stores canonical product truth.

Mercury stores market observations.

Forge authors Atlas records.

Sentinel validates engineering integrity.

Compass recommends.

Aurora explains.

Hardware Radar presents.

The Core remains stable.

Extensions evolve independently.