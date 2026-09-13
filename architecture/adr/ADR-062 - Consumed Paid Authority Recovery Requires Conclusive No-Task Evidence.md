# ADR-062 — Consumed Paid Authority Recovery Requires Conclusive No-Task Evidence

**Status:** Accepted
**Date:** 2026-09-12

## Context

A controlled paid-action authorization can be consumed before a local execution defect prevents provider-task creation. Reusing that authorization would violate single-use audit semantics, while permanently blocking all successors would make conclusive zero-task failures operationally unrecoverable. Transport failures are not equivalent: after a timeout or connection loss, the provider may have accepted the request even when no local task ID was recorded.

## Decision

Mercury classifies recovery from consumed paid authority using all durable authorization, consumption, execution, provider-task, intent, and spend evidence.

- `SAFE_NO_PROVIDER_TASK` requires conclusive proof that no request capable of creating a task left the process, or an explicit provider rejection that certifies no task creation, plus zero spend and no conflicting task lineage.
- `PROVIDER_TASK_STATUS_UNKNOWN` covers every ambiguous delivery outcome or nonzero spend without authoritative task lineage and requires reconciliation rather than retry.
- `PROVIDER_TASK_CREATED` applies when any durable provider task or provider task ID exists; the existing task must be retrieved or reconciled.

Safe recovery is never automatic. Explicit operator review may append a new expiring authorization bound to the consumed predecessor, failed execution, recovery assessment, reviewer, reason, current rights, and current spend. The predecessor remains immutable. The successor retains the same logical `paidActionIntentId`, so the canonical task ledger remains the exactly-once guard for the logical paid action. At most one active authorization may exist for an action, and execution remains a separate confirmed operation.

## Consequences

- Absence from one repository never proves absence of a provider task.
- Ambiguous transport outcomes fail closed and cannot be blindly retried.
- Auditors can reconstruct the original authority, consumption, failure, recovery assessment, reviewed successor, and any later execution.
- The rule is reusable for controlled DataForSEO acquisition where equivalent durable evidence exists; it is not tied to Amazon, a product, an artifact, or a particular client method.
- Recovery creates no provider call, spend, evidence, history, Current Display, publication, or public-price authority.
