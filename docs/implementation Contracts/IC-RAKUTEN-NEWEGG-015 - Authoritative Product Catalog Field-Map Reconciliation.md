# IC-RAKUTEN-NEWEGG-015 — Authoritative Product Catalog Field-Map Reconciliation

## Status and authority

RAKUTEN-NEWEGG-015 fixture-certifies the canonical ordinary Product Catalog positional map from two operator-supplied Rakuten Advertising sources: *Product Catalog Appendix A - File Field Definitions*, last edited September 8, 2026, and *Product Catalog Data Feed Implementation Guidelines for Publishers*, updated December 2023. The September 2026 Appendix A is authoritative for current field definitions where it supersedes the older guide. The December 2023 guide remains supporting authority for file structure, Appendix B class definitions, samples, SFTP behavior, delta behavior, and details not contradicted by current Appendix A. No full copyrighted provider document is copied into the repository.

Provider documentation is authoritative for source-interface semantics. Live observations verify implementation and reveal discrepancies; they do not replace published source contracts by assumption. This increment uses only the previously staged feed and performs no SFTP, download, production mutation, or spend.

## Canonical field map

`RAKUTEN_PRODUCT_CATALOG_FIELD_MAP` in `RakutenProductCatalogParser.js` is the single field-position owner used by parser records, adapter semantics, and fixtures. Rakuten field numbers are one-based; each entry explicitly stores its zero-based JavaScript index.

| Rakuten field | JS index | Canonical property |
|---:|---:|---|
| 1 | 0 | `productId` |
| 2 | 1 | `productName` |
| 3 | 2 | `sku` |
| 4 | 3 | `primaryCategory` |
| 5 | 4 | `secondaryCategory` |
| 6 | 5 | `productUrl` |
| 7 | 6 | `productImageUrl` |
| 8 | 7 | `buyUrl` |
| 9 | 8 | `shortDescription` |
| 10 | 9 | `longDescription` |
| 11 | 10 | `discount` |
| 12 | 11 | `discountType` |
| 13 | 12 | `salePrice` |
| 14 | 13 | `retailPrice` |
| 15 | 14 | `beginDate` |
| 16 | 15 | `endDate` |
| 17 | 16 | `brand` |
| 18 | 17 | `shipping` |
| 19 | 18 | `keywords` |
| 20 | 19 | `manufacturerPartNumber` |
| 21 | 20 | `manufacturerName` |
| 22 | 21 | `shippingInformation` |
| 23 | 22 | `availability` |
| 24 | 23 | `upc` |
| 25 | 24 | `classId` |
| 26 | 25 | `currency` |
| 27 | 26 | `m1` |
| 28 | 27 | `pixel` |
| 29–38 | 28–37 | `attribute1`–`attribute10` |
| 39 delta only | 38 | `modification` |

The prior fixture map omitted field 7 Product Image URL and therefore shifted Buy URL onward one position. This confirmed implementation defect is classified `FIELD_25_CLASS_ID_MISREAD_AS_CURRENCY`. Field 25 is now Class ID and field 26 Currency; documented Class ID `140` means Electronics and is never treated as currency or used to infer more-specific product semantics.

## Full, delta, and special classes

Appendix A establishes 38 fields for ordinary full files and 39 for ordinary delta files, with final `I`, `U`, or `D`, and Currency as a required three-character ISO code. The parser now exposes `MAIN_FULL` and `MAIN_DELTA`; SFTP selection and the local filename-aware validator pass the corresponding strict profile. The existing `MAIN` compatibility profile remains for callers whose file family is not supplied. Class ID 150 credit-card records are the documented special extended-width case; existing separate 51-field fixture behavior is retained rather than redefined here.

Attributes 1–10 remain opaque, class-dependent source fields. No universal RAM meaning is assigned without Appendix B/Class ID authority.

## Live offline result

The staged delta still passes gzip, HDR, 4,250 product rows, TRL 4,250, 39-field-only width, and modification counts `I=1,010`, `U=2,228`, `D=1,012`. Corrected mapping produces 4,250 USD rows. Class IDs are safely aggregated in the ignored review artifact.

Seven rows bind exactly across six of 94 effective Newegg RAM destinations. All seven decoded Product URLs corroborate the destination, with zero URL or MPN contradiction. Four update rows expose ordinary prices and `in-stock`; two updates remain `PRICE_SEMANTICS_UNRESOLVED` because positive sale and retail prices differ; one row is a source withdrawal. Condition remains null and public-display/comparison rights remain false, so zero rows are current-display eligible.

One destination still has two exact `U` rows at physical feed positions 1,685 and 3,695 with different retail prices and the same mapped availability. Rakuten documentation explicitly permits duplicate SKU values for some advertisers, so duplication itself is not a documentation/live discrepancy. The supplied sources do not establish a safe collapse or precedence rule for two applicable updates in one delta. `LIVE_ADAPTER_MULTIPLICITY_UNRESOLVED` remains fail closed; this increment does not choose first, last, highest, or lowest.

## Separation

The review artifact is ignored, deterministic, and contains safe aggregate or bounded identity metadata only. No production `CurrentDisplaySnapshot`, Atlas record, `RetailerDestination`, history, canonical observation, review, publication, Current Price, Cheapest, Pick, or affiliate route is created or changed.
