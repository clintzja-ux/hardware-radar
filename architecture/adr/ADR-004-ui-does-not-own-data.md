# ADR-004

## Title

The User Interface Never Owns Business Data

---

## Status

Accepted

---

## Context

User interfaces evolve rapidly.

Business knowledge evolves slowly.

Coupling data structures to presentation creates unnecessary technical debt.

---

## Decision

The website consumes Atlas.

The website never becomes the canonical source of truth.

Business rules remain independent of presentation.

---

## Consequences

Benefits

- Easier redesigns
- Easier mobile apps
- Easier APIs
- Better testing
- Longer architectural lifespan

Trade-offs

Requires stronger separation between frontend and backend concerns.

---

## Alternatives Considered

Embedding business logic inside page rendering.

Rejected because it tightly couples presentation and knowledge.

---

## Related Documents

HR-ARCH-001
Atlas