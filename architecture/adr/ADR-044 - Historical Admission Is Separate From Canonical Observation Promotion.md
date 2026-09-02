# ADR-044 — Historical Admission Is Separate From Canonical Observation Promotion

**Status:** Accepted
**Date:** 2026-08-23

## Context

Early Mercury history was derived only from canonical observations. DF004 later separated retained evidence, historical eligibility, canonical eligibility, and publication eligibility. E2H can now authorize internal history while canonical-observation policy remains intentionally undefined. The canonical observation schema also normalizes source-null condition and does not structurally retain provider total and tax, so using it for E2J would discard facts and imply a canonical status that policy has not granted.

## Decision

Mercury has an immutable historical-admission record for retained evidence that satisfies current E2G/E2H historical policy. It uses a distinct deterministic `mer_hist_` identifier so an internal historical record cannot collide with or impersonate a canonical `mer_obs_` identity. It reuses append-only file persistence, evidence-scoped idempotency, and Atlas referential checks, but it is not a canonical or published observation.

Admission preserves provider values losslessly, including null shipping, tax, and condition; provider total is stored without recomputation. Original observation time remains distinct from admission time. Each record references the retained evidence and governed PRODUCTS, PRODUCT_INFO, and SELLERS acquisition chain.

Historical admission requires current identity-review projection, Atlas-backed retailer resolution, Atlas product existence, complete provenance, and `historicalEligible=true`. Refresh evidence may satisfy identity gates only through its exact governed refresh-reuse binding; admission preserves that refresh plan, authorization, SELLERS task, source evidence, provider identity, and decision provenance without inventing new PRODUCTS or PRODUCT_INFO tasks. It also requires canonical and publication eligibility to remain false for this policy version.

## Consequences

- Retention is not history, and eligibility is not admission.
- Historical admission cannot manufacture canonical or publication eligibility.
- Historical records are immutable and replay-safe per retained evidence ID.
- Later market observations create distinct records rather than updating history.
- Existing canonical historical intelligence remains compatible with canonical observations; E2J internal records require an explicit query-integration contract, supplied by DF004-E2K.
- E2J performs no acquisition, publication, or spend.
