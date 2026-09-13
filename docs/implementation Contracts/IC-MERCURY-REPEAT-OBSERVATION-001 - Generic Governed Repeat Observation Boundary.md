# IC-MERCURY-REPEAT-OBSERVATION-001 — Generic Governed Repeat Observation Boundary

## Status

Fixture-certified. Production composition and operator commands are not exposed by this increment.

## Boundary

Mercury may reuse a durable governed product/source identity to prepare a fresh `SELLERS` observation acquisition. It may not reuse an old market observation. Each observation cycle produces a content-addressed preparation, paid-action intent, and acquisition-cycle identity bound to the Atlas product, source, effective reusable identity digest, source-rights digest, operation, cycle timestamp, task ceiling, and zero-retry rule.

The caller supplies only the Atlas product, supported source, and governed observation-cycle timestamp. Source adapters resolve the effective identity from existing owners: a strong automatic or operator-confirmed ASIN for DataForSEO Amazon, or the certified historical-refresh identity/reuse projection for Google Shopping. Missing, contradictory, retired, or discovery-required identity fails closed; the boundary never silently runs PRODUCTS discovery.

## Lifecycle

`PREPARE` is deterministic, local, and zero-spend. It grants no paid authority. A later authorization requires the exact preparation ID, operator, reason, expiry, and confirmation; it is bound to one task, the source task-price ceiling, the current `$0.025` UTC-day ceiling, and zero automatic retries. Fixture execution delegates exactly one `AMAZON_SELLERS` or `SELLERS` task to the existing production task owner and its single-use consumption boundary.

The generic boundary owns no provider transport, task ledger, spend ledger, provider-result repository, evidence repository, identity repository, or history repository. Existing retrieval and immutable-result owners consume the resulting task lineage; existing source normalizers and retention repositories persist evidence; H058 assesses and admits fact-level history separately. Preparation or paid authorization grants no retention, historical admission, canonical, review, E2S, publication, Current Price, Current Display, Cheapest, Pick, or affiliate authority.

## Identity and replay

- Same product/source/cycle and unchanged governed bindings: identical preparation and duplicate replay.
- A later governed cycle: distinct preparation, paid-action intent, acquisition identity, and provider task.
- Same acquisition identity and identical material result: duplicate.
- Same acquisition identity and changed material result: conflict and fail closed.
- Same product, merchant, and price from a new task/provider observation time: legitimate new evidence and potentially a new historical fact.

## Economics

Amazon SELLERS is capped at `$0.0015`; Google Shopping SELLERS is capped at `$0.001`. New repeat observations use the canonical `$0.025` UTC-day ceiling and preserve legacy `$0.010` fields only as historical audit data. A fixture five-product, dual-source cycle is ten tasks and `$0.0125` maximum spend. No real authorization or task is created by certification.

## Scalability and exclusions

Product IDs are fixture data, not production policy. One generic lifecycle uses source adapters and scales by governed identity records. This increment deliberately adds no scheduler, background automation, portfolio orchestration, paid retries, autonomous discovery, Forge work, or production command surface. No ADR is required because subsystem ownership is unchanged.

## Durable acquisition persistence

Production-scale repeat operational state uses `SqliteRepeatObservationRepository`, backed by the Node runtime's built-in SQLite capability. Mercury's near-term execution topology is a single host with potentially multiple local processes. WAL, full synchronous durability, foreign keys, a bounded busy timeout, transactions, unique constraints, and direct indexes provide crash-safe append operations and cross-process coordination without an external service. SQLite is not represented as a distributed multi-host database.

Preparations are indexed by preparation ID, paid-action intent, acquisition cycle, and product/source/cycle. Authorizations are indexed by ID and preparation/expiry. Records retain complete validated immutable JSON alongside indexed binding columns. Exact replay is idempotent; identity, intent, source, cycle, or authorization conflicts fail closed. `BEGIN IMMEDIATE` protects the compound active-authorization check and insertion. Actual authorization consumption remains owned by the existing live-authorization consumption repository and production task owner's single-writer execution boundary; no second consumption ledger was introduced.

Legacy `FileDataForSeoPrepareArtifactRepository` JSON remains unchanged and readable as audit/history. Its experimental repeat collections were removed rather than retained as a second operational source of truth. There is no production migration or indefinite dual write. A future database adapter can implement the same repository methods without changing `RepeatObservationService` or downstream identity, task, retention, and H058 semantics.

Production command composition remains a separate increment. Persistence certification uses temporary fixture databases and creates no production preparation or authorization.
