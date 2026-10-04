# IC-NEWEGG-PRODUCT-CATALOG-HISTORY-AND-ANALYTICS-RIGHTS-P1 — History and analytics rights certification

**Status:** IMPLEMENTED / FIXTURE-CERTIFIED / NO HISTORY ADMISSION
**Owner:** Mercury `SourceRightsRegistry`
**Date:** 2026-10-03

## Purpose and evidence

This increment records operator-supplied written clarification from Newegg Support for Hardware Radar's governed US Newegg Product Catalog source. The repository stores a sanitized capability summary, not private correspondence or unnecessary personal information. The evidence establishes that Hardware Radar may display Product Catalog product information and current prices, make truthful same-product current-price comparisons, use the data for rankings and recommendations, cache current data locally for timestamped automated processing, retain successive qualified price observations for price history, historical lows, and trends, and retain or publicly display aggregated or derived analytics. Previously collected historical observations and derived analytics may remain retained if Product Catalog approval or the Newegg advertiser relationship ends.

The evidence does not authorize acquisition after approval or the advertiser relationship ends. It does not establish indefinite raw-feed retention, raw-feed redistribution, an external data API, offer-condition inference, or rights for another Rakuten advertiser, feed family, market, retailer, Amazon, Google Shopping, or DataForSEO.

## Canonical scope and capabilities

The canonical profile remains `RAKUTEN_NEWEGG_PRODUCT_CATALOG`. Its scope is the approved Newegg US ordinary Product Catalog feed family for canonical retailer `RETAILER-0004`.

| Capability | State | Boundary |
| --- | --- | --- |
| governed feed import | `ALLOWED` | Only while source authorization remains active |
| local current processing/cache | `ALLOWED` | Existing 36-hour Hardware Radar Current freshness policy remains unchanged |
| current observation and display | `ALLOWED` | Normal identity, offer, destination, freshness, and current-market qualification still applies |
| truthful same-product current comparison | `ALLOWED` | No Cheapest or comparison-policy change |
| ranking/recommendation use | `ALLOWED` | Rights permission only; no ranking, Picks, Compass, or recommendation algorithm changes |
| normalized historical retention | `ALLOWED` | Subject to normal Mercury History qualification and immutable provenance |
| historical lows and trends | `ALLOWED` | Derived only from admitted comparable History |
| aggregated/derived analytics | `ALLOWED` | May be retained and publicly displayed through governed projections |
| previously collected History/analytics after relationship end | `ALLOWED` | Retention only; no future acquisition authority |
| offer-condition inference | `CLARIFICATION_REQUIRED` | Existing condition policy remains independent |
| raw payload retention | unchanged | Existing bounded provider/source policy remains authoritative |
| raw redistribution/API | `BLOCKED` | The clarification does not grant bulk raw-feed redistribution |

The immediately preceding rights profile is retained in the existing historical-profile registry so immutable earlier preparations can still verify their original rights digest. Historical records are not retroactively rewritten.

## Qualification and admission separation

Rights eligibility is not History admission. A Newegg Product Catalog observation is only `RIGHTS_ELIGIBLE_FOR_REVIEW` until the existing Mercury History owners verify exact Atlas product identity, canonical retailer/channel and listing identity, positive price and currency semantics, provider observation time, immutable source provenance and integrity, condition and offer comparability, source scope, duplicate identity, and chronology.

This increment performs no retrospective admission. Current qualification and History qualification remain independent: an observation may qualify for both, Current only, History only where established policy permits, or neither. Terminal and other derived intelligence consume future admitted History through the existing source-neutral History projection; no source-specific Terminal path is introduced.

## Future FULL and DELTA semantics

A newly retrieved, validated FULL may independently produce qualified Current observations and qualified History candidates. Its validated HDR is provider deposit/observation evidence time. A later FULL observation with the same price may be a distinct historical observation at the later HDR when normal uniqueness and comparability rules permit it.

Validated DELTA `I` and `U` records may independently become History candidates at the DELTA HDR. `D` is withdrawal/source-state evidence and never a fabricated price observation. Absence from a DELTA creates no observation. Processing/import time must never replace provider observation time.

## Retrospective review boundary

Canonical Current presently retains 60 Newegg Product Catalog offers. Fifty-eight are the exact-bound observations from the latest validated FULL refresh; two are earlier governed source observations. These populations overlap retained catalog states and refresh artifacts and must not be summed. Catalog states, raw rows, and QA exports are evidence containers, not automatically qualified History observations.

A future `NEWEGG_RETAINED_OBSERVATION_HISTORY_ADMISSION_P1` increment may assess those 60 canonical observations and any additional non-overlapping immutable retained candidates. It must bind original source artifact and HDR, exact product/listing/destination identity, price/currency selection, condition/comparability, rights profile lineage, and deterministic History uniqueness before admission. It may not manufacture timestamps, use processing time as `observedAt`, or create repeated identical records accidentally.

## Authority and zero mutation

This certification changes rights policy only. It creates no History record, Current offer, ranking, recommendation, Terminal metric, public artifact, publication authority, release, deployment, provider call, or paid task. Canonical Current remains `mer_display_3724ab4068bcac762a876ee7` with 189 offers. Canonical History remains 410 observations at sequence 410.

## Next bounded increments

1. `NEWEGG_RETAINED_OBSERVATION_HISTORY_ADMISSION_P1` — assess retained validated observations for duplicate-safe retrospective History admission without invented timestamps.
2. `NEWEGG_ROUTINE_MARKET_OBSERVATION_OPERATION_P1` — compose one governed fresh FULL operation with independently qualified Current and History paths, followed by normal recomposition/certification/publication boundaries. Affiliate health remains independently governed.
