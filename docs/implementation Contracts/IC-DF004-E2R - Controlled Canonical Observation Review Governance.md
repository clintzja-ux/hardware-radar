# IC-DF004-E2R — Controlled Canonical Observation Review Governance

**Status:** Implemented — fixture-certified
**Increment:** DF004-E2R

## Purpose

E2R establishes Mercury's controlled operator boundary for reviewing an already admitted canonical observation. Canonical admission, review, publication evaluation, publication authority, and current/public-price authority remain independent lifecycle decisions.

`REVIEWED` means exactly: “The canonical observation has been examined under Hardware Radar's governed observation-review policy and is acceptable to proceed to independent publication evaluation.” It does not mean published, publishable, current, cheapest, or recommended.

## Ownership and lifecycle

Mercury owns observation review through the existing `ObservationReviewService`, `ReviewWorkflowService`, and append-only `FileReviewDecisionRepository`. Forge may draft or display review inputs, but it does not decide review validity.

```text
canonical observation + current owner state
→ E2R observation-integrity assessment
→ E2R PREPARE immutable expiring authorization
→ explicit operator review and exact confirmation
→ E2R EXECUTE reload and reassessment
→ ReviewWorkflowService append-only decision
→ single authorization consumption
```

The repository-native decision states remain `REVIEWED`, `HOLD`, and `REJECTED`. E2R adds no generic approval or force-publish state.

## Immutable binding

An E2R assessment and authorization bind the canonical observation and idempotency identity, retained evidence, Atlas product, Atlas retailer, provider/source and task, provenance, rights, historical and canonical record digests, E2P assessment/policy, E2Q authorization/consumption, current effective review state, requested decision, E2R policy version, operator, reasons, and notes. A deterministic binding digest protects the complete candidate.

PREPARE is local and zero-network. It creates only a reviewable, expiring authorization and performs no review mutation. EXECUTE accepts only the authorization ID, exact `RECORD-CANONICAL-OBSERVATION-REVIEW-DECISION` confirmation, and the bound operator label. It reloads current owner state, reassesses E2R, rejects stale or substituted bindings, delegates the append only to `ReviewWorkflowService`, and records one immutable authorization consumption.

## Replay, concurrency, and re-review

Exact PREPARE replay returns the same authorization. A conflicting authorization for the same observation and effective-review-state intent fails closed. Missing, malformed, expired, substituted, or unconfirmed authorization fails closed.

Exact EXECUTE replay returns the existing consumed result. Conflicting consumption fails closed. Cross-process single-writer locks protect authorization and review-decision repositories. A governed review decision records its predecessor effective decision, so stale concurrent re-review fails closed while a later explicit decision can form a traceable append-only chain.

The legacy `review:record` command is not a production review path. It is guarded by an explicit nonproduction acknowledgement and directs operators to E2R PREPARE/EXECUTE.

## Scope separation

E2R creates no canonical observation, publication eligibility, publication authority, publication event, current/live/public-price authority, Cheapest/Pick authority, provider call, paid task, or spend. `REVIEWED` permits only a later independent publication evaluation. `HOLD` and `REJECTED` likewise grant no downstream authority.

## Operator commands

```text
npm run review:canonical:prepare -- --observation-id=<ID> --decision=<REVIEWED|HOLD|REJECTED> --reviewed-by=<OPERATOR> --reason=<REASON>
npm run review:canonical:execute -- --authorization-id=<ID> --confirm=RECORD-CANONICAL-OBSERVATION-REVIEW-DECISION --executed-by=<OPERATOR>
```

Fixture certification covers valid PREPARE/EXECUTE, all native decisions, exact binding, expiry and malformed input, candidate and operator substitution, exact replay, conflicts, stale predecessor state, cross-process single-writer behavior, immutable history, and explicit publication/current-price separation. Neither command was run against production state during implementation or certification.
