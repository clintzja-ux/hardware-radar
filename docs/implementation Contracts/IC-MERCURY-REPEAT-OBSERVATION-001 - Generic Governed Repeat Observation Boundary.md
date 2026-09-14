# IC-MERCURY-REPEAT-OBSERVATION-001 — Generic Governed Repeat Observation Boundary

## Status

Fixture-certified, including the thin production bounded-run operator command surface. No production bounded run was created during certification.

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

## Production composition

`createProductionRepeatObservationService` is the single production composition owner. Its canonical operational database is `.forge-review/mercury/repeat-observations.sqlite`, resolved relative to the runtime working directory and never placed in source or public assets. Opening the repository initializes schema version `1`; WAL and full synchronous durability apply. Operators must include this file and its SQLite WAL state in coordinated local backups while Mercury is stopped.

Amazon identity is derived from the existing effective Amazon acceptance outcome and permits only `STRONG_UNIQUE_ASIN` or `STRONG_OPERATOR_CONFIRMED_ASIN`; the caller cannot supply an ASIN. Google identity is derived from the latest governed Google historical observation and its exactly bound retained evidence; missing history/evidence or ambiguous lineage returns discovery-required/fail-closed rather than launching PRODUCTS. Execution reloads and compares the current governed identity, rights profile, and durable UTC-day spend before delegating exactly one `AMAZON_SELLERS` or `SELLERS` task to the existing production task owner.

The thin commands are `mercury:repeat-observation:prepare`, `mercury:repeat-observation:authorize`, and `mercury:repeat-observation:execute`. PREPARE and AUTHORIZE are local and zero-spend. EXECUTE is explicitly confirmed and is the only command capable of posting one paid task. The reusable service also exposes `retrieve`, `processRetain`, and `assessAdmitFact`; these route by governed IDs to existing owners and do not grant downstream authority. Repeat execution authority never implies retention, historical admission, canonical retailer identity, Current Price, Current Display, Cheapest, Pick, recommendation, publication, or affiliate authority.

## Bounded repeat runs

`BoundedRepeatObservationRunService` composes those six certified service methods for a data-driven cohort. PREPARE RUN accepts only an explicit UTC cycle and product/source pairs, persists READY and blocked results as one immutable plan, and calculates the exact task/spend envelope. One expiring operator authorization binds the complete plan and may authorize H058 factual admission only for evidence produced by that run. START consumes that scope once and derives exact, non-expandable task authorizations internally; it cannot add products, sources, discovery, retries, or tasks.

Run plans, authorizations, runs, and minimal member progress use indexed tables in the same `repeat-observations.sqlite` database. `WAITING_FOR_PROVIDER` is durable and RESUME retrieves only already-created tasks. Product-local evidence/offer failures become isolated exceptions; rights, binding, budget, repository, authorization, SQLite, or task-owner integrity failures stop the run. The small states are `PREPARED`, `AUTHORIZED`, `RUNNING`, `WAITING_FOR_PROVIDER`, `COMPLETED`, `COMPLETED_WITH_EXCEPTIONS`, and `FAILED`.

Canonical provider-task resolution is by the exact repeat preparation, paid-action intent, acquisition cycle, Atlas product, source, operation, reusable-identity digest, rights digest, repeat authorization, and parent run authorization. Zero or multiple matches fail closed; an older bootstrap task for the same product is never a substitute. File-backed task-ledger readers reload canonical state for each lookup, and writers merge the latest durable state before replacement so independently composed Google and Amazon task owners cannot overwrite one another's rows.

After a successful repeat execution, `paidTaskCreated=true` requires an exact, durably recoverable canonical provider-task identity. The production task owner requires the canonical task row to be resolvable before returning success. Successful provider execution whose canonical task lineage cannot be recovered is a systemic integrity failure, never a product-local exception. Bounded-run paid-task and spend totals are derived from authoritative resolved task/execution accounting, not authorization ceilings or attempted work.

