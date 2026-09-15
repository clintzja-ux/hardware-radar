# IC-MERCURY-SCALE-RAMP-P1A — Bounded Existing-Task Pending Progression

Status: fixture-certified

## Responsibility

Mercury owns finite progression of already-created provider tasks inside an existing neutral bounded run. The owner composes durable run/member state, exact provider-task lineage, existing source retrieval, immutable canonical-result persistence, and source-specific processing. It owns no identity, rights, review, history, or publication policy.

The architecture is source-neutral orchestration plus source-owned retrieval and processing. DataForSEO Amazon and Google Shopping retain their existing task, result, normalization, identity, and rights owners. Repeat observation may compose the same progression primitive over its existing bounded-run adapter.

## Authority boundary

Progression accepts only an existing run ID and explicit finite `maxAttempts` / `intervalMs` policy. Every active member must already be `WAITING_FOR_PROVIDER`, have `paidTaskCreated=true`, and carry a non-empty provider task ID. Any member that would require authorization or execution causes a durable systemic stop.

Progression has no task creator, paid executor, acquisition-authorization repository, retry policy, or scope-expansion input. Existing-task retrieval requires no new paid authorization. Maximum new tasks and spend are always zero.

## Finite behavior

Each invocation performs at most `maxAttempts`. Between still-pending attempts it uses the injected wait boundary and caller-supplied non-negative interval. No production interval or completion timeout is claimed by this increment; provider completion timing remains `MEASURE`.

The projection is:

- `TERMINAL` when the existing run reaches its repository-native terminal state;
- `PENDING_BOUND_REACHED` when at least one member remains `WAITING_FOR_PROVIDER` after the finite bound;
- `SYSTEMIC_STOP` when the run is durably `FAILED`.

Completed and exception members are never replayed through source processing. Pending members retain their exact task IDs. Member-local domain exceptions remain isolated. Shared lineage, repository, immutable-result, rights, or paid-execution integrity failures remain loud and fail closed.

## Persistence and concurrency

No new repository is introduced. Identity discovery continues to use `SqliteNeutralBoundedRepository`; repeat runs continue to use `SqliteRepeatObservationRepository` through their existing persistence adapter. SQLite transactions own member/run updates. Existing canonical task/result repositories and source owners retain their established serialization, immutable conflict, and idempotency behavior. No second lock hierarchy or writer topology is introduced.

Restart reconstructs the run and exact task lineage from durable repositories. Process-local attempt counters are operational bounds only and confer no authority. Concurrent or replayed finalization is governed by the existing immutable source-result and domain-finalization owners.

## Separation

This increment does not provide scheduling, cadence, background execution, Forge cohort projection, exception review, H052, Sellers authorization, repeat-observation authorization, publication, Current Price, Cheapest, Picks, recommendations, or affiliate authority.

## Certification

Fixtures cover immediate completion, mixed completion/pending, pending-then-complete, pending beyond the bound, member-local exception isolation, lineage failure, immutable-result conflict, restart, exact replay, paid-work prohibition, multi-member isolation, Amazon/Google composition, and repeat-run compatibility. Production providers and repositories are not invoked.
