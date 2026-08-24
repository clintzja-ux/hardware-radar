# IC-DF005A — Historical Observation Portfolio Read Model

**Status:** Implemented  
**Increment:** DF005-A

## Boundary

`HistoricalObservationPortfolio` is a deterministic, provider-neutral Mercury read model reconstructed on demand. Canonical Atlas defines the product universe; E2J history, E2K intelligence, E2N lifecycle state, and applicable E2O policies supply derived facts. No portfolio repository exists, and the result never becomes authoritative state.

Including an Atlas product does not authorize acquisition. Products without history remain visible with zero observations, `NO_DATA`, null market values, empty retailer/currency sets, and `POLICY_NOT_CONFIGURED` when no policy applies. Nothing is inferred from absence.

## Product entries and summary

Each immutable entry contains historical chronology, retailer/currency sets, latest observed values and E2K trend; applicable cadence configuration and E2O due status; E2N cycle stage and next structural action; conservative paid-path context; and human-attention reasons. Entries are sorted by Atlas product ID.

The immutable summary counts Atlas products, history coverage, observations, policy coverage, due states, blockers, human review, automatic execution, and unattended LIVE. `maximumPotentialNextCycleSpendUsd` sums only governed maximums for products that are currently DUE and have a known next SELLERS path. It is potential exposure, never committed or authorized spend; `committedSpendUsd` remains zero.

## Governance

Evaluation requires explicit `asOf` and never uses wall-clock time. Same repositories and `asOf` produce the same deeply frozen output. Queries do not mutate Atlas, history, evidence, reviews, lifecycle artifacts, ledgers, or policy.

DUE means only that configured cadence permits consideration of another cycle. The portfolio creates no refresh plan, authorization, provider task, retrieval, retention, admission, or publication. Automatic execution and unattended LIVE remain disabled. Adaptive, interest-, traffic-, volatility-, provider-, and budget-based cadence are deferred, and latest observed values do not acquire public-current-price or freshness semantics.

## Operations

`npm run history:portfolio -- --as-of=<ISO_TIMESTAMP>` performs a local read-only query. `--json` emits the same immutable model as JSON for operator tooling. Both paths create no paid task and spend `$0.000`.
