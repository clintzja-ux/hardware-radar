# IC-RAKUTEN-NEWEGG-MAIN-FEED-SEMANTICS-001 — Seller, Condition, and Offer-Classification Evidence Closure

**Status:** EVIDENCE ASSESSED / FAIL-CLOSED FIXTURE-CERTIFIED
**Owner:** Mercury current-display source-adapter and offer-qualification boundaries
**Date:** 2026-09-18

## Decision

The bounded population is the approved US `RAKUTEN_NEWEGG_PRODUCT_CATALOG` ordinary main Product Catalog (`MAIN`, `MAIN_FULL`, and `MAIN_DELTA`) for canonical retailer `RETAILER-0004`. It excludes `NEWEGG_MKPL`, every additional or unclassified feed, independent observations of Newegg Marketplace, other advertisers, other programs, and other geographies.

The available authoritative Rakuten Product Catalog and Newegg program material establishes a current-commerce catalog with product, price, availability, destination, and source fields. It does **not** establish that every row in that bounded population is sold by Newegg first party, is `NEW`, or is an ordinary standalone offer. The documented project research interpretation that the observed main feed represented Newegg first-party new inventory is relevant corroboration, but it is not a reusable source/program guarantee. Fixture data is test input, not authority.

The certified classifications therefore remain:

- seller: `SELLER_REMAINS_UNKNOWN`;
- condition: `CONDITION_REMAINS_UNKNOWN`;
- offer class: `OFFER_CLASS_REMAINS_UNRESOLVED`.

`RakutenNeweggProductFeedAdapter` continues to emit null `sellerType`, `sellerName`, and `condition`. It does not infer these properties from `newegg.com`, retailer identity, affiliate approval, Product Catalog membership, main-feed membership, or absence of contrary text. It does not infer standalone status from a product row or title. No runtime change is required.

## Evidence inventory and provenance

Authoritative evidence consists of the official Rakuten Product Catalog overview, Data Feeds guidance, download guidance, December 2023 implementation guide, September 8, 2026 Appendix A field definitions, and the operator-confirmed approved Newegg advertiser/Product Catalog relationship recorded as `OPERATOR_CONFIRMED_APPROVED_NEWEGG_ADVERTISER_AND_PRODUCT_CATALOG_ACCESS_2026_09_18`. These establish current-commerce rights and technical fields, but none supplies the missing population-level seller, condition, or standalone guarantee.

Project research records an observed distinction between a main feed interpreted as first-party/new inventory and a broader Marketplace population with third-party and non-new offers. That observation remains project research rather than a canonical source contract. The sanitized fixtures prove fail-closed behavior only and never promote the research interpretation into authority.

Because no affirmative semantic is derived, there is no new persisted semantic digest. Existing source-profile, feed-profile, source-record digest, destination, and rights lineage remains unchanged and reconstructable after restart.

## Negative boundaries and downstream effect

Fixture certification proves that a direct `newegg.com` URL, canonical Newegg retailer identity, affiliate/catalog access, `MAIN` membership, marketplace membership, and additional-feed membership do not establish seller or condition. Marketplace and unclassified populations do not inherit main-feed assumptions. Used, refurbished, open-box, third-party, and bundle-shaped evidence must continue through their existing explicit classification boundaries and cannot be overwritten by this source.

The production-shaped ordinary main-feed fixture therefore remains `CONDITION_UNKNOWN`, with `CONDITION_NOT_ELIGIBLE` as its current item-price blocker. It is not current item-price display eligible, item-price comparison eligible, delivered-total eligible, Cheapest eligible, publication eligible, or released. Unknown shipping and fees remain unknown; feed-derived history remains prohibited by the source-rights profile.

## Smallest governed closure input

The next evidence input must be affirmative and narrowly bound. It may be either:

1. authoritative Newegg/Rakuten program or feed documentation that explicitly guarantees seller, condition, and any claimed offer class for the exact US main-feed population; or
2. per-offer evidence bound to the exact source product/SKU, canonical destination, Atlas product, feed observation time, evidence provenance/digest, and independent condition/seller rights, with contradiction and temporal checks.

Per-offer evidence should use the existing prepared-evidence and bounded Forge-review pattern rather than source-code exceptions. Acceptance must remain additive and auditable; it must not rewrite a source row or infer `NEW` from missing data. A broad new review subsystem is not authorized by this contract.

## Safety

No Rakuten connection, feed download, credential test, provider call, paid task, production source-state write, CurrentDisplaySnapshot write, history admission, publication, release, Gateway/Beacon connection, deployment, or spend occurred. Actual spend is `$0.000`.
