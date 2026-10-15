# IC-NEWEGG-ROUTINE-PRODUCTION-COMMAND-AND-PRIVATE-FORGE-OPERATIONS-TRANSPORT-P1

Status: retained-FULL end-to-end certified and exposed through one registered mode-explicit operator command; live acquisition and scheduler activation remain fail-closed/OFF pending a durable acquisition-authority owner.

## Bounded recurring-authority extension — implemented, inactive

The operator approved this policy extension for implementation and disposable certification only. No production mandate is active.

The present Current and retained-commerce History contracts require exact plan/preparation-scoped confirmations. The routine contract also forbids inventing a routine-wide confirmation. A standing mandate that can cause future exact plans to execute therefore changes durable authority policy and requires explicit operator approval before implementation.

The mandate operating window governs authorization of a new acquisition. It is not a completion deadline. Once a new FULL acquisition is authorized in-window, later Current and History children may be issued after the window end or parent expiry only for that exact completed acquisition, matching mandate, source, artifact digest, plan, preparation, predecessor, rights, and eligibility evidence. Pause, revocation, tampering, source mismatch, rights failure, or conflicting lineage still fails closed. This continuation creates no new acquisition allowance, retry, catch-up, renewal, publication, or deployment authority.

The narrow proposed extension has three independent scopes under one operator-attributed mandate:

1. **Acquisition scope.** Authorize only the exact Rakuten Newegg main FULL source family, during an explicit start/expiry interval and Jamaica-local operating window, for at most one new acquisition per Jamaica-local calendar day, with zero automatic retries, pinned-host and source-rights revalidation, pause/revocation state, single-writer consumption, and durable recovery receipts. Canonical recovery of an already-started acquisition reuses its receipt and consumes no second daily slot.
2. **Current scope.** When independently enabled, allow the mandate owner to create a single-use child authorization only after the existing Current owner has produced and revalidated one exact plan and preparation against the mandate's acquired FULL lineage, current predecessor, rights, and eligibility. The child authorization carries the exact plan/preparation scope expected by the existing executor; the standing mandate itself is not passed as the executor confirmation.
3. **History scope.** When independently enabled, perform the equivalent operation through a distinct single-use child authorization after the existing retained-commerce History owner revalidates its exact plan, preparation, candidates, source lineage, History predecessor, and rights. Current enablement or consumption never implies History enablement or consumption.

The proposed child-authority owner would be the only component permitted to issue execution evidence from a recurring mandate. It must persist the mandate revision, scope, exact source digest/HDR, exact plan and preparation IDs/digests, predecessor binding, issuance/consumption state, operator attribution, and recovery link. It must reject expiry, not-yet-valid time, pause, revocation, wrong source/day/window, tampering, stale predecessor, concurrent consumption, unauthorized renewal, and any unrelated plan. Publication, release, deployment, affiliate, identity, and scheduler authority remain false.

Forge may project only sanitized state: enabled/paused/revoked, approved source, expiry, last authorized run, remaining daily allowance, next eligible window, and separate Current/History scope status. No control is eligible until backend creation, pause, resume, revoke, and inspection actions are separately certified.

`NeweggRoutineRecurringAuthorityService` implements these rules over an atomic file repository protected by the repository-native cross-process single-writer lock. Mandate and child records carry deterministic integrity digests. Acquisition and market completion receipts support exact recovery without additional consumption. The registered command accepts `--mandate-id` for mandate-specific inspection and live validation; no default mandate exists.

No authenticated production mandate creation/pause/revoke/renewal control has been activated, and no production mandate was created during certification. `RUN_LIVE` therefore remains unavailable before network access until that separate control and activation boundary is approved. This implementation does not authorize scheduling, provider retries, publication, release, deployment, paid work, or automatic source deletion.

## Production command service

`NeweggRoutineProductionCommand` is the single orchestration owner for the certified Newegg routine. It accepts injected existing stage owners and executes: preflight, acquisition, validation, disk-backed catalog state, binding, qualification, preparation, Current, History, QA, recomposition, Sentinel certification, production-shaped release certification, retention assessment, Forge projection, and Forge transport. It contains no source parsing, qualification, Current, History, QA, release, or retention policy.

