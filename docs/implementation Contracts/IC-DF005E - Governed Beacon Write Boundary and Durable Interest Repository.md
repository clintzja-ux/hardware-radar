# IC-DF005E — Governed Beacon Write Boundary and Durable Interest Repository

## Status

Implemented as a framework-neutral Gateway handler contract and Beacon durable repository adapter. Production transport remains `NOT_CONNECTED`; no browser listener or production storage is configured.

## Ownership and route

Gateway owns transport behavior for conceptual route `POST /api/beacon/product-interest`: route/method checks, JSON content type, 2048-byte raw-body limit, JSON parsing, and minimal HTTP response mapping. Beacon owns the strict event schema, privacy rejection, Atlas validation, signal construction, immutable persistence, and replay/conflict semantics. Atlas remains authoritative for product and retailer identity. Mercury is not a dependency.

The handler returns only `{status, signalId}` for accepted/replayed events or a coarse error code. It never returns Atlas metadata, repository records, interest summaries, headers, request bodies, cadence policy, or internal errors. It does not log transport headers or bodies.

## Durable repository

`FileFirstPartyProductInterestCollectionRepository` implements the Beacon repository contract for development and deployment-adapter testing. State is versioned and Beacon-owned, accepted records are immutable, writes serialize through a single-process queue, and commits use write-to-unique-temporary-file followed by atomic rename. Reads reconstruct and validate every event and signal, material fingerprint, deterministic signal ID, event/signal binding, Atlas identifiers, occurrence/recording time relationship, sequence, and uniqueness. Missing state is empty; malformed, inconsistent, unsupported, or corrupt state fails closed.

Exact event replay returns `DUPLICATE` without writing a second signal. The same event ID with different product, retailer, type, source surface, or occurrence time fails as `FIRST_PARTY_INTEREST_EVENT_CONFLICT`. `recordedAt` and transient request metadata are excluded from material identity. Different event IDs persist independently and list deterministically by signal ID.

## Request and privacy controls

Only the existing flat DF005-D event envelope is accepted. Unsupported paths/methods/media types, oversized or malformed JSON, unknown fields, nested metadata, invalid enums/timestamps, and unknown Atlas product/retailer identities fail closed. Event IDs use a bounded safe character format. Prototype-like or arbitrary structures are rejected by the top-level allowlist.

Names, email/IP addresses, user-agent values, accounts, sessions, visitors, advertising IDs, fingerprints, cookies-as-identity, location, and persistent identifiers cannot enter the event schema or signal. A Gateway may transiently observe transport IP/user-agent data, but the handler does not forward or persist it.

## Read integration and authority

Durably loaded signals feed the existing `ProductInterestSignalRepository`, `ProductInterestSummaryService`, and `ProductInterestPortfolioContextService` without an adapter that weakens validation. Fixture tests prove `NO_DATA → OBSERVED` and preserve per-type/source/window semantics.

Interest remains untrusted behavioral evidence—not unique users, demand truth, conversion, ranking, or popularity. No reusable Gateway rate limiter exists today. A production deployment must add infrastructure-appropriate rate limiting, concurrency guarantees, storage, retention, monitoring, and abuse/data-quality review before connection. No CAPTCHA, identity, or scoring is introduced here.

## Production readiness and isolation

The application boundary is `READY`; the durable file adapter is `AVAILABLE_NOT_CONFIGURED`; production transport is `NOT_CONNECTED`. The adapter is not declared production storage because the repository has no deployable Gateway/runtime configuration or approved Beacon persistence location. The status CLI is read-only and creates no events.

DF005-E cannot change the 86400000 ms cadence, policy assignment, E2O/E2N state, automatic execution, unattended LIVE, plans, authorizations, provider tasks, evidence, historical/canonical observations, publication, affiliate navigation, ranking, or spend. Google Analytics and Clarity remain separate and are neither called nor imported.
