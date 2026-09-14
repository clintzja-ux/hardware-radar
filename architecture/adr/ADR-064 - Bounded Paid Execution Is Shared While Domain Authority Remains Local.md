# ADR-064 — Bounded Paid Execution Is Shared While Domain Authority Remains Local

## Status

Accepted.

## Decision

Mercury owns one neutral bounded paid-action coordination mechanism for immutable cohort plans, aggregate and per-member cost bounds, expiring single-use parent authorization, shared-budget revalidation, member progress, waiting/resume, failure isolation, and terminal summaries. Members are identified by opaque domain keys, and child authority is content-addressed to the exact parent authorization and immutable domain preparation.

Typed domain adapters retain all semantic authority, including supported source/operation validation, identity and rights rules, provider task ownership, retrieval, retention, historical admission, and the point at which a member becomes terminal. A neutral parent authorization grants no domain result or downstream authority.

## Consequences

Repeat observation uses the shared coordinator without changing its existing service or command surface, SQLite production state, source-specific task owners, recovery behavior, or H058 boundary. Compatibility projection preserves existing records without migration. Future Products identity discovery may reuse the bounded mechanics only through a separately certified typed adapter; it cannot inherit repeat-observation semantics or authority.

This is a concrete Mercury mechanism, not a workflow language, scheduler, plugin system, task ledger, spend ledger, identity system, evidence repository, or history repository.
