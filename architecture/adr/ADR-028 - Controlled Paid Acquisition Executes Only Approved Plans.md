# ADR-028 — Controlled Paid Acquisition Executes Only Approved Plans

## Status
Accepted — DF004-B

## Decision
Paid acquisition execution is separated from planning. The executor accepts only an approved DF004-A plan, runs under the Mercury single-writer lock, executes only tasks embedded in that plan, performs no automatic paid retries, accounts for provider-reported actual cost, and writes an immutable execution ledger.

A plan is permission bounded by its task count, per-run spend ceiling, and daily spend ceiling. Before each paid task the executor verifies that the task's planned cost still fits the remaining envelope. After each provider response it records actual reported cost and stops remaining work if actual spend has exhausted or exceeded a hard ceiling.

Provider cost can exceed an estimate on the paid operation that has already occurred. No software guard can retroactively prevent that provider charge. The executor therefore records the overrun and prevents subsequent paid work.

The same plan may not be executed twice. Duplicate-plan protection is checked and recorded while holding the DF003-E single-writer lock.

## Consequences
- Planning itself remains non-spending.
- Paid retries remain zero.
- Failed provider operations may still carry non-zero actual cost.
- Execution history is auditable and can later feed Forge/Beacon and daily budget accounting.
- Live DataForSEO transport integration remains out of scope for DF004-B.
