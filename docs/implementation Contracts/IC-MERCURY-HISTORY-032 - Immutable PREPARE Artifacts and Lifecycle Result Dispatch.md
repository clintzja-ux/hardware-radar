# IC-MERCURY-HISTORY-032 — Immutable PREPARE Artifacts and Lifecycle Result Dispatch

## Status

`MERCURY_HISTORY_ARTIFACT_RESOLUTION_CERTIFIED`.

## Boundary

Stage-A bootstrap PREPARE records are canonical only after they are written to `FileDataForSeoPrepareArtifactRepository`. The repository is append-only, addressable by immutable `mer_prepare_*` identity, and indexed by the continuation's `paidActionIntentId`. Each record binds operation, DataForSEO source, Atlas product, cohort position, checkpoint and preparation artifact, originating checkpoint sequence, operation-specific proposal/request, exact authorization-request reference, policy version, preparation time, and a content digest.

Ordinary operator PREPARE files remain compatible convenience outputs. They are not bootstrap reconstruction authority. Exact replay returns the stored artifact; a different record claiming the same artifact or paid-action intent fails with `PREPARE_ARTIFACT_CONFLICT`. Missing, altered, stale, or mismatched records fail closed.

## Resolve before consume

`HistoricalBootstrapPreparedActionResolver` resolves the checkpoint's exact artifact ID and authorization request and proves agreement with the current checkpoint projection and durable continuation. Bootstrap handoff resolves this state before continuation consumption, rights/spend evaluation remains runtime-owned, and the task owner receives the canonical authorization request rather than reconstructed inputs. A resolution failure consumes no continuation and creates no provider task.

## Result dispatch

The source-neutral `MERCURY-HISTORY-032-1.0` result reference contains only operation, provider task, canonical operation-specific result ID, digest, provider status, paid-action intent when available, and recording time. It does not copy provider payloads. `HistoricalBootstrapResultDispatcher` validates that reference against the exact checkpoint task/result lineage, selects an injected existing progression owner by operation, and appends only the resulting lifecycle status and canonical next-stage reference. It performs no scoring, identity interpretation, DF003 reinterpretation, historical admission, next PREPARE, or provider call.

PRODUCTS and PRODUCT_INFO progression therefore remain owned by their certified identity owners. SELLERS local processing remains owned by the existing DF003 and historical-finalization owners. Any next-stage proposal or retained-evidence reference is returned by those owners and merely referenced by the checkpoint.

## Recovery and safety

- Artifact present without `PREPARE_BOUND`: explicit reconciliation may bind it only through a unique exact intent; no newest-file selection is permitted.
- `PREPARE_BOUND` present: exact ID/digest resolution is required.
- Canonical result present without result event: explicit exact task/result reconciliation is permitted; no paid retry.
- Existing retained evidence or historical observation remains authoritative under its existing replay rules.
- No production lifecycle command is exposed by this increment.
- No Current Display, Current Price, Cheapest, Pick, review, publication, affiliate, Atlas, rights-policy, or acquisition-policy authority is added.

## Certification

Fixtures cover independent artifacts across three products, PRODUCTS/PRODUCT_INFO/SELLERS escalation artifacts, exact resolution, replay and conflict, missing/digest/stale failures, result dispatch for all three operations, wrong task lineage, compact checkpoint references, ordinary PREPARE compatibility, and zero provider/spend behavior.

This increment made no live provider call, created no paid task, mutated no production data, and spent `$0.000`.
