# IC-FORGE-MERCURY-001 — Canonical Observation Ingestion

## Objective
Establish Mercury's controlled write boundary so Forge and future acquisition clients can request ingestion without manufacturing canonical observations.

## Implemented
- IngestionService orchestration boundary.
- Deterministic request validation and structured result states.
- Adapter registry resolution by retailer, marketplace and source method.
- Atlas product and retailer identity resolution before canonical construction.
- Mercury-owned mer_obs_* identity allocation.
- Canonical normalization/provenance through the selected adapter.
- Observation validation before acceptance.
- Atomic caller semantics: failed ingestion creates no accepted record.
- Deterministic SHA-256 idempotency key and duplicate result handling.
- Explicit Amazon production source-method fail-closed gate from FC001.
- TEST_FIXTURE success path for deterministic non-production verification.
- Explicit publication rejection for TEST_FIXTURE evidence.

## Deferred
- Amazon Creators API HTTP client and authentication.
- Credentials/token lifecycle and rate limiting.
- Durable filesystem/database observation writer.
- Forge UI integration and review workflow.
- Amazon licensed-content TTL/retention implementation.
- Production Amazon publication.

## Exit Criteria
Mercury 39/39, Atlas 15/15, Sentinel 7/7, repository layout and public publication-boundary verification pass. Forge and Hardware Radar require manual regression verification.
