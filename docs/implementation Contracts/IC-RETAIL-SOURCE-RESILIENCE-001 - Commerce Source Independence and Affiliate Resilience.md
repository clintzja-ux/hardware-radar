# IC-RETAIL-SOURCE-RESILIENCE-001 — Commerce Source Independence and Affiliate Resilience

**Status:** DOCUMENTED
**Owner:** Atlas / Mercury / Commercial boundary
**Date:** 2026-09-07

## Purpose

Protect Hardware Radar retailer functionality from dependency on an affiliate relationship or single commerce-data provider while preserving existing subsystem ownership. This increment documents architecture only; it implements no source adapter, refresh orchestration, routing, or provider connection.

## Ownership contract

- Atlas owns canonical product and retailer identity.
- Mercury `RetailerDestination` owns the exact canonical retailer listing for an Atlas product.
- Replaceable commerce sources contribute ephemeral evidence under independent provenance and source-rights policy.
- Affiliate routing is an optional downstream commercial transformation after a qualifying offer has been selected.

An affiliate URL never replaces or redefines the canonical destination. Affiliate status never changes market truth, Current Price, Cheapest, Picks, trust, recommendation, or evidence interpretation.

## Future adapter seam

A future repository-native `CurrentRetailSourceAdapter` or compatible boundary may normalize authorized source evidence into the existing `CurrentDisplaySnapshot`. Its common output should bind:

- `atlasProductId`;
- `retailerId`;
- `destinationId`;
- item price and currency;
- condition and availability;
- seller/marketplace state;
- `observedAt`;
- source identity and source-rights profile.

Missing values remain null or unknown. Rakuten Product Feed/Search, a future authorized Newegg feed/API, a future authorized Amazon source, independent providers, and operator/manual acquisition are examples only, not implementation commitments. No adapter owns snapshot, comparison, Cheapest, or public-projection semantics.

## Availability, precedence, and loss

A source path may operate as automated-primary, automated-alternate, manual-only, or unavailable. These are documentary operational modes, not runtime enums introduced by this increment.

Source selection must be justified by authority, provenance, exact product/destination binding, rights, freshness, completeness, quality, and reliability. Affiliate economics are not selection evidence.

When a source is unavailable:

- canonical products, retailers, destinations, and audit history remain intact;
- no observation is fabricated or retimestamped;
- prior current-display state may survive only with its original observation time and within source policy/TTL;
- unaffected sources continue;
- approved alternate/manual acquisition may be used;
- the unavailable source is reported as an isolated operational failure.

## Current display and history

All current-retail sources target the existing bounded `CurrentDisplaySnapshot` owner. No Rakuten, Newegg, affiliate, or provider-specific price repository is permitted. Current plus immediately previous remains the maximum current-display shape, further limited by source TTL.

Ephemeral current-display permission does not grant durable history. Historical retention and analytics require separate explicit rights and the existing Mercury historical governance.

## Current commercial context

Operator evidence establishes that the Rakuten publisher account is reactivated and Newegg has approved Hardware Radar into its affiliate program. The dashboard exposes Product Feeds, Product Search API, Deep Links API, and other publisher APIs; Product Feed access currently requires enablement/support. Actual Newegg fields, access behavior, attribution, TTL, current-display rights, and comparison rights remain uninspected and uncertified. No credential or sensitive identifier is recorded here.

## Deferred implementation

This increment does not implement a source adapter, Rakuten client, feed transport, affiliate router, link conversion, source-precedence engine, current-refresh orchestrator, Forge view, or scheduling. CURRENT-RETAIL-REFRESH remains pending.

## Safety result

Provider calls, paid tasks, production mutations, public changes, and spend are all zero. Atlas, retailer destinations, current-display snapshots, public artifacts, historical Mercury state, affiliate links, provider configuration, and credentials remain unchanged.
