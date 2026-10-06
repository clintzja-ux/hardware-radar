# IC-DATAFORSEO-EXISTING-TASK-PENDING-SUPERVISION-P1

Status: fixture-certified implementation contract.

## Purpose and ownership

Mercury supervises already-created asynchronous provider tasks independently from paid task creation. It reuses the bounded-run repository, provider task ledger, execution ledger, canonical result owners, and source adapters. It creates no second task, scheduler, spend ledger, or authority system.

Paid task creation and existing-task retrieval are separate authority boundaries. Expiry of paid creation authority does not revoke retrieval of an already-purchased task. Supervision retrieves only the exact task already bound to a run member; it cannot create replacements, authorize paid work, or spend.

## Provider status contract

| Code | DataForSEO meaning | Classification |
| --- | --- | --- |
| 40601 | Task Handed | `RETRYABLE_PENDING` |
| 40602 | Task In Queue | `RETRYABLE_PENDING` |
| 40101 | Internal search-engine error | `PROVIDER_TERMINAL_FAILURE` |
| 40102 | No search results | `COMPLETED_NO_RESULTS` |
| 40103 | Task execution failed | `PROVIDER_TERMINAL_FAILURE` |
| 40105 | Task deleted | `PROVIDER_TERMINAL_FAILURE` |
| 40106 | Partial results | available only with result material; otherwise review |
| 40401 | Task not found | `TASK_NOT_FOUND` |
| 40403 | Results expired | `PROVIDER_TERMINAL_FAILURE` |
| other known request/auth/payment 4xxxx | `INVALID_REQUEST` |
| unknown | `OTHER_REVIEW_REQUIRED` |

`20000` with populated result material is available. `20000` with an empty result is ambiguous and requires review; it is neither silently pending nor fabricated as no-results.

Authoritative references: [DataForSEO errors](https://docs.dataforseo.com/v3/appendix/errors/), [Amazon Products Task GET](https://docs.dataforseo.com/v3/merchant/amazon/products/task_get/advanced/), [Amazon Products Task POST](https://docs.dataforseo.com/v3/merchant-amazon-products-task_post/), and [Amazon Tasks Ready](https://docs.dataforseo.com/v3/merchant-amazon-products-tasks_ready/).

DataForSEO documents result retrieval for 30 days. No authoritative maximum completion horizon or required polling cadence was found. Hardware Radar therefore certifies a conservative 15-minute check interval and six-hour operational-review threshold. Six hours is not provider terminality.

## Durable model

The existing bounded SQLite owner stores one record per exact task: run/member/source/operation binding, truthful `firstKnownAt`, optional prospective `providerCreatedAt`, supervision start, whether historical attempts are known, attempts since supervision, last attempt, normalized provider status/code/message, next eligible check, review reason, terminal reason, and a bounded lease.

States are `PENDING_PROVIDER`, `CHECK_DUE`, `WAITING_UNTIL_NEXT_CHECK`, `OPERATOR_REVIEW_REQUIRED`, `PROVIDER_TERMINAL_FAILURE`, `RESULT_AVAILABLE`, and `COMPLETED`.

Legacy tasks use `providerCreatedAt = null`, `historicalAttemptsKnown = false`, and a zero count explicitly scoped to attempts since supervision. No historical timestamp or attempt count is fabricated.

One invocation atomically leases at most its bounded requested number of due records, checks exact existing IDs, persists outcomes, and exits. Not-due, review, terminal, and completed records are not claimed. Restart reconstructs attempt history; overlapping invocations cannot claim the same live lease.

Forge exposes tracked, pending, due, review, terminal, attempt, last-check, next-check, and latest-status data through the existing read-only certified projection. No scheduler is activated by this contract.
