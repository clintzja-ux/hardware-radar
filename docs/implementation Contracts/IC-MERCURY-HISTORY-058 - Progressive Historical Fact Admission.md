# IC-MERCURY-HISTORY-058 — Progressive Historical Fact Admission

## Status

Implemented and fixture-certified.

## Decision

Mercury preserves a rigorously validated historical fact before requiring authority used only by comparison, canonical retail identity, Current Price, Cheapest, Picks, or publication. `DF004-E2H-2.0-FACT` explicitly supersedes the fact-level portion of `DF004-E2H-1.0`; the older policy remains unchanged for stronger promotion assessment.

`HistoricalObservationAdmissionService` remains the sole history writer and the existing repository remains the sole store. Schema `1.1` is additive: it accepts an unresolved canonical retailer, preserves the observed seller and merchant-resolution state, stores HISTORY-018 comparability metadata, and binds source-rights lineage. Schema `1.0` records remain valid without migration.

## Minimum factual authority

Admission requires a verified single Atlas product, no critical product contradiction, complete immutable acquisition/provenance lineage, historical-retention rights, original observation time, positive item price, and valid currency. Condition, shipping, tax, delivery, seller URL, and total price preserve their exact known or null state. No missing value is inferred.

Canonical retailer registration and `STANDALONE_COMPARABLE` are not required to preserve the fact. Unresolved merchants retain `retailerId=null`; later governed resolution may supply downstream authority without rewriting the factual observation. Non-standalone observations remain excluded from standalone analytics.

## Authority separation

Fact admission always records canonical, Current Price, Cheapest, Pick, and publication eligibility as false. E2P and every retailer-dependent consumer continue to require current governed retailer identity and exact evidence binding. Historical analytics includes all facts in its audit timeline but computes price movement only from standalone-comparable facts; retailer-specific queries naturally exclude unresolved records.

## Replay and safety

Observation identity and idempotency remain evidence-derived. Exact replay returns the existing observation; conflicting material under the same identity fails in the existing retained-evidence or historical repository boundary. This increment adds no repository, provider operation, authorization, production write, or downstream mutation and spends `$0.000`.
