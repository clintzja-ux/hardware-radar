# HOTFIX-001 — Merchant Structured Data Integrity

## Status
Implemented locally; deployment and Search Console validation remain operational steps.

## Problem
The live site exposed `Product` and `Offer` microdata for placeholder records. Google Search Console therefore evaluated the pages as merchant listings and reported missing product images, descriptions, identifiers, availability, shipping details, and return policy.

## Decision
Remove merchant-listing microdata from placeholder presentation records. Do not publish incomplete or unverified merchant structured data merely to silence Search Console warnings.

Merchant structured data will be restored when it can be generated from verified sources:

- Atlas: product identity, name, description, image, brand, MPN/GTIN where known.
- Mercury: price, currency, availability, retailer, offer URL, shipping observations.
- Retailer policy data: return and shipping policy only when substantiated.

## Verification
- No `Product` or `Offer` schema.org microdata remains in the placeholder overall renderer.
- Existing visual rendering is unchanged.
- Atlas and Sentinel test suites must remain green.

## Deployment follow-up
1. Deploy the updated public files.
2. Inspect the live rendered HTML.
3. Run Google Rich Results Test against affected URLs.
4. Start Search Console validation only after the deployed pages no longer emit incomplete merchant-listing markup.
