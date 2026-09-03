# ADR-014 — Durable Observation Persistence Preserves Source Retention Boundaries

**Status:** Accepted
**Scope:** Mercury / Forge ingestion persistence

**Implementation evidence:** The filesystem-backed `ObservationAcceptanceRepository`, source-retention enforcement, restart/idempotency coverage, fixture isolation, and failure-recovery behavior are implemented and relied upon by the certified Mercury ingestion and publication boundaries.

## Context
Mercury observations are immutable evidence, but source licenses may restrict how long retailer-provided content may be retained. Immutability must not be interpreted as permission to retain licensed payload indefinitely.

## Decision
Mercury separates durable observation identity and lawful audit evidence from source-licensed payload. Durable acceptance is owned by a repository boundary that atomically allocates canonical identity, enforces idempotency, persists accepted observations, and applies source-aware retention policy.

Licensed payload may expire and be purged while the observation's permitted audit envelope remains. Purged or expired payload is unavailable to publication and historical intelligence.

Test-fixture evidence is physically rejected by production durable repositories in addition to being publication-ineligible.

The initial backend is filesystem-based behind `ObservationAcceptanceRepository`; backend replacement must not alter ingestion semantics.

## Consequences
- Mercury preserves audit continuity without claiming indefinite rights to source content.
- Freshness and source retention remain independent concepts.
- Identity allocation and idempotency become durable and restart-safe.
- Forge never writes canonical observation files directly.
- Amazon Creators API offer payload is treated as license-controlled under the current FC001 baseline.