## Current preparation service extraction (P1B1)

`ProductionRakutenFullCurrentPreparationService` owns the production composition for the Current PREPARE stage. It composes existing owners rather than reproducing their policy: Atlas repositories, effective destination resolution, disk-backed Rakuten catalog evidence, source-neutral Current qualification, source-rights validation, predecessor resolution, and canonical plan/preparation creation.

The existing `mercury:rakuten-full-current:prepare` command is a thin wrapper over this service. Equivalent canonical inputs retain the established command arguments, operator output, IDs, digests, persisted formats, zero-authority semantics, and failure classifications. The service's richer typed result is for internal stage composition and includes immutable FULL/HDR/catalog lineage, source-rights profile binding, Current predecessor binding, coverage and qualification counts, review state, and canonical artifact references.

Replay authority remains with the canonical plan and preparation artifacts. Both artifacts must exist, parse, validate, and exactly match the deterministic recomposition. A lone artifact or conflicting content fails closed; a routine journal cannot substitute for these checks. PREPARE performs no Current mutation and grants no execution, publication, release, or deployment authority.

## Retained-commerce History preparation service extraction (P1B2)

`ProductionRetainedCommerceHistoryPreparationService` owns the production composition for routine History PREPARE. It validates the immutable FULL digest and HDR timestamp, resolves an exact effective Newegg destination and ACTIVE/READY Atlas identity, applies existing retained-commerce rights and standalone-comparability policy, binds the canonical History predecessor, and delegates identity construction to the established retained-commerce plan and preparation owners.

History qualification is independent of Current freshness, Current publication eligibility, offer selection, affiliate relationships, Cheapest, and release state. Shipping remains null when unknown and is never converted to zero; only an explicit finite non-negative source value is retained. Bundle, non-new, unavailable, unresolved-price, and ambiguous-identity evidence remains excluded or review-required under existing policy.

The existing `mercury:newegg-routine:history -- --action=prepare` interface is a thin wrapper over the service and preserves the established artifact formats, deterministic IDs/digests, confirmation, output, and failure vocabulary. Its `execute` path is unchanged and continues to require independently validated History authority. Exact replay depends on the canonical plan/preparation pair, not the routine journal; partial or conflicting artifacts fail closed. PREPARE grants no History mutation, Current mutation, release, or deployment authority.

## Current QA service and P1B stage binding (P1B3)

`ProductionRakutenCurrentQaService` owns the complete-Newegg post-Current CSV composition formerly embedded in the Current EXECUTE CLI. The existing CLI invokes the service after canonical Current execution and preserves the established column names/order, row ordering, offer/source/destination provenance, affiliate-action indicator, output filename, SHA-256, population check, and operator output.

QA is eligible only when canonical Current equals the executed plan's proposed snapshot identity, fingerprint, and offer count. Its source binding includes the FULL artifact digest, HDR observed time, catalog state, plan, and preparation. An exact existing CSV is canonical replay; different bytes at the same path fail closed. A routine receipt alone never proves QA completion.

`bindProductionNeweggRoutineP1BOwners` binds the distinct Current and retained-commerce History preparation services to PREPARE and binds QA to the post-Current snapshot. History authority remains independent. Stage order is `PREPARE → HISTORY → CURRENT → QA`: a Current failure cannot prevent already-qualified History progression, and QA cannot run before successful or canonically recovered Current execution. None of these zero-authority composition stages grants publication, release, deployment, or provider authority.

Modes are `PRODUCTION`, `RETAINED_EVIDENCE`, and `FIXTURE`. Fixture and retained-evidence modes use isolated owners and cannot weaken the production owners' validation. The provider envelope is one Rakuten session, one FULL, zero DELTAs, zero automatic retries, concurrency one, zero DataForSEO calls, zero paid tasks, and zero spend. Weekly affiliate maintenance is excluded.

