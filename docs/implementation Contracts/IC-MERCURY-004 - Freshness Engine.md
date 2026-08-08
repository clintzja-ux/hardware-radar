# IC-MERCURY-004 — Freshness Engine

**Status:** Implemented — Pending Exit Review  
**Subsystem:** Mercury  
**ADR:** ADR-009

## Objective

Introduce deterministic temporal evaluation for canonical Mercury observations without mutating those observations or storing time-decaying freshness state.

## Deliverables

- `FreshnessEngine`
- `FreshnessPolicy`
- `FreshnessValidator`
- versioned default development policy
- `CURRENT`, `AGING`, and `STALE` states
- explicit expiration handling
- explicit evaluation-time requirement
- Mercury facade integration
- deterministic unit and integration tests

## Boundaries

IC-MERCURY-004 does not implement:

- confidence or source trust;
- retailer reliability;
- automatic refresh or scheduling;
- publication decisions;
- Forge workflow changes;
- Hardware Radar presentation changes;
- retailer-specific production freshness thresholds.

## Exit Criteria

- Freshness remains derived rather than stored.
- Boundary behavior is deterministic and tested.
- Explicit expiration overrides ordinary policy state.
- Evaluation before observation time fails deterministically.
- Original observations remain immutable.
- Existing Atlas, Sentinel, Mercury, Forge, and Hardware Radar behavior remains regression-free.
