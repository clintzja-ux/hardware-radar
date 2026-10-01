# IC-RAKUTEN-NEWEGG-016 — Delta Multiplicity Semantics Investigation

## Status and scope

RAKUTEN-NEWEGG-016 investigates, offline, multiple live delta rows that resolve to one canonical Newegg `RetailerDestination`. It changes no adapter selection behavior. It opens no SFTP connection, downloads nothing, and mutates no production Current Display, Atlas, destination, history, publication, winner, or affiliate state.

## Provider documentation and first-party clarification

The investigation uses the operator-supplied Rakuten Advertising *Product Catalog Appendix A - File Field Definitions* (September 8, 2026) as current field-definition authority and *Product Catalog Data Feed Implementation Guidelines for Publishers* (December 2023) for supporting structure, Appendix B classes, samples, SFTP, and delta behavior where not contradicted.

Documented facts are limited to the following relevant rules:

- SKU Number is required, is unique for a majority of advertisers, and may be duplicated by some advertisers.
- A delta contains advertiser-feed records processed as inserted, updated, or deleted; field 39 carries `I`, `U`, or `D`.
- advertisers may process feeds multiple times per day;
- periodic full-file retrieval is the reconciliation strategy described by the existing adapter contract.

First-party Rakuten technical clarification received September 14, 2026 now establishes the source-local rules that were unresolved when this contract was written:

- **R1 — distinct source identity:** different Product IDs or SKU values remain distinct Rakuten products/offers even when they share a retailer destination URL. They may represent variants, sizes, colors, or bundles. URL equality is not feed-entry identity.
- **R2 — repeated same SKU in one delta:** delta records are applied in physical sequence. When one Product ID/SKU repeats, the last physical record defines its resulting current source state.
- **R3 — later full catalog:** a subsequent `*_full` file is the authoritative baseline for complete current Rakuten catalog membership. Entries absent from that full become inactive/absent in Rakuten source state before later deltas are applied.

These rules govern Rakuten source-catalog state only. They do not make a Rakuten SKU an Atlas product ID, make a destination URL cross-source identity, or grant retention, publication, comparison, recommendation, Current Price, Cheapest, Pick, or affiliate authority.

## Live structural evidence

The ignored staged delta contains two `U` rows at physical lines 1,685 and 3,695 that resolve through the decoded Product URL to one canonical Newegg destination. Safe comparison establishes:

- Product ID: different;
- SKU: different;
- decoded Product URL target: same;
- Buy URL target: absent in both;
- MPN: same;
- UPC: same;
- Class ID and currency: same;
- retail price: different;
- sale price: absent in both;
- source shipping: different;
- availability: same;
- Modification: `U→U` in physical order.

This corrects the earlier contextual assumption that the two rows share one exact SKU. They do not. The evidence is consistent with distinct provider products or offers converging on one canonical retailer destination, but the available provider contract does not prove that interpretation. It also does not prove repeat updates or retransmission. The provider-identity conclusion remains unresolved.

## Governance decision and current implementation audit

Product ID and SKU remain preserved source evidence; neither replaces Atlas identity or Mercury destination ownership. Exact decoded destination corroboration does not authorize collapsing distinct provider identities. Price and shipping are not identity signals. Physical order is authoritative only for repeated records of the same Product ID/SKU within one delta under R2.

`RakutenNeweggProductFeedAdapter` therefore retains its existing invariant: exactly one applicable row is required for a destination refresh. Multiple applicable rows return `INVALID_SOURCE_RESULT`, represented operationally as `LIVE_ADAPTER_MULTIPLICITY_UNRESOLVED`. Both rows remain available only in bounded ignored diagnostics.

The parser already preserves every physical record and its ordinal, so distinct Product IDs/SKUs sharing one URL are not parser-deduplicated. The destination adapter also refuses to collapse multiple source entries into one observation. This satisfies R1's source-entry preservation and remains compatible with offer-comparability fail-closed behavior.

`RakutenCatalogStateProjection` now provides the source-local, deterministic current-catalog projection inside the existing Mercury Rakuten current-display adapter boundary. It:

1. keys entries by the documented Rakuten Product ID/SKU identity rather than destination URL;
2. folds delta records in preserved physical order so the last same-key record wins;
3. replaces active source membership from each later full before applying subsequent deltas;
4. marks absent/deleted source entries inactive without deleting Atlas products, retained Mercury evidence, historical observations, or other-source state; and
5. feeds the existing destination/identity/comparability boundaries without granting downstream authority.

The source-entry key is the exact pair `[productId, sku]`; changing either preserves a distinct source entry, irrespective of URL. Full inputs fail closed on duplicate exact source keys. Delta inputs are consumed in array/physical-record order without sorting; each `I` or `U` replaces that key and `D` removes it. A later full replaces the complete derived source membership before later deltas apply. The resulting projection is immutable, deterministically digested, and does not mutate its inputs.

The projection is derived and in-memory. No durable Rakuten source-state repository was introduced by this increment. `IC-RAKUTEN-NEWEGG-CURRENT-COMMERCE-RIGHTS-001` subsequently permits bounded current/ephemeral retention, but production source-state persistence and refresh composition remain unimplemented. `RakutenNeweggProductFeedAdapter` accepts an ordered `catalogFiles` sequence when source-state reconciliation is required and uses the projection before its existing destination, price, condition, and rights checks. Its `MAIN_DELTA` single-file path also applies same-key last-record precedence while retaining the existing delete outcome behavior. Legacy fixture profiles remain compatible.

## Historical and offer safety

Rakuten full/delta state is current source state, not Hardware Radar knowledge deletion. A missing SKU in a later full cannot erase Atlas knowledge, retained evidence, history, canonical observations, or cross-source identities. Distinct variants and bundles remain source offers until governed identity and comparability establish otherwise. Bundles do not compete with standalone Cheapest or establish standalone history; `UNKNOWN_COMPARABILITY` remains isolated; unknown shipping and fees are not zero.

The technical clarification itself did not broaden rights. The later, independently evidenced current-commerce reconciliation is recorded by `IC-RAKUTEN-NEWEGG-CURRENT-COMMERCE-RIGHTS-001`.

## Provider question (resolved)

The previously prepared question was answered by the September 14, 2026 first-party clarification summarized above. No private correspondence metadata is retained here.

> When a Product Catalog delta contains multiple rows that resolve to the same SKU, Product ID, or retailer product destination during one generated delta, is record ordering significant, and should publishers apply first-row, last-row, Modification sequence, Product ID, or another provider-defined precedence rule? How should distinct Product IDs or SKUs that resolve to the same retailer product URL be handled?

## Certification

Fixture coverage proves R1 same-URL distinct-source preservation; R2 same-key and interleaved last-physical-record precedence; R3 later-full replacement and subsequent-delta behavior; exact deterministic replay; input immutability; and Atlas/evidence/history isolation. Existing destination behavior remains fail closed where multiple distinct source entries still map to one destination. No public display, comparison, historical, identity, or affiliate authority is added.

**Certification:** R1 preserved and fixture-certified; R2 runtime-correct and fixture-certified; R3 runtime-correct and fixture-certified.
