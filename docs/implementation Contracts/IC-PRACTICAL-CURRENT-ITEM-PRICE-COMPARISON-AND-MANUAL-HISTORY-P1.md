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

## P3 production evidence

`MANUAL_RETAIL_RESEARCH_INCREMENTAL_COHORT_P3` reused the certified preparation and routine-progression owners for 81 factual workbook deltas. Every preparation progressed independently into Current and append-only History with zero review or failure outcomes, zero provider operations, and zero spend. The operator workbook remained byte-identical. The result demonstrates that refreshed observations append new historical facts rather than replacing earlier knowledge and that legacy Current slots can advance to explicit manual provenance without changing the overall offer count.

P3 preserved all 45 operator-entered Newegg affiliate links without allowing them to alter observation identity, price selection, Current, History, comparison, or destination records. `NEWEGG_AFFILIATE_DESTINATION_PRECEDENCE_P1` now derives the public retailer action separately from canonical destination evidence. A valid, uniquely product-bound, operator-reviewed Rakuten/Newegg link may replace only the public click URL when its exact Atlas product, Newegg destination ID, and listing agree with the governed destination. Otherwise the existing ordinary governed URL remains available; absence of a governed destination remains fail-closed.

The selector is Newegg-only and preserves the operator URL byte-for-byte. It neither generates nor rewrites affiliate links and exposes no separate public affiliate fields. The real-state audit proves all 42 actionable P3 Newegg bindings use affiliate precedence, zero of those 42 use ordinary fallback, two additional governed non-actionable rows receive affiliate action routing, and one affiliate-bearing row without destination authority remains excluded. Current, Cheapest, History, chronology, Terminal, snapshot semantics, recommendations, and retailer trust are invariant. Release remains OFF; release recomposition is a later explicit gate.
