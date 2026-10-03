# IC — DataForSEO Amazon Sellers offer-presence policy P1

Status: implemented and fixture-certified

Policy version: `DATAFORSEO-AMAZON-SELLERS-OFFER-PRESENCE-P1-1.0`

## Purpose and owner

This source-semantic policy lives inside the existing DataForSEO Amazon Sellers Current adapter. It does not create a second qualification owner. `CurrentMarketObservationQualificationService`, `CurrentOfferModel`, canonical source rights, and the freshness-policy owner remain authoritative.

The policy never claims DataForSEO returned an availability boolean. Its bounded factual statement is: at provider observation time, the seller-scoped Amazon all-offers result presented a USD-priced seller item with an affirmative delivery representation and a current-or-future delivery start date.

## Predicate

`OFFER_PRESENT_EVIDENCED` requires exact governed `DATAFORSEO_AMAZON / AMAZON_SELLERS` lineage and seller-item scope; a finite non-negative current price in USD; a non-empty seller-item delivery message; a valid seller-item `delivery_date_from` on or after the provider observation UTC calendar day; valid supplied delivery dates; and no negative or contradictory delivery signal.

Negative evidence wins. Malformed dates are ambiguous. Price-only, seller-only, condition-only, ships-from-only, generic Products delivery, and processing time are insufficient. Seller identity and condition remain independent gates: an unknown seller or used/unknown condition may have presence evidence without becoming an ordinary comparable Current offer.

An evidenced row maps to existing schema-1.1 `AVAILABLE` through `CONTRACTUALLY_DERIVABLE` source semantics. This versioned mapping applies only to DataForSEO Amazon Sellers.

## Certified retained population

All 218 retained immutable observations were inspected. Exactly 199 have seller-scoped delivery objects, non-empty messages, valid delivery start dates, valid USD prices, and known sellers; none has a malformed date or negative delivery message. Those 199 observations across 31 products are `OFFER_PRESENT_EVIDENCED`. The remaining 19 observations across 15 products have no seller, price, or delivery object and remain `OFFER_PRESENCE_UNKNOWN`. No retained observation is negatively evidenced or ambiguous.

The evidenced rows comprise 13 Amazon.com and 186 known third-party observations; 165 are new, 30 used, and four have unknown condition. Presence does not alter comparability.

## Independent blockers and authority

No DataForSEO Amazon Sellers Current freshness policy exists. Presence therefore makes no retained row fully Current-ready. Seller-specific actions remain absent; Amazon product destinations remain channel-level. This increment creates no Current or History record, public action, Cheapest/Pick/Terminal input, affiliate authority, publication, release, or deployment.

Amazon Products, manual observations, Rakuten, Google Shopping, and Amazon affiliate behavior are outside this policy.
