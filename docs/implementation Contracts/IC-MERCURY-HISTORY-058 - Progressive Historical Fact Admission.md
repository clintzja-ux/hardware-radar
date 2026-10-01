# IC-MERCURY-HISTORY-058 — Progressive Historical Fact Admission

## Status

Implemented and fixture-certified.

## Decision

Mercury preserves a rigorously validated historical fact before requiring authority used only by comparison, canonical retail identity, Current Price, Cheapest, Picks, or publication. `DF004-E2H-2.0-FACT` explicitly supersedes the fact-level portion of `DF004-E2H-1.0`; the older policy remains unchanged for stronger promotion assessment.

`HistoricalObservationAdmissionService` remains the sole history writer and the existing repository remains the sole store. Schema `1.1` is additive: it accepts an unresolved canonical retailer, preserves the observed seller and merchant-resolution state, stores HISTORY-018 comparability metadata, and binds source-rights lineage. Schema `1.0` records remain valid without migration.

## Minimum factual authority

Admission requires a verified single Atlas product, no critical product contradiction, complete immutable acquisition/provenance lineage, historical-retention rights, original observation time, positive item price, and valid currency. Condition, shipping, tax, delivery, seller URL, and total price preserve their exact known or null state. No missing value is inferred.

Complete acquisition lineage may be either the existing initial discovery/bootstrap chain or a validated `REUSABLE_IDENTITY_REPEAT_LINEAGE`. Repeat lineage must bind the prior governed source identity and digest, exact product/source/rights, repeat preparation and authorization, acquisition cycle, new provider task, and immutable result. This establishes why direct SELLERS acquisition was authorized without claiming that another PRODUCTS task occurred. It does not weaken factual minimums or promote identity.

Canonical retailer registration and `STANDALONE_COMPARABLE` are not required to preserve the fact. Unresolved merchants retain `retailerId=null`; later governed resolution may supply downstream authority without rewriting the factual observation. Non-standalone observations remain excluded from standalone analytics.

## Authority separation

Fact admission always records canonical, Current Price, Cheapest, Pick, and publication eligibility as false. E2P and every retailer-dependent consumer continue to require current governed retailer identity and exact evidence binding. Historical analytics includes all facts in its audit timeline but computes price movement only from standalone-comparable facts; retailer-specific queries naturally exclude unresolved records.

## Replay and safety

Observation identity and idempotency remain evidence-derived. Exact replay returns the existing observation; conflicting material under the same identity fails in the existing retained-evidence or historical repository boundary. This increment adds no repository, provider operation, authorization, production write, or downstream mutation and spends `$0.000`.

The bounded replay preparation seam uses `HistoricalObservationAdmissionService.assess()` rather than creating another eligibility owner. `npm run evidence:historical-facts:prepare` binds the explicitly selected Amazon pilot and all retained Google Shopping evidence into an immutable, zero-authority plan; `npm run evidence:historical-facts:inspect` validates and renders that plan. PREPARE records exact evidence, expected observation IDs and hashes, source counts, duplicates, blockers, and downstream-false declarations.

The separately controlled replay boundary adds one immutable, plan-scoped, expiring authorization and one append-only consumption record. `evidence:historical-facts:authorize` accepts only the plan ID, operator, reason, expiry, and exact confirmation. `evidence:historical-facts:execute` accepts only the authorization ID, executing operator, and exact confirmation. Execution reloads the exact plan, revalidates every bound candidate through the existing assessment owner before any write, then delegates only to `HistoricalObservationAdmissionService.admit()` and `FileHistoricalObservationRepository`. Exact historical facts replay as duplicates; changed evidence, identity, rights, lineage, observation hash, plan binding, or consumption fails closed. A repository-native single-writer lock prevents simultaneous execution from duplicating rows. Crash recovery remains replay-safe because historical writes are evidence-idempotent and authorization consumption is append-only.

Neither authorization nor execution performs acquisition/retrieval or grants canonical, Current Price, Current Display, Cheapest, Pick, affiliate, or publication authority. The production plan has been fixture-certified only; no real replay authorization or execution occurred during implementation.
