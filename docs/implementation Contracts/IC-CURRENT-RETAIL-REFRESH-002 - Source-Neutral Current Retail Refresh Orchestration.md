# IC-CURRENT-RETAIL-REFRESH-002 — Source-Neutral Current Retail Refresh Orchestration

**Status:** FIXTURE-CERTIFIED
**Owner:** Mercury current-display boundary
**Date:** 2026-09-08

## Purpose

Provide one source-neutral, zero-cost orchestration boundary for refreshing known Atlas RAM products at existing canonical `RetailerDestination` records. Retailer/provider adapters sit below this boundary. The existing `CurrentDisplaySnapshot` remains the sole ephemeral state owner and `PublicCurrentRetailProjection` remains the sole public freshness and Cheapest owner.

## Runtime boundary

`createCurrentRetailRefreshPortfolio` deterministically selects `ACTIVE/READY` RAM products, active canonical destinations, and explicitly registered capable adapters. Each item binds the exact product, retailer, destination, canonical URL, listing identity, marketplace, adapter, source mode, and explicit `asOf`. Affiliate state is neither accepted nor consulted.

`CurrentRetailRefreshOrchestrator` executes those immutable items with bounded concurrency. An adapter receives only governed destination context and returns either normalized current-retail evidence or a compact typed outcome. Provider-specific payloads do not cross the adapter boundary. Fixture registration proves automated-primary, automated-alternate, manual-only, and unavailable modes without defining global provider precedence.

## Evidence and rights

Normalized observations preserve source identity, rights-profile identity, observed time, item price, condition, availability, seller state, marketplace, and canonical bindings. Missing condition remains `null`; missing availability becomes `UNKNOWN`; missing shipping and fees remain `null`. The orchestrator never infers `NEW`, `AVAILABLE`, zero delivery costs, or first-party seller status.

Every adapter registration must explicitly allow acquisition and ephemeral retention and explicitly state public-display/comparison permission. Historical retention is required to be `false` in this boundary. A future live adapter requires separately certified source schema, destination binding, rights, TTL, and operating behavior.

## Replacement and failure semantics

- A valid observation replaces only the same product/retailer finding.
- `OUT_OF_STOCK` and `PRICE_NOT_EXPOSED` remove that current numeric offer without deleting its canonical destination.
- Timeout, rate limit, unavailable source, provider error, and malformed result preserve the prior finding with its original `observedAt`; they never refresh stale evidence.
- One failure cannot stop other portfolio items.
- Repository persistence continues to retain only current plus immediately previous snapshots, with its existing replay/conflict behavior.

Current item-price eligibility remains fail-closed: condition must be explicit `NEW`, availability must be `AVAILABLE`, the canonical destination must remain bound, and source public-display/comparison rights must permit use. The public 36-hour freshness rule and four-scope winner calculation remain downstream in `PublicCurrentRetailProjection`.

## Fixture certification and operator interface

The fixture adapter is test-only and performs no external operation. No production-looking refresh command is exposed in this increment. The future reserved operator shape is `npm run retail:current:refresh`; it must not be added until at least one real adapter is independently schema-, rights-, and transport-certified. Local composition can use the pure portfolio function or orchestrator `dryRun`, both of which report zero mutations and zero spend.

The certified future sequence is:

```text
precheck -> compose portfolio -> select adapters -> refresh -> normalize
-> CurrentDisplaySnapshot -> build public -> verify public -> operator report
```

Build and deployment remain separate. Manual acquisition through `ManualRetailReviewImportService` remains an independent fallback.

## Explicit non-authority

This boundary creates no provider task, paid authorization, durable Mercury evidence, history, canonical observation, review, E2S state, publication decision, durable Current Price, historical Cheapest, statistic, Pick, affiliate route, Atlas identity, retailer, or destination. It introduces no Rakuten, Amazon, Newegg, DataForSEO, feed, SFTP, scraping, credential, or deployment behavior.

## Certification result

Fixture coverage proves deterministic composition, multiple adapters, canonical binding, lifecycle filtering, unknown-value preservation, compact outcomes, failure isolation, bounded concurrency, timestamp preservation, scoped replacement/removal, repository replay, manual fallback, downstream 36-hour freshness, and public winner recomputation. External operations and spend are `$0.000`.
