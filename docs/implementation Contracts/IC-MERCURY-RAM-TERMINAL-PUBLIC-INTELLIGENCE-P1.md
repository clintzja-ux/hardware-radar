# IC-MERCURY-RAM-TERMINAL-PUBLIC-INTELLIGENCE-P1

Status: IMPLEMENTED / FIXTURE-CERTIFIED / REAL-STATE-DEVELOPMENT-PREVIEW-CERTIFIED

## Purpose

Provide one rebuildable, public-safe Mercury projection for `/ram/terminal/`. The Terminal combines Atlas product membership, qualified public Mercury Current, and public-eligible standalone-comparable Mercury History. It creates no new canonical repository, lifecycle, ranking authority, or recommendation owner.

## Ownership and inputs

- Atlas owns product identity, specifications, and lens membership.
- `PublicCurrentRetailProjection` owns qualified current item-price inputs.
- `HistoricalObservationIntelligence` owns historical ordering and comparability.
- `RamTerminalPublicIntelligence` composes and sanitizes those established facts.
- The static site consumes `public/data/ram-terminal.json`; all calculations occur at build time.

The four lenses are `ALL_RAM`, `DDR5`, `DDR4`, and `LAPTOP_SODIMM`. Laptop membership is Atlas `SO_DIMM`, independent of DDR generation.

## Current and historical semantics

Each product contributes at most one current value. The value is the lowest qualified, comparison-eligible USD item price; additional retailers do not add statistical weight. Shipping, taxes, and fees remain excluded and unknown values are never converted to zero.

Admitted History and comparable History are reported separately. Only `STANDALONE_COMPARABLE` observations participate in temporal movement, observed ranges, or observed-low status. Two distinct compatible timestamps are required. Same-time observations cannot establish movement. Research-only Rakuten material remains ineligible; future qualified History from the governed Newegg Product Catalog source may enter through the ordinary source-neutral History owner under its certified rights.

Current and History remain independently governed inputs. Historical movement is `latestComparableObservation - previousComparableObservation`; it is not Current minus previous History. The comparable-history range and observed-low state likewise describe the historical series, with `atObservedLow` meaning the latest comparable historical observation equals that series minimum. The public table exposes both historical comparators and labels the movement/range explicitly so an independently newer or differently selected Current price is never presented as one side of the historical calculation.

“Lowest Hardware Radar-observed price” means the lowest governed comparable observation since Hardware Radar began tracking the product. It is not an all-time, internet-wide, or retailer historical-low claim.

## Suppression policy

Coverage numerator/denominator and the lowest qualified current item price remain factual at any nonzero cohort size. Aggregate median and range require at least five currently priced products in the lens. Smaller cohorts return `INSUFFICIENT_MARKET_COHORT` and null aggregate median/range; this is a narrow P1 rule, not a generalized confidence system.

## Public artifact and route

The deterministic artifact exposes only public product identity/specifications, sanitized current values, counts, and derived history signals. It excludes destinations, URLs, provider tasks/results, evidence identifiers, raw payloads, filesystem paths, credentials, affiliate state, and operator-only state.

`/ram/terminal/` is the only indexable Terminal route in P1. Its default All RAM view is server-rendered into static HTML; JavaScript only switches among the four precomputed lenses. The page has no runtime API, acquisition, charts, recommendation language, or browser-triggered provider work.

## Presentation behavior

The accepted P1 information architecture is market pulse, primary current-market metrics, compact supporting evidence, a lightweight cross-lens coverage view, sortable product intelligence, and methodology. This hierarchy is presentation-only: every displayed number and signal remains a direct rendering of the governed projection.

Movement is expressed as human-readable up/down/unchanged language without exposing a signed negative amount after a down arrow. Its accessible wording identifies the latest and previous comparable observations. Unknown latest or previous observations remain an em dash with an accessible explanation, and sub-day or fractional history spans are rendered conservatively as “Less than 1 day” or completed whole days. Repeated manufacturer text is removed only when the product label begins with the same brand twice; legitimate repeated product-family words are preserved. The hero formats the artifact's authoritative date in a human-readable UTC calendar form without changing its timestamp.

Lens tabs support pointer and arrow-key navigation. Sortable columns operate only on the already projected product rows, preserve unknown values last, and announce the active order. The cross-lens coverage bars are CSS-only representations of the existing tracked/currently-priced counts and create no new metric or authority.

## Release boundary

The ordinary public build remains governed by static release control. With release OFF, the checked-in artifact contains the complete Atlas denominator but no operational Current or History. The explicitly non-production development-preview build reads canonical local Current and History for review and asserts `releaseAuthority=false` and `deploymentAuthority=false`.

## Certification

Tests cover catalog/lens counts, SO-DIMM membership, one-value-per-product arithmetic, odd/even median, sparse suppression, current filtering, admitted-versus-comparable history, distinct-time movement, observed ranges/lows, research-only exclusion, deterministic replay, private-field/claim exclusion, static route, no-JavaScript default content, keyboard-accessible lens controls, responsive table behavior, presentation formatting and sorting, and real-state development-preview counts.
