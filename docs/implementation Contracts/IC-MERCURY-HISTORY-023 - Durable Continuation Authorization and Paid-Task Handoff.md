# IC-MERCURY-HISTORY-023 — Durable Continuation Authorization and Paid-Task Handoff

## Status

`MERCURY_HISTORY_PAID_TASK_HANDOFF_PARTIAL`.

HISTORY-023 fixture-certifies a typed durable continuation repository, deterministic paid-action intent, irreversible continuation consumption, one-task handoff, and ledger-first reconstruction. Production commands remain unavailable until the task-specific PRODUCTS/PRODUCT_INFO/SELLERS authorization records and ledgers persist the new paid-action intent as a first-class reconstructable field.

## Authorization owner and intent

`FileHistoricalBootstrapContinuationRepository` is the minimal Mercury owner because existing authorization repositories are domain-specific and cannot safely accept a new record shape. It stores immutable typed authorizations, an intent index, and irreversible consumptions; it stores no credentials or provider payload.

The deterministic `mer_histbootintent_*` binds artifact, checkpoint, checkpoint event sequence, Atlas product, product index, exact operation, and `DATAFORSEO_GOOGLE_SHOPPING`. The continuation additionally binds remaining cohort task/spend allowance, reviewed UTC-day spend, operator, reason, expiry, confirmation, `$0.001` task ceiling, policy, and authorization hash.

## Ordering and reconstruction

The safe order is: persist continuation; revalidate checkpoint, rights, and durable spend; consume continuation; invoke the existing task-specific authorized owner once; let its provider/execution ledgers persist provider truth; append the checkpoint task reference. Consumption is never reversed.

Reconstruction precedence is provider task/execution ledger, task-specific authorization, continuation, then checkpoint projection. A consumed continuation without paid lineage is `CONSUMED_WITHOUT_PAID_TASK` and requires review. A provider task or execution record without checkpoint event is `PAID_TASK_DURABLE_CHECKPOINT_RECONCILIATION_REQUIRED`. Two tasks for one intent are `PAID_ACTION_INTENT_CONFLICT`; spend/task disagreement also fails closed. No latest/first heuristic is permitted.

This is effective exactly-once paid-task intent, not a distributed atomicity claim. Exact continuation replay is idempotent; conflicting intent records fail. Double execution returns already consumed without a provider call. Expiry, cancellation, stale checkpoint sequence, wrong operation/product/source, changed rights, and changed spend all block before transport.

## Remaining production seam

The existing task-specific records do not yet persist `paidActionIntentId`. Until that field is propagated through task-specific PREPARE, authorization, `ControlledAcquisitionExecutor`, provider task ledger, and execution ledger, crash reconstruction cannot prove the complete chain without inference. Consequently `authorize-next`, `execute-next`, `retrieve`, `process`, `inspect`, and `cancel` production commands are not exposed by this partial increment. No run-all or automatic resume command is allowed.

Atlas continues to own canonical product knowledge. Mercury owns only orchestration, governed market evidence, and historical market knowledge. No current/public, recommendation, affiliate, or Rakuten authority is created.
