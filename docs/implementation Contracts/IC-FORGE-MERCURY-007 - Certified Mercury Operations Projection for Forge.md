# IC-FORGE-MERCURY-007 — Certified Mercury Operations Projection for Forge

Status: IMPLEMENTED — AWAITING OPERATOR VERIFICATION

## Purpose

Provide Forge with one immutable, deterministic, read-only operational projection composed from certified Atlas and Mercury state. FM007 contains the legacy authoring preview without deleting it and prevents that preview from being mistaken for governed Mercury state.

## Source ownership

| Source | Semantics retained by FM007 |
|---|---|
| Atlas product repository snapshot | Canonical product identity |
| DF003 retained-evidence snapshot | Evidence membership and count |
| E2I identity projection | Product and merchant identity-review state |
| E2G/E2H promotion assessment | Promotion state, eligibility flags, and reasons |
| `HistoricalObservationPortfolio` | Historical counts/values, cadence, due state, cycle blockers, and next action |
| Canonical Mercury observations plus repository-resolved effective decisions | Distinct effective review and publication workflow state |

FM007 only composes these results. It does not reevaluate identity, eligibility, cadence, review, publication, freshness, or acquisition policy.

## Projection schema

`CERTIFIED_MERCURY_OPERATIONS_PROJECTION` version `1.0` contains an explicit `asOf`, operational semantic flags, a certified portfolio summary, and sorted per-product entries. Each product entry contains canonical Atlas identity, retained-evidence references/count, historical portfolio state, per-evidence identity projections, promotion assessment, cadence/cycle state, separate durable review/publication workflow state, machine-readable source-tagged blockers, and the portfolio-derived next action.

Unsupported optional state is represented as `NOT_AVAILABLE`, `NOT_ASSESSED`, `NOT_REVIEWED`, or `NOT_DECIDED`; it is never invented.

## Invariants

- Identical governed inputs and identical `asOf` produce identical output.
- Output is deeply frozen and source snapshots are never mutated.
- Malformed sources, contradictory bindings, duplicate identifiers, or an `asOf` mismatch fail closed.
- Evidence, historical admission, identity review, promotion, review, and publication remain separate.
- Review does not imply publication; no generic readiness flag exists.
- The projection authorizes no mutation, acquisition, review, publication, or paid task.

## Historical-price semantics

Latest values are copied only from the historical portfolio and are explicitly labeled `HISTORICAL_OBSERVATION`. Projection and UI flags state `currentPrice=false`, `livePrice=false`, `publicPrice=false`, and `publicationAuthority=false`. FM007 changes no Mercury publication policy and grants no public price-history authority.

## Forge boundary

Forge loads a local JSON projection and renders already-derived semantics. It contains no promotion/cadence/publication business rules and performs no repository or provider call. Empty, optional, blocked, and malformed/unavailable states are rendered safely. The existing authoring path remains available but is visibly labeled `Legacy Mercury Preview — Noncanonical`.

## Non-scope and external state

No repository exporter, external provider operation, live acquisition, historical admission, policy decision, review/publication write, deployment, secret access, or production connection is introduced. DF005-X remains unchanged and fail closed. Network operations: none. Paid tasks: none. Actual spend: `$0.000`.

## Tests and exit criteria

Fixture-only Mercury and Forge-panel tests cover determinism, deep immutability, source isolation, canonical identity, historical semantics, separate workflow states, blockers/actions, empty and missing state, malformed-state rejection, legacy isolation, and zero-operation metadata. Exit requires focused tests, public build/verification, all subsystem suites, layout verification, diff validation, and privacy scan to pass without weakening existing tests.
