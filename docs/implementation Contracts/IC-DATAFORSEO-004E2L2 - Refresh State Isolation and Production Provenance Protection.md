# IC-DATAFORSEO-004E2L.2 — Refresh State Isolation and Production Provenance Protection

**Status:** Implemented  
**Increment:** DF004-E2L.2

## State isolation

Production operator commands retain the documented defaults:

- `.forge-review/acquisition/historical-refresh-plan.json`
- `.forge-review/acquisition/historical-refresh-authorization-request.json`

Mercury's test runner sets `HARDWARE_RADAR_TEST_MODE=1`. In that mode, refresh CLI tests must supply explicit fixture repository and output paths, and writes to either production refresh path are rejected before repositories are loaded or files are written. Standalone fixture commands may select the same protection with `--fixture-mode=true`.

The E2L fixture overwrite was caused by the historical-refresh accumulation CLI test supplying temporary evidence, history, decisions, authorization, and execution ledger but omitting its output path. After the E2L.1 CLI began persisting the prepared plan, the default production path received the fixture plan. The test now supplies an explicit temporary `--plan-state`.

## Current-source validation

Authorization PREPARE does not trust a stored plan by itself. It reloads current Atlas product and retailer records, retained evidence, historical observations, identity decisions/remediations, the governed prior SELLERS authorization, and execution ledger. It deterministically regenerates the E2L plan and requires both the `refreshPlanId` and full authorization digest to match before constructing a pending authorization.

Consequently missing or stale observation/evidence references, provider-task mismatch, observation/evidence mismatch, product or retailer substitution, provider-identity drift, non-latest applicable history, and identity no longer projecting VERIFIED/REGISTERED fail closed. A newly created authorization records `currentSourceValidated: true`; older requests lacking this proof cannot pass execution binding.

## Determinism and recovery

`refreshPlanId` is SHA-256-derived from the Atlas product ID, stable provider identity (`productId`, `dataDocId`, `gid`), previous observation ID, previous retained-evidence ID, previous SELLERS provider-task ID, product review decision ID, and merchant review decision ID. Wall-clock processing and admission times are excluded. The full authorization digest additionally binds operation, identity projection, minimum safe path, previous observation time, and spend policy.

The contaminated plan and authorization are audit evidence and are not repaired, consumed, or executed. Recovery means explicitly regenerating the plan from certified production source state and then creating a fresh authorization. Both recovery steps are zero-network; paid execution remains a separate explicit command after review.
