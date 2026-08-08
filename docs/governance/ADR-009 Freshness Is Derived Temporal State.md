# ADR-009 — Freshness Is Derived Temporal State

**Status:** Accepted  
**Subsystem:** Mercury  
**Implementation Contract:** IC-MERCURY-004

## Decision

Mercury shall derive observation freshness from immutable observation timestamps, an explicit versioned freshness policy, optional absolute expiration, and an explicit evaluation time.

Freshness status shall not be persisted as canonical observation truth.

## Rationale

A stored freshness flag decays merely because time passes and therefore cannot remain canonical without mutation. Mercury observations are immutable. Freshness must consequently be evaluated as temporal state at a requested point in time.

This design also makes historical evaluation deterministic and reproducible.

## Canonical States

- `CURRENT`
- `AGING`
- `STALE`

Expiration remains an independent fact. When `expiresAt` has been reached, the observation evaluates as `STALE` with `expired: true`.

## Consequences

- Core freshness calculation must not call `Date.now()` implicitly.
- Evaluation requires an explicit `evaluatedAt` value or equivalent injected clock at a higher orchestration layer.
- Thresholds belong to versioned freshness policies rather than scattered conditionals.
- Freshness does not determine confidence, trust, publication eligibility, or refresh scheduling.
- Retailer-specific production thresholds require explicit later policy decisions.
