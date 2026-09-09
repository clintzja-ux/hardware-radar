# IC-RAKUTEN-NEWEGG-002 — Rakuten Newegg Product Catalog Fixture Adapter

**Status:** FIXTURE-CERTIFIED
**Owner:** Mercury current-display source-adapter boundary
**Date:** 2026-09-09

## Purpose

Certify a zero-network `RakutenNeweggProductFeedAdapter` beneath the existing source-neutral current-retail refresh architecture using sanitized fixtures derived from the operator-observed Rakuten Newegg Product Catalog schema. This contract implements no live transport, credentials, production registration, scheduler, affiliate routing, or provider operation.

## Parser boundary

`parseRakutenProductCatalogGzip` accepts local compressed bytes or a readable stream and incrementally decompresses and parses pipe-delimited records. Quoted pipe characters and doubled quotes are supported. A valid file requires one leading `HDR`, one terminal `TRL`, a valid source timestamp, exactly 38 ordinary or 39 delta fields per product row, supported delta values `I`, `U`, or `D`, and an exact trailer/product-row count. Malformed compression, quoting, shape, ordering, modification, or counts fail closed.

The parser yields records as they are read; future full feeds need not be materialized. Tiny test fixtures may be collected for assertions. Fixtures retain only minimum sanitized schema behavior and contain no SFTP identity, credential, private tracking identity, or real feed payload.

## Exact Newegg binding

The adapter operates only against active existing Newegg `RetailerDestination` records. Exact retailer SKU/listing identity is primary. The underlying Newegg merchant URL decoded from Rakuten `murl` may independently corroborate the same listing. MPN is corroborating evidence and an explicit contradiction fails closed; UPC is preserved as source evidence. Title and category text never establish identity, and no destination is created or replaced.

Rakuten tracking URLs remain source metadata. The canonical destination URL and identity remain Mercury-owned and are never replaced by affiliate routing data.

## Price, availability, condition, and shipping

The fixture profile requires USD and performs no currency conversion. `in-stock` maps to `AVAILABLE`; unseen values map to `UNKNOWN`. Main-feed presence establishes neither first-party seller state nor condition, so condition and seller fields remain null.

Retail price is exposed only when it is a positive ordinary price. A distinct positive sale price produces `PRICE_SEMANTICS_UNRESOLVED` until a separate timing/discount policy exists; the adapter never chooses the lowest number. Source sale timing and price fields remain compact source evidence.

Source shipping, including `0.00`, is preserved only as `sourceEvidence.sourceShippingUsd`. Governed normalized `shippingUsd` and `feesUsd` remain null because the current-display contract does not grant shopper-wide delivered-cost authority. No tax or delivered-cost Cheapest value is inferred.

## Delta and profile semantics

- `I` and `U` may produce a normalized current observation after exact validation.
- `D` produces `SOURCE_WITHDRAWN`. The orchestrator removes a prior offer only when it was produced by this same adapter; manual or alternate-source evidence remains intact. Atlas and canonical destinations are never deleted.
- `NEWEGG_MKPL` may preserve positive marketplace-source context only for that explicit profile. It does not establish condition or seller identity and is fixture-only because the observed feed was stale.
- `ADDITIONAL_UNCLASSIFIED`, including a Jarrods-Tech-shaped fixture, establishes no marketplace or seller semantics merely from an additional-feed name.

## Rights and downstream behavior

Fixture rights permit acquisition-shaped parsing and ephemeral retention only. Production public-display and comparison rights remain unconfigured/false; historical retention is false. A valid price with available stock and exact destination remains item-price ineligible because condition is null and source public/comparison rights are not approved.

The adapter preserves the header-supported feed timestamp as `observedAt`; import runtime never retimestamps it. Existing `PublicCurrentRetailProjection` retains sole ownership of the 36-hour public freshness rule and winner calculation.

`CurrentDisplaySnapshot` remains the only ephemeral repository. The adapter creates no Atlas record, destination, durable evidence/history, canonical observation, review, E2S state, publication, Current Price, Cheapest/Pick authority, or affiliate route.

## Full, delta, and source-loss strategy

A future production integration should periodically stream the full Newegg feed for reconciliation and routinely stream deltas, discarding every row that does not exactly match a known destination. Category feeds are excluded from initial identity design. Source failure preserves prior evidence at its original time so it expires naturally; unaffected and manual sources remain available, consistent with ADR-060.

## Future live transport

A separately certified `RakutenProductCatalogSftpTransport` would own SFTP-only access, binary-safe compressed download, extraction and trailer validation, remote/header time handling, replaceable retries, and secrets supplied outside Git. It should default to one connection and must never exceed five concurrent SFTP connections. File size alone is insufficient validation. This increment exposes no transport or production refresh command.

## Certification result

Local fixture coverage proves gzip and record parsing, header/trailer validation, 38/39-field behavior, exact known-destination matching including all 94 current Newegg destinations, conservative prices, USD enforcement, unknown preservation, I/U/D behavior, source-scoped deletion, explicit MKPL/non-generalized additional profiles, source loss, downstream fail-closed eligibility, and zero network/spend.
