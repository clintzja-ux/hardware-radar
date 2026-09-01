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

## MVP-002 Increment 4 — Curated RAM Offers

The canonical ingestion boundary now supports a narrowly specialized `mer_adapter_operator_curated_ram_offer` path behind controlled `curated-offer:prepare` and `curated-offer:execute` commands. It accepts structured RAM offer candidates only, resolves explicit Atlas product and retailer IDs, and binds source URL/domain, observation time, listed price/currency, availability, source-backed condition, shipping knownness, standalone/bundle state, unconditional/conditional-price state, operator reference, and source-rights profile.

PREPARE performs deterministic validation and creates a 15-minute immutable authorization without allocating or accepting an observation. EXECUTE reloads Atlas and rights state, requires `RECORD-CURATED-RAM-OFFER`, validates the exact binding and a provisional canonical observation before allocation, delegates durable acceptance and idempotency to `IngestionService`, and consumes authorization once. Both operations are local, zero-network, and zero-spend.

Missing or blank condition normalizes to `UNKNOWN`; it never defaults to `NEW`. Shipping unknownness remains null rather than zero. Standalone/bundle and unconditional/conditional classifications are mandatory and preserved as structured offer fields. Affiliate input is neither accepted as authority nor used for eligibility.

Curated ingestion creates no historical-admission event, canonical-admission authorization, review decision, E2S qualification, publication decision, Current Price, Cheapest, Pick, or recommendation authority. Those remain independent downstream stages.

## Deferred
- Amazon Creators API HTTP client and authentication.
- Credentials/token lifecycle and rate limiting.
- Durable filesystem/database observation writer.
- Forge UI integration and review workflow.
- Amazon licensed-content TTL/retention implementation.
- Production Amazon publication.
- Real curated source-rights profiles, source-specific production freshness policies, launch catalog selection, and production curated observations.

## Exit Criteria
Mercury 39/39, Atlas 15/15, Sentinel 7/7, repository layout and public publication-boundary verification pass. Forge and Hardware Radar require manual regression verification.
