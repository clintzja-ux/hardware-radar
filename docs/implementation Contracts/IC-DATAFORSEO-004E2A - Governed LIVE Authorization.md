# IC-DATAFORSEO-004E2A — Governed LIVE Authorization

## Scope
Introduce the authorization boundary required before any LIVE acquisition. This increment does not create an unattended LIVE scheduler and does not perform a real DataForSEO request.

## Contract
LIVE requires: enabled policy; zero automatic paid retries; a reachable paid transport at the runtime layer; an explicit unexpired authorization bound to the exact plan; authorization task/spend caps; and the existing plan budget, daily budget, cooldown, and single-writer controls.

## B-006A global current-day spend governance

`maxSpendPerDayUsd` is the global governed DataForSEO daily ceiling across PRODUCTS, PRODUCT_INFO, initial SELLERS, and historical-refresh paid acquisition. The shared acquisition execution ledger is the canonical budget authority; operator-observed provider balance is contextual only.

The operational default is `$0.0250` per UTC day. `createAcquisitionBudgetPolicy` remains the canonical configuration owner and accepts an explicit ceiling for fixture or future operator-controlled composition; production DataForSEO authorization paths consume its exported default rather than scattering a replacement literal. This is an internal Hardware Radar governance limit, not a provider API limit. It changes neither the `$0.001` Google Shopping task ceiling nor the `$0.0015` Amazon task ceiling, and automatic paid retries remain zero.

Previously prepared artifacts that recorded the acceptance-era `$0.010` ceiling remain immutable audit evidence. Their stored preparation envelope is not rewritten or revived as spend authority. Current authorization, execution revalidation, and read-only operational projection use the current governed ceiling together with durable UTC-day ledger spend; artifact-specific cohort, program, and per-task ceilings remain independently binding.

Every production PREPARE calculates actual governed spend for the explicit evaluation time's UTC date from that shared ledger and binds the value into the immutable plan. Dry-run records are excluded; malformed execution state fails closed. A projected total equal to the ceiling is permitted, while a projected total above it is rejected before authorization.

Immediately before paid transport, `ControlledAcquisitionExecutor` reloads the ledger under the acquisition lock and recalculates the same UTC-day total. The value must exactly equal the authorization plan's snapshot. Any intervening governed spend invalidates the immutable authorization and requires fresh PREPARE; execution does not dynamically rebind it. Budget failure creates no provider task and makes no provider call. Existing single-use, replay, task-count, per-run spend, zero-retry, and confirmation gates remain unchanged.

Forge may later expose this existing configuration as a `Daily acquisition budget` operator setting with configured ceiling, durable current spend, and remaining capacity. No Forge UI or new spend owner is introduced here.

## Operator states
`LIVE_NOT_AUTHORIZED`, `LIVE_AUTHORIZED`, `LIVE_BLOCKED_KILL_SWITCH`, `LIVE_BLOCKED_BUDGET`, `LIVE_BLOCKED_RETRIES`, `LIVE_BLOCKED_EXPIRED`, and `LIVE_BLOCKED_PLAN_MISMATCH` are explicit. Paid execution is possible only when mode is LIVE, transport is reachable, policy is enabled, kill switch is clear, and authorization state is LIVE_AUTHORIZED.

## Exit gate
All tests pass using fake execution only. No credentials or real provider transport are added to the scheduled path.

## DF004-E2A is certified.

Mercury    114/114 PASS
Atlas       15/15 PASS
Sentinel     7/7 PASS


Forge       PASS
Site        PASS
Console     CLEAN


DF004-E2A   CERTIFIED
