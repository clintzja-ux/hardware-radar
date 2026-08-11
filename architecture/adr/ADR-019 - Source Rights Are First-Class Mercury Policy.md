# ADR-019 — Source Rights Are First-Class Mercury Policy

**Status:** PROPOSED / MR001 implementation complete pending user verification  
**Date:** 2026-08-10

## Context

Mercury previously treated retention as a narrow storage concern. Unknown license contexts fell through to durable storage, while Historical Intelligence and governed publication evaluated technical evidence without a generalized source-rights policy. Amazon compliance and the Best Buy RC001 audit demonstrated that technical accessibility does not imply permission to retain, derive, compare, or publish source content.

## Decision

Mercury will treat source rights as first-class machine-readable policy. Acquisition, live use, publication, comparison, retention, historical use, derivation, and presentation requirements are independent rights dimensions. Rights that are unknown, conditional, or awaiting clarification do not count as explicit permission for the governed operation being evaluated.

Unknown source rights fail closed.

RetentionPolicy remains an enforcement projection of SourceRightsRegistry rather than an independent retailer rulebook. HistoricalEligibility requires explicit historical-retention permission. Governed publication requires explicit public-display permission. Ingestion requires an explicitly permitted acquisition method.

Retailer-specific facts belong in source-rights profiles, not Sentinel invariants or generic workflow services.

## Consequences

- Amazon Creators API retains its one-hour licensed-content TTL and is blocked from historical intelligence.
- Legacy manual Amazon observations remain blocked production evidence.
- Best Buy Products API is represented provisionally: API acquisition is permitted as a technical source, historical retention is blocked, and unresolved comparison/public-display rights fail closed pending written clarification.
- Unknown future sources no longer default to durable storage.
- Historical Intelligence remains available for sources that explicitly permit historical retention.
- Future retailer audits can update policy profiles without redesigning Mercury.

## promote ADR-019 to ACCEPTED.