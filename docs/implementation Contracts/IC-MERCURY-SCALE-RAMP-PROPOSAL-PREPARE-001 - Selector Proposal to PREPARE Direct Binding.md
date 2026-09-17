# IC-MERCURY-SCALE-RAMP-PROPOSAL-PREPARE-001 — Selector Proposal to PREPARE Direct Binding

Status: IMPLEMENTED / FIXTURE-CERTIFIED / PRODUCTION-SHAPED-CERTIFIED

## Ownership and scope

The existing deterministic scale-ramp selector owns immutable member selection. The existing Products identity-discovery PREPARE composition owns current readiness, rights, destination, conflict, preparation, and plan persistence. This increment connects those owners without introducing another selector, repository, workflow, authority, or policy owner.

The direct CLI input is `--selector-proposal-file=<review-only-proposal>`, mutually exclusive with legacy `--cohort-file`. The operator supplies only the proposal and discovery cycle. Source, operation, requested size, and exact product membership are derived from the validated proposal.

## Proposal contract

Only schema `1.0` `MERCURY_SCALE_RAMP_CANARY_REVIEW` artifacts in `REVIEW_ONLY` state are accepted. The proposal must have authority `NONE`, false PREPARE/execution authority, and zero calls, tasks, and spend. Policy `MERCURY_SCALE_RAMP_CANARY_SELECTION / 1.0`, stage binding, source/operation, requested size, candidate count/digest, unique selected members, and selected-member digest are required.

The selected-member digest is recomputed from the selector's canonical contract, so candidate-digest, selection, size, source, operation, stage, or selector-policy tampering fails closed. A separate canonical proposal digest covers immutable selection content and produces `mer_scaleproposal_<digest>`. Filesystem paths, formatting, property order, current readiness, spend, tasks, results, and authorization state do not define proposal identity.

## Plan binding and current revalidation

Direct plans record complete `selectionProvenance`: proposal ID/digest, stage policy/version, stage ID/digest, selector policy/version, candidate count/digest, selected-member digest, requested selector size, source/operation, and exact selected Atlas IDs. This complete object participates in the existing deterministic plan binding digest. Partial direct provenance fails closed.

PREPARE still processes every exact selected member through the existing domain adapter. Current Atlas lifecycle, reusable identity, rights, destination, conflict, and operation readiness can move a member to the existing blocked representation, but cannot remove it from requested selection, substitute another candidate, or rewrite the proposal. The resulting plan remains `NOT_AUTHORIZED` and `NOT_STARTED` and creates no call, task, run, spend, or downstream authority.

Legacy cohort-input plans remain readable and immutable as `LEGACY_COHORT_INPUT`; selector provenance is absent and is never inferred retroactively. Existing SQLite JSON payload persistence requires no schema migration. Direct plan restart, deterministic replay, and transaction/uniqueness behavior reuse the existing owner.

## INSPECT and operating model

INSPECT exposes input type, complete selector provenance, and exact membership equivalence alongside existing ready/blocked, task/spend envelope, authorization, and run state. The proposal ID and digest provide durable identity; a mutable path is neither authority nor integrity.

The certified operating chain is:

`stage → selector → immutable review proposal → direct PREPARE → current revalidation → provenance-bound plan → INSPECT → separate human paid authorization → explicit START`.

Human governance remains responsible for stage/slice-size policy, paid-envelope approval, START approval, exception review, and stage promotion.

## Certification

Fixtures cover strict schema/authority/digest validation, membership and source anti-substitution, current-readiness blocking without replacement, plan-digest binding, legacy readability, restart, replay, CLI exclusivity, zero authority, historical first-canary proposal/cohort equivalence, and deterministic 8/24/100/1,000-member mechanics. The historical first-canary plan and production state are not rewritten. Scale fixtures certify local mechanics only, not provider throughput.
