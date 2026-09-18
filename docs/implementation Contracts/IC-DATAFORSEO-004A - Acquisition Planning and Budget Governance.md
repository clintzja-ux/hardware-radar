# IC-DATAFORSEO-004A - Acquisition Planning and Budget Governance

## Purpose
DF004-A creates an immutable, auditable acquisition plan before any paid DataForSEO operation is permitted to execute.

## Contract
Planning performs no network request and spends no money. The default policy is disabled. Paid retries are fixed at zero. A plan evaluates explicit priority, freshness/cooldown, maximum paid tasks per run, per-run spend, and daily spend. Skipped candidates retain an explicit reason.

## Boundaries
DF004-A does not execute DataForSEO tasks, persist observations, publish market data, infer affiliate status, or schedule recurring work. Execution is a later DF004 increment and must consume an approved bounded plan under Mercury's single-writer runtime contract.

## Priorities
HIGH, NORMAL, LOW, and PAUSED are operational acquisition priorities only. They do not alter market truth, observation validity, retailer identity, or publication eligibility.

## Safety
The kill switch (`enabled`) defaults to false. `automaticPaidRetries` must remain zero. Budget limits are configurable governance rather than architectural maxima. The current DataForSEO UTC-day operational default is `$0.0750`; Google Shopping Products/Sellers remain capped at `$0.001` per task and Amazon Products/Sellers at `$0.0015` per task. Raising the daily ceiling creates no plan, authorization, task, or permission to consume it. Plan IDs are deterministic for identical plan inputs and timestamps, supporting auditability and idempotent downstream execution design.

Ordinary single-task execution requires exact equality between the plan's immutable `spentTodayUsd` snapshot and authoritative durable UTC-day spend. A certified neutral bounded-parent execution may recognize only actual spend from earlier completed members of the same exact parent authorization, plan, run, and authorized member set. Recognition requires exact child and provider-task lineage, canonical execution-ledger attribution, each member ceiling, the parent aggregate ceiling, zero retries, and the current daily ceiling. Any remainder—including unrelated or interleaved DataForSEO spend—remains `ACQUISITION_DAILY_SPEND_SNAPSHOT_DRIFT`. This adds no spend ledger or reservation owner. Immutable plans and artifacts retain the ceiling recorded in their own binding; current authorization and execution paths independently revalidate durable spend against current governed policy where their certified contract requires it.
