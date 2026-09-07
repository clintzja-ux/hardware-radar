# ADR-060 — Retail Commerce Sources and Affiliate Routing Are Replaceable Capabilities

**Status:** Accepted
**Date:** 2026-09-07

## Context

Hardware Radar may obtain current commerce evidence through retailer APIs, affiliate feeds, independent providers, or governed operator acquisition. Some integrations depend on mutable commercial relationships. Allowing one relationship or provider to own retailer identity, destinations, comparison semantics, or outbound routing would make source loss corrupt otherwise durable facts and couple market truth to monetization.

ADR-024 already separates merchant identity from affiliate relationships, ADR-059 gives Mercury ownership of ordinary retailer destinations, and ADR-019 makes source rights independent policy. A durable cross-subsystem rule is still required for replaceable acquisition and routing capabilities.

## Decision

Hardware Radar separates four concerns:

- Atlas owns canonical retailer identity.
- Mercury's `RetailerDestination` owns the exact canonical product/listing destination.
- Replaceable commerce-data adapters supply source-specific ephemeral current-retail evidence under independent rights profiles.
- Affiliate routing optionally transforms an outbound click after market selection.

The canonical retailer destination is independent of an affiliate tracking URL. Affiliate availability, commission, payout, or conversion must not determine product or retailer identity, evidence interpretation, Current Price, Cheapest, Picks, trust, recommendation, or market ranking.

All admitted current-retail sources normalize into the existing Mercury `CurrentDisplaySnapshot`; no provider-specific public price store or affiliate price history is created. Sources may be automated-primary, automated-alternate, manual-only, or unavailable without changing canonical ownership. Precedence follows authority, provenance, exact binding, rights, freshness, completeness, data quality, and reliability.

Source loss degrades per source: preserve canonical identities and destinations, do not fabricate freshness, preserve a prior observation with its original time only where current-display policy and source TTL permit, allow stale public prices to expire, continue unaffected sources, and use an approved alternate or governed manual path when available. One failed source must not fail the whole portfolio.

Current-display authorization does not imply historical retention. Every source independently establishes acquisition, ephemeral retention, public-display, comparison, attribution, TTL, historical-retention, and analytics rights. Affiliate approval alone establishes none of them.

## Consequences

- Commercial relationships and market evidence can evolve independently.
- A source-neutral refresh portfolio and orchestrator may later use retailer-specific clients without giving those clients ownership of current-display semantics.
- Manual acquisition remains a valid controlled fallback rather than an architectural failure.
- Affiliate deep-link transformation occurs downstream of canonical offer selection and may fall back to the canonical retailer URL where policy permits.
- Historical source and destination audit records remain unchanged when integrations are replaced or disabled.
- The rule applies platform-wide, not only to RAM.
- This ADR creates no source adapter, routing implementation, provider configuration, acquisition authority, or production mutation.
