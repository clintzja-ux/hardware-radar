# IC-RAKUTEN-NEWEGG-CURRENT-COMMERCE-RIGHTS-001 — Current Commerce Rights and Semantics Reconciliation

**Status:** IMPLEMENTED / FIXTURE-CERTIFIED / PRODUCTION REFRESH NOT COMPOSED
**Owner:** Mercury source-rights and current-display boundaries
**Date:** 2026-09-18

## Purpose and evidence

This increment reconciles the approved Hardware Radar Newegg Product Catalog relationship with current official Rakuten publisher documentation. The operator-confirmed relationship evidence is recorded only as the non-secret reference `OPERATOR_CONFIRMED_APPROVED_NEWEGG_ADVERTISER_AND_PRODUCT_CATALOG_ACCESS_2026_09_18`. No account, credential, site, or private program identifier is retained.

Official Rakuten evidence establishes that Product Catalog is an approved-advertiser feed intended for publisher websites that maintain current product links and information. Rakuten expressly identifies shopping-comparison and price-comparison sites as intended Product Catalog users and describes comparison of products from different advertisers by price. Dynamically generated downloads and daily-updated publisher databases establish current-commerce processing rather than durable price history.

Canonical references are:

- Rakuten Advertising Publisher Help Center, *Product Catalog Overview*, last edited July 11, 2025;
- Rakuten Advertising Publisher Help Center, *Data Feeds*, last edited September 22, 2025;
- Rakuten Advertising Publisher Help Center, *Download Product Catalog Data Feed Files*, last edited August 20, 2025; and
- the already captured December 2023 Product Catalog implementation guide and September 8, 2026 Appendix A field definitions for technical semantics.

## Capability-separated rights

`SourceRightsRegistry` profile `RAKUTEN_NEWEGG_PRODUCT_CATALOG` is the canonical runtime owner. It grants only the approved Newegg US Product Catalog current-commerce scope.

| Capability | State | Meaning |
| --- | --- | --- |
| governed feed import | `ALLOWED` | SFTP-acquired Product Catalog files may enter the certified server-side parser path |
| manual/scraped acquisition | `BLOCKED` | No Newegg page scraping or manual-price substitute |
| ephemeral processing | `ALLOWED` | Transfer, validation, parsing, source reconciliation, qualification, and bounded current projection |
| current observation | `ALLOWED` | Qualified current feed observations may enter the current-display boundary |
| current/ephemeral retention | `ALLOWED` | Current plus immediately previous replaceable display state under the existing 36-hour Hardware Radar public-current safety policy |
| public current-price display | `ALLOWED` | Only after identity, offer, destination, freshness, and current-market qualification |
| cross-retailer item-price comparison | `ALLOWED` | Only among otherwise comparable qualified offers |
| historical retention | `BLOCKED` | No feed-derived longitudinal price history |
| derived analytics | `BLOCKED` | Not independently established |
| offer-condition derivation | `CLARIFICATION_REQUIRED` | Product Catalog access does not itself prove `NEW` |
| recommendation | `BLOCKED` | No Compass/Pick authority |
| redistribution/API | `BLOCKED` | No external feed-data API or bulk redistribution |
| attribution | `CONDITIONAL` | Existing affiliate/program presentation requirements remain independently applicable |

The 36-hour value is Hardware Radar's existing public-current safety policy, not a provider-authored license duration or feed SLA. Source documents say information is updated daily and generated dynamically, while actual timeliness depends on advertiser updates. Hardware Radar must not represent that operational statement as a guaranteed refresh interval.

## Source and offer semantics

The existing source-local projection remains authoritative for Rakuten catalog state:

- the exact `[productId, sku]` pair is source identity;
- equal destination URLs do not merge distinct source entries;
- repeated same-key delta records apply in physical order and the last physical record wins;
- a later full replaces complete current Rakuten membership; and
- disappearance or `D` removes only current Rakuten source membership, never Atlas, Mercury history, or another source.

Appendix A establishes `Retail Price`, `Sale Price`, `Shipping`, `Availability`, `Currency`, Product ID/SKU, MPN, UPC, and Class ID positions. The adapter currently exposes a positive USD retail price only when sale price is absent/equal. A distinct positive sale price stays `PRICE_SEMANTICS_UNRESOLVED`; numerical cheapness is not a precedence rule. Blank, zero, malformed, or non-USD price state fails closed. Retailer-claimed savings, MSRP, promotion timing, tax, and delivered cost are not inferred.

### Product Catalog price-semantics evidence reconciliation

Public first-party Rakuten documentation was rechecked on 2026-09-18 without connecting to SFTP or using publisher credentials. The canonical public references are:

