# Hardware Radar Architecture Bible

**Document ID:** HR-ARCH-BIBLE  
**Version:** 1.0  
**Status:** Canonical  
**Owner:** Mirabelle Labs  
**Applies To:** Hardware Radar, Atlas, Mercury, Sentinel, Forge  
**Last Updated:** 2026-07-18

---

## 1. Purpose

This document defines the canonical architecture of the Hardware Radar platform. It establishes subsystem responsibilities, data ownership boundaries, permitted dependencies, lifecycle models, governance principles, publication controls, Amazon integration boundaries, and engineering traceability requirements.

All future implementation work must conform to this document unless a formally recorded architecture decision supersedes part of it.

## 2. Platform Mission

Hardware Radar helps users make better computer-hardware purchasing decisions by combining verified product specifications, current retailer observations, independent editorial analysis, transparent affiliate relationships, and compliance-aware publishing controls.

Hardware Radar is not merely an affiliate-link directory. It is the public presentation layer of a structured product-information and market-observation platform.

## 3. Governing Principles

### HR-PRINCIPLE-001 — Truth Before Speed
Accuracy, traceability, and user trust take priority over publication speed. The platform shall not publish guessed specifications, unverified observations, expired retailer data, or unsupported claims.

### HR-PRINCIPLE-002 — Single Source of Truth

| Data class | Canonical owner |
|---|---|
| Product identity and specifications | Atlas |
| Retailer observations and affiliate destinations | Mercury |
| Compliance and governance rules | Sentinel |
| Creation, review, and publication workflow | Forge |
| Editorial presentation and public user experience | Hardware Radar |

### HR-PRINCIPLE-003 — Separation of Responsibilities
Each subsystem shall have one primary responsibility and shall not absorb unrelated business logic.

### HR-PRINCIPLE-004 — Everything Has a Lifecycle
Products, observations, rules, drafts, and published pages shall move through explicit states.

### HR-PRINCIPLE-005 — Compliance Is Executable
Compliance shall be translated into testable engineering rules rather than remaining only as prose documentation.

### HR-PRINCIPLE-006 — Automation Must Be Earned
A workflow may be automated only after it has been understood, documented, standardized, executed successfully in a manual or assisted form, and validated against applicable requirements.

### HR-PRINCIPLE-007 — Retailer Independence
The platform shall not depend structurally on any single retailer. Amazon is the first commercial integration and reference retailer, not the system of record for product truth.

### HR-PRINCIPLE-008 — Traceability
Every material policy or engineering rule must be traceable through:

**Source → Business interpretation → Engineering requirement → Implementation → Test**

### HR-PRINCIPLE-009 — No Sale of Trust
Affiliate compensation may affect destination availability, but not product truth, ranking integrity, or editorial conclusions.

### HR-PRINCIPLE-010 — Boring Core, Excellent Experience
Core systems should be deterministic, inspectable, and conservative. Creativity belongs primarily in the public user experience.

## 4. Canonical Platform Model

```text
                    Users
                      │
                      ▼
             Hardware Radar
      Editorial and Presentation Layer
                      │
                      ▼
                    Forge
       Workflow and Publication Layer
                      │
                      ▼
                  Sentinel
      Compliance and Governance Layer
                      │
            ┌─────────┴─────────┐
            ▼                   ▼
          Atlas               Mercury
   Product Knowledge     Market Intelligence
```

The public website consumes approved outputs. It shall not independently decide whether data is compliant or publishable.

## 5. Subsystem Definitions

### 5.1 Atlas — Product Knowledge

Atlas defines what a hardware product is.

Atlas owns canonical product identifiers, manufacturer data, model and family, manufacturer part number, technical specifications, form factor, capacity, module configuration, memory generation, rated speed, timings, voltage, ECC status, product relationships, lifecycle state, and specification provenance.

Atlas must not own retailer prices, affiliate URLs, promotions, discounts, retailer availability, commissions, Amazon-specific advertising content, or retailer compliance state.

For RAM products, the canonical invariant is:

```text
capacityGb = moduleCount × capacityPerModuleGb
```

Lifecycle:

```text
DISCOVERED → VERIFIED → ACTIVE → DEPRECATED → ARCHIVED
```

### 5.2 Mercury — Market Intelligence

Mercury records retailer-specific market observations.

Mercury owns retailer identity, retailer product identifiers, ASINs where applicable, observed price, currency, availability, product condition, observation timestamp, data source, retrieval method, verification method, affiliate destination, affiliate eligibility, cache or display expiry, provenance, publication eligibility, and supersession relationships.

