# IC-MERCURY-ACTIVATION-002D — Failed Provider Execution Diagnosis and Terminal Failure Reconciliation

Status: implemented and fixture-certified
Owner: Mercury controlled acquisition execution and portfolio checkpoint projection
Provider authority: none

## Boundary

MERCURY-ACTIVATION-002D preserves a structured, sanitized diagnostic on the existing acquisition execution ledger whenever an authorized provider execution returns `FAILED`. It does not create a second failure ledger or authorize retry. Diagnostics bind the failure stage and class, provider and operation, occurrence time, retryability, safe code/message, optional provider task identity, execution run, candidate, and actual governed spend. Secret-shaped material is redacted and messages are bounded.

Supported stages are `BEFORE_PROVIDER_REQUEST`, `DURING_PROVIDER_REQUEST`, `PROVIDER_REJECTED`, `AFTER_PROVIDER_RESPONSE_BEFORE_TASK_PERSISTENCE`, `LOCAL_PERSISTENCE_FAILURE`, and `UNKNOWN`. A missing provider task ID is valid. `FAILED` does not imply zero cost: actual spend remains owned by the execution ledger and may be nonzero when governed evidence establishes an incurred charge.

Exact execution-ledger replay is idempotent; conflicting material for an existing plan fails closed. Automatic paid retries remain zero. A failed single-use authorization remains consumed and can never be reopened.

## Checkpoint reconciliation

The existing checkpoint event stream now appends `TASK_FAILED` after `TASK_AUTHORIZED` when the controlled executor returns a bound failed run. The event preserves the authorization, run, optional provider task, diagnostic, and actual spend. Its deterministic identity makes exact replay idempotent, while a conflicting terminal fact for the same product/run fails closed. The checkpoint projects the product to terminal `FAILED`, not `PRODUCTS_AUTHORIZED` or automatically back to ready.

For a historical failed run that predates this behavior, `CheckpointFailedExecutionReconciliationService` derives the same immutable terminal event solely from the existing task and execution records. It never changes the original authorization, execution, or authorization event. The local command is:

```text
npm run mercury:portfolio:checkpoint:failure:reconcile -- --portfolio-cycle-id=<id> --atlas-product=<id> --authorization-id=<id> --confirm=RECONCILE-FAILED-EXECUTION
```

This command performs no provider request and creates no paid task. A retry is a later, independent operator decision requiring a fresh single-use authorization.

## Operator visibility

The existing checkpoint inspection command reports failed product, execution run, failure class, safe reason, optional provider task, and retryability. Checkpoint/program monetary capacity is derived from actual execution-ledger spend for both posted and failed bound runs.

