# IC-NEWEGG-ROUTINE-PRODUCTION-COMMAND-AND-PRIVATE-FORGE-OPERATIONS-TRANSPORT-P1

Status: fixture-certified composition boundary; scheduler and transport deployment remain OFF.

## Production command service

`NeweggRoutineProductionCommand` is the single orchestration owner for the certified Newegg routine. It accepts injected existing stage owners and executes: preflight, acquisition, validation, disk-backed catalog state, binding, qualification, preparation, Current, History, QA, recomposition, Sentinel certification, production-shaped release certification, retention assessment, Forge projection, and Forge transport. It contains no source parsing, qualification, Current, History, QA, release, or retention policy.

Modes are `PRODUCTION`, `RETAINED_EVIDENCE`, and `FIXTURE`. Fixture and retained-evidence modes use isolated owners and cannot weaken the production owners' validation. The provider envelope is one Rakuten session, one FULL, zero DELTAs, zero automatic retries, concurrency one, zero DataForSEO calls, zero paid tasks, and zero spend. Weekly affiliate maintenance is excluded.

The service persists after every successful stage. Resume starts at the first incomplete stage. A run with a different active binding returns `BLOCKED_ACTIVE_RUN` before acquisition. Successful Current is not rolled back when History fails; successful History is not replayed when Current fails. Completed stages are skipped on restart. Release and deployment authority remain false.

Internal stage outcomes retain `SUCCESS_RELEASE_READY`, `SUCCESS_NO_CHANGE`, and the detailed failure classifications. Final change classification is derived from authoritative Current and History results: a meaningful Current mutation or admitted History observation is release-ready even when another completed stage is `REPLAY` or `NO_CHANGE`; only the absence of both is a genuine routine no-change.

The locally validated simplification connects release readiness directly to the canonical Sentinel publication command. The routine reads the canonical publication authority repository, requires exactly one enabled and currently valid production mandate with available daily allowance, validates the certified candidate/run binding, and passes that mandate identity to Sentinel. Sentinel remains the owner of candidate freshness, authority issuance and consumption, predecessor, deterministic artifact comparison, checkpoint, fast-forward, deployment verification, acceptance, and recovery. The normal path no longer selects a fixed mandate from environment configuration and no longer writes a separate post-success publication receipt. Historical receipt evidence remains historical; failure-specific Sentinel recovery remains compatible.

The operator-facing terminal outcome is one of `LIVE_ACCEPTED`, `SUCCESS_NO_CHANGE`, `RELEASE_READY_NOT_PUBLISHED`, `ACQUISITION_FAILED`, or `PUBLICATION_FAILED`. Detailed internal stage and recovery classifications remain durable. A publication failure is never reported as routine success. The stable Forge launcher and publication subprocess both use the canonical `.env` through Node `--env-file` and enable the system CA store with `--use-system-ca`.

## Canonical Forge runtime composition

The installed application checkout owns Forge code, static assets, retailer configuration, and canonical Atlas records. Mutable operator evidence is independently rooted by the required absolute `FORGE_OPERATOR_OPERATIONAL_ROOT`: audits, mandates, command outcomes, routine state, Current and History evidence, workbooks, and runtime logs resolve only beneath that operational root. A trusted production launch with a missing or relative operational root fails closed; it must not create an implicit evidence tree inside the application checkout. Fixture launches remain explicitly isolated by their fixture root.

Every confirmation dialog assigns one stable request identity before transport. The same identity is sent to the existing audited, idempotent Forge command boundary. Definite HTTP rejections remain rejected; a network failure or unreadable response is reported as an uncertain submission and disables repeat submission until the operator inspects durable Current-operation evidence. A successful acceptance remains accepted even if the subsequent status refresh fails. This changes no authority or audit semantics and introduces no additional command owner.

## Private Forge transport

`PrivateForgeOperationsTransport` transports only the certified `NEWEGG_ROUTINE_OPERATIONS` projection in a digest-bound, expiring envelope. Access requires a runtime bearer credential of at least 24 characters. The credential is never included in the envelope, source, logs, public artifacts, or Forge projection. The HTTP adapter serves only `/internal/forge/newegg-routine`, returns `Cache-Control: private, no-store` and `X-Robots-Tag: noindex, nofollow`, and returns 404 for public routes. It is read-only and has no provider, Mercury, publication, release, or deployment authority.

The envelope binds transport version, audience, creation/expiry, projection digest, and envelope digest. Corrupt or stale envelopes fail closed. A transport failure after Current or History persistence becomes `FORGE_TRANSPORT_FAILURE`; completed market stages remain durable. A retry resumes only `FORGE_TRANSPORT`, is projection-specific and idempotent, and cannot reacquire provider data or mutate Mercury.

The existing explicit local projection file remains a diagnostic fallback. It is not the production transport.

## Deployment and activation boundary

The simplification is locally validated without provider calls or production mutation and is not yet production-installed. Scheduling remains OFF. Production activation requires separate merge and runtime-installation authorization.

The next bounded increment is `NEWEGG_ROUTINE_SCHEDULER_AND_PRIVATE_FORGE_TRANSPORT_ACTIVATION_P1`: bind the production stage-owner factory to one scheduler invocation, deploy the internal authenticated handler through approved private infrastructure, verify Forge consumption, and activate the approximately 24-hour schedule without changing the data path.
