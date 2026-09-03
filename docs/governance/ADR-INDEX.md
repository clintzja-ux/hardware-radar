# Architectural Decision Records (ADR)

## Purpose

Architectural Decision Records document important engineering decisions that
shape Hardware Radar.

An ADR exists to answer one question:

"Why was this decision made?"

Code explains *how*.

Architecture explains *what*.

ADRs explain *why*.

---

## Rules

An ADR should be created when a decision:

- affects architecture
- changes data models
- changes project philosophy
- changes subsystem boundaries
- would be difficult to reverse

Do NOT create ADRs for:

- bug fixes
- styling
- small refactors
- temporary experiments

---

## Current ADRs

| ID | Decision |
|---|---|
| ADR-001 | Separate Facts from Observations |
| ADR-002 | Product IDs Are Permanent |
| ADR-003 | Recommendations Are Computed, Not Curated |
| ADR-004 | The User Interface Never Owns Business Data |
| ADR-008 | Adapter-Based Ingestion Architecture |
| ADR-009 | Freshness Is Derived Temporal State |
| ADR-010 | Confidence Is Explainable Derived State |
| ADR-011 | Historical Intelligence Is Derived From Immutable Observations |
| ADR-012 | Applications Consume Published Intelligence Artifacts |
| ADR-013 | Canonical Observations Enter Mercury Through Controlled Ingestion |
| ADR-014 | Durable Observation Persistence Preserves Source Retention Boundaries |
| ADR-015 | Review Decisions Are Separate From Canonical Observations |
| ADR-016 | Review History Is Append-Only Derived Workflow State |
| ADR-017 | Publication Is Explicit Governed Workflow State |
| ADR-018 | Amazon Acquisition Is a Server-Side Source Boundary |
| ADR-019 | Source Rights Are First-Class Mercury Policy |
| ADR-020 | First-Party Data Is a Strategic Platform Asset |
| ADR-021 | Live Market Intelligence Is Rights and Freshness Gated |
| ADR-022 | DataForSEO Is an Asynchronous Cost-Governed Acquisition Source |
| ADR-023 | External Product Identity Requires Atlas Resolution |
| ADR-024 | Merchant Identity Is Independent of Affiliate Relationships |
| ADR-025 | Licensed Market Evidence Is Promoted Into History Only After Identity Resolution |
| ADR-026 | Mercury File Persistence Is Single Writer |
| ADR-027 | Paid Acquisition Requires an Approved Budgeted Plan |
| ADR-028 | Controlled Paid Acquisition Executes Only Approved Plans |
| ADR-029 | Acquisition Success Does Not Imply Evidence Acceptance |
| ADR-030 | Dry Run Is Structurally Non-Paid and Operator State Is Explicit |
| ADR-031 | Scheduled Acquisition Begins as Structurally Dry Run |
| ADR-032 | Scheduled Dry Run CLI Uses Canonical Operational State |
| ADR-033 | First Unattended Acquisition Schedule Is Local Dry Run Only |
| ADR-034 | Unattended LIVE Requires Explicit Plan-Bound Authorization |
| ADR-035 | Manual LIVE Is Plan-Bound, Single-Use, and Explicitly Confirmed |
| ADR-036 | Product Enrichment Requires Identity Resolution and Separate Authorization |
| ADR-037 | Real PRODUCTS Evidence Must Resolve Before Enrichment Spend |
| ADR-038 | Product Identity Resolution Uses Canonical Physical Evidence |
| ADR-039 | Product Info Enrichment Is Proposal Bound and Single Use |
| ADR-040 | Sellers Enrichment Requires Governed Product Info Provenance |
| ADR-041 | Retrieved Sellers Results Enter DF003 Without Reacquisition |
| ADR-042 | Retained Evidence Requires Explicit Promotion Assessment |
| ADR-043 | Product and Merchant Identity Reviews Are Independent Audit Records |
| ADR-044 | Historical Admission Is Separate From Canonical Observation Promotion |
| ADR-045 | Historical Refresh Cycles Are Provider-Task Scoped |
| ADR-046 | Historical Refresh Cadence Assignment Is Explicit and Unambiguous |
| ADR-047 | First-Party Interest Collection Requires a Governed Write Boundary |
| ADR-048 | Beacon Production Gateway Uses Cloudflare Workers and D1 |
| ADR-049 | Beacon First-Party Interest Evidence Is Retained for 90 Days |
| ADR-050 | Beacon Product-Interest Ingestion Is Rate Limited at the Cloudflare Edge |
| ADR-051 | Beacon Gateway Monitoring Stores Operational Categories, Not Behavioral Payloads |
| ADR-052 | Beacon Gateway Alerts Are Derived From Privacy-Safe Operational Metrics |
| ADR-053 | Beacon Gateway Operational Alerts Use Explicit Operator Email Notification |
| ADR-054 | Operator Alert Recipient Is Supplied Only Through Server-Side Runtime Configuration |
| ADR-055 | Cloudflare Gateway Secrets Are Supplied Only Through Server-Side Runtime Configuration |
| ADR-056 | Editorial Guides Use Deterministic Static Generation |
| ADR-057 | Atlas Product Identity Owns Persistent Public Product Routes |
| ADR-058 | RAM Comparison Is an Atlas-Derived Factual Surface |
| ADR-059 | Ordinary Retailer Destinations Are Mercury-Owned Navigation Metadata |

ADR-005 through ADR-007 are intentionally unused. Accepted identifiers are never reassigned, and an ADR's own status remains authoritative for whether it is accepted, superseded, or otherwise inactive.

---

## Naming Convention

ADR-###
