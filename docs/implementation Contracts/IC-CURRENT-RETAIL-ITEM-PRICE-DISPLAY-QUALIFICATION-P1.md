# IC-CURRENT-RETAIL-ITEM-PRICE-DISPLAY-QUALIFICATION-P1

**Status:** IMPLEMENTED / FIXTURE-CERTIFIED
**Policy:** `CURRENT-RETAIL-ITEM-PRICE-DISPLAY-QUALIFICATION-P1-1.0`

## Boundary

Mercury may prepare a fresh, operator-observed US item price under either `NEWEGG_MANUAL_PUBLISHER_OBSERVATION` or `AMAZON_MANUAL_PUBLISHER_OBSERVATION`. These are distinct human publisher-research lanes. Neither is Rakuten Product Catalog automation, Amazon API access, DataForSEO evidence, scraping authority, historical evidence, or a substitute for an automated source projection.

The source profile permits bounded manual acquisition, current-state processing, public display and comparison of the exact observed item price, plus separately governed fact-level historical retention. It blocks API/import acquisition, general analytics, recommendations, redistribution, condition inference, and delivered-cost claims with unknown costs. Official publisher documentation supports the distinct manual publisher workflow; it does not grant automated feed/API authority.

## Truth and ranking

`itemPriceEligible` and `comparisonEligible` are independent claims. A positive USD item price with exact active Atlas product, active retailer, reviewed Amazon or Newegg destination, explicit availability, valid observation time, source rights, and private operator provenance may be item-price and comparison eligible while condition, seller, shipping, tax, and fees remain unknown. Unknown is never inferred as favorable. Known incompatible condition or offer semantics still block comparison.

The public projection may carry an item-price offer for factual display, but only `comparisonEligible` offers participate in comparison. `lowerCurrentItemPrice` additionally requires two distinct qualifying retailers. Shipping, fees, and taxes remain unknown and no delivered total is synthesized.

## Operator preparation

The one-product preparation accepts an Atlas product ID, reviewed destination ID, positive USD item price, bounded availability, supported condition, shipping, seller, researched URL, observation time, operator attribution, and evidence reference/notes. Mercury derives retailer, marketplace, rights, destination binding, and policy. Valid operator-observed facts are first-class Mercury evidence: manual acquisition does not justify replacing known condition, shipping, seller, or URL provenance with unknown values. Raw operator values and normalized values remain distinguishable in the preparation. Claim policy remains separate and may still withhold delivered-cost or other downstream claims. Mercury rejects stale/future times, inactive products or retailers, destination mismatch, invalid price/currency/availability/condition/shipping, missing provenance, rights mismatch, and a conflicting current source.

Preparation is immutable, deterministic, replay-safe, inspectable by ID, and zero-authority. It creates no current snapshot, publication decision, release, Cheapest, Pick, history, provider call, paid task, or spend. The commands are:

```text
npm run retail-current:manual:prepare -- --input=<operator-input.json> --prepared-at=<ISO-8601>
npm run retail-current:manual:prepare -- --workbook=<operator-workbook.xlsx> --atlas-product-id=<id> --retailer=<AMAZON|NEWEGG> --prepared-at=<ISO-8601>
npm run retail-current:manual:inspect -- --preparation-id=<mer_manualpriceprep_...>
```

The workbook mode is an additional composition seam over the same PREPARE owner, not a parallel preparation lifecycle. One invocation selects exactly one workbook row and one retailer. Mercury reads the certified column contract, derives the exact retailer observation through `selectManualCurrentPriceWorkbookObservation`, and invokes the unchanged preparation service. The JSON input mode remains compatible.

Workbook observation instants are composed from the separately retained observation date, observation time, and IANA timezone. Excel serial dates/times and ordinary 12-hour formatted times normalize deterministically; the workbook's Observed At and Rakuten Checked At columns are display-only derivatives and cannot override those source fields. `America/Jamaica` is the operator context for this workbook, and PREPARE time, file time, machine-local timezone, and Rakuten link-check time cannot substitute for retailer observation time.

Operator attribution and evidence notes remain in the private preparation repository and are prohibited from the sanitized public projection. Snapshot mutation is separately governed by `IC-MANUAL-CURRENT-DISPLAY-SNAPSHOT-EXECUTION-COMPOSITION-P1`; PREPARE itself remains zero-authority.

## Routine progression and exception review

`Ready = YES` plus complete reviewed operator evidence is the operator's submission for routine processing; it is not authority to bypass validation. `RoutineManualCurrentPriceProcessingService` revalidates the immutable preparation against current Atlas lifecycle, retailer and destination state, rights, freshness, source conflict, item-price eligibility, and the existing manual-history boundary. A routine-valid preparation may then use the existing snapshot authorization/execution records as machine-created audit lineage without requiring a second per-record human authorization ceremony. No new authority type or policy owner is introduced.

