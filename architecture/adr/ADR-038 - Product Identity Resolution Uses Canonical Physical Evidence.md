# ADR-038 — Product Identity Resolution Uses Canonical Physical Evidence

## Decision
Mercury product-candidate resolution uses Atlas primary timings, normalized color, and RGB state as auditable identity evidence in addition to MPN and core RAM specifications.

Explicit contradictions fail closed. Exact MPN evidence does not override an explicit conflict with canonical Atlas physical identity.

Price is not an identity signal.

## Rationale
Real Google Shopping discovery evidence demonstrated that multiple exact-MPN candidates can differ in descriptive physical attributes. Resolver decisions must therefore be explainable from canonical Atlas facts rather than title wording or price.

## Consequences
- GRAY and GREY normalize to the same canonical color.
- Primary timing strings such as 30-36-36-76 support the corresponding CAS latency identity signal.
- Explicit color conflicts are contradictions.
- Explicit RGB claims conflict with Atlas `rgbLighting=false`.
- PREPARE output exposes winner evidence, runner-up score, and score margin for operator review.
