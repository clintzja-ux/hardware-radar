# ADR-035 — Manual LIVE Is Plan-Bound, Single-Use, and Explicitly Confirmed

DF004-E2B introduces a two-step manual LIVE workflow. PREPARE performs no provider call and exports one pending request bound to the exact acquisition plan. EXECUTE requires the exact request ID plus the literal confirmation `SPEND-0.001`, loads DataForSEO credentials only after those checks, and permits one PRODUCTS task with a $0.001 ceiling and zero automatic paid retries.

Authorization consumption is durable and occurs before paid execution. Therefore a provider failure cannot make the same authorization replayable. The Windows unattended scheduler remains DRY_RUN-only and is not modified by E2B.
