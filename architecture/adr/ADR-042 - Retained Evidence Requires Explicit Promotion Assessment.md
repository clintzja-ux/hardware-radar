# ADR-042 — Retained Evidence Requires Explicit Promotion Assessment

**Status:** Accepted  
**Date:** 2026-08-22

## Context

DF003 deliberately retains licensed market evidence before Atlas product and merchant identities are necessarily canonical. Retention prevents evidence loss; it is not an assertion that the evidence belongs in Mercury history, canonical observations, or public intelligence.

Treating existence as eligibility would let uncertain external confidence mutate Atlas identity and would collapse four distinct governance boundaries: retention, historical eligibility, canonical eligibility, and publication eligibility.

## Decision

Mercury owns a deterministic, non-mutating, fail-closed evidence-promotion assessment. It recomputes and cross-checks the certified DF003 eligibility result and returns an explainable promotion state plus machine-readable reasons and evidence dimensions.

Unknown values, malformed provenance, contradictions, and inconsistent stored eligibility cannot produce eligibility. Product evidence confidence remains evidence about an Atlas identity; it never edits or upgrades Atlas identity. Publication remains governed by the existing canonical review and publication workflow and cannot be reached directly from retained evidence.

No new business thresholds are introduced. Existing certified DF003 identity rules may establish historical/canonical eligibility. Where no canonical rule exists—especially direct publication from retained evidence—the state remains unreachable.

## Consequences

- `retained evidence != historical eligibility != canonical eligibility != publication eligibility`.
- Current `PROBABLE` product plus `DISCOVERED` merchant evidence requires review.
- Assessment is local and creates no provider task or spend.
- Unattended LIVE acquisition and automatic promotion remain outside scope.