- Rakuten Advertising Publisher Help Center, *Product Catalog Appendix A - File Field Definitions*, last-edited date displayed as December 1, 2023, <https://pubhelp.rakutenadvertising.com/hc/en-us/articles/8191594256013-Product-Catalog-Appendix-A-File-Field-Definitions>; and
- Rakuten Advertising, *Product Catalog Data Feed Implementation Guidelines for Publishers*, updated December 2023, public attachment <https://pubhelp.rakutenadvertising.com/hc/es/article_attachments/22365119792013>.

The sources establish only these price-contract facts needed here:

- field 13 `Sale Price` is optional numeric data and reflects discounts;
- field 14 `Retail Price` is required numeric data and does not reflect discounts;
- field 15 `Begin Date` is an optional `mm/dd/yyyy hh:mm:ss` date/time when the product becomes available;
- field 16 `End Date` is an optional `mm/dd/yyyy hh:mm:ss` date/time when the product ceases to be available; and
- field 26 `Currency` is a required three-character ISO currency code, with USD documented as the default.

The reviewed sources do **not** establish that Sale Price is the current actionable selling price, that it overrides Retail Price, or that Begin/End Date govern Sale Price rather than product availability generally. They do not define blank-date, one-sided-window, timezone, boundary-inclusivity, blank/zero/malformed Sale Price, inactive dated Sale Price, or Retail Price fallback behavior. They also do not state explicitly whether Currency applies independently to both price fields, although it is the row's only documented currency field. Those points remain `NOT_ESTABLISHED`; no Hardware Radar behavior may be inferred from field names, numerical ordering, or the Kingston example.

For the production-shaped Kingston row (`Sale Price=299.99`, `Retail Price=319.99`, blank Begin/End Date, `Currency=USD`), the only source-contract-safe result remains `CURRENT_ITEM_PRICE_UNRESOLVED`. This evidence reconciliation creates no runtime rule and preserves the adapter's fail-closed behavior.

The reviewed official material does not establish that every main-feed row is sold by Newegg first party or is new merchandise. Separate marketplace/additional feeds demonstrate source populations but do not make main-feed absence an affirmative seller/condition field. The adapter therefore keeps `sellerType`, `sellerName`, and `condition` null. `NEWEGG_MKPL` remains explicitly marketplace-shaped and cannot enter normal standalone-new comparison without its own seller/condition/offer qualification.

Feed shipping is retained only as source evidence. Normalized shipping and fees remain unknown. A rights-eligible item price may eventually be displayed with the exact existing exclusion disclosure, but delivered-cost comparison and delivered-cost Cheapest remain unavailable while mandatory shipping/fees are unknown. Tax remains excluded and geography-dependent.

The current certified scope is the US `newegg.com` destination population with USD records. It grants no global applicability.

## Runtime and authority separation

`RakutenNeweggProductFeedAdapter` now derives its default current-display rights flags from the canonical rights profile rather than a fixture-only pending-rights object. Rights removal leaves `CONDITION_NOT_ELIGIBLE` as the normal valid-main-row fixture blocker. The adapter still cannot create Atlas identity, destinations, historical evidence, publication decisions, Current Price, Cheapest, Picks, recommendations, affiliate winners, or release authority.

The source-neutral `CurrentRetailRefreshOrchestrator`, replaceable `CurrentDisplaySnapshot`, public current-retail projection, publication qualification, certified static artifact builder, and static release control remain separate owners. Release remains `OFF`, and no real publication artifact is bound.

No production adapter registry, ordered source-file checkpoint, current source-state persistence, refresh PREPARE/EXECUTE command, scheduler, restart recovery, or source-health projection is introduced here. Those are production-composition concerns. Forge and Beacon are not first-canary blockers before a bounded supervised run, but established exceptions and health should ultimately project to them.

## Readiness and next gate

Rights and deterministic source-state semantics are closed. Current-item-price qualification remains blocked independently by (1) offer classification, because canonical evidence still does not prove first-party seller plus `NEW` condition for the bounded main-feed population, and (2) unresolved Product Catalog price precedence/window semantics when distinct positive Sale and Retail prices coexist. Shipping additionally blocks total-cost comparison. Historical use remains prohibited.

`IC-RAKUTEN-NEWEGG-MAIN-FEED-SEMANTICS-001` completed the zero-network seller/condition evidence closure. Available authority remains insufficient to establish first-party seller, `NEW`, or standalone semantics for every bounded main-feed row, so the adapter correctly preserves unknown state. Separately, the public price-field documents establish field definitions but not the precedence and validity rules required to choose an actionable price. The smallest price-semantics action is a narrowly scoped clarification from Rakuten Advertising Publisher Support covering the unresolved contract questions above. Production refresh composition and runtime implementation must not bypass either evidence gap.

## Safety

This increment made zero Rakuten connections, downloads, credential tests, provider calls, paid tasks, production source-state writes, CurrentDisplaySnapshot writes, evidence/history writes, publication decisions, release changes, or deployments. Spend was `$0.000`.
