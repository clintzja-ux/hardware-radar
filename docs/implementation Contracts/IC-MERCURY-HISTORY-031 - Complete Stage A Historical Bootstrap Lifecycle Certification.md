# IC-MERCURY-HISTORY-031 — Complete Stage A Historical Bootstrap Lifecycle Certification

## Status

`MERCURY_HISTORY_STAGE_A_PARTIAL`.

## Certification result

HISTORY-030 closed script ownership of zero-spend task preparation and added compact `PREPARE_BOUND` checkpoint references. It did not yet make the referenced task artifacts resolvable by the paid-task handoff or align the operation-specific retrieval and processing interfaces with `HistoricalBootstrapLifecycleService`. A complete production lifecycle factory therefore cannot be composed from the current certified owners without adding unowned interpretation.

The production command set remains unavailable. Real Stage A INIT and INSPECT were not run.

## Exact composition gaps

### PREPARE artifact resolution and execution

`HistoricalBootstrapPaidTaskHandoff.execute()` passes intent, operation, product, index, PREPARE artifact ID, and authorization-request ID to its task-specific owner. `createProductionDataForSeoTaskOwner().execute()` accepts `{ request, authorizedAt }` and requires the complete canonical operation-specific authorization request. No certified owner currently resolves a checkpoint's compact PREPARE reference to that request and validates its digest, product, operation, intent, continuation, and checkpoint sequence before execution.

The ordinary PREPARE owners write operation-specific mutable “latest” files. A later product or stage may replace those files. They are not an immutable repository addressable by the checkpoint's artifact/request IDs, so crash recovery and multi-product reconstruction cannot safely rely on them. Choosing the current file or newest record would be heuristic and fail-open.

Continuation consumption also occurs before the downstream task owner is invoked. Until exact PREPARE resolution and task-authorization validation occur before irreversible continuation consumption, a local validation failure can strand an otherwise unused continuation.

### Retrieval and identity dispatch

`HistoricalBootstrapLifecycleService` expects one generic retrieval owner returning lifecycle `status`, `resultReference`, and `resultDigest`. HISTORY-027 exposes operation-specific retrieval owners with provider-native outcomes. No certified result-reference repository/adapter currently persists and resolves those outcomes for the lifecycle checkpoint.

The lifecycle likewise expects one identity owner accepting checkpoint/projection inputs. HISTORY-028 exposes distinct PRODUCTS and PRODUCT_INFO owners with different required inputs. PRODUCTS processing returns preparation/routing material but no certified lifecycle owner persists the exact PRODUCT_INFO or direct SELLERS proposal artifact required by the next HISTORY-030 PREPARE owner. SELLERS DF003 processing and historical finalization also have distinct inputs and outputs that are not yet bound by a reusable lifecycle dispatcher.

## Required next bounded increment

Extract a reusable append-only task-PREPARE artifact repository and a trusted lifecycle adapter layer that:

1. persists immutable proposal/request records by canonical ID and binding digest while retaining ordinary latest-file compatibility;
2. resolves and validates the exact checkpoint PREPARE reference before continuation consumption;
3. delegates the resolved request to `createProductionDataForSeoTaskOwner` without reconstructing it;
4. persists operation-specific zero-cost result references and dispatches HISTORY-027 retrieval owners;
5. dispatches HISTORY-028 PRODUCTS/PRODUCT_INFO progression and durably records the resulting next-stage proposal;
6. composes SELLERS DF003 processing and historical finalization without reinterpreting their outputs.

Only after those boundaries are fixture-certified can the production lifecycle factory, eight thin commands, crash/race matrix, and full Stage A end-to-end certification be completed.

## Preserved state machine and safety

The intended state sequence remains continuation authorization → explicit PREPARE → `PREPARE_BOUND` → task-specific authorization/execution → waiting/result/process. Execution without the exact PREPARE remains blocked. Rights and spend remain runtime checks, not PREPARE authority. Task and spend ceilings remain `$0.001` per task, three tasks per product, nine tasks and `$0.009` per cohort, `$0.010` per UTC day, and zero automatic paid retries.

Atlas remains canonical product owner; Mercury remains acquisition-evidence and historical-market owner. No Current Display, Current Price, Cheapest, Pick, review, publication, affiliate, or Rakuten authority is present. This inspection created no provider task, retrieval, production mutation, or spend.
