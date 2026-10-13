# IC-NEWEGG-ROUTINE-PRODUCTION-COMMAND-AND-PRIVATE-FORGE-OPERATIONS-TRANSPORT-P1

Status: fixture-certified composition boundary with canonical Current and History authority adapters; the registered production command, scheduler, and transport deployment remain OFF.

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

Machine outcomes are `SUCCESS_RELEASE_READY`, `SUCCESS_NO_CHANGE`, `BLOCKED_ACTIVE_RUN`, `PROVIDER_FAILURE`, `INTEGRITY_FAILURE`, `QUALIFICATION_REVIEW_REQUIRED`, `CURRENT_FAILURE`, `HISTORY_FAILURE`, `QA_FAILURE`, `RECOMPOSITION_FAILURE`, `CERTIFICATION_FAILURE`, and `FORGE_TRANSPORT_FAILURE`. Success uses exit code 0; blocks and failures use a nonzero exit code.

## Private Forge transport

`PrivateForgeOperationsTransport` transports only the certified `NEWEGG_ROUTINE_OPERATIONS` projection in a digest-bound, expiring envelope. Access requires a runtime bearer credential of at least 24 characters. The credential is never included in the envelope, source, logs, public artifacts, or Forge projection. The HTTP adapter serves only `/internal/forge/newegg-routine`, returns `Cache-Control: private, no-store` and `X-Robots-Tag: noindex, nofollow`, and returns 404 for public routes. It is read-only and has no provider, Mercury, publication, release, or deployment authority.

The envelope binds transport version, audience, creation/expiry, projection digest, and envelope digest. Corrupt or stale envelopes fail closed. A transport failure after Current or History persistence becomes `FORGE_TRANSPORT_FAILURE`; completed market stages remain durable. A retry resumes only `FORGE_TRANSPORT`, is projection-specific and idempotent, and cannot reacquire provider data or mutate Mercury.

The existing explicit local projection file remains a diagnostic fallback. It is not the production transport.

## Deployment and activation boundary

The composition and access boundary is certified without a provider call or canonical mutation. The repository still lacks one concrete production owner map for all non-Current/History stages; those stages remain injection-only in the factory certification. Consequently no operator command is registered yet: registering the fixture-capable factory as production would be misleading and unsafe. A bounded follow-up must bind the existing acquisition, validation, catalog, binding, qualification, preparation, QA, recomposition, Sentinel, retention and Forge owners, then register the single command. Scheduler and authenticated internal-host activation remain later boundaries.

The next bounded increment is `NEWEGG_ROUTINE_REMAINING_CANONICAL_STAGE_OWNER_COMPOSITION_AND_COMMAND_REGISTRATION_P1`. Scheduler activation must not begin until that command is production-certified.
