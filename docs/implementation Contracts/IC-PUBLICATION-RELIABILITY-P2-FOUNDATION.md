# Publication Reliability P2 foundation

**Status:** Local implementation, not production installed
**Owner:** Sentinel publication boundary
**Date:** 2026-11-19

## Purpose

This increment adds two reversible contracts to the existing publication lifecycle. It does not add an orchestrator, authority collection, acceptance ledger, operator command, provider call, or deployment mechanism.

## Read-only status projection

`projectPublicationReliabilityStatus` consumes the existing mandate, operation, recovery, and reconsideration evidence plus an explicitly supplied current code head. It reports the latest accepted data release, published checkpoint, current code head, active stage, latest recovery status, Jamaica-day accepted-release allowance, live-but-not-accepted state, and next safe operator action. Missing time or code-head evidence fails closed. The projection never writes canonical state.

The production `INSPECT` command supplies the installed runtime Git head and returns this projection alongside the established health view. Existing health fields remain compatible.

## No-change classification

The governed preparation owner evaluates the exact normalized generated-path delta after build and verification. An empty delta is accepted only when the Git comparison is explicitly complete. The result is `NO_MEANINGFUL_CHANGE`; the inner publication authorization remains unconsumed and the unattended coordinator records a terminal no-change event before Git checkpoint creation. It performs no push or deployment and consumes no accepted-release allowance.

Non-empty deltas continue through the existing allowlist, packaging, checkpoint-parent, fast-forward, deployment, verification, and acceptance controls. Missing, duplicated, malformed, or incomplete comparison evidence fails closed.

## Producer coverage

The delta contract is producer-neutral and covers Atlas-only, Mercury Current-only, Mercury History-only, and combined generated changes. It does not infer producer authority from paths. Atlas and Mercury continue to own their canonical inputs; Sentinel continues to own validation and publication gating.

## Recovery and compatibility

Existing pre-checkpoint, post-push, reconsideration, and observation-recovery records remain authoritative and immutable. A recovered acceptance participates in latest-release and daily-allowance projection exactly like ordinary `LIVE_ACCEPTED` evidence. Code-only mainline advancement is visible as a difference between code head and published checkpoint, not as an implicit data release.

## Architecture decision assessment

No ADR is required for this foundation: canonical ownership, authority, lifecycle, and persistence do not change. A later increment that replaces the publication coordinator, changes authoritative state transitions, or introduces a new producer ownership boundary requires ADR review before implementation.

## Validation

Production-shaped regression covers Atlas-only, Current-only, History-only, combined, no-change, code-only advancement, live-but-not-accepted, recovered acceptance, incomplete/conflicting evidence, and input immutability. Existing Atlas, Sentinel, Mercury, Forge, publication reliability, and Windows lifecycle suites remain required before checkpoint review.