Mercury shall prefer immutable observations. A new collection event creates a new observation rather than silently overwriting the old one.

Lifecycle:

```text
CREATED → VALIDATED → PUBLISHABLE → PUBLISHED → SUPERSEDED → ARCHIVED
```

Historical retention, analytics, and public trend presentation remain subject to the retailer's applicable license and usage rules. Retention in Mercury does not automatically grant permission for public historical-price display.

### 5.3 Sentinel — Compliance and Governance

Sentinel decides whether data and content are safe to publish.

Sentinel owns the compliance-rule catalog, architecture-rule validation, retailer-policy validation, disclosure requirements, freshness checks, price-source validation, affiliate-link validation, approved image-source checks, publication gating, rule-version tracking, revalidation requirements, severity classification, and compliance evidence.

Rule results:

```text
PASS
WARN
FAIL
NOT_APPLICABLE
UNKNOWN
```

A material `FAIL` blocks publication. A material `UNKNOWN` also blocks or holds publication until resolved.

Lifecycle:

```text
UNCHECKED → VALIDATED → APPROVED → EXPIRED → REVALIDATION_REQUIRED
```

### 5.4 Forge — Workflow and Publication Console

Forge coordinates creation, validation, review, and publication.

Forge owns data-entry workflows, generation workflows, engineering review, compliance review coordination, publication-readiness display, record generation, preview, publish orchestration, and audit metadata.

Publication states:

```text
PENDING
READY
REVIEW
BLOCKED
```

- **PENDING:** Current input has not been evaluated or was edited after evaluation.
- **READY:** Required engineering and compliance checks pass.
- **REVIEW:** Submission is complete but requires human review.
- **BLOCKED:** A complete submission fails a material engineering or compliance rule.

Browser-native validation remains responsible for preventing incomplete form submission. Forge publication states evaluate complete submissions.

Content lifecycle:

```text
DRAFT → ENGINEERING_REVIEW → COMPLIANCE_REVIEW → READY → PUBLISHED → NEEDS_REFRESH → ARCHIVED
```

### 5.5 Hardware Radar — Public Experience

Hardware Radar presents trusted product and market information to users.

It owns page composition, editorial explanations, buying guides, recommendation narratives, user-facing comparisons, accessibility, responsive behavior, visual hierarchy, machine-readable public metadata, and disclosure presentation.

It must not own canonical specifications, mutable retailer observations, compliance logic, retailer data retrieval, or publication approval decisions.

The homepage must immediately answer where the cheapest verified RAM option currently presented by Hardware Radar can be found.

## 6. Dependency Rules

Allowed dependencies:

```text
Hardware Radar → approved published outputs
Forge → Atlas, Mercury, Sentinel
Sentinel → rule catalog and metadata from Atlas/Mercury/Forge
Mercury → Atlas product identity
```

Forbidden dependencies:

- Atlas shall not depend on Mercury.
- Atlas shall not contain retailer-specific logic.
- Hardware Radar shall not bypass Sentinel.
- Forge shall not override a Sentinel failure without an explicit, auditable exception mechanism.
- Mercury shall not redefine canonical product specifications.
- Sentinel shall not mutate product or observation truth merely to make a record pass.

## 7. Amazon Integration Boundary

Amazon is the first reference retailer.

Amazon may provide ASINs, approved product advertising content, permitted pricing and availability information, affiliate destination URLs, retailer-specific identity, approved image references, and commercial attribution.

Amazon must not become the canonical owner of RAM specifications, product taxonomy, product relationships, independent recommendations, Hardware Radar scoring, buying advice, or editorial conclusions.

| Amazon-related field | Owner |
|---|---|
| ASIN | Mercury retailer mapping |
| Amazon price | Mercury observation |
| Amazon availability | Mercury observation |
| Amazon affiliate URL | Mercury |
| Amazon image reference | Mercury or approved media-reference layer |
| Amazon compliance result | Sentinel |
| Amazon disclosure rendering | Hardware Radar, required by Sentinel |
| Manufacturer specifications | Atlas |

## 8. Data Lifecycle

```text
Product Discovered
        ↓
Identity Confirmed
        ↓
Atlas Record Created
        ↓
Specifications Verified
        ↓
Retailer Listing Matched
        ↓
Mercury Observation Created
        ↓
Sentinel Checks Executed
        ↓
Forge Review Completed
        ↓
Published to Hardware Radar
        ↓
Observation Monitored
        ↓
Refresh or Expiry
        ↓
Superseded or Archived
```