Current-state and history outcomes remain independent. A stale observation may remain history-eligible, and an unresolved current-source conflict may preserve an independently eligible historical fact while withholding current-state mutation. Missing submission/review evidence, changed bindings, incompatibility, invalid rights, or other exceptional conditions remain fail-closed for governed human review. Routine processing never grants publication, artifact, release, deployment, Current Price, delivered-cost Cheapest, Pick, or recommendation authority.

The bounded routine command accepts only existing preparation IDs and an explicit processing instant:

```text
npm run retail-current:manual:process -- --preparation-id=<mer_manualpriceprep_...> [--preparation-id=<mer_manualpriceprep_...>] --processed-at=<ISO-8601> [--processed-by=<operator>]
```

It processes members sequentially, isolates member-local exceptions, supports deterministic replay, and reports current, history, comparison, and exception outcomes. It performs no provider acquisition or paid work. Existing explicit authorization commands remain available for exceptional or deliberately supervised processing; routine progression does not weaken them.

## Dual-retailer research workbook

The checkpointed operator workbook `hardware-radar-amazon-newegg-manual-price-research.xlsx` contains all 103 canonical Atlas RAM products once, with visibly separate Newegg and Amazon reference/research groups. Canonical reviewed destinations take precedence as reference data; a canonical/legacy disagreement is explicitly `DESTINATION_REVIEW_REQUIRED`. Prices start blank. Availability, shipping, condition, seller, observation time, notes, reviewer, and ready controls remain independent per retailer, and both ready controls default `NO`.

The additive operator workbook `hardware-radar-amazon-newegg-manual-price-research-with-rakuten.xlsx` preserves that complete surface and adds a separate **Newegg — Rakuten Routing** group. Shipping accepts `UNKNOWN`, `FREE`, known numeric zero, or a non-negative known numeric amount; blank never means free. Condition uses `UNKNOWN`, `NEW`, `USED`, `REFURBISHED`, or `OPEN_BOX`. Amazon and Newegg controls remain independently bound to their own columns. The workbook also records an affiliate URL, workbook-only `READY` / `MISSING` / `REVIEW_REQUIRED` status, checked date/time/timezone/at, and notes. Manual retailer observations and Rakuten link checks default to operator-local IANA zone `America/Jamaica`; the full timestamps remain separately recorded. The canonical Newegg destination remains the product/listing reference; the Rakuten URL is downstream routing metadata and never replaces it. Link review time never substitutes for price-observation time. A blank `MISSING` affiliate link does not block manual Newegg price preparation, and routing state grants no identity, price, availability, condition, seller, shipping, comparison, Cheapest, Pick, recommendation, publication, or release authority. The repository contains no product-bound Rakuten affiliate URLs to prepopulate, so all 103 routing rows begin blank and `MISSING` without fabrication.

`Record Reviewed By` records the operator who reviewed the complete product research row. Retailer-specific reviewer cells remain optional overrides: an explicit retailer reviewer wins, otherwise the shared record reviewer supplies private operator attribution. `Ready = YES` still requires effective attribution and every retailer-specific PREPARE field; the shared reviewer grants no readiness, identity, price, timestamp, destination, source-rights, routing, comparison, or publication authority. Rakuten routing may carry the same reviewer context, but its checked instant and link evidence remain independent from both price observations.

The workbook adapter selects exactly one product plus one retailer. Either retailer can flow into the same certified manual PREPARE boundary after its own destination, observation, and source-rights validation. Amazon and Newegg remain independently governed: Amazon manual evidence never becomes DataForSEO or API evidence, Newegg manual evidence never inherits Rakuten Product Catalog authority, and neither lane erases its distinct provenance. Comparison eligibility is derived; historical admission remains a separate governed mutation. Existing ASIN/listing IDs and Newegg item IDs remain reference identity only and never rewrite Atlas, retailer, destination, or reusable source identity.

## Certification

Fixtures cover bounded display/comparison for both manual retailer lanes, rights separation, freshness, identity/destination binding, invalid input, conflict rejection, deterministic preparation/replay, private provenance, snapshot compatibility, null costs, repository restart, dual-retailer field independence, blank prices, independent ready controls, exact one-product/one-retailer selection, cross-retailer destination isolation, identity preservation, missing-link preparation, routing-link independence from price observations, canonical/affiliate URL round-trip separation, conflicting routing bindings, workbook-file parsing, Excel date/time normalization, `America/Jamaica`, shared attribution, retailer overrides, missing-attribution failure, synthetic workbook-to-PREPARE/INSPECT persistence, Amazon/Newegg preparation independence, routine six-member processing, replay, mixed retailer combinations, stale-current/history admission, source-conflict/history independence, malformed or unsubmitted exceptions, duplicate cohort inputs, and bounded partial success. The first two production preparations were consumed by the already recorded S2 executions. The six later production preparations are read-only assessed as routine-ready and remain unprocessed; this P1 changes no production snapshot or history.
