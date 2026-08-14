# ADR-021 — Live Market Intelligence Is Rights and Freshness Gated

## Status

Proposed

## Context

Hardware Radar's immediate production priority is current market intelligence. Historical Intelligence remains an implemented Mercury capability, but its production use depends on source rights that may not be available for many retailer-derived datasets.

A current offer must not participate in price ranking merely because Mercury has an observation containing a price. A live-market claim must be supported by evidence that is contractually usable, technically valid, currently fresh, currently available, correctly mapped to Atlas, and eligible for governed publication.

Without a dedicated live-market policy, stale, unavailable, unresolved, or rights-ambiguous evidence could influence a current-price claim even though the platform cannot substantiate that offer as actionable now.

## Decision

Mercury shall maintain a distinct Live Market Intelligence policy.

An observation may participate in the Live Market only when all mandatory gates pass:

1. source rights explicitly permit current observation use;
2. source rights explicitly permit comparison use;
3. source rights explicitly permit public display;
4. the canonical observation validates;
5. Atlas product identity resolves;
6. Atlas retailer identity resolves;
7. provenance validates;
8. declared validation state passes;
9. freshness is currently eligible;
10. confidence is currently eligible;
11. availability is currently actionable;
12. condition is eligible;
13. required source-link evidence is present; and
14. applicable licensed payload remains available and unexpired.

Unknown, conditional, or clarification-required rights fail closed unless a future explicit policy authorizes the relevant capability.

## Live-Market Semantics

An expired offer is not an "old current price." It is no longer current evidence.

An unavailable offer is not a low-priced candidate. It is excluded before ranking.

When no observations pass all mandatory gates, Mercury returns an insufficient-data state rather than falling back to legacy, stale, manually copied, or otherwise ungoverned prices.

Price ranking occurs only after eligibility. The cheapest offer is therefore the cheapest eligible current offer, not simply the numerically lowest stored price.

## Relationship to Historical Intelligence

Historical Intelligence remains separate.

Historical evidence must satisfy its own source-rights requirements and is not required to produce Live Market Intelligence. Historical price data must not influence live ranking merely because it exists.

Historical Intelligence may remain dormant indefinitely without affecting Hardware Radar's ability to present verified current offers.

## Relationship to Publication Workflow

Review and publication authorization remain separate workflow stages.

Live eligibility does not itself publish an observation. Governed publication consumes evidence that remains live-eligible at evaluation time. A previously published observation that later becomes stale, unavailable, rights-ineligible, or otherwise non-actionable must cease contributing to future snapshots.

## Consequences

### Positive

- Current-price claims become explicitly evidence-backed.
- Stale and unavailable offers cannot win price ranking.
- Unknown source rights fail closed.
- Historical data rights no longer block Hardware Radar's launch roadmap.
- Existing Mercury freshness, confidence, rights, Atlas, and publication components converge behind one current-market contract.
- Future sources can participate without retailer-specific ranking logic.

### Trade-offs

- Hardware Radar may display insufficient data even when Mercury contains older observations.
- Current coverage depends on timely acquisition and refresh operations.
- Sources with unresolved comparison or publication rights cannot participate until their rights profile is updated.

These trade-offs are accepted because truthful current-market claims take precedence over apparent coverage.

## Architectural Principle

> A price becomes Live Market Intelligence only while Hardware Radar can substantiate that it is authorized, current, actionable, and publishable now.
