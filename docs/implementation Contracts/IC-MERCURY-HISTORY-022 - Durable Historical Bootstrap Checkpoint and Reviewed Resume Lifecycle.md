# IC-MERCURY-HISTORY-022 — Durable Historical Bootstrap Checkpoint and Reviewed Resume Lifecycle

## Status

`MERCURY_HISTORY_DURABLE_CHECKPOINT_PARTIAL`.

The append-only checkpoint model, deterministic projection, continuation binding, pending-result semantics, runtime rights/spend checks, cancellation, and replay/conflict rules are fixture-certified. Production operator commands remain unavailable because continuation authorizations are not yet durably persisted and consumed in one atomic lineage with the existing task-specific authorization/execution boundary.

## Checkpoint ownership

`FileHistoricalBootstrapCheckpointRepository` owns only immutable cohort orchestration events. It references, rather than copies, provider task IDs, task-specific authorization IDs, execution runs, result references/digests, evidence, and historical observations. The execution/spend ledger remains authoritative.

The checkpoint is permanently bound to HISTORY-019 artifact `mer_histbootstrap_71c280422c057da3b248a43b`, its digest, explicit `asOf`, three ordered products, DataForSEO source, nine-task and `$0.009` cohort limits, and `$0.010` UTC-day limit. Substitution and malformed event sequences fail closed.

## Lifecycle

The derived cohort states are `READY_FOR_PAID_TASK`, `WAITING_FOR_RESULT`, `RESULT_AVAILABLE`, `COHORT_COMPLETE`, `COHORT_STOPPED`, and `CANCELLED`. Product stages are `PRODUCTS`, conditional `PRODUCT_INFO`, `SELLERS`, local retention/comparability/admission, and `COMPLETE`.

After a task is created, its provider task, task-specific authorization, execution run, product/stage, ordinal, and spend are append-only. The only next provider action is zero-cost retrieval of that exact task. Pending results leave the checkpoint unchanged. Available results record only a safe reference and digest. Governed identity—not the checkpoint—selects SELLERS, PRODUCT_INFO escalation, or a stop.

`ADMITTED` and `DUPLICATE` alone permit the next product. Every other terminal local outcome stops the cohort. The next product still requires a fresh reviewed continuation; no paid operation begins automatically.

## Resume and crash semantics

Resume means reconstruct owner state, inspect it, issue one newly reviewed continuation for the single derived next paid action, and execute only that action. It never means run the remaining cohort.

Projection checks checkpoint events against provider execution, result, evidence, and history references. A recorded task is never recreated. If task creation reached the canonical task/execution ledger but the checkpoint write failed, reconstruction must find and reconcile that owner record before another task can be authorized. Two tasks claiming one product/stage, mismatched lineage, or unexplained history are conflicts—not repair opportunities.

This provides effective exactly-once paid-task intent only when the checkpoint transition and existing task-specific authorization/ledger are composed. It does not claim distributed exactly-once delivery.

## Remaining boundary

A follow-up must durably persist and consume continuation authorizations and bind that consumption atomically or reconstructably to the existing task-specific authorization and provider execution record. Until then, `AUTHORIZE-NEXT`, `EXECUTE-NEXT`, `RETRIEVE`, `PROCESS`, and `CANCEL` production commands are not exposed. No `RUN-ALL`, `RESUME-ALL`, or `EXECUTE-COHORT` command is permitted.

No Current Display, publication, Current Price, Cheapest, Picks, affiliate, public, or Rakuten authority is created.

## Atlas and Mercury knowledge ownership

**Atlas owns canonical product knowledge. Mercury owns governed market evidence and historical market knowledge about Atlas products.** Atlas remains authoritative for product identity, brand/manufacturer, model/MPN, family/category, specifications, capacity and module invariants, memory generation, form factor, compatibility attributes, and lifecycle/readiness.

Every exact Mercury historical series must anchor to an existing governed `AtlasProductId`. Provider product-like fields are identity or contradiction evidence only; they never overwrite Atlas. Evidence without a governed Atlas binding cannot enter exact-product history and cannot create either an Atlas product or a competing Mercury catalog identity. Later Atlas enrichment does not rewrite immutable Mercury evidence or history; any rebinding requires its existing explicit governance.

Mercury separately owns retained source evidence, admitted historical observations, separately governed canonical market observations, derived historical intelligence, and current-market claims. These layers do not imply one another. Mercury may derive ranges, movement, counts, retailer coverage, and other E2K historical knowledge, but recommendations and Picks remain Compass concerns. Future explanations may be rendered by Aurora and future APIs by Gateway, while Mercury remains the fact owner. Forge is an operator projection, not an alternate historical repository.
