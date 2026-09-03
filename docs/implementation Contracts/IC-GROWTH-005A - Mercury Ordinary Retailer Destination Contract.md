# IC-GROWTH-005A — Mercury Ordinary Retailer Destination Contract

**Status:** IMPLEMENTED / FIXTURE-CERTIFIED
**Owner:** Mercury
**Date:** 2026-09-02

## Purpose

Establish the smallest immutable Mercury boundary for an operator-reviewed ordinary retailer product-page destination. This increment creates no production records and renders no public links.

## Ownership and authority

Atlas owns `atlasProductId`, product lifecycle, manufacturer part number, `retailerId`, retailer lifecycle, and the retailer's canonical website. Mercury owns the destination URL, exact product-page binding, provenance, review attribution, lifecycle, and replay semantics.

A valid active record grants only `DESTINATION_NAVIGATION_ELIGIBLE`. It grants no offer, observation, rights, affiliate, review, canonical, publication, live/current/public-price, Cheapest, Pick, ranking, recommendation, or trust authority. Affiliate enablement has no effect on destination identity or eligibility.

## Record contract

`RetailerDestination` version `1.0` contains:

- deterministic `destinationId` and `materialFingerprint`;
- exact Atlas product, Atlas retailer, and normalized marketplace bindings;
- destination type `PRODUCT_PAGE` and a canonical HTTPS product-page URL;
- optional retailer listing identifier;
- exact manufacturer-part-number binding, `EXACT_STANDALONE_PRODUCT` scope, operator review method, and non-empty evidence references;
- operator-source provenance, reviewer, review time, creation time, and creator;
- `ACTIVE` or `RETIRED` status;
- optional predecessor and required retirement reason where applicable.

The strict validator rejects unknown fields and any nested market or commercial claims, including price, currency, availability, condition, shipping, tax, discounts, promotions, affiliate URLs, Cheapest, current price, rank, score, recommendation, or Pick.

## URL and binding rules

- HTTPS is mandatory.
- Credentials, explicit ports, known URL shorteners, homepage roots, and arbitrary query parameters fail closed.
- Recognized tracking parameters are removed; fragments are not part of the canonical destination.
- Destination host, marketplace, and the canonical Atlas retailer website host must match after normalization.
- The Atlas product must be active and ready, and its exact manufacturer part number must match the reviewed binding.
- The Atlas retailer must be active.
- Missing or malformed product, retailer, evidence, operator, provenance, lifecycle, or binding data fails closed.

No network request or link-health assertion participates in validation.

## Repository and lifecycle

`FileRetailerDestinationRepository` is the sole GROWTH-005A persistence boundary. It uses immutable append-only records and validated indexes for destination ID, product, retailer, and product/retailer/marketplace binding.

- First valid retain: `RETAINED`.
- Exact replay: `DUPLICATE`, with no second record.
- Same identity with different material content: replay conflict.
- Parallel effective destinations for one binding: conflict.
- Replacement or retirement: a new immutable record must supersede the current effective active record.
- Missing, stale, cross-binding, cyclic, or otherwise malformed lineage fails closed.
- Retired history remains queryable; it is never rewritten or deleted.

The repository validates all stored records and indexes on read. Invalid persisted state is not partially trusted.

## Read projections

Queries support ID, product, retailer, composite binding, all records, and the effective active record. Returned objects are defensive immutable copies. Neutral public ordering, when later authorized, is retailer display name then retailer ID; price and affiliate state cannot affect it.

The Beacon projection contains only destination ID, product ID, retailer ID, marketplace, destination type, and status. It excludes the destination URL and all unauthorized market or commercial data.

## Fixture certification

Fixtures cover deterministic identity, URL normalization, exact Atlas binding, lifecycle validation, immutable reads, idempotent replay, conflict handling, replacement and retirement lineage, malformed-state rejection, affiliate independence, neutral ordering, privacy-safe Beacon projection, and explicit absence of downstream authority. They use no production destination record, provider call, link-health check, paid task, or spend.

## Deferred seams

A future increment may add a validated source-controlled destination manifest and a public product-page resolver. Public rendering, operator production records, link-health monitoring, affiliate transformation/fallback behavior, and outbound event ingestion remain outside this increment and require their own authority.
