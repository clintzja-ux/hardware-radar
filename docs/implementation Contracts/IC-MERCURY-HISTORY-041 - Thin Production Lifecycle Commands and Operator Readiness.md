# IC-MERCURY-HISTORY-041 — Thin Production Lifecycle Commands and Operator Readiness

## Status

`MERCURY_HISTORY_OPERATOR_COMMANDS_CERTIFIED`.

## Boundary

H041 exposes the H039/H040 production lifecycle through eight thin, one-action operator commands. The shared command composition instantiates the already-certified artifact, checkpoint, continuation, immutable PREPARE, task/execution, canonical provider-result, retrieval, progression, DF003, historical-admission, rights, and spend owners. It translates owner return shapes only; it owns no policy and creates no repository, queue, workflow engine, authorization model, or automatic progression.

The command surface is exactly:

- `mercury:history:bootstrap:init`
- `mercury:history:bootstrap:inspect`
- `mercury:history:bootstrap:authorize-next`
- `mercury:history:bootstrap:prepare-next`
- `mercury:history:bootstrap:execute-next`
- `mercury:history:bootstrap:retrieve`
- `mercury:history:bootstrap:process`
- `mercury:history:bootstrap:cancel`

There is no run-all, resume-all, cohort executor, background loop, or automatic next action. Each invocation performs at most its named lifecycle transition. INIT, INSPECT, AUTHORIZE-NEXT, PREPARE-NEXT, PROCESS, and CANCEL do not call a provider or spend money. EXECUTE-NEXT may post at most one independently authorized paid task. RETRIEVE may retrieve only the exact task derived from checkpoint lineage and creates no new paid task.

## Strict operator input

The commands accept only their documented checkpoint, artifact, operator attribution, reason, confirmation, authorization, and optional authorization-TTL values. They reject product, operation, source, provider-task, provider-result, proposal, paid-action-intent, price, budget, repository, raw PREPARE, and other trust-boundary overrides. Products, operations, rights, caps, task identity, immutable PREPARE artifacts, and result lineage are resolved from durable owner state.

Output is structured operator-safe JSON. Provider payloads and credential-like fields are not an output surface. Errors return a non-zero exit code and a stable machine-readable owner/command error. EXECUTE-NEXT and RETRIEVE use the existing system-CA and local credential-loading convention; the other commands do not require provider credentials.

## Lifecycle and authority

- INIT binds one eligible schema-1.1 historical-bootstrap artifact and creates one deterministic checkpoint.
- INSPECT is read-only and reports the next permitted action, caps, spend, rights, and downstream authority as owned by the lifecycle projection.
- AUTHORIZE-NEXT creates one expiring continuation for the state-derived next operation.
- PREPARE-NEXT resolves that continuation and persists the exact immutable H032 PREPARE artifact before appending `PREPARE_BOUND`.
- EXECUTE-NEXT re-resolves that artifact, revalidates rights and spend, consumes the continuation once, and delegates at most one task to the existing operation-specific owner.
- RETRIEVE resolves the exact checkpoint task and persists its immutable H034 canonical provider result when available.
- PROCESS dispatches that result to the existing PRODUCTS, PRODUCT_INFO, or SELLERS/DF003/historical-admission owner.
- CANCEL appends a local terminal cancellation and performs no provider operation.

None of these commands grants canonical admission, review, E2S, publication, Current Display, Current Price, Cheapest, Pick, affiliate, or Rakuten authority.

## Artifact readiness

The repository-local operator state currently contains only legacy artifact `mer_histbootstrap_71c280422c057da3b248a43b` (`schemaVersion: 1.0`, `MERCURY-HISTORY-019-1.0`). It is intentionally ineligible for H041 INIT because it lacks the H037/H038 originating source-rights lineage required by the schema-1.1 lifecycle. Therefore `SUCCESSOR_ARTIFACT_STILL_REQUIRED` remains the operator-readiness state.

The existing zero-provider successor-artifact command is:

`npm run mercury:history-bootstrap:prepare -- --as-of=<EXPLICIT_ISO_TIME>`

It prepares a new reviewable artifact only. It creates no checkpoint, continuation, PREPARE artifact, provider task, retrieval, retained evidence, or historical observation, and authorizes no spend.

## Certification safety

Fixture tests exercise all eight one-action command routes, strict argument rejection through every actual shell, direct PRODUCTS → SELLERS and escalated PRODUCTS → PRODUCT_INFO → SELLERS shell sequences, a greater-than-three-product shell fixture, factory construction without credential access, and absence of run-all commands. The shell-sequence transport/service substitute is loaded only by the Node test process; production command code exposes no fixture repository or provider override. Existing H039/H040 suites remain the domain-level authority for the same direct, escalation, generic-cohort, replay, crash, and lineage behavior. H041 certification executed no real Stage A INIT or INSPECT, no DataForSEO or Rakuten operation, no production mutation, and no paid task. Simulated fixture spend is not provider spend; actual spend was `$0.000`.
