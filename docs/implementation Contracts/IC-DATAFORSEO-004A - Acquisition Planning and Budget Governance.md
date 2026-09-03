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
The kill switch (`enabled`) defaults to false. `automaticPaidRetries` must remain zero. Budget limits are configurable rather than production policy constants. Plan IDs are deterministic for identical plan inputs and timestamps, supporting auditability and idempotent downstream execution design.
