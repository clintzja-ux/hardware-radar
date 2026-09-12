# IC-MERCURY-HISTORY-046 — DataForSEO Amazon Source Contract and ASIN Identity Foundation

## Status

Fixture-certified source foundation. `DATAFORSEO_AMAZON` is a distinct Mercury source from both `DATAFORSEO_GOOGLE_SHOPPING` and `AMAZON_CREATORS_API`. H046 creates no transport, production command, provider task, retained production evidence, or downstream authority.

## Existing owners and source rights

The existing `SourceRightsRegistry` owns the source profile. The established DataForSEO market-intelligence authorization and this bounded approval permit API acquisition, ephemeral/current processing, durable evidence retention, historical retention and analytics, comparison, offer-condition derivation, and public display subject to all later evidence/publication gates. Manual/import acquisition remain blocked. Attribution remains conditional. The current rights schema has no redistribution capability; redistribution is therefore unestablished and fail closed.

The profile is not inherited from Google and does not reuse Amazon Creators API rights or its one-hour TTL. Cross-source lookup fails closed, and revocation of Amazon API acquisition blocks Amazon acquisition.

## Provider operation contracts

The typed, transport-free operations are `AMAZON_PRODUCTS`, `AMAZON_ASIN`, and `AMAZON_SELLERS`.

- Products preserves `data_asin`, title, URL, price range, currency, delivery, and special offers. Its price is not historical-offer authority.
- ASIN preserves `data_asin`, `parent_asin`, modification/product ASINs, brand/author, title, structured details, price range, and currency. Parent/child relationships remain evidence rather than identity equivalence.
- Sellers preserves the ASIN, seller name/URL, `ships_from`, condition and description, current/regular price, currency, vouchers, rating, delivery, and delivery price.

Missing condition remains `null`; it is never defaulted to `NEW`. Missing delivery price remains `null`; explicit numeric zero remains zero. Tax and unavoidable fees remain unknown unless separately established.

## Atlas-to-ASIN identity assessment

`assessAtlasAmazonAsinIdentity` is pure, deterministic, order-independent, and product-generic. It compares available provider evidence to Atlas MPN, approved brand aliases supplied by the caller, capacity, module count, DDR generation, form factor, speed, timings, color, and RGB. Missing provider facts are missing, not contradictions. Price, seller, fulfillment, ratings, retailer preference, and affiliate state are excluded from identity selection.

Outcomes are `STRONG_UNIQUE_ASIN`, `MULTIPLE_COMPATIBLE_ASINS`, `ASIN_VARIANT_CONFLICT`, `ASIN_NOT_FOUND`, `BUNDLE_ASIN`, `RENEWED_OR_USED_ASIN`, and `INSUFFICIENT_ASIN_EVIDENCE`. Only one contradiction-free exact-MPN ASIN yields a `DOCUMENTED_AMAZON_PRODUCT_IDENTITY` provider anchor. That anchor is not Atlas mutation, historical eligibility, canonical admission, review, publication, Current Price, Cheapest, or Pick authority.

Bundles cannot establish standalone product identity or component price. Renewed, used, refurbished, open-box, and pre-owned identity remains distinct from new. Multiple compatible ASINs remain unresolved unless later governed variant evidence resolves the exact Atlas variant.

## Existing Amazon destinations

Checked-in Amazon destinations include ASIN-shaped `retailerListingId` and `/dp/<ASIN>` evidence. H046 may pass those identifiers into the assessment as sorted corroborating evidence, but destination navigation review did not grant canonical provider-identity authority. They never select or override an ASIN automatically.

## Retention, history, and source independence

The existing retained-evidence repository already keys acquisition identity by source plus provider task/item reference and fingerprints material evidence. Fixtures prove Google and Amazon records for one Atlas product remain two records with independent source/provenance lineage; Atlas product, timestamp, or price similarity does not merge them.

The historical observation schema and repository already preserve a generic `provenance.source`, so they can distinguish Amazon from Google without schema or repository changes. The transport-free Sellers projection defines the minimal later DF003-compatible shape: provider/source, Atlas binding, ASIN provider identity, merchant evidence, prices, null-safe condition/shipping/tax, and task/time/raw-reference provenance.

E2J is not broadened in H046. Its current promotion assessment and acquisition-chain owners are Google-specific; changing only its source equality check would create a misleading admission path without certified Amazon DF003 identity, merchant, promotion, and chain composition. The exact remaining blocker is a typed Amazon retention/promotion/admission composition that supplies those existing owners with complete Amazon lineage. Google safety checks remain unchanged.

Third-party seller name, URL, and `ships_from` may be retained as source evidence while canonical merchant resolution remains unresolved. Retention does not register that merchant, bind it to `RETAILER-0001`, or authorize history.

## Scalability and exclusions

No ASIN or Atlas product is hard-coded. The identity semantics are certified once for the supported evidence class and apply by data/configuration to supported Atlas RAM products. H046 adds no HTTP client, POST/GET, polling, production CLI, paid authorization, queue, history store, or provider operation. The next increment is bounded fixture composition of Amazon task transport and immutable result handling before any live authorization.
