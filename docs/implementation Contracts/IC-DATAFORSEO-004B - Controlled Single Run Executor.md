# IC-DATAFORSEO-004B — Controlled Single-Run Executor

## Purpose
Execute a previously approved DF004-A acquisition plan without permitting unplanned work, retries, overlapping writers, or silent budget drift.

## Inputs
- immutable Acquisition Plan v1.0
- FileSingleWriterRunLock-compatible lock
- execution ledger repository
- paid-transport interface exposing `execute(executionDescriptor)`

## Required behavior
1. Reject disabled, structurally inconsistent, or policy-exceeding plans.
2. Require an execution descriptor for every approved task.
3. Acquire the DF003-E single-writer lock before duplicate checks or execution.
4. Block duplicate execution of the same `planId`.
5. Execute approved tasks only, in plan order.
6. Never retry a paid operation automatically.
7. Before each paid operation, ensure its estimated cost fits remaining run and daily ceilings.
8. After each operation, account for provider-reported actual cost.
9. Stop remaining work after provider failure or actual budget exhaustion/overrun.
10. Preserve provider task ID/status and charged cost when supplied, including failures.
11. Persist one immutable run ledger per executed plan.

## Non-goals
- live DataForSEO calls
- DF003 market-evidence ingestion
- scheduling
- Forge UI
- production budget calibration

## Cost semantics
Estimated cost is a pre-call guard. Actual provider cost is authoritative after a call. If a provider charges more than estimated, the ledger records the overrun and subsequent paid work is stopped; the already-incurred provider charge cannot be undone.
