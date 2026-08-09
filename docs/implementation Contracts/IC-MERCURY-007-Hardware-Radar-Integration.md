# IC-MERCURY-007 — Hardware Radar Integration

## Objective
Establish the certified Mercury-to-Hardware-Radar publication boundary and replace placeholder/raw-observation market rendering with application-facing published intelligence.

## Deliverables
- MarketPublicationService and versioned publication policy.
- Deterministic publication eligibility and cheapest eligible selection.
- Atlas product and retailer joining.
- AVAILABLE and INSUFFICIENT_DATA scope states.
- Evidence identifiers in published offers.
- public/data/market-snapshot.json generation.
- Hardware Radar consumption of the published snapshot.
- Removal of direct browser dependency on raw Mercury observations.
- Internal Mercury package removed from public/data.
- Truthful insufficient-data rendering.
- Publication and integration regression tests.

## Boundaries
M007 does not add live retailer acquisition, fabricate observations, weaken freshness/confidence policy, or make Forge UI changes. Forge orchestration can be expanded after the publication service is certified.

## Exit Criteria
Publication tests pass; existing Mercury/Atlas/Sentinel suites remain green; Forge remains operational; Hardware Radar pages remain operational; legacy PRICE records and placeholder market data are no longer in the active market-rendering path.
