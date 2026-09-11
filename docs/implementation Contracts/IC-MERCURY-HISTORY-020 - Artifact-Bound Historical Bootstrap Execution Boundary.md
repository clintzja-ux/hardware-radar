# IC-MERCURY-HISTORY-020 — Artifact-Bound Historical Bootstrap Execution Boundary

## Status

Fixture-certified domain execution boundary. Production CLI composition remains unavailable until the existing task-specific PRODUCTS, optional PRODUCT_INFO, SELLERS retrieval/retention, and E2J owners are composed without bypassing their individual authorization records.

## Authority and binding

`HistoricalBootstrapExecutor` accepts only a HISTORY-019 artifact ID, an exact immutable artifact-bound authorization, the artifact-specific confirmation string, and an operator identity. Product IDs come exclusively from the validated artifact. Validation covers the ID/digest, policy, explicit `asOf`, DataForSEO source, three-product cohort, nine-task ceiling, `$0.009` ceiling, and zero-authority PREPARE state.

Authorization is distinct, explicit, expiring, single-use, operator-attributed, and bound to the artifact digest, limits, source, and `MERCURY-HISTORY-020-1.0`. It is consumed before the first provider operation. Replay, expiry, substitution, and conflict fail before provider invocation; interrupted or stopped execution cannot reuse it.

## Sequential execution

Products run in artifact order without concurrency. Each follows PRODUCTS, governed identity evaluation, conditional PRODUCT_INFO only for `ESCALATION_REQUIRED`, SELLERS, DF003 retention, HISTORY-018 comparability, E2J admission, and existing portfolio/Forge reconstruction. No next product starts until the prior product is `ADMITTED` or `DUPLICATE`. Any other terminal result stops Stage A.

Before each paid operation the boundary revalidates current DataForSEO acquisition and historical rights, UTC-day spend, cohort task/spend remainder, per-product ceiling, source, and task type. Limits are 3 tasks/product, 9 tasks/cohort, `$0.009` cohort spend, `$0.010` UTC-day spend, `$0.001` per task, and zero retries.

Terminal product states are `ADMITTED`, `DUPLICATE`, `BLOCKED_RIGHTS`, `BLOCKED_IDENTITY`, `BLOCKED_COMPARABILITY`, `PROVIDER_FAILED`, `RETENTION_FAILED`, `ADMISSION_FAILED`, or `BUDGET_BLOCKED`. Bundle, conditional, and unknown comparability cannot write history. Duplicate admission creates no second observation.

The boundary grants no Current Display, public projection, canonical, review, publication, Current Price, Cheapest, Pick, affiliate, or Rakuten authority. It creates no queue, scheduler, evidence repository, or historical repository.

## Production composition gap

No production EXECUTE command is exposed by this increment. Existing provider stages own separate durable proposals, authorizations, task records, retrieval, and retention lineage. Collapsing them without composing those owners would violate certified boundaries. A subsequent narrow increment must bind this cohort authorization to those existing single-task authorities before any real command becomes available.
