# ADR-008 — Adapter-Based Ingestion Architecture

**Status:** Accepted  
**Subsystem:** Mercury  
**Decision:** External retailer-specific market data enters Mercury through a registered adapter implementing the canonical `RetailerAdapter` contract.

## Context

Mercury must support multiple retailers without allowing retailer-specific formats, marketplace quirks, or collection representations to leak into its observation engine, Sentinel, Forge, or consuming applications.

## Decision

Mercury adopts an adapter-based ingestion boundary:

External representation → RetailerAdapter → normalized observation candidate → validation → canonical observation repository.

Adapters own translation and normalization only. They do not decide trust, freshness, confidence, certification, or publication eligibility.

All retailer-specific implementation code is isolated beneath `packages/mercury/adapters/<retailer>/`. Mercury discovers adapters through the `AdapterRegistry` rather than depending directly on retailer implementations.

## Consequences

- Retailers can be added without changing the observation engine.
- Normalized observation contracts remain retailer-independent.
- Adapter behavior can be tested independently.
- Sentinel validates canonical data rather than retailer-specific payloads.
- Forge can orchestrate adapters without owning normalization logic.
- Future collection mechanisms can evolve behind stable adapter contracts.

## Governing Principle

**MERCURY-PRINCIPLE-001 — Adapter Isolation:** All external retailer-specific behavior shall be isolated behind the canonical RetailerAdapter contract. No other Mercury subsystem may depend directly on retailer-specific implementations.
