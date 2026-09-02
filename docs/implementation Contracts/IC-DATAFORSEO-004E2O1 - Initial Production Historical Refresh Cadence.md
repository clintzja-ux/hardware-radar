# IC-DATAFORSEO-004E2O.1 — Initial Production Historical Refresh Cadence

**Status:** Implemented
**Increment:** DF004-E2O.1

## Approved policy

Mercury persists the first operator-approved production historical-refresh cadence as the schema-validated policy `mer_histrefresh_cadence_ram_corsair_cmk32gx5m2b6000z30_v1`. It is enabled only for `ram_corsair_cmk32gx5m2b6000z30`, has `minimumIntervalMs=86400000`, no retailer restriction, and `automaticExecution=false`.

The 24-hour interval is an intentionally conservative acquisition cadence for initial production validation. It is not universal product policy and may change only through explicit policy review. It does not describe public price currency, staleness, publication expiration, canonical-evidence lifetime, or automatic execution.

## Storage and loading

The policy is Mercury-owned durable repository configuration under `historical-refresh/policies/`, not `.env`, `.forge-review`, or Forge. `HistoricalRefreshCadencePolicyRepository` validates the complete versioned representation before returning it. Unknown, malformed, or structurally altered policy state fails closed.

The existing due CLI loads this production policy deterministically when `--policy` is omitted. Callers may still supply an explicit policy file for isolated evaluation. No arbitrary fallback interval exists in evaluator code.

## Timing and governance

Cadence uses parsed `observationTime`. For `2026-08-24 00:07:42 +00:00`, the next eligible instant is `2026-08-25T00:07:42.000Z`. Evaluation is `NOT_DUE` before that instant and `DUE` at or after it. `admittedAt`, price, and E2K trend do not influence the result.

Elapsed time never overrides E2N governance. Incomplete, review-required, failed, or blocked cycles remain blocked. `NO_SELLER_OBSERVATIONS` receives the same configured cadence and no aggressive retry.

The six-hour scheduled dry-run wake frequency remains independent and unchanged. The scheduler remains structurally incapable of LIVE acquisition. Policy evaluation creates no plan, authorization, provider task, retrieval, admission, or spend.
