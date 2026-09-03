# IC-DATAFORSEO-004E2K — Historical Observation Intelligence & Query Boundary

**Status:** Implemented
**Increment:** DF004-E2K

## Ownership and scope

Mercury derives provider-neutral, read-only intelligence from immutable E2J `mer_hist_*` observations. Atlas remains the owner of product and retailer identity; Sentinel validation and Forge workflow are not modified. Derived metrics are returned to callers and never persisted into historical records.

## Query

The required query field is `atlasProductId`. Optional filters are `retailerId`, inclusive `from`, and inclusive `to`, with chronology based exclusively on `observationTime`. `admittedAt` remains audit metadata and never controls market ordering.

## Result

Results expose observation count, first/latest observation times and IDs, latest retailer, retailer IDs/count, currencies, latest base and provider-total prices, base and total ranges, chronological source points, per-currency summaries, change-from-first, change-from-previous, trend strength, and source observation IDs.

Base price is the trend dimension because existing Mercury canonical intelligence compares `offer.price`, and DataForSEO's canonical mapping defines that field from provider base price. Provider-reported total price remains an independent observed dimension. Shipping and tax are never inferred or treated as zero, and total price is never locally recomputed.

## Trend semantics

- `NO_DATA`: zero matching observations.
- `INSUFFICIENT_HISTORY`: one matching observation.
- `UP`: at least two comparable observations and latest base price exceeds first base price.
- `DOWN`: at least two comparable observations and latest base price is below first base price.
- `FLAT`: at least two comparable observations and latest base price equals first base price.
- `NON_COMPARABLE`: matching observations span multiple currencies, so no aggregate price movement is calculated.

Change-from-first and change-from-previous separately expose base-price and total-price absolute and percentage movement. Percentages require a positive denominator. Cross-currency range, trend, and change fields are null; per-currency summaries remain available without FX conversion.

## Terminology and governance

`latestBasePrice` and `latestTotalPrice` mean latest observed historical values, not current or live prices. Lowest values are historical observations, not cheapest-price recommendations. E2K introduces no freshness, ranking, affiliate, canonical promotion, publication, recommendation, or narrative policy.

## Operational contract

`npm run history:query -- --atlas-product=<ID>` performs local reads only. Optional `--retailer`, `--from`, and `--to` filters are supported. Queries introduce no current-time fields, acquisition, provider request, publication, mutation, or spend.
