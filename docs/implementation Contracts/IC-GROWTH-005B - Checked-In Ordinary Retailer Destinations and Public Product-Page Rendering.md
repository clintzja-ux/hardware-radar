# IC-GROWTH-005B — Checked-In Ordinary Retailer Destinations and Public Product-Page Rendering

**Status:** IMPLEMENTED / FIXTURE-CERTIFIED / THREE PRODUCTION RECORDS
**Owner:** Mercury source and validation; public static product-page projection
**Date:** 2026-09-02

## Boundary

The checked-in source `packages/mercury/destinations/production-destinations.json` contains canonical GROWTH-005A records directly. It is separate from Atlas, observations, operator state, and generated public files. The empty manifest is valid; malformed JSON or any invalid record, Atlas binding, URL, lifecycle chain, prohibited field, or parallel effective head fails the public build.

No production destination may be inferred. A real record requires an operator-supplied exact HTTPS product URL and explicit review evidence satisfying GROWTH-005A. Git review is the V1 authoring approval boundary.

## Public projection and rendering

Only effective active destinations are projected. Public data is limited to destination ID, Atlas product ID, retailer ID and display name, marketplace, destination URL, and type. Reviewer identity, evidence references, fingerprints, provenance, and lifecycle internals remain private.

Static product generation embeds destinations into their exact Atlas product page. Products with no destination omit the section. The section is titled **Retailer links**, uses **Visit retailer**, and states that links do not indicate current price or availability. Links use validated HTTPS URLs with `target="_blank"` and `rel="noopener noreferrer"`; ordinary links are neither `sponsored` nor affiliate links.

Ordering is canonical retailer display name followed by retailer ID. Rendering consults no observation, price, availability, condition, shipping, rights, affiliate, current-market, review, publication, Cheapest, Pick, or recommendation state. It adds no Offer structured data, route, sitemap entry, catalog link, comparison link, or dynamic API.

Existing published-market navigation now uses the explicit presentation name `offerUrl`; `destinationUrl` is reserved for ordinary `RetailerDestination` navigation. The two sources are not composed.

## Certification and production state

Synthetic fixtures cover empty, single, multiple, superseded, retired, malformed, unsafe, mismatched, and conflicting sources; exact-product rendering; neutral ordering; non-affiliate visibility; output escaping; safe link attributes; absence of market language and Offer schema; and separation from market-offer links.

GROWTH-005B.3 admits three operator-supplied, operator-reviewed Amazon US product-page destinations for exact Atlas products. The records use canonical retailer `RETAILER-0001`, marketplace `amazon.com`, explicit Amazon listing IDs, `OPERATOR_INSPECTED_PUBLIC_PAGE` provenance, and `OPERATOR_EXACT_PRODUCT_REVIEW` binding. The existing URL policy removes `www` while retaining each supplied descriptive `/dp/<ASIN>` path; it introduces no Amazon-specific rewrite.

Production destination records are now `3`. They grant navigation authority only and render independently of pending Amazon affiliate state. No affiliate tag, sponsored relation, price, availability, condition, shipping, offer schema, market observation, publication state, Current Price, Cheapest, Pick, ranking, or recommendation was added. The public market snapshot remains unchanged.
