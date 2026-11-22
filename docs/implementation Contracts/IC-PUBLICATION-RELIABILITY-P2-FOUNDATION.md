# Publication Reliability P2 foundation

**Status:** `PRODUCTION_INSTALLED_AND_VERIFIED`
**Owner:** Sentinel publication boundary
**Date:** 2026-11-22

## Purpose

This increment adds two reversible contracts to the existing publication lifecycle. It does not add an orchestrator, authority collection, acceptance ledger, operator command, provider call, or deployment mechanism.

## Read-only status projection

`projectPublicationReliabilityStatus` consumes one explicitly selected existing mandate, operation, recovery, and reconsideration evidence plus an explicitly supplied current code head. It reports that exact mandate's identity, status, validity interval, and current validity separately from the Jamaica-day accepted-release allowance, as well as the latest accepted data release, published checkpoint, current code head, active stage, latest recovery status, live-but-not-accepted state, and next safe operator action. Missing time, code-head, mandate, or exact repository-mandate evidence fails closed. The projection never writes canonical state.

The production `INSPECT` command requires `--mandate-id=<exact canonical mandate ID>`, supplies the installed runtime Git head, and returns this projection alongside the established health view. The health view and unified projection must name the same mandate and report the same status and validity interval. Missing or unknown mandate IDs fail closed; inspection never selects another historical mandate implicitly. Existing health fields remain compatible and add the selected mandate identity, validity start, and current-validity result.

## Production verification

PR #11 is integrated and the clean P2 executable runtime is installed at `b135380da18c2d0cff510c7e8596f7d8e48707ed`. Read-only production inspection against the canonical authority repository selected successor mandate `pubmandate_4cda9ead192f66240f223b38` in both health and `publicationStatus`, reported status `ENABLED`, validity `2026-11-19T01:31:24.948Z` through `2026-12-19T01:31:24.948Z`, and `currentlyValid: true` at the November 20 inspection. The projection retained accepted release `pubrel_a593d8a1d869597c25075e84`, recovery receipt `pubobsrecovery_a2f23448aff6528e2e6ddaaa`, and published checkpoint `77ed7d7e6ee7b3c420e20c51e27c169a1420f614`; it reported the installed code head separately, no active publication, and no live-but-unaccepted release.

The Jamaica-day allowance is a time-dependent projection, not a property of mandate validity. The verified inspection calculated local day `2026-11-20`, maximum 1, consumed 0, and remaining 1. Every later operator decision must inspect again for its actual Jamaica calendar day. The disposable three-root rehearsal independently returned `NO_MEANINGFUL_CHANGE` with a complete empty generated-path inventory and no production mutation.

## No-change classification

The governed preparation owner evaluates the exact normalized generated-path delta after build and verification. An empty delta is accepted only when the Git comparison is explicitly complete. The result is `NO_MEANINGFUL_CHANGE`; the inner publication authorization remains unconsumed and the unattended coordinator records a terminal no-change event before Git checkpoint creation. It performs no push or deployment and consumes no accepted-release allowance.

Non-empty deltas continue through the existing allowlist, packaging, checkpoint-parent, fast-forward, deployment, verification, and acceptance controls. Missing, duplicated, malformed, or incomplete comparison evidence fails closed.

## Producer coverage

The delta contract is producer-neutral and covers Atlas-only, Mercury Current-only, Mercury History-only, and combined generated changes. It does not infer producer authority from paths. Atlas and Mercury continue to own their canonical inputs; Sentinel continues to own validation and publication gating.

Unified producer contracts and dependency-aware artifact planning remain the next engineering milestone. This foundation does not implement that future producer unification.

### Production-verified two-producer dependency shadow

The shadow remains production installed and verified in executable runtime commit `408e0b66af8d7474a33eb8f5c3f1d2165f7adce1`. It adds a pure, non-authoritative RAM impact plan for canonical Atlas specification inputs (`ATLAS_SPECIFICATION`) and qualified Mercury Current inputs (`MERCURY_CURRENT`). It requires exact canonical input identities and SHA-256 digests from the candidate and accepted-predecessor portfolios, derives affected product IDs and artifact paths, and compares the prediction with the existing complete normalized generated-path inventory. Missing identity/digest/comparison evidence becomes a deterministic diagnostic. Unexpected and missing dependent paths are reported separately. Replaying the same inputs and changed-path set produces the same plan and comparison digests.

