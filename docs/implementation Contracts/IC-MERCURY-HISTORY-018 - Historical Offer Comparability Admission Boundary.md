# IC-MERCURY-HISTORY-018 — Historical Offer Comparability Admission Boundary

## Status

Fixture-certified implementation contract.

## Boundary

Mercury's existing `HistoricalObservationAdmissionService` remains the sole E2J admission owner. Before it writes through `FileHistoricalObservationRepository`, it applies a pure, deterministic `HistoricalOfferComparabilityAssessment` to the retained evidence already accepted by DF003. No repository, historical-series model, or public-price boundary is added.

Admission still requires all existing promotion, identity, Atlas binding, provenance, source-validity, and source-rights gates. Comparability neither supplies nor overrides any of those authorities. Conversely, rights and verified identity do not override an ineligible comparability result.

## Classification

The policy version is `MERCURY-HISTORY-018-1.0`. The assessment yields exactly one classification:

- `STANDALONE_COMPARABLE`: descriptive retained evidence identifies the offered product and contains no governed bundle or conditional marker.
- `BUNDLE`: retained title/details explicitly indicate the product is combined with another component or accessory.
- `CONDITIONAL`: the displayed price explicitly depends on a coupon/code, membership/subscription, trade-in, financing, loyalty, quantity, or similar shopper condition.
- `UNKNOWN_COMPARABILITY`: retained evidence is malformed or lacks descriptive evidence sufficient to classify the offer.

Only `STANDALONE_COMPARABLE` may enter the ordinary standalone historical series. The other outcomes fail before a historical write with, respectively, `HISTORICAL_OFFER_BUNDLE_NOT_COMPARABLE`, `HISTORICAL_OFFER_CONDITIONAL_NOT_COMPARABLE`, or `HISTORICAL_OFFER_COMPARABILITY_UNKNOWN`. Numerical attractiveness never changes that result. An unconditional public sale is not conditional merely because its sale price differs from retail price.

## Price semantics

`basePrice` is assessed as the item price. Known shipping and tax retain their exact non-negative values; unknown values remain `null`, so explicit zero shipping is distinct from unknown shipping. The retained DataForSEO model has no separate unavoidable-fee field, so fees remain an explicit unsupported/unknown gap rather than being invented.

`totalPrice` is labeled `PROVIDER_REPORTED_TOTAL_UNVERIFIED_COMPOSITION`. Existing evidence does not prove whether it contains shipping, tax, or every acquisition cost, so it is not actionable delivered cost. This increment certifies `ITEM_PRICE_ONLY` comparability and does not expand Cheapest, Current Price, or public historical-low semantics.

## Audit and persistence

The immutable assessment ID is derived from its material policy, evidence, classification, signals, and price semantics. E2J binds that ID and its digest into the admission candidate binding before persistence. Retained evidence remains the source reference. Existing `HistoricalObservation` schema `1.0` is unchanged, and existing observations require no migration or rewrite.

Exact E2J replay retains the existing observation/idempotency behavior. Previously admitted observations remain immutable if their source later becomes stale or unavailable, subject to the existing rights policy. E2K queries and `HistoricalObservationPortfolio` continue reading the unchanged historical schema.

## Refresh parity and visibility

Initial acquisition and governed historical refresh both enter history through the same `HistoricalObservationAdmissionService`; therefore both receive the same pre-write comparability gate. `HistoricalRefreshAdmissionGovernance` continues to own refresh lineage and cannot bypass the gate.

No new durable portfolio state is created. Forge remains unchanged because the current certified projection has no lifecycle artifact for a candidate rejected before admission; a future operator-visibility increment may project these safe reason codes through its existing blocker surface if operational need warrants it.

## Safety

This increment performs no provider or Rakuten operation, creates no paid task, and spends `$0.000`. It does not mutate Atlas, retailer destinations, retained evidence, Current Retail, canonical observations, review, E2S, publication, Cheapest, Picks, Beacon, or public pages.
