# IC-RAKUTEN-NEWEGG-014 — Bounded Live Feed Normalization Review

## Status and scope

RAKUTEN-NEWEGG-014 performs a local, review-only execution of the existing `RakutenProductCatalogParser` and `mer_adapter_rakuten_newegg_product_catalog` against the already downloaded and integrity-validated Newegg main delta `44583_4746097_mp_delta.txt.gz`. It opens no SFTP connection, downloads nothing, writes no production current-display state, and creates no Atlas, destination, Mercury history, publication, winner, or affiliate state.

## Documentation-first result

The captured Rakuten Product Catalog documentation remains the source-contract authority. The staged delta validates completely as 4,250 physical product records, all with 39 fields and explicit `I`, `U`, or `D` modification values. This supports the observed delta shape but one feed does not independently promote that shape into universal provider doctrine.

The live review exposed a field-map discrepancy after structural parsing. The existing fixture-derived base-field map read field 25 as `currency`; every live row produced `140` there rather than `USD`. RAKUTEN-NEWEGG-014 correctly stopped instead of relabeling fields from plausible live values. The subsequently supplied September 8, 2026 Rakuten Appendix A confirms this was implementation defect `FIELD_25_CLASS_ID_MISREAD_AS_CURRENCY`, not an unresolved documentation/live discrepancy: field 25 is Class ID and field 26 is Currency.

## Exact destination review

Only active `RETAILER-0004` destinations participate. Exact listing/SKU identity is primary; decoded Newegg `murl` may corroborate it; exact MPN disagreement blocks; UPC is supporting source evidence only. Title matching, fuzzy MPN matching, destination creation, product creation, and affiliate URL generation are prohibited.

The review found seven exactly bound live rows across six of the 94 effective Newegg RAM destinations. All seven URLs corroborated the same destinations; there were no URL, MPN, or multiple-destination identity conflicts. One destination has two applicable live rows, which the existing adapter correctly rejects rather than selecting or ordering implicitly; provider-supported delta sequencing semantics remain unresolved. One exact row carried `D`, but no production withdrawal was performed. A delta is not expected to cover every destination.

## Normalization and downstream safety

All seven exact rows fail the adapter's USD gate under the unresolved field map and return `INVALID_SOURCE_RESULT`; the duplicate destination scope also violates the adapter's one-applicable-row invariant. Therefore no live row becomes normalized current-display evidence. Price, availability, and shipping cannot be promoted from their currently mapped positions. Condition remains unestablished/null, marketplace and seller identity remain unresolved, and neither main-feed presence nor absence of an explicit condition may imply `NEW` or first-party sale.

The default review rights profile allows only the already authorized acquisition-shaped local ephemeral review. Production public-display, comparison, and historical-retention rights remain false. Consequently the hypothetical persisted effect is zero added offers, zero updated offers, zero withdrawals, and no winner change.

## Evidence and audit

The ignored review artifact contains only deterministic aggregate counts, permitted destination/product identifiers for the seven bounded RAM matches, safe structural status, timestamps, the local staged-file digest, and zero-operation/mutation declarations. It contains no raw feed records, product descriptions, affiliate URLs, credentials, or secrets.

Remote size remains informational: the server reported 1,046,885 bytes, 1,029,070 bytes transferred, a difference of -17,815 bytes, while remote EOF, local finish, gzip, header, trailer, and the 4,250-row count all passed. Remote SFTP time `2026-09-10T00:21:23.000Z` and header time `2026-09-10T01:21:21.000Z` remain separate.

## Next boundary

RAKUTEN-NEWEGG-015 supersedes the positional blocker using Rakuten Appendix A and strict ordinary full/delta profiles. The separate multiple-applicable-row lifecycle remains unresolved and requires provider-supported sequencing semantics before production normalization.
