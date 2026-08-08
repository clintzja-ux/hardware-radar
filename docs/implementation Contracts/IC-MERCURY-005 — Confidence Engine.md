# IC-MERCURY-005 — Confidence Engine

**Status:** Implemented — pending exit certification

## Objective

Introduce explainable, deterministic confidence evaluation for Mercury observations without persisting confidence as observation truth.

## Scope

- Confidence evidence derivation
- Versioned confidence policy
- `HIGH`, `MEDIUM`, `LOW` classification
- Explainable reason codes
- Mercury facade integration
- Deterministic tests

## Evidence Inputs

- canonical observation validation;
- provenance validation;
- adapter registration;
- derived freshness;
- observation-declared validation status.

## Explicitly Out of Scope

- numeric confidence scoring;
- publication eligibility;
- source reputation learning;
- retailer reliability analytics;
- price anomaly detection;
- historical intelligence;
- Aurora reasoning.

## Exit Criteria

- Confidence results are deterministic and immutable.
- Every result contains evidence and reasons.
- Stronger classifications are policy-driven.
- Unknown or insufficient evidence fails closed to LOW.
- No confidence field is added to the canonical observation schema.
- Mercury, Atlas, Sentinel, Forge, and Hardware Radar regressions pass.
