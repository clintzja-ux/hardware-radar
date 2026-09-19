# IC-CURRENT-RETAIL-ITEM-PRICE-DISPLAY-QUALIFICATION-P1

**Status:** IMPLEMENTED / FIXTURE-CERTIFIED  
**Policy:** `CURRENT-RETAIL-ITEM-PRICE-DISPLAY-QUALIFICATION-P1-1.0`

## Boundary

Mercury may prepare a fresh, operator-observed Newegg US item price under source profile `NEWEGG_MANUAL_PUBLISHER_OBSERVATION`. This is a distinct human publisher-research lane. It is not Rakuten Product Catalog automation, scraping authority, historical evidence, or a substitute for the source-local feed projection.

The source profile permits bounded manual acquisition, ephemeral current-state processing, and public display of the exact observed item price. It blocks API/import acquisition, history, analytics, recommendations, redistribution, condition inference, and ordinary comparison when condition is unknown. Official Rakuten publisher link, product-link, and deep-link documentation supports the distinct manual publisher workflow; it does not grant automated Product Catalog authority.

## Truth and ranking

`itemPriceEligible` and `comparisonEligible` are independent claims. A positive USD item price with exact active Atlas product, active Newegg retailer, reviewed destination, explicit availability, valid observation time, source rights, and private operator provenance may be item-price eligible while condition, seller, shipping, and fees remain unknown. Unknown condition is never inferred as `NEW` and blocks `comparisonEligible`.

The public projection may carry a weak item-price offer for factual display, but only `comparisonEligible` offers may populate `lowerCurrentItemPrice` or any overall/category Cheapest winner. A lower weak offer cannot defeat a higher comparable offer; weak-only products have a null lower comparison price; multiple weak offers produce no Cheapest winner. Shipping, fees, and taxes remain unknown and no delivered total is synthesized.

## Operator preparation

The one-product preparation accepts only an Atlas product ID, reviewed destination ID, positive USD item price, bounded availability, observation time, operator attribution, and evidence reference/notes. Mercury derives retailer, marketplace, rights, destination binding, and policy. It rejects stale/future times, inactive products or retailers, destination mismatch, invalid price/currency/availability, missing provenance, rights mismatch, and a conflicting current source.

Preparation is immutable, deterministic, replay-safe, inspectable by ID, and zero-authority. It creates no current snapshot, publication decision, release, Cheapest, Pick, history, provider call, paid task, or spend. The commands are:

```text
npm run retail-current:manual:prepare -- --input=<operator-input.json> --prepared-at=<ISO-8601>
npm run retail-current:manual:inspect -- --preparation-id=<mer_manualpriceprep_...>
```

Operator attribution and evidence notes remain in the private preparation repository and are prohibited from the sanitized public projection. Execution/current-snapshot mutation remains a separately governed future boundary.

## Certification

Fixtures cover valid weak display, rights separation, freshness, identity/destination binding, invalid input, conflict rejection, deterministic preparation/replay, private provenance, snapshot compatibility, weak-only display, weak-lower-versus-stronger comparison, null costs, and repository restart. No production preparation was created.
