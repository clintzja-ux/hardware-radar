# ADR-016 — Review History Is Append-Only Derived Workflow State

## Status
Accepted by implementation candidate; final acceptance follows FM004 exit review.

## Context
FM003 introduced review decisions as workflow metadata separate from canonical Mercury observations. Publication requires an auditable review state, but replacing a single mutable `reviewStatus` field would destroy operational history and weaken traceability.

## Decision
Review decisions are immutable, append-only records stored separately from canonical observations. Each durable decision receives a Mercury-owned `mer_rev_*` identifier. The effective review state of an observation is derived from the latest successfully committed decision in that observation's ordered review history.

A later decision never edits or deletes an earlier decision. `REVIEWED`, `HOLD`, and `REJECTED` are review workflow states only; none authorizes publication.

## Consequences
- Complete review history is retained.
- Effective state is reproducible from durable evidence.
- Canonical observations remain immutable.
- Review identifiers are allocated atomically by the durable review repository.
- Decision persistence validates observation-reference integrity.
- Test-only observations cannot receive production review decisions.
- Publication remains a separate downstream decision.

 ## promoted to accepted