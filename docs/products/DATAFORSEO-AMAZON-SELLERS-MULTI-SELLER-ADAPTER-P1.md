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

The canonical Amazon product destination is classified `CHANNEL_PRODUCT_DESTINATION`; it is not evidence that a retained marketplace price has a seller-offer-corresponding action. The adapter therefore always preserves `OFFER_ACTION_NOT_ESTABLISHED` for this retained population.

## Canonical retained-evidence certification

The certified offline inventory contains 49 tasks/results, 218 retained observations, 32 exact Atlas products, and 32 exact ASINs. Every row resolves to an immutable canonical provider result and an active exact Amazon product destination. It contains 13 Amazon.com rows, 186 known third-party rows, and 19 seller-unresolved rows; 199 rows bear item price/currency. Conditions are 165 new, 17 used-like-new, 13 used-very-good, and 23 unknown. Availability is absent in all 218 rows. Seller URLs are 185 seller-profile pages, one other Amazon path, and 32 absent.

The adapter produces 165 distinct deterministic offer identities from the 218 temporal observations. Product coverage is three products with one deterministic seller, five with two, 23 with three or more, seven with Amazon.com plus third-party sellers, 24 third-party-only, and 15 with at least one unresolved-seller row.

The qualification funnel is:

| Gate | Rows |
|---|---:|
| Representable | 218 |
| Identity-ready | 218 |
| Seller-ready | 199 |
| Condition-ready | 195 |
| Availability-ready | 0 |
| Price-corresponding action-ready | 0 |
| Fresh under an established Amazon Current policy | 0 |
| Fully Current-qualification-ready | 0 |

No DataForSEO Amazon Sellers Current freshness policy exists yet, so freshness is explicitly unassessed rather than fabricated. Semantic readiness remains separate from freshness.

## Remaining evidence questions

The smallest future provider-contract question is whether an explicit Sellers result field or another governed Amazon endpoint establishes buyability/availability without inference. The smallest actionability question is whether the provider supplies a retained offer identifier or explicit seller-offer/add-to-cart destination that can be validated without URL synthesis. Provider reconnaissance, Amazon Associates compliance, Current progression, and public marketplace display remain separate increments.

## Authority and isolation

Provider calls, paid tasks, and spend are `0 / 0 / $0.000`. Canonical Current, History, Atlas, destinations, workbook, public output, Cheapest, Picks, Terminal, structured data, affiliate routing, publication, release, and deployment are unchanged. Future Amazon refresh may target exact schema-1.1 offer identities, but this increment activates no lane.
