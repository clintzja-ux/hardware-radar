# IC-MERCURY-ACTIVATION-005D — Governed Product Info Result Retrieval Composition

Status: implemented and fixture-certified
Owner: Mercury Product Info result retrieval and validation composition
Provider spend authority: none

## Boundary

The production command requires an explicit `--task-id`; it never defaults to the latest task, an environment value, or the former hard-coded historical task. Before credentials are loaded or a provider GET occurs, Mercury requires exactly one `PRODUCT_INFO` task-ledger record and validates the existing task → execution → consumed authorization → proposal → source PRODUCTS lineage through `validateProductInfoRetrievalLineage`.

The proposal additionally binds the durable provider-equivalence assessment, manual selection decision, exact selected `dataDocId` / `productId` / `gid`, Atlas product, source-rights digest, provider, location, and language. Unknown tasks, wrong operations, missing or conflicting execution/consumption state, proposal drift, or selection drift fail closed before retrieval.

## Retrieval and result governance

The network boundary permits one GET for the explicit Product Info task and uses Node system CAs with certificate validation enabled. It cannot post tasks, create paid authorization, retry automatically, retrieve Sellers, or retrieve an unrelated task. Result retrieval has no additional provider-task cost.

Truthful outcomes include `PROVIDER_PENDING`, `NO_RESULT`, `RESULT_RECEIVED`, and fail-closed malformed, binding, provider, or identity errors. A received result must preserve the exact task identity and every jointly populated selected provider identifier. The existing Product Info/Atlas validator remains the sole owner of identity compatibility and contradiction checks.

## Persistence and replay

`FileProductInfoResultRepository` stores immutable, task-keyed result records in the Mercury operator state. Each record binds task, execution, authorization, proposal, selection, Atlas product, provider identity, safe projected evidence, validation, retrieval time, and a deterministic material digest. Exact replay returns the original record without duplication; changed material for the same task fails with `PRODUCT_INFO_RESULT_REPLAY_CONFLICT`.

A validated result may derive `READY_FOR_SELLERS` using the existing Product Info result governance. This is readiness only: no Sellers proposal, authorization, execution, or retrieval is created. The result grants no retention, historical, canonical, review, publication, Current Price, Cheapest, or Pick authority.

## Operator command

```text
npm run acquisition:enrichment:result:retrieve -- --task-id=<PRODUCT_INFO_TASK_ID>
```

The command performs no task post and adds `$0.000` spend. Any later Sellers action remains a separate operator-governed increment.
