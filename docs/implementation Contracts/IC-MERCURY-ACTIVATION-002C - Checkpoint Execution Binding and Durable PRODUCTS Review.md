# IC-MERCURY-ACTIVATION-002C — Checkpoint Execution Binding and Durable PRODUCTS Review

Status: implemented and fixture-certified
Owner: Mercury acquisition orchestration
Provider spend authority: existing task-level executor only

## Boundary

MERCURY-ACTIVATION-002C adds an immutable `PRODUCTS_DISCOVERY` checkpoint beneath a certified acquisition portfolio. Its identity binds the portfolio cycle and digest, ordered PRODUCTS-first products and exact queries, source-rights digest, `$0.001` task ceiling, `$0.009` checkpoint ceiling, `$0.010` UTC-day ceiling, and `$0.029` program ceiling.

The checkpoint does not authorize provider spend. Each product still requires the existing acquisition plan, pending manual authorization request, exact `SPEND-0.001` confirmation, single-use authorization, controlled executor, provider-task ledger, execution ledger, and current-day spend revalidation. Detached, substituted, drifted, wrong-stage, wrong-product, or over-budget task bindings fail closed before delegation.

Checkpoint and program spend are projections over the existing execution ledger joined to append-only checkpoint/portfolio task-posted events. No second monetary ledger exists. The original portfolio PREPARE artifact remains immutable.

## Durable state

Operator-local state is stored beneath:

```text
.forge-review/mercury/acquisition-portfolios/<portfolio>/checkpoints/<checkpoint>/
```

It contains an immutable checkpoint, one immutable PREPARE per Atlas product, append-only progress events, and one immutable PRODUCTS review per product/provider-task pair. Exact replay is idempotent; conflicting event, task, or review material fails closed. The legacy singleton authorization export remains a compatibility projection only and cannot overwrite canonical per-product review history.

Governed PRODUCTS identity assessment remains owned by the existing resolver. The checkpoint records its outcome and projects matched results to `READY_FOR_PRODUCT_INFO`, ambiguous or contradicted results to review-required, no-result to terminal no-result, and provider-pending to pending. It never posts PRODUCT_INFO or SELLERS and creates no downstream Mercury or public authority.

## Operator commands

```text
npm run mercury:portfolio:checkpoint:inspect -- --portfolio-cycle-id=<id> --as-of=<ISO timestamp>
npm run mercury:portfolio:checkpoint:next-task:prepare -- --portfolio-cycle-id=<id> --as-of=<ISO timestamp>
npm run mercury:portfolio:products:reviews -- --portfolio-cycle-id=<id>
```

These commands inspect or prepare exactly one next task. There is no batch executor.