No automation may skip a required lifecycle stage merely for convenience.

## 9. Data Provenance

Every publishable fact must record sufficient provenance.

Atlas provenance should include source type, source name, source locator, verification date, verifier, and verification status.

Mercury provenance should include retailer, retrieval source, retrieval method, observed timestamp, verification method, affiliate eligibility, applicable expiry, and originating rule version.

Sentinel evidence should include rule ID, rule version, evaluation timestamp, result, evidence reference, affected record, severity, and reviewer where manual review applies.

## 10. Rule Traceability Standard

Every material rule shall include:

```text
Rule ID
Title
Official Source
Source Version or Review Date
Business Interpretation
Engineering Requirement
Affected Systems
Implementation Notes
Test Cases
Severity
Status
```

## 11. Architecture Decision Records

Significant architectural changes shall be documented as ADRs.

Naming convention:

```text
ADR-0001-short-decision-title.md
```

An ADR should contain status, context, decision, alternatives considered, consequences, affected systems, migration requirements, and related rules.

An ADR is required when subsystem ownership changes, a new platform component is introduced, a canonical schema changes materially, a retailer-specific exception weakens a general rule, a publication state changes, or an immutable model becomes mutable.

## 12. Publication Safety Model

A page or record may be published only when:

1. required form-level fields are complete;
2. Atlas requirements pass;
3. Mercury observation requirements pass;
4. Sentinel has no unresolved blocking failures;
5. required human review is complete;
6. required disclosures can be rendered;
7. retailer data is within its permitted display window;
8. an auditable publication record is created.

When a material status is unknown, the system must not guess or silently publish. The record must move to `REVIEW` or `BLOCKED`.

## 13. Manual, Assisted, and Automated Operations

### Stage 1 — Manual
A human performs each step and records evidence.

### Stage 2 — Assisted
Forge extracts, suggests, or validates fields, but a human confirms them.

### Stage 3 — Semi-automatic
Approved retailer mechanisms populate Mercury; a human reviews exceptions and publication.

### Stage 4 — Automatic
Scheduled ingestion, validation, expiry handling, and publication occur automatically within proven boundaries.

Automation must fail closed where compliance uncertainty is material.

## 14. Current Scope

The current commercial integration scope is Amazon only.

Other retailers shall not be implemented until Amazon has complete relevant compliance documentation, a stable manual workflow, a stable assisted workflow, defined data ownership, repeatable validation, an operational refresh process, acceptable monitoring, and documented incident handling.

## 15. Non-Goals for the Current Phase

The current phase does not authorize unattended Amazon publishing, unsupported scraping, manual production use of Amazon content requiring an approved source, public price-history features before license analysis, self-hosting retailer-controlled images without confirmed permission, expansion to other retailers, or rankings based solely on affiliate commission.

## 16. Recommended Repository Structure

```text
docs/
├── architecture/
│   ├── architecture-bible.md
│   └── adr/
├── compliance/
│   └── amazon/
│       ├── amazon-compliance-bible.md
│       ├── amazon-rule-catalog.md
│       ├── amazon-traceability-matrix.md
│       └── sources.md
├── operations/
│   └── amazon/
│       ├── amazon-operations-manual.md
│       └── incident-response.md
├── data/
│   ├── atlas-data-dictionary.md
│   ├── mercury-data-dictionary.md
│   └── data-lifecycle-specification.md
└── forge/
    └── publication-workflow.md
```

## 17. Immediate Next Documents

1. Amazon Compliance Bible
2. Amazon Official Source Register
3. Amazon Rule Catalog
4. Amazon Engineering Traceability Matrix
5. Amazon Operations Manual
6. Amazon Data Lifecycle Specification
7. Sentinel Rule Specification
8. Amazon Incident and Recovery Procedure

## 18. Definition of Architecture Stability

The architecture is stable enough for Amazon integration work when subsystem boundaries are accepted, canonical ownership is documented, Amazon rules are mapped to system responsibilities, Mercury's observation model is defined, Sentinel's rule model is defined, Forge publication gating is defined, critical unknowns are recorded, and no implementation depends on an unverified Amazon-policy assumption.

## 19. Amendment Policy

Changes require a documented reason, identification of affected systems, migration implications, an ADR for material changes, a version increment, and review of related compliance and operations documents.

## 20. Canonical Summary

```text
Atlas knows what the product is.

Mercury knows what was observed in the market.

Sentinel knows whether it may be published.

Forge manages how it becomes published.

Hardware Radar presents the approved result to the user.
```

This separation is the foundation of the Hardware Radar platform.