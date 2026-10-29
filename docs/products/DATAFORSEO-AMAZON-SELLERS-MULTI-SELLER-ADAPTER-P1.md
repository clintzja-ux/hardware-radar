# DataForSEO Amazon Sellers multi-seller adapter P1

Status: implemented and fixture-certified

Policy version: `DATAFORSEO-AMAZON-SELLERS-MULTI-SELLER-ADAPTER-P1-1.0`

## Purpose

This adapter maps already-retained, governed DataForSEO Amazon Sellers evidence into the certified Current schema 1.1 product/channel/seller/offer model. It is a zero-authority composition projection, not canonical Current and not a new acquisition, identity, destination, qualification, History, publication, or release owner.

## Reused owners and binding

- `DataForSeoAmazonContracts` and the immutable Amazon result repositories own normalized source evidence and canonical provider results.
- The existing Amazon identity lifecycle owns the exact Atlas-product/ASIN association.
- `RetailerDestination` owns the canonical Amazon product/channel destination.
- `CurrentOfferModel` owns schema-1.1 seller attribution, actionability state, and deterministic offer identity.
- Existing Current qualification remains the only Current authority.

Composition requires exact equality across retained evidence, confirmed Atlas product, ASIN, provider task, immutable result ID/digest, operation/source, and the active Amazon destination listing ID. Title, price, seller name, or time cannot substitute for that lineage.

## Semantics

The commerce channel is Amazon because the governed operation is `AMAZON_SELLERS`, its exact provider identity is an ASIN returned under the Amazon result contract, and the product has an exact canonical `amazon.com` destination. Seller name does not establish channel identity.

Actual deterministic seller attribution is preserved. Exact `Amazon.com` is classified first-party; other nonblank sellers are third-party marketplace sellers; absent seller is `UNKNOWN`. Amazon seller profile query identifiers may act as source-local seller identifiers, but seller profile pages never become offer actions. No seller becomes an Atlas retailer.

Offer identity uses Atlas product + Amazon channel + exact ASIN listing anchor + deterministic seller (when present) + condition. It is stable across price, observation time, acquisition mode, provider task, and evidence record changes. Different sellers or conditions remain different offers. Unknown-seller evidence remains representable through its exact ASIN anchor but carries an independent seller blocker.

The canonical Amazon product or all-offers destination is classified `CHANNEL_PRODUCT_DESTINATION`. It does not preselect the observed seller or guarantee that the observed price remains available. Under Hardware Radar's approved marketplace-navigation policy, that limitation no longer makes an otherwise trustworthy timestamped marketplace observation ineligible by itself. Public presentation must preserve the observed seller and time and disclose `PRODUCT_OR_ALL_OFFERS_NAVIGATION_SELLER_AND_PRICE_NOT_PRESELECTED`. A seller-profile URL may provide seller context, but it is not an offer action and must not replace the governed product destination.

The implemented adapter predates that policy correction and still emits `OFFER_ACTION_NOT_ESTABLISHED`, `comparisonEligible: false`, and `MARKETPLACE_CURRENT_NOT_QUALIFIED` unconditionally. Those are now implementation blockers rather than evidence that an exact seller-selected URL exists or should be constructed. Removing them requires a bounded adapter/qualification correction through the existing Current owners; this documentation update does not requalify retained evidence.

## Written DataForSEO clarification — 2026-10-29

DataForSEO confirmed in writing that:

1. No Amazon Sellers endpoint returns a stable offer-level identifier.
2. No documented Amazon URL preselects an exact seller offer.
3. Seller-profile and all-offers URLs are available.
4. DataForSEO states there is no restriction on using or displaying the returned URLs.
5. Sellers results are timestamped snapshots; Amazon prices and featured offers may change after observation.
6. The Sellers HTML function exposes raw offers-page markup, but undocumented Amazon internal values are not stable identifiers and must not be promoted as such.

Hardware Radar therefore must not synthesize an offer ID, treat an undocumented HTML value as durable identity, or claim that a destination selects the observed seller. Exact Atlas product + governed ASIN + Amazon marketplace + observed seller + condition remain the deterministic offer identity inputs. Product/all-offers navigation is acceptable only with the marketplace-navigation disclosure and all ordinary Current, rights, freshness, availability, shipping, fee, and comparability gates.

