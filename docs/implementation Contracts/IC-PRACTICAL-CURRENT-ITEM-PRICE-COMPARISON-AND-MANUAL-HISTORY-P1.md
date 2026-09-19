# IC — Practical Current Item-Price Comparison and Manual History P1

Status: implemented and fixture-certified.

## Claim boundary

Mercury may compare the current positive USD **item price** of two fresh, available, exact-product, exact-standalone retailer offers when their source rights permit public display and comparison. Unknown condition, seller identity, shipping, tax, and fees remain explicitly unknown; they are not inferred as favorable values and do not by themselves make the item-price claim false. Known used, refurbished, open-box, bundle, conditional, wrong-variant, stale, unavailable, invalid-currency, invalid-destination, or unresolved source-conflict evidence fails closed.

`lowerCurrentItemPrice` requires qualifying offers from at least two distinct retailers. It means only the lower observed item price. It is not a delivered total, checkout total, savings claim, recommendation, Pick, or independent publication authority. Existing public Cheapest doctrine remains the bounded lowest qualifying displayed item-price doctrine and is not expanded by this increment.

## Manual historical facts

An immutable manual publisher preparation may be admitted separately as a schema 1.1 fact-level historical observation through the existing `FileHistoricalObservationRepository`. The observation preserves Atlas product, retailer, destination and digest, source and rights digest, preparation and digest, observed time, item price/currency/availability, private operator/evidence provenance, and null condition/seller/shipping/tax/total price. It invents no provider task.

Manual current freshness expiry removes current-display eligibility but does not delete an already admitted historical fact. Exact replay is idempotent; a later observation produces a distinct preparation and historical observation. Manual and automated history coexist with separate provenance. This boundary grants no canonical, publication, Current Price, Cheapest, Pick, recommendation, release, or deployment authority.

## Ownership and safety

`CurrentDisplayEligibility` owns bounded item-price eligibility. `SourceRightsRegistry` owns source rights. `ManualCurrentPricePreparation` owns immutable manual evidence preparation. `ManualCurrentPriceHistoryService` adapts that evidence into the existing historical contract; it owns no new repository or policy hierarchy. Production S2 and all durable history remain unchanged by fixture certification.

The next gate is `REAL_MANUAL_CANARY_COMPARISON_AND_HISTORY_RECONCILIATION`: read-only comparison proof first, followed only by separately reviewed history admission authority. No publication or release is implied.

## Prior-rights lineage compatibility

`MANUAL_HISTORY_PRIOR_RIGHTS_LINEAGE_COMPATIBILITY_P1` separates immutable original-rights lineage from current action authority. A prior preparation remains usable only when its binding is intact, its original source profile and digest are reconstructable from the versioned rights registry, source/product/retailer/destination/commerce facts remain continuous, and the current profile explicitly permits manual historical retention and historical analytics. Whole-profile digest equality across time is not required.

The historical record preserves both `originalPreparationRightsDigest` and `admissionRightsProfileDigest`. Rights policy evolution does not require rewriting immutable evidence, and current permission does not retroactively validate unknown or corrupted evidence. Current freshness and destination actionability are not historical-fact requirements; the original observation time and exact destination-at-observation lineage remain preserved. Observation identity continues to derive from the preparation ID, so rights evolution cannot duplicate market history.
