# ADR-011 — Historical Intelligence Is Derived From Immutable Observations

**Status:** Accepted

## Decision
Mercury derives historical intelligence from canonical immutable observations. It does not maintain a second mutable price-history store.

Historical eligibility is independent of present-day freshness. Comparability is explicit by product, currency, and condition, with retailer and marketplace available as optional query dimensions. Derived claims retain observation identifiers so every result remains traceable to evidence.

## Consequences
Historical results are reproducible, auditable, and cannot silently rewrite market history. Subjective deal scoring and prediction remain outside this decision.

DF005-A extends this derivation across the canonical Atlas product universe as a read-only portfolio. Portfolio presence, cadence DUE status, and potential-cost summaries remain non-authoritative and grant no acquisition authority.
