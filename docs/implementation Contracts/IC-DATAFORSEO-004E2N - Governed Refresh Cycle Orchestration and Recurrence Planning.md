# IC-DATAFORSEO-004E2N — Governed Refresh Cycle Orchestration and Recurrence Planning

**Status:** Implemented  
**Increment:** DF004-E2N

## Boundary

E2N reconstructs a historical-refresh cycle from existing immutable plan, authorization, consumption, execution, retrieval, evidence, identity-reuse, promotion, admission, and historical-intelligence artifacts. It adds no second workflow repository and does not rewrite authoritative artifacts. Its event history is a deterministic read-only projection of referenced lifecycle records.

Orchestration automates sequencing, not authority. The status service may identify the next operator action, but it cannot create or approve an authorization, consume authorization, execute SELLERS, retrieve provider data, retain evidence, assess promotion, or admit history. The paid boundary always remains an explicit operator action through existing commands. Scheduled dry runs retain `paidTransportReachable=false` and gain no LIVE authority.

## Cycle and next action

A cycle is keyed deterministically from its refresh plan and references the Atlas product, retailer, provider identity, prior observation/evidence/task, authorization, provider task, retained evidence, reuse assessments, promotion state, and admitted historical observations. Before a plan exists, a deterministic readiness identity is based on the product and latest historical observation.

Conservative stages cover readiness, plan and authorization preparation, paid execution, retrieval, retention, promotion assessment, historical eligibility, admission, completion, review, blocking, failure, and no-seller-observation outcomes. Malformed, contradictory, duplicated, substituted, or referentially incomplete state fails closed. A consumed authorization is never presented as reusable; an expired unconsumed authorization recommends preparing a new authorization and is never regenerated automatically. Failed paid execution never triggers automatic retry.

Every next-action result declares whether the action is zero-spend, whether explicit spend authorization is required, whether human review is required, the potential future `SELLERS` operation, its `$0.001` ceiling, and that no action was executed.

## Recurrence and chronology

Recurrence output is policy-neutral. It exposes observation count, latest observation time, optional elapsed time from an explicit `asOf`, latest provider task, and cycle completion state. It defines no cadence, freshness threshold, stale-price rule, publication SLA, or current-price semantics.

Chronology uses `Date.parse` semantics, not lexical timestamp ordering, so existing UTC serializations remain immutable and comparable. Without `asOf`, elapsed time and authorization-expiry evaluation are not silently tied to wall-clock time.

## Operations

The read-only local command is:

`npm run acquisition:history-refresh:status -- --atlas-product=<ATLAS_PRODUCT_ID> [--as-of=<ISO_TIMESTAMP>]`

It reports `$0.000` actual spend and creates no paid task.
