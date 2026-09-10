# IC-RAKUTEN-RIGHTS-017 — Rakuten Product Catalog Source Rights and Production-Use Authority

## Status and scope

RAKUTEN-RIGHTS-017 records a documentation-only, capability-separated rights assessment for the Newegg Product Catalog made available through Rakuten Advertising. The assessment establishes only the rights supported by captured evidence. It changes no `SourceRightsPolicy`, source-rights profile, adapter, SFTP transport, retained evidence, Current Display, historical observation, public page, affiliate route, or production authority.

The resulting classification is `RAKUTEN_PRODUCT_CATALOG_RIGHTS_PARTIALLY_ESTABLISHED`.

## Evidence and authority boundaries

The reviewed evidence is:

- operator-confirmed Newegg advertiser approval and Product Catalog access through Rakuten Advertising;
- Rakuten Advertising *Product Catalog Appendix A - File Field Definitions* (September 8, 2026), authoritative for current field definitions;
- Rakuten Advertising *Product Catalog Data Feed Implementation Guidelines for Publishers* (December 2023), authoritative for nonconflicting file structure, Appendix B classes, examples, SFTP, full/delta behavior, and technical processing;
- the captured Newegg affiliate-program evidence summarized in `docs/compliance/NewEgg/RC002 — Newegg Affiliate Catalog.md`;
- the fail-closed capability model in IC-MERCURY-RIGHTS-001 and IC-MERCURY-RIGHTS-002.

The two Rakuten documents are technical Product Catalog specifications. They do not, by themselves, license every downstream use of catalog data. Advertiser approval and working feed access establish technical availability and scoped acquisition authority; they do not implicitly establish public display, price comparison, historical retention, recommendation, analytics, or redistribution authority.

## Capability assessment

`UNRESOLVED` below means Hardware Radar has no production authority for that capability. It maps operationally to fail closed, not to a permissive default.

| Capability | Assessment | Evidence and conditions | Hardware Radar implication |
| --- | --- | --- | --- |
| `ACQUISITION_ALLOWED` | `AUTHORIZED` | Newegg advertiser approval plus enabled Rakuten Product Catalog access supports acquisition through the approved feed and account | Feed acquisition may occur only through the governed Rakuten/Newegg transport and existing operator authority |
| `EPHEMERAL_PROCESSING_ALLOWED` | `AUTHORIZED` | The documented downloadable feed format necessarily supports transient local transfer, integrity validation, parsing, normalization, and bounded review within the approved feed workflow | Technical inspection and ephemeral normalization are allowed; no downstream capability is implied |
| `CURRENT_DATA_RETENTION_ALLOWED` | `UNRESOLVED` | No captured term establishes a cache duration, production retention duration, refresh duty, or post-access removal rule | No production current-data retention profile may be enabled |
| `PUBLIC_PRODUCT_DISPLAY_ALLOWED` | `UNRESOLVED` | Affiliate promotion and deep linking are supported generally, but the captured evidence does not expressly establish republication of Product Catalog fields on Hardware Radar | Public feed-derived product display remains unauthorized |
| `PUBLIC_PRICE_DISPLAY_ALLOWED` | `UNRESOLVED` | RC002 previously classified current price display as likely but requiring verification; no authoritative feed-use term has resolved it | Public feed-derived prices remain unauthorized |
| `PRICE_COMPARISON_ALLOWED` | `UNRESOLVED` | No captured source expressly permits cross-retailer comparison using Product Catalog data | Comparison remains unauthorized |
| `RECOMMENDATION_USE_ALLOWED` | `UNRESOLVED` | No captured source addresses using feed content for recommendations or Picks | Recommendation use remains unauthorized |
| `HISTORICAL_RETENTION_ALLOWED` | `UNRESOLVED` | No captured source permits durable retention of successive feed observations | No Mercury historical admission is authorized |
| `PRICE_HISTORY_ALLOWED` | `UNRESOLVED` | No captured source permits public or internal price-history construction from successive catalog prices | Price-history use remains unauthorized |
| `DERIVED_ANALYTICS_ALLOWED` | `UNRESOLVED` | No captured source defines permission for durable statistics, trends, benchmarks, or other derived analytics | Derived analytics remain unauthorized |
| `API_REDISTRIBUTION_ALLOWED` | `UNRESOLVED` | No captured source grants sublicensing, API delivery, bulk export, or redistribution rights | Redistribution remains unauthorized |

Affiliate deep linking is supported by the captured Newegg affiliate-program evidence, subject to the approved affiliate relationship and applicable link/attribution requirements. That link authority is independent of rights to retain or display feed fields. Affiliate status does not decide Mercury observation eligibility.

## Freshness, modification, and termination

The provider documents establish that feeds may be processed or updated multiple times per day and that full and delta files exist. This is an operational fact, not an explicit cache TTL, public-price freshness SLA, or license to retain stale values. The repository fixture TTL is an internal safety constraint and is not provider-granted authority.

The reviewed evidence does not establish:

- mandatory public attribution wording or presentation rules beyond ordinary governed affiliate linking;
- a maximum cache or display age;
- permission to alter, summarize, compare, or combine Product Catalog fields;
- a required withdrawal interval after a delete record, advertiser termination, publisher termination, or loss of feed access;
- whether previously acquired raw data, historical observations, or derived artifacts must be deleted after termination.

Hardware Radar therefore must stop new acquisition or downstream use when the applicable advertiser approval, account access, or declared right is absent. That fail-closed behavior is Hardware Radar governance; it is not presented as a provider-authored deletion rule. Treatment of previously retained material remains unresolved until authoritative terms address it.

## Production consequence

The current fixture profile remains intentionally conservative: acquisition and ephemeral processing are the only established feed-data capabilities. Public display, comparison, historical retention, and all other unresolved capabilities remain false. No runtime rights flag is changed by this investigation, and no staged or downloaded file gains production authority.

Technical corrections certified by RAKUTEN-SFTP-003–013 and RAKUTEN-NEWEGG-014–016 remain useful for safe transport and parsing, but technical correctness does not cure a rights gap. Likewise, a valid destination, exact MPN, price, availability, or delta modification does not authorize Current Display, Mercury history, publication, Cheapest, or Picks.

## Provider clarification request

Before enabling any unresolved capability, obtain sufficiently authoritative Rakuten/Newegg terms or written confirmation answering, at minimum:

1. May an approved publisher display Product Catalog product fields and current prices on its own comparison site?
2. May those current prices be compared with prices from other retailers?
3. What cache/retention duration, refresh frequency, stale-data handling, attribution, and link requirements apply?
4. May successive observations be retained internally, and may price history be shown publicly?
5. May catalog data support derived analytics, rankings, or recommendations?
6. Is API, bulk-export, sublicense, or other redistribution permitted?
7. What removal or deletion duties apply after a delete record, advertiser withdrawal, account termination, or loss of feed access?
8. Are there advertiser-specific Newegg restrictions beyond Rakuten's publisher terms?

Submitting these questions is not itself permission evidence. Any response must be classified capability by capability before runtime rights can change.

## Certification conclusion

Rakuten/Newegg Product Catalog acquisition and ephemeral technical processing are established for the approved account/feed path. Affiliate deep linking is separately supported. Production current-data retention, public product or price display, price comparison, recommendations, historical retention, price history, derived analytics, and API redistribution remain unresolved and therefore fail closed.
