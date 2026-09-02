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

ADR-001
Separate Atlas facts from Mercury observations.

ADR-002
Product IDs are immutable.

ADR-003
Recommendations are generated rather than manually maintained.

ADR-042
Retained evidence requires explicit promotion assessment.

ADR-043
Product and merchant identity reviews are independent audit records.

ADR-044
Historical admission is separate from canonical observation promotion.

ADR-045
Historical refresh cycles are provider-task scoped.

ADR-046
Historical refresh cadence assignment is explicit and unambiguous.

ADR-047
First-party interest collection requires a governed write boundary.

ADR-048
Beacon production Gateway uses Cloudflare Workers and D1.

ADR-049
Beacon first-party interest evidence is retained for 90 days.

ADR-050
Beacon product-interest ingestion is rate limited at the Cloudflare edge.

ADR-051
Beacon Gateway monitoring stores operational categories, not behavioral payloads.

ADR-052
Beacon Gateway alerts are derived from privacy-safe operational metrics.

ADR-053
Beacon Gateway operational alerts use explicit operator email notification.

ADR-054
Operator alert recipient is supplied only through server-side runtime configuration.

ADR-055
Cloudflare Gateway credentials are supplied only through server-side runtime configuration.

ADR-056
Editorial Guides use deterministic static generation.

---

## Naming Convention

ADR-###