The existing `GovernedLivePricePublicationCoordinator` owns the hook: inspection occurs immediately before its unchanged build and verification runners, and comparison occurs after its existing path inventory is available. The result is returned in existing preparation evidence and recorded in the existing no-change or checkpoint event. Shadow evidence is explicitly excluded from checkpoint identity. Diagnostics are non-authoritative, observer failure cannot independently block publication, and the shadow does not alter validation, eligibility, the authoritative P2 no-change classification, acceptance, authority consumption, recovery, or operator commands. The unchanged full generator remains authoritative.

The Atlas rehearsal changed one synthetic specification value and modification time in a disposable checkout. The existing full generator changed exactly the mirrored Atlas record, RAM catalog, corresponding product page, and sitemap. The Current rehearsal used the existing qualified Current fixture path and production generator functions in an isolated preview root. Its core changes were Current JSON, Terminal JSON/page, and the affected product page; sitemap remained byte-identical because the offer timestamp did not advance the route's maximum authoritative `lastmod`. Three market-snapshot/development-preview artifacts were correctly identified as preview-only output outside the core plan.

Mercury History and destination-only planning are intentionally unsupported and appear as diagnostics if their bound input digests change. Selective generation remains unimplemented. There is no producer registry, stateful producer service, persistent dependency database, or enforcement gate. Production verification used read-only `INSPECT`, focused production-shaped matrices, and an isolated three-root rehearsal; no real governed publication has yet produced operational shadow observations.

### Shared RAM dependency calculation

The shared-calculation refinement is production installed and verified in executable runtime commit `408e0b66af8d7474a33eb8f5c3f1d2165f7adce1`. `calculateRamProductLastmod` is the single pure owner for selecting the maximum calendar date from Atlas specification modification evidence, qualified Current offer observation evidence, and History chronology evidence. The public generator uses that result without changing sitemap formatting, and the shadow uses the same result when deciding whether a sitemap dependency should be claimed. Missing optional evidence retains the generator's established behavior; absence of all valid evidence fails closed.

Minimal RAM artifact declarations and product-scoped path expansion are colocated with that calculation so the generator and shadow can share dependency vocabulary without a registry or producer framework. The full public generator remains the authoritative byte producer; Sentinel validation and certification, the P2 Foundation no-change classifier, Git checkpoint and accepted-release identities, and existing recovery owners remain authoritative and unchanged. Shadow diagnostics remain non-blocking and excluded from checkpoint identity. Production verification covered Atlas-, Current-, and History-newest dates, equal and same-day dates, missing and invalid evidence, stale Current, Atlas-only, Current-only, combined, exact no-change, and deterministic replay. The disposable three-root rehearsal returned `NO_MEANINGFUL_CHANGE` with zero generated paths and no protected-state mutation. History and destination changes remain unsupported planning inputs, selective generation remains unimplemented, and publication eligibility, freshness policy, and dependency enforcement remain unchanged.

## Recovery and compatibility

Existing pre-checkpoint, post-push, reconsideration, and observation-recovery records remain authoritative and immutable. A recovered acceptance participates in latest-release and daily-allowance projection exactly like ordinary `LIVE_ACCEPTED` evidence. Code-only mainline advancement is visible as a difference between code head and published checkpoint, not as an implicit data release.

## Architecture decision assessment

No ADR is required for this foundation or the shared-calculation maintenance increment: canonical ownership, authority, lifecycle, and persistence do not change. EDR-028 remains the applicable engineering decision and records the observation-first parity strategy. A later increment that replaces the publication coordinator, changes authoritative state transitions, or introduces a new producer ownership boundary requires ADR review before implementation.

## Validation

Production-shaped regression covers Atlas-only, Current-only, History-only, combined, no-change, code-only advancement, live-but-not-accepted, recovered acceptance, incomplete/conflicting evidence, and input immutability. Existing Atlas, Sentinel, Mercury, Forge, publication reliability, and Windows lifecycle suites remain required before checkpoint review.
