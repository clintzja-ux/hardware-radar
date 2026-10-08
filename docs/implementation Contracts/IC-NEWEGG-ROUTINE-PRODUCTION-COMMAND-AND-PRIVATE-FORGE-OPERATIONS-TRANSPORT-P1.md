# IC-NEWEGG-ROUTINE-PRODUCTION-COMMAND-AND-PRIVATE-FORGE-OPERATIONS-TRANSPORT-P1

Status: fixture-certified composition boundary; scheduler and transport deployment remain OFF.

## Production command service

`NeweggRoutineProductionCommand` is the single orchestration owner for the certified Newegg routine. It accepts injected existing stage owners and executes: preflight, acquisition, validation, disk-backed catalog state, binding, qualification, preparation, Current, History, QA, recomposition, Sentinel certification, production-shaped release certification, retention assessment, Forge projection, and Forge transport. It contains no source parsing, qualification, Current, History, QA, release, or retention policy.

Modes are `PRODUCTION`, `RETAINED_EVIDENCE`, and `FIXTURE`. Fixture and retained-evidence modes use isolated owners and cannot weaken the production owners' validation. The provider envelope is one Rakuten session, one FULL, zero DELTAs, zero automatic retries, concurrency one, zero DataForSEO calls, zero paid tasks, and zero spend. Weekly affiliate maintenance is excluded.

The service persists after every successful stage. Resume starts at the first incomplete stage. A run with a different active binding returns `BLOCKED_ACTIVE_RUN` before acquisition. Successful Current is not rolled back when History fails; successful History is not replayed when Current fails. Completed stages are skipped on restart. Release and deployment authority remain false.

Machine outcomes are `SUCCESS_RELEASE_READY`, `SUCCESS_NO_CHANGE`, `BLOCKED_ACTIVE_RUN`, `PROVIDER_FAILURE`, `INTEGRITY_FAILURE`, `QUALIFICATION_REVIEW_REQUIRED`, `CURRENT_FAILURE`, `HISTORY_FAILURE`, `QA_FAILURE`, `RECOMPOSITION_FAILURE`, `CERTIFICATION_FAILURE`, and `FORGE_TRANSPORT_FAILURE`. Success uses exit code 0; blocks and failures use a nonzero exit code.

## Private Forge transport

`PrivateForgeOperationsTransport` transports only the certified `NEWEGG_ROUTINE_OPERATIONS` projection in a digest-bound, expiring envelope. Access requires a runtime bearer credential of at least 24 characters. The credential is never included in the envelope, source, logs, public artifacts, or Forge projection. The HTTP adapter serves only `/internal/forge/newegg-routine`, returns `Cache-Control: private, no-store` and `X-Robots-Tag: noindex, nofollow`, and returns 404 for public routes. It is read-only and has no provider, Mercury, publication, release, or deployment authority.

The envelope binds transport version, audience, creation/expiry, projection digest, and envelope digest. Corrupt or stale envelopes fail closed. A transport failure after Current or History persistence becomes `FORGE_TRANSPORT_FAILURE`; completed market stages remain durable. A retry resumes only `FORGE_TRANSPORT`, is projection-specific and idempotent, and cannot reacquire provider data or mutate Mercury.

The existing explicit local projection file remains a diagnostic fallback. It is not the production transport.

## Deployment and activation boundary

The composition and access boundary are certified without a provider call or canonical mutation. A concrete scheduler process adapter and authenticated internal-host deployment must bind the already-certified production stage owners and HTTP handler before unattended operation. Until that bounded activation/deployment increment, scheduling remains OFF and deployed Forge continues to use the diagnostic local-file path.

The next bounded increment is `NEWEGG_ROUTINE_SCHEDULER_AND_PRIVATE_FORGE_TRANSPORT_ACTIVATION_P1`: bind the production stage-owner factory to one scheduler invocation, deploy the internal authenticated handler through approved private infrastructure, verify Forge consumption, and activate the approximately 24-hour schedule without changing the data path.
