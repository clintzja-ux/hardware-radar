# ADR-003

## Title

Recommendations Are Computed, Not Curated

---

## Status

Accepted

---

## Context

Manual recommendations become inconsistent and difficult to maintain as the catalog grows.

Users also deserve transparent reasoning.

---

## Decision

Compass will generate recommendations using objective scoring criteria.

Recommendations should be explainable and reproducible.

---

## Consequences

Benefits

- Reduced bias
- Better scalability
- Transparent reasoning
- Easier testing

Trade-offs

Requires a scoring model.

---

## Alternatives Considered

Manually maintaining "Best Overall" lists.

Rejected because they become subjective and difficult to scale.

---

## Related Documents

HR-ARCH-003
Compass