RESUME has one narrow terminal-exception recovery: a member stopped solely by `REPEAT_OBSERVATION_PROVIDER_TASK_NOT_FOUND` may return to `EXECUTED` only when the immutable preparation, its single authorization, and exactly one completed execution ledger entry prove the complete lineage and provider task ID. The missing canonical task row is reconstructed in the existing `DataForSeoTaskLedger`; no task is posted and no authorization is created or consumed. RESUME must reuse the existing provider task and may never recreate paid work. Other terminal exceptions remain terminal. Exact recovery replay is idempotent, while missing, changed, or ambiguous execution lineage fails closed. Amazon and Google task owners must produce the same canonical repeat-task lineage fields even though their provider operations and costs differ.

The service exposes `prepareRun`, `authorizeRun`, `startRun`, `inspectRun`, and `resumeRun` directly; neither shell spawning nor per-product operator actions belong in the service contract.

## Governed reusable-identity lineage

Mercury recognizes two acquisition origins without conflating them. `INITIAL_DISCOVERY_LINEAGE` preserves the existing PRODUCTS/discovery-to-SELLERS chain. `REUSABLE_IDENTITY_REPEAT_LINEAGE` binds a new SELLERS acquisition to an already governed source identity, the exact repeat preparation, paid-action intent, acquisition cycle, task authorization, task/result, rights digest, and optional parent bounded-run authorization. It never fabricates a PRODUCTS task or upgrades identity authority.

Amazon reuse remains limited to strong unique or operator-confirmed ASIN identity. Google reuse remains limited to the certified applicable/verified/reused provider-identity projection. Missing, ambiguous, contradictory, retired, or changed identity and rights fail closed. `DataForSeoTaskLedger` accepts only the explicit historical-bootstrap and repeat-observation intent classes and validates repeat product, source, operation, cycle, preparation, authorization, identity, and rights bindings.

The production result pipeline resolves tasks by indexed paid-action intent, retrieves through existing source owners, persists immutable canonical results in the existing provider-result repository, retains through existing Amazon or Google DF003 boundaries, and presents the validated repeat lineage to H058. Exact replay is duplicate-safe; changed material under the same acquisition identity is a conflict. Source retention and H058 preserve unresolved merchant evidence and grant no downstream authority.

Fixtures certify complete Amazon and Google bounded-run paths, including one provider-pending member that resumes against the same task without new paid work. The lineage model is product-neutral and keyed by indexed IDs/digests; it introduces no new identity, task, evidence, or history repository.

## Bounded-run operator commands

The production runtime composes `BoundedRepeatObservationRunService` over the existing production repeat-observation factory and its SQLite store, identity, rights, spend, task, result, retention, and H058 owners. Scripts contain argument validation and rendering only; future Forge callers may invoke the service directly.

- `mercury:repeat-run:prepare -- --cohort-file=<JSON> --observation-cycle=<ISO-UTC>`
- `mercury:repeat-run:inspect -- --run-plan-id=<ID>` or `--run-id=<ID>`
- `mercury:repeat-run:authorize -- --run-plan-id=<ID> --operator=<LABEL> --reason=<TEXT> --expires-at=<ISO-UTC> --confirm=AUTHORIZE-BOUNDED-REPEAT-RUN`
- `mercury:repeat-run:start -- --run-authorization-id=<ID> --executed-by=<LABEL> --confirm=START-BOUNDED-REPEAT-RUN`
- `mercury:repeat-run:resume -- --run-id=<ID> --resumed-by=<LABEL> --confirm=RESUME-BOUNDED-REPEAT-RUN`

The cohort file is a JSON array whose elements contain exactly `atlasProductId` and `source`. PREPARE, INSPECT, and AUTHORIZE perform no provider operation or paid task. START revalidates every READY identity and rights binding plus aggregate durable spend before paid work. RESUME is explicitly attributed and retrieves only already-created tasks. Neither command accepts raw provider identity, provider task, result, policy, cost, repository, or downstream-authority overrides.

Persistence certification uses temporary fixture databases and creates no production preparation or authorization.
