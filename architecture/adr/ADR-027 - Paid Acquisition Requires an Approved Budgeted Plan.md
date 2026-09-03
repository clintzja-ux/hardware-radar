# ADR-027 - Paid Acquisition Requires an Approved Budgeted Plan

## Status
Accepted

## Decision
Every automated paid Mercury acquisition operation must originate from an immutable approved acquisition plan. Planning is side-effect free and must occur before execution. The planner fails closed when acquisition is disabled and enforces task-count, per-run, daily-budget, and freshness/cooldown limits. Automatic paid retries are prohibited.

## Rationale
External API acquisition has real marginal cost. Budget governance must therefore be an architectural boundary rather than an operational convention. Separating planning from execution makes proposed spend inspectable before any network side effect occurs.

## Consequences
Future DF004 executors may execute only approved plan entries and must remain within the plan's approved maximum. Scheduling does not bypass this boundary. Affiliate relationships may influence future acquisition priority but never alter Mercury's recorded market truth.
