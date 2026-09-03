# IC-FORGE-MERCURY-002 — Durable Observation Repository

**Status:** Implemented — Pending Exit Review
**Subsystems:** Mercury / Forge integration

## Objective
Persist accepted canonical Mercury observations durably without weakening immutability, atomic acceptance, deterministic identity, idempotency, provenance, or source-retention boundaries.

## Implemented
- `ObservationAcceptanceRepository` write-side contract.
- Filesystem-backed durable implementation using atomic temporary-file replacement.
- Repository-owned canonical `mer_obs_*` identity allocation.
- Durable idempotency across process/repository restart.
- Readback by observation, product, and retailer identity.
- Source-aware storage classification.
- Independent license-controlled payload expiry and purge.
- Durable audit envelope retained after permitted payload purge.
- Production rejection of `TEST_FIXTURE` evidence.
- Publication rejection of purged/expired licensed payload.
- Existing manifest-backed `ObservationRepository` remains the read-side canonical repository.

## Explicit Boundaries
FM002 does not implement Forge review UI, Amazon Creators API networking, database infrastructure, automatic publication, or source-license expansion. Amazon historical analytics remain blocked by default under FC001.

## Exit Criteria
Full Mercury, Atlas, Sentinel, repository-layout, public-boundary, Forge, and Hardware Radar regressions must pass before certification.
