# IC-DATAFORSEO-EXISTING-TASK-SUPERVISION-SCHEDULING-AND-FORGE-OPERATIONS-P1

Status: fixture-certified; Windows activation deliberately not performed.

The generic scheduler discovers due supervision records from canonical bounded SQLite state. It accepts no configured run, product, task, source, or operation identity, honors durable `nextEligibleCheckAt`, and invokes the certified existing-task supervision owner under a global maximum of 50 checks. SQLite task leases and Windows `IgnoreNew` prevent overlap.

This boundary retrieves existing provider tasks only. It cannot prepare, authorize, create, replace, or retry paid work. Automatic paid retries, replacement tasks, and additional spend are zero. The 15-minute schedule is only a wake-up cadence; durable eligibility controls polling. Completed work is not rediscovered, product-local outcomes remain isolated, and systemic invocation failures fail closed.

Forge consumes a sanitized read-only projection containing scheduler configuration/enabled state, health, last invocation, checks, pending/due/review/terminal/not-found counts, oldest pending time, next due time, and systemic failure state. It grants no acquisition, Current, History, destination, publication, or release authority.

Repository command: `npm run mercury:existing-task-supervision:scheduled`.

Separate operator activation: `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\windows\install-mercury-existing-task-supervision-task.ps1`.

Status: `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\windows\get-mercury-existing-task-supervision-task.ps1`.

Enable/disable/remove use the corresponding repository-owned `enable-`, `disable-`, and `remove-mercury-existing-task-supervision-task.ps1` scripts.

Private logs remain under `.forge-review/acquisition/scheduler-logs/`. No ADR is required because existing supervision, persistence, lease, Forge, and scheduler ownership is unchanged.
