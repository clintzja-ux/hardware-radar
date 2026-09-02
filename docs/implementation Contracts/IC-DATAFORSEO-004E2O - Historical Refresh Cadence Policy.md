# IC-DATAFORSEO-004E2O — Historical Refresh Cadence Policy

**Status:** Implemented
**Increment:** DF004-E2O

## Boundary

E2N determines which structural action comes next. E2O independently determines whether policy permits a new normal historical-refresh cycle yet. Due status is read-only scheduling policy, never acquisition or execution authority. It cannot prepare a refresh or authorization, consume authorization, execute or retrieve SELLERS, retain evidence, admit history, or publish.

The existing six-hour unattended dry-run schedule is scheduler wake frequency, not historical market-refresh cadence. E2O initially shipped without an approved production interval, so policy omission at the service boundary returns `POLICY_NOT_CONFIGURED`. DF004-E2O.1 subsequently supplies the first explicit product-scoped production policy through the repository loader; no interval is embedded in evaluator logic.

## Policy and due semantics

An explicit versioned policy contains its ID, enabled flag, positive `minimumIntervalMs`, Atlas-product scope, optional retailer scope, rationale/metadata, and the invariant `automaticExecution=false`. A disabled policy needs no interval. Enabled policies fail closed without a valid interval or matching product scope.

Cadence uses the latest immutable `observationTime`, never `admittedAt`. The next eligible instant is `observationTime + minimumIntervalMs`. Evaluation is `NOT_DUE` before that instant and `DUE` at or after it. All calculations require explicit `asOf`; timestamps are parsed as instants rather than compared lexically, preserving both existing UTC serialization forms.

Only structurally terminal `COMPLETE` and `NO_SELLER_OBSERVATIONS` cycles may be cadence-evaluated. Incomplete, expired-authorization, failed, review-required, or blocked cycles remain blocked and cannot become permission for overlap or retry merely because time elapsed. `NO_SELLER_OBSERVATIONS` receives no special aggressive interval.

Trend, price, cost, and retailer do not adapt cadence unless retailer scope is explicitly configured. Cost is operator context only: SELLERS remains capped at `$0.001`, and no spend is authorized.

## Operations

The local read-only command is:

`npm run acquisition:history-refresh:due -- --atlas-product=<ATLAS_PRODUCT_ID> --as-of=<ISO_TIMESTAMP> [--policy=<POLICY_FILE>]`

The CLI loads the operator-approved repository policy by default after E2O.1; `--policy` remains available for explicit isolated policy input. The service still reports `POLICY_NOT_CONFIGURED` when no policy is supplied. The scheduler remains structurally dry, public freshness/current-price semantics are not created, and actual spend is `$0.000`.