The service persists after every successful stage. Resume starts at the first incomplete stage. A run with a different active binding returns `BLOCKED_ACTIVE_RUN` before acquisition. Successful Current is not rolled back when History fails; successful History is not replayed when Current fails. Completed stages are skipped on restart. Release and deployment authority remain false.

## Canonical Current and History authority adapters

`RakutenFullCurrentRoutineAuthorityAdapter` reuses the existing Rakuten FULL Current plan and preparation validators, requires the exact plan/preparation-scoped confirmation, binds the immutable artifact digest, validated HDR observation time and catalog state, and rechecks either the exact Current predecessor or the exact proposed completed state. It delegates mutation to `executeRakutenFullCurrentRefresh`.

`RetainedCommerceHistoryRoutineAuthorityAdapter` independently reuses the retained-commerce plan/preparation, rights, candidate and predecessor validators. The routine path accepts only the plan/preparation-scoped History confirmation, binds every candidate to the same immutable FULL digest and observed time, rejects partial admission, and detects exact completed admission for receipt recovery. It delegates mutation to `RetainedCommerceHistoryExecutionService`. Current authority never implies History authority.

`bindProductionNeweggRoutineMarketAuthorities` installs these two canonical owners into the existing production factory without changing any other stage owner or policy.

Machine outcomes are `SUCCESS_RELEASE_READY`, `SUCCESS_NO_CHANGE`, `BLOCKED_ACTIVE_RUN`, `PROVIDER_FAILURE`, `INTEGRITY_FAILURE`, `QUALIFICATION_REVIEW_REQUIRED`, `CURRENT_FAILURE`, `HISTORY_FAILURE`, `QA_FAILURE`, `RECOMPOSITION_FAILURE`, `CERTIFICATION_FAILURE`, `FORGE_HEALTH_FAILURE`, and `FORGE_TRANSPORT_FAILURE`. A Forge projection/persistence failure is distinct from Sentinel certification, and a private-transport failure remains distinct from both. Success uses exit code 0; blocks and failures use a nonzero exit code.

Terminal presentation is derived from canonical completion rather than residual attempt fields. `SUCCESS_RELEASE_READY` and `SUCCESS_NO_CHANGE` expose `failedStage: null` and `failure: null`, including exact completed-operation replay. Failed and incomplete outcomes expose their actual active failed stage and failure detail. This projection rule never erases or rewrites prior failed-attempt evidence in the durable run journal or bootstrap operation.

## Private Forge transport

`PrivateForgeOperationsTransport` transports only the certified `NEWEGG_ROUTINE_OPERATIONS` projection in a digest-bound, expiring envelope. Access requires a runtime bearer credential of at least 24 characters. The credential is never included in the envelope, source, logs, public artifacts, or Forge projection. The HTTP adapter serves only `/internal/forge/newegg-routine`, returns `Cache-Control: private, no-store` and `X-Robots-Tag: noindex, nofollow`, and returns 404 for public routes. It is read-only and has no provider, Mercury, publication, release, or deployment authority.

The envelope binds transport version, audience, creation/expiry, projection digest, and envelope digest. Corrupt or stale envelopes fail closed. A transport failure after Current or History persistence becomes `FORGE_TRANSPORT_FAILURE`; completed market stages remain durable. A retry resumes only `FORGE_TRANSPORT`, is projection-specific and idempotent, and cannot reacquire provider data or mutate Mercury.

The existing explicit local projection file remains a diagnostic fallback. It is not the production transport.

The production health repository recognizes exactly two state shapes: the current schema-1.0 digest envelope and the established schema-1.0 raw `NEWEGG_ROUTINE_OPERATIONS` projection. Legacy acceptance requires the complete known field set, a valid routine run identity, immutable FULL digest/HDR and catalog identity, recognized success status, schedule shape, zero-authority safety flags, and valid numeric accounting. Unknown, malformed, ambiguous, or tampered legacy evidence fails closed. During the first newer projection write, the repository preserves the validated raw projection in a digest-bound same-directory backup, atomically replaces the active file with the canonical envelope under its single-writer lock, and re-reads the committed envelope before reporting success. It does not reinterpret the legacy run as a new completion.

