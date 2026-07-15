# ADR-001

## Title

Separate Facts from Observations

---

## Status

Accepted

---

## Context

Computer hardware contains two fundamentally different kinds of information.

Some information rarely changes.

Examples:

- Brand
- Model
- Capacity
- Speed
- ECC
- RGB

Other information changes constantly.

Examples:

- Price
- Availability
- Shipping
- Discounts

Treating these as one dataset causes unnecessary coupling.

---

## Decision

Atlas will own immutable hardware facts.

Mercury will own retailer observations.

Atlas references observations.

Atlas never stores observations directly.

---

## Consequences

Benefits

- Clean architecture
- Easier price updates
- Better history
- Easier storage migration
- Better AI grounding

Trade-offs

Requires communication between Atlas and Mercury.

---

## Alternatives Considered

Store prices directly inside products.

Rejected because it couples stable knowledge with volatile observations.

---

## Related Documents

HR-ARCH-001

Hardware Database Specification