## Canonical retained-evidence certification

The certified offline inventory contains 49 tasks/results, 218 retained observations, 32 exact Atlas products, and 32 exact ASINs. Every row resolves to an immutable canonical provider result and an active exact Amazon product destination. It contains 13 Amazon.com rows, 186 known third-party rows, and 19 seller-unresolved rows; 199 rows bear item price/currency. Conditions are 165 new, 17 used-like-new, 13 used-very-good, and 23 unknown. An explicit provider availability field is absent in all 218 rows. The subsequent versioned `DATAFORSEO-AMAZON-SELLERS-OFFER-PRESENCE-P1-1.0` policy establishes narrower source-semantic presence for 199 rows with valid USD seller price, affirmative seller-item delivery message, current-or-future delivery start date, and no malformed or negative delivery evidence. The remaining 19 stay unknown. Seller URLs are 185 seller-profile pages, one other Amazon path, and 32 absent.

The adapter produces 165 distinct deterministic offer identities from the 218 temporal observations. Product coverage is three products with one deterministic seller, five with two, 23 with three or more, seven with Amazon.com plus third-party sellers, 24 third-party-only, and 15 with at least one unresolved-seller row.

The qualification funnel is:

| Gate | Rows |
|---|---:|
| Representable | 218 |
| Identity-ready | 218 |
| Seller-ready | 199 |
| Condition-ready | 195 |
| Offer-presence/availability-ready under the subsequent versioned policy | 199 |
| Seller + NEW + USD price + offer-presence ready | 165 |
| Above rows with explicit shipping amount | 23 |
| Exact seller-preselected action available | 0 (not required by approved marketplace-navigation policy) |
| Fresh under an established Amazon Current policy | 0 |
| Fully Current-qualification-ready | 0 |

All 218 retained rows are now stale. Across the retained population, 34 rows have an explicit shipping amount and 184 have unknown shipping; within the 165 seller/new/USD/presence-ready rows, 23 have explicit shipping and 142 do not. No retained row carries a separately established mandatory-fee amount. Unknown shipping or unavoidable fees must never be treated as zero and prevent delivered-cost Cheapest/Pick comparison until established. No DataForSEO Amazon Sellers Current freshness policy exists yet, so freshness is explicitly unassessed rather than fabricated. Semantic readiness remains separate from freshness.

## Qualification assessment and remaining gaps

**Assessment:** future fresh Sellers observations can support product-level Amazon marketplace navigation under the approved policy; an exact seller-preselected action is neither available nor required. The current adapter cannot yet admit them because its pre-policy action blocker and comparison flags remain hard-coded.

The remaining eligibility gaps are:

- establish and certify a DataForSEO Amazon Sellers source-specific Current freshness policy;
- update the existing adapter and Current qualification composition to accept governed product/all-offers navigation with the required seller/time/non-preselection disclosure;
- reconcile the automated-lane certification with the already implemented exact ASIN destination binding and offer-presence semantics;
- require explicit shipping and unavoidable-fee treatment for delivered-cost comparison—unknown values remain ineligible for Cheapest and retailer pricing used by Picks;
- preserve independent source-rights, seller, `NEW` condition, USD price, availability/presence, canonical destination, and exact provider-lineage validation;
- keep Amazon Associates eligibility independent from Current and comparison eligibility.

No retained row is eligible for requalification: all are stale, and none establishes the complete delivered-cost fee treatment. New paid Sellers acquisition is not justified solely by this clarification; first certify the bounded adapter/freshness correction, then authorize only a small evidence-gathering canary if the expected shipping/fee yield can answer the remaining commercial question.

## Authority and isolation

Provider calls, paid tasks, and spend are `0 / 0 / $0.000`. Canonical Current, History, Atlas, destinations, workbook, public output, Cheapest, Picks, Terminal, structured data, affiliate routing, publication, release, and deployment are unchanged. Future Amazon refresh may target exact schema-1.1 offer identities, but this increment activates no lane.