## Deployment and activation boundary

The composition and access boundary is certified without a provider call or canonical mutation. P1A binds acquisition, validation, and catalog reconstruction; P1B binds Current and retained-commerce History preparation, their independent canonical execution authorities, and QA.

P1C binds the existing downstream policies through `NeweggRoutineDownstreamStageOwners`: zero-authority portfolio recomposition, exact Sentinel candidate certification, zero-authority release-readiness assessment, non-destructive retention plus disk-capacity assessment, durable routine-health projection, and private Forge transport. Every downstream completion is recorded atomically against the routine binding, immutable FULL digest, and HDR observation time. Exact receipts replay, while malformed, partial, or digest-conflicting receipts fail closed. Retention can return `STORAGE_HOLD`; it never deletes an artifact or expands retention policy. Forge receives only the sanitized read-only projection and grants no provider, market, release, or deployment authority.

P1D closes the former `PREFLIGHT`, `BINDING`, and `QUALIFICATION` owner-map gap. Preflight composes the established source-rights, disk-capacity, retention-safety, acquisition-configuration, immutable-lineage, and overlap boundaries without network activity. Binding and qualification call the exact Current and retained-commerce History preparation services, so catalog matching, ACTIVE/READY eligibility, effective Newegg destination identity, price/comparability, seller uncertainty, shipping/fee semantics, and source rights remain owned by those services. PREPARE subsequently resolves the same deterministic artifacts as replay. Their atomic receipts bind the routine digest, FULL digest, HDR time, catalog state, and exact Current/History plan identities.

`composeProductionNeweggRoutineOwners` now assembles P1A through P1D and rejects any missing stage owner. The final operator command is still intentionally not registered: certification has not yet exercised one single retained FULL through the assembled root composition because the root-level zero-authority portfolio/Sentinel services remain dependency-injected rather than exposed by a production constructor. Component and factory certification cannot be represented as that missing end-to-end proof. A final bounded composition test must use the retained FULL and disposable canonical repositories, then registration may add only `INSPECT`, `CERTIFY_RETAINED`, and explicitly authorized `RUN_LIVE`. Scheduler activation remains later and separate.

P1E introduces command-backed production adapters for the existing RAM portfolio CLI, Sentinel certification, and release-readiness validation. They invoke the established CLI and portfolio validators, validate the persisted candidate/certification bindings, and retain explicit false release/deployment authority. The retained production FULL is `162,823,035` bytes and its current disk-bounded catalog is approximately `1.08 GB`. A complete disposable execution therefore requires a root-state workspace containing Current, History, workbook, catalog, receipts, QA, portfolio, and Forge transport plus explicit disposable Current/History execution authorities.

P1F supplies that disposable canonical root and proves that no production writer is reachable from it. Product-level isolation preserves the one exact Timetec `MPN_CONTRADICTION` as a durable review exception while allowing independently qualified evidence to continue. QA reconciliation maps the canonical Current execution receipt's `currentSnapshotId`, material fingerprint, offer count, FULL digest/HDR, and plan/preparation lineage into the existing 23-column QA owner; it also validates the canonical preparation fields `refreshPlanId` and `refreshPlanBindingDigest`. Initial execution, canonical recovery, and conflicting receipt inputs remain fail closed.

The retained 1,091,483-record FULL now completes every routine stage with `SUCCESS_NO_CHANGE`, including QA, zero-authority recomposition, Sentinel certification, release-readiness assessment, non-destructive retention, Forge health `SUCCESS_WITH_PRODUCT_EXCEPTIONS`, and private transport. Timetec remains excluded and review-required; no identity was inferred. Provider calls and reachable production writers were zero. The next boundary is the separately governed production command/scheduler activation review; it must not alter this certified data path or resolve the Timetec exception implicitly.
