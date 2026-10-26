# IC — DataForSEO Amazon Sellers Current qualification P1

Status: implemented and fixture-certified; retained production evidence remains public-Current-ineligible

Policy versions:

- `DATAFORSEO-AMAZON-SELLERS-MULTI-SELLER-ADAPTER-P1-1.1`
- `DATAFORSEO-AMAZON-SELLERS-CURRENT-FRESHNESS-P1-1.0`
- `DATAFORSEO-AMAZON-SELLERS-OFFER-ACTION-P1-1.0`

## Ownership and freshness

The existing DataForSEO Amazon Sellers Current adapter composes immutable provider-result lineage, governed ASIN identity, canonical Amazon product destinations, the schema-1.1 Mercury Current offer model, and source-rights decisions. It creates no alternative Current repository or qualification engine.

Amazon Sellers observations are Current-fresh for at most 24 hours after the exact provider observation timestamp. The boundary is inclusive. A future-dated observation is invalid; an older observation is stale. Expiry is calculated once from provider time and is never extended by retrieval, processing, retention, or replay. Historical retention remains an independent decision. The 24-hour limit reflects volatile multi-seller price, merchant, availability, and delivery state while retaining a practical daily observation cadence; it is deliberately stricter than the general 36-hour public projection ceiling.

## Seller, condition, price, and presence

Current readiness requires exact Atlas product and reusable governed ASIN identity; exact Sellers task, immutable result, and retained-evidence lineage; a known merchant name; explicit `NEW` condition; a finite non-negative item price in `USD`; and `OFFER_PRESENT_EVIDENCED` seller-item delivery evidence. Amazon.com is classified separately from known third-party merchants, but neither class bypasses the same gates. Used, unknown-condition, missing-merchant, missing-price, non-USD, unavailable, contradictory, bundled, or ambiguous evidence fails closed.

Known numeric shipping remains separate from item price. Unknown shipping or fees prevents delivered-cost comparison but does not manufacture zero shipping. Any item-price comparison continues to carry the existing public disclosure that shipping, taxes, and fees may be excluded.

## Exact offer action

A canonical `/dp/ASIN` product destination is navigation evidence only. A seller profile is merchant identity evidence only. Neither proves that the observed seller and price will be selected for the shopper.

Price-corresponding action requires an independently governed `EXACT_SELLER_OFFER` binding to the same destination, Atlas product, retailer, marketplace, ASIN, merchant name, provider seller token, and an HTTPS Amazon merchant-offer URL whose ASIN path and `smid` or `seller` selector match the retained seller. Missing, generic, affiliate-decorated-only, contradictory, or ambiguous actions are rejected. Amazon affiliate authority remains separate and is not inferred.

Even a fully qualified offer receives only canonical Current and public-offer eligibility from this adapter. Cheapest and Pick authority remain false here and continue through ordinary comparison and recommendation policy.

## Retained corpus certification

The 218 retained immutable Amazon Sellers rows across 32 products were recomposed read-only from both canonical provider-result repositories and the effective production destination set:

| Gate | Rows passing |
| --- | ---: |
| Exact immutable lineage, Atlas identity, governed ASIN, and canonical Amazon product destination | 218 |
| Known merchant identity | 199 |
| Usable USD item price | 199 |
| Seller-item offer-presence evidence | 199 |
| Explicit `NEW` condition | 165 |
| Known numeric shipping | 34 |
| All factual gates before action and freshness | 165 |
| Exact price-corresponding seller action | 0 |
| Fresh at the 2026-10-26 assessment time | 0 |
| Fully public-Current-ready | 0 |

The latest retained provider observation is `2026-09-30T05:36:23Z`; it expired on `2026-10-01T05:36:23Z`. The corpus contains 13 Amazon.com seller rows, 186 known third-party rows, 30 used rows, and 23 unknown-condition rows. No existing evidence supports public Amazon Current admission. Retained evidence and any independently eligible History remain unchanged.

## Authority boundary

This contract performs no provider call, paid action, ASIN promotion, H052 mutation, Current or History mutation, affiliate admission, Cheapest/Pick decision, publication, release, or deployment. A later Sellers canary must establish a governed exact seller-offer action and fresh evidence before public Current can be considered.
