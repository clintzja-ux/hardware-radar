# ADR-059 — Ordinary Retailer Destinations Are Mercury-Owned Navigation Metadata

**Status:** Accepted
**Date:** 2026-09-02

## Context

Hardware Radar product pages eventually need ordinary links to exact retailer product pages. Atlas already owns canonical product and retailer identity, while Mercury owns market-facing source, offer, provenance, and destination semantics. Treating a link as an offer, an observation, or an affiliate grant would collapse those boundaries and could create unsupported price or commercial authority.

## Decision

Mercury owns an immutable `RetailerDestination` record that binds one active, ready Atlas product and one active Atlas retailer to one operator-reviewed, exact standalone product page on the retailer's canonical marketplace. The destination is navigation metadata only and grants only `DESTINATION_NAVIGATION_ELIGIBLE`.

The destination does not contain price, availability, condition, shipping, tax, discounts, ranking, or recommendation data. It is not an observation, offer, publication decision, source-rights grant, affiliate relationship, or retailer-trust decision. A direct ordinary destination remains valid independently of Atlas `affiliateEnabled`; any affiliate transformation is a later downstream concern and must preserve an ordinary-link fallback.

URLs are canonical HTTPS product-page URLs. Tracking parameters, credentials, ports, shorteners, arbitrary query strings, homepage roots, and retailer/domain mismatches fail closed. Product configuration is bound by exact Atlas product identity, manufacturer part number, explicit standalone-product scope, and operator evidence references. Atlas remains the sole owner of the product and retailer identities.

Destination records are append-only. Exact replay is idempotent, conflicting replay fails closed, and replacement or retirement creates a new record with explicit predecessor lineage. Historical records and their source identity remain immutable. At most one effective destination exists for a product, retailer, and marketplace binding.

No production destination records and no public rendering are authorized by GROWTH-005A.

## Consequences

- Ordinary retailer navigation can be introduced without inventing an offer or weakening Mercury publication rules.
- Affiliate availability cannot control destination eligibility or neutral retailer ordering.
- Beacon may later receive privacy-safe destination/product/retailer/marketplace identifiers, but never needs the destination URL as event authority.
- Public product identity remains Atlas-owned and canonical at its existing route.
- Source-controlled destination authoring and public product-page rendering require separately certified increments.
