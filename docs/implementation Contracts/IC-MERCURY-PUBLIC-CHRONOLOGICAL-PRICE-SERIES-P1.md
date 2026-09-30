# IC-MERCURY-PUBLIC-CHRONOLOGICAL-PRICE-SERIES-P1

Status: IMPLEMENTED / FIXTURE-CERTIFIED / VISUAL-POLISH-COMPLETE / OPERATOR-FINAL-VISUAL-REVIEW-PENDING

## Purpose

Expose truthful chronological Hardware Radar-observed RAM price evidence on existing canonical RAM product pages. The feature is a deterministic, sanitized, rebuildable projection of Atlas identity and canonical Mercury History. It is not another historical authority, a continuous-price record, a market-price series, or acquisition authority.

## Ownership

- Atlas owns product identity, public path, and canonical retailer identity.
- Mercury History remains the only durable historical-observation authority.
- `PublicChronologicalPriceSeries` owns the narrow public projection contract.
- Hardware Radar's existing static RAM product generator owns the evidence table, discrete-point timeline, methodology, accessibility, and responsive presentation.
- Current Market remains independently qualified and never enters the historical series implicitly.

## Public contract

Schema `1.0`, methodology `MERCURY-PUBLIC-CHRONOLOGICAL-PRICE-SERIES-P1-1.0`, and comparison semantics `ITEM_PRICE` expose only product identity/path plus UTC timestamp groups. Each group contains standalone-comparable USD item prices, optional canonical retailer ID/name, and an observation count. Equivalent instants group across timezone offsets. Publicly equivalent observations aggregate deterministically; meaningfully distinct prices or retailer bindings remain distinct.

The projection excludes unknown, bundle, conditional, unsupported-currency, private/research-only, and Rakuten Product Catalog observations. It never exposes canonical observation/evidence/task IDs, raw references, URLs, operator/admission/review fields, rights digests, hashes, sellers, providers, acquisition modes, or private lineage.

## Presentation

- Zero public timestamps retain the existing comparable-history unavailable state and render no empty series block.
- One timestamp renders the server-generated evidence table without a connecting line or movement claim.
- Two or more timestamps render the same evidence table plus a dependency-free SVG discrete-point timeline.
- Multiple retailer prices at one timestamp remain separate points. Public-equivalent duplicates show one row/point with `observationCount`.
- No points are connected, smoothed, interpolated, or synthesized.
- The table is the semantic primary representation. SVG points are keyboard focusable, described, non-color-only, mobile-scrollable, and compatible with reduced-motion preferences.

The SVG uses a presentation-only price domain. For a nonzero observed range, padding on each side is 15% of that range with a `$0.50` floor and a 25%-of-range upper bound; for a zero-range series, padding is the greater of `$1.00` or 2.5% of the observed price. The lower display bound never falls below zero. These contextual bounds change only coordinates and sparse scale labels: observed prices, ranges, table rows, summaries, and projection data remain unchanged.

Timestamp ticks derive only from chronological group positions. Two through four groups display every group; denser series display at most five evenly distributed group positions, always including the first and last and removing duplicate indexes. Endpoint ticks retain the year and intermediate ticks use the same public UTC formatter in a shorter form. Ticks never create or move observations. Same-time retailer points retain the exact same X coordinate.

Required disclosure states that Hardware Radar observes discrete comparable item prices rather than continuously, shipping/taxes/fees may be excluded, and Current Market remains separately qualified.

## Failure policy

Invalid canonical repository records, duplicate canonical observation IDs, or unreadable repository state block generation. A product-local Atlas/retailer contradiction suppresses that product series. A valid but ineligible observation is excluded without suppressing unrelated evidence.

## Delivery and authority

The ordinary static build uses an empty History repository while release remains OFF. The ignored development-preview build reads canonical local History and injects page-local series directly into the 103 existing product pages. No runtime API, public aggregate history artifact, new route, database, cache, provider operation, publication authority, or release authority is created.

## Certification

Focused tests cover chronological/timezone normalization, late arrival, same-time same/multi-retailer evidence, differing/equal prices, public-equivalent aggregation, replay rejection, sparse states, source/comparability/currency exclusions, null retailer identity, public-field sanitization, deterministic reconstruction, product binding, no-line rendering, accessible table/points, mobile CSS, reduced motion, and Current/History separation. Full repository validation is required before checkpoint.
