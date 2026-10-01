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

Safe recovery is never automatic. Explicit operator review may append a new expiring authorization bound to the consumed predecessor, failed execution, recovery assessment, reviewer, reason, current rights, and current spend. The predecessor remains immutable. The successor retains the same logical `paidActionIntentId`, so the canonical task ledger remains the exactly-once guard for the logical paid action, but receives a new deterministic execution `planId` bound to its recovery lineage. Logical paid-action identity, reviewed execution-attempt identity, and provider-task identity are separate. At most one active authorization may exist for an action, and execution remains a separate confirmed operation.

“Active” means currently executable authority, not merely an unexpired immutable record. A consumed authorization is not active even before its expiry, but its recovery eligibility remains a separate fail-closed assessment. Atomic successor persistence may exclude only consumed IDs proven to belong to the exact action lineage; every unconsumed, unexpired authorization continues to block a parallel successor.

## Consequences

- Absence from one repository never proves absence of a provider task.
- Ambiguous transport outcomes fail closed and cannot be blindly retried.
- Auditors can reconstruct the original authority, consumption, failure, recovery assessment, reviewed successor, and any later execution.
- The rule is reusable for controlled DataForSEO acquisition where equivalent durable evidence exists; it is not tied to Amazon, a product, an artifact, or a particular client method.
- Every additional recovery hop requires a new conclusive assessment and explicit review; neither a failed attempt nor a prior safe classification creates standing retry authority.
- Recovery creates no provider call, spend, evidence, history, Current Display, publication, or public-price authority.
