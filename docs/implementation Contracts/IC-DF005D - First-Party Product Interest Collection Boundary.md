# IC-DF005D — First-Party Product Interest Collection Boundary

## Status and ownership

Implemented as a Beacon-owned, zero-spend collection application boundary. Atlas remains authoritative for product and retailer identity. Mercury remains isolated. Production transport is `NOT_CONNECTED` because Hardware Radar is statically hosted and has no governed Gateway/server write endpoint.

## Supported interaction

The only initial collection type is `OUTBOUND_RETAILER_CLICK`, matching existing price/recommendation links that are bound to a published Atlas product and canonical retailer. No product-detail route currently exists, and generic category navigation is not redefined as a product interaction. Supported controlled surfaces are `OVERALL`, `CATEGORY_DDR5`, `CATEGORY_DDR4`, and `LAPTOP_RAM`.

The collection event contains only `schemaVersion`, browser-generated one-interaction `eventId`, `atlasProductId`, `signalType`, controlled `sourceSurface`, `occurredAt`, and canonical `retailerId`. Unknown fields, unsupported types/surfaces, payloads over 2048 bytes, malformed or future occurrence times, unknown Atlas products, and unknown Atlas retailers fail closed.

## Identity, replay, and persistence

`eventId` identifies one browser submission and uses no visitor identity. A new legitimate interaction uses a new event ID. Signal identity is `beacon_interest_` plus a deterministic truncated SHA-256 of the event ID. The repository fingerprints the material event fields. Exact replay returns `DUPLICATE` and preserves the original signal; the same event ID with different material content fails as `FIRST_PARTY_INTEREST_EVENT_CONFLICT`.

The increment uses immutable raw events with `value=1`, `unit=COUNT`, and `evidenceKind=RAW`. `observedAt` and the zero-duration signal window preserve the interaction time. Server-provided `recordedAt` is metadata and never replaces occurrence time.

Persistence is currently `APPLICATION_BOUNDARY_ONLY`: the isolated in-memory repository proves the acceptance contract and exposes signals directly to the existing `ProductInterestSignalRepository`, `ProductInterestSummaryService`, and portfolio-context decorator. No production file or fake event is created. A durable server repository and retention period require a later approved transport increment.

## Privacy and provenance

The strict envelope has no arbitrary metadata. Names, email/IP addresses, user-agent strings, user/account/session/visitor IDs, advertising IDs, cookies-as-identity, fingerprints, precise location, and cross-site identity are rejected. Transport-level IP or user-agent information must never enter persisted Beacon evidence.

Signals declare `HARDWARE_RADAR_FIRST_PARTY`, the Beacon collection boundary, source surface, event relationship, canonical retailer, and successful Atlas validation. Existing Google Analytics and Microsoft Clarity remain independent general analytics integrations and are neither queried nor reinterpreted as governed Beacon evidence.

## Authority isolation

Collected signals are behavioral evidence, not unique visitors, purchase intent, demand, popularity, ranking, recommendation weight, or cadence policy. Collection cannot change DF005-B policy resolution, the 86400000 ms production interval, E2O/E2N state, spend exposure, authorization, provider tasks, history, canonical observations, publication, affiliate destinations, automatic execution, or unattended LIVE.

Because production transport is not connected, no browser listener is added. Existing outbound navigation remains unchanged and cannot be delayed or blocked by collection failure. The read-only status command reports connection, privacy, supported types, Atlas validation, zero cadence authority, and `$0.000` spend.
