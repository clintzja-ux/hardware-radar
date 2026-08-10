# ADR-010 — Confidence Is Explainable Derived State

**Status:** Accepted  
**Subsystem:** Mercury  
**Decision:** Mercury confidence is derived from explicit evidence through a versioned policy. Confidence is not stored as canonical observation truth and M005 does not assign an opaque numeric score.

## Context

Freshness established that time-dependent interpretation should be derived rather than persisted. Confidence is similarly contextual and may change as validation, provenance, adapter registration, or freshness evidence changes.

## Decision

Mercury shall:

- derive confidence from explicit evidence;
- preserve evidence and reasons with every confidence result;
- use categorical `HIGH`, `MEDIUM`, and `LOW` states in M005;
- fail closed to `LOW` when the evidence does not satisfy a stronger policy classification;
- keep confidence policy versioned and separate from observation data;
- keep confidence distinct from publication eligibility and Sentinel decisions.

## Consequences

Consumers can explain why a confidence result was reached. Policies can evolve without mutating historical observations. Aurora and future applications may consume the evidence and classification without depending on an unexplained numeric score.
