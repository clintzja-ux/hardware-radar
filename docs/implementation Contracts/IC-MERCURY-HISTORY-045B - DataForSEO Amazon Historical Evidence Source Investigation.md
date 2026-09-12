# IC-MERCURY-HISTORY-045B — DataForSEO Amazon Historical Evidence Source Investigation

## Status and decision

Documentation-only investigation complete. Decision: `AMAZON_SOURCE_RECOMMENDED` as an additional, independently governed Mercury historical-evidence source. No Amazon source right, implementation, task, retrieval, retention, checkpoint, or downstream authority is created by this decision.

## Provider-documented model

Current official DataForSEO documentation establishes this Standard Queue path:

1. Amazon Products accepts a keyword/product name plus location and language and returns Amazon listing candidates. Candidate evidence includes title, product URL, `data_asin`, item-price range, currency, special offers, and delivery information.
2. Amazon ASIN accepts one ASIN and returns product information plus the parent ASIN and ASINs assigned to product modifications. It is an optional identity/variant corroboration stage, not a seller-observation prerequisite in every case.
3. Amazon Sellers requires one ASIN plus location and language and returns marketplace offers with `seller_name`, `seller_url`, `ships_from`, current/regular price, currency, price-range state, vouchers, seller rating, explicit `condition`/`condition_description`, and delivery dates/message/price.
4. Standard tasks use separate POST and GET operations. Completed advanced results are retrievable by task ID for 30 days without another task charge.

An ASIN is a provider-documented Amazon product identifier. Mercury may therefore classify it as `DOCUMENTED_AMAZON_PRODUCT_IDENTITY`, while Atlas remains the sole canonical product identity owner. Parent/child and modification relationships mean one MPN-to-ASIN mapping is not presumed unique.

Authoritative references:

- [Amazon Merchant API overview](https://docs.dataforseo.com/v3/merchant-amazon-overview/)
- [Amazon Products task POST](https://docs.dataforseo.com/v3/merchant-amazon-products-task_post/)
- [Amazon Products advanced result](https://docs.dataforseo.com/v3/merchant-amazon-products-task_get-advanced/)
- [Amazon ASIN task POST](https://docs.dataforseo.com/v3/merchant-amazon-asin-task_post/)
- [Amazon ASIN advanced result](https://docs.dataforseo.com/v3/merchant-amazon-asin-task_get-advanced/)
- [Amazon Sellers task POST](https://docs.dataforseo.com/v3/merchant-amazon-sellers-task_post/)
- [Amazon Sellers advanced result](https://docs.dataforseo.com/v3/merchant-amazon-sellers-task_get-advanced/)
- [Amazon API pricing](https://dataforseo.com/pricing/merchant/amazon-api)

## Identity and ambiguity doctrine

Atlas-to-ASIN binding must be deterministic, contradiction-aware, and independent of price, retailer preference, affiliate state, result order, or fuzzy similarity. Candidate assessment should use the available Atlas facts: exact MPN, canonical brand/aliases, capacity, module count, DDR generation, form factor, speed, timings, color, and RGB. Missing provider fields remain unknown.

Conceptual fail-closed outcomes are:

- `STRONG_UNIQUE_ASIN`: exactly one materially concordant ASIN and no contradiction; eligible only for the next separately governed stage.
- `MULTIPLE_COMPATIBLE_ASINS`: several materially concordant ASINs; require documented modification evidence or explicit review, never price-based selection.
- `ASIN_VARIANT_CONFLICT`: modification, capacity, kit, color, form-factor, condition, or other material conflict.
- `ASIN_NOT_FOUND`: no candidate.
- `BUNDLE_ASIN`, `RENEWED_OR_USED_ASIN`, or `INSUFFICIENT_ASIN_EVIDENCE`: fail closed for ordinary new standalone history.

The ASIN endpoint can supply product details and modification relationships useful for resolving variants, but it does not turn an ASIN into Atlas identity and does not guarantee that every specification needed by Atlas is present.

## Offer, marketplace, and comparability semantics

Amazon Sellers explicitly supplies offer-level condition. This can improve Mercury evidence quality, but null/missing condition remains unknown and is never inferred as `NEW`. Seller-result presence or delivery information is not silently converted into an unsupported stock state.

`RETAILER-0001` owns canonical Amazon marketplace identity. `seller_name` identifies the offer merchant and `ships_from` identifies fulfillment origin; neither is automatically the Amazon retailer. Third-party seller identity must remain distinct and requires stable governed resolution before historical admission. A bounded first acceptance may succeed only where the seller/marketplace binding is unambiguous under certified policy; otherwise it stops for merchant identity.

Seller price and delivery price are distinct. Known delivery price is retained; `null` is not automatically zero unless the provider contract and normalized record explicitly preserve free delivery semantics. Price ranges are not silently reduced to one comparable price.

Products `special_offers` and Sellers `applicable_vouchers` expose coupon and Subscribe & Save evidence. Titles/details and ASIN modifications can expose bundles or variants. The inspected contract does not guarantee structured coverage for every membership, trade-in, financing, quantity, or other conditional term, so absence of those fields proves nothing. HISTORY-018 continues to fail closed when standalone comparability cannot be established.

## Existing repository fit and gaps

Existing Amazon support is a different boundary: Atlas has `RETAILER-0001`, Mercury has an Amazon offer adapter and Amazon Creators API acquisition foundation, current-display/destination logic recognizes Amazon URLs/ASINs, and `AMAZON_CREATORS_API` has a one-hour, non-historical rights profile. That implementation does not implement DataForSEO Amazon Merchant API. Its normalizer currently has Creators/manual-era defaults, including defaulting absent condition to `NEW`; it must not be reused unchanged for this source.

The current historical pipeline is only partly source-neutral:

- `HistoricalOfferComparabilityAssessment`, `HistoricalObservation`, its repository, and `HistoricalObservationPortfolio` can preserve generic source, seller, market, price, condition, timestamp, and provenance semantics.
- DF003 Sellers adaptation, retained-evidence naming/shape, E2G/E2H promotion composition, bootstrap preparation, acquisition-chain resolution, and E2J admission explicitly assume `DATAFORSEO_GOOGLE_SHOPPING` plus Google `productId`/`dataDocId`/`gid` lineage.
- E2J explicitly rejects any other source and currently binds one Atlas retailer plus a seller-name string; third-party Amazon seller governance therefore requires an explicit compatible projection rather than collapsing seller into marketplace.

The smallest implementation should add source-specific Amazon Products/ASIN/Sellers transport and normalization adapters while extending the existing retained-evidence, promotion, comparability, and admission owners through typed supported-source projections. It must preserve existing storage compatibility and must not create a parallel evidence or history repository.

## Rights and cost

`DATAFORSEO_GOOGLE_SHOPPING` is intentionally source-specific. The established general DataForSEO use premise does not itself create machine-readable Amazon acquisition, retention, historical-analytics, comparison, or public-display rights. A separate `DATAFORSEO_AMAZON` source-rights profile and explicit approval are prerequisites; this investigation does not add them.

Current documented Standard Queue pricing is `$0.0015` per Amazon ASIN product and `$0.0015` per Amazon Products or Sellers product/SERP. Retrieval of a posted task result within 30 days has no additional task charge. With Products depth constrained to one billed SERP:

- minimum identity-to-offer path, Products plus Sellers: two tasks, maximum `$0.003`;
- reasonable enriched path, Products plus ASIN plus Sellers: three tasks, maximum `$0.0045`.

Depth above 100 can incur additional Products charges and is outside that estimate. Pricing must be revalidated at future authorization time.

## Source coexistence and scalability

Recommended strategy: `MULTI_SOURCE_INDEPENDENT_EVIDENCE`. Amazon complements rather than replaces Google Shopping. It can add documented product identity, explicit condition, Amazon seller coverage, offer pricing, delivery information, and independent corroboration, but it represents one marketplace rather than the whole market.

Google and Amazon observations must remain separate by source, provider identity, seller, marketplace, timestamp, price, condition, shipping, rights, and acquisition provenance. Matching Atlas identity never merges observations. Source adapters and policy are generic across supported Atlas products; ASIN bindings are durable evidence, never hard-coded runtime constants.

## Recommended bounded implementation and acceptance

Implement one bounded source class:

1. approve and register the source-specific rights profile;
2. add governed Amazon Products task preparation/execution/retrieval and an immutable ASIN-candidate result;
3. add optional ASIN enrichment for ambiguity/variant resolution;
4. add Amazon Sellers task preparation/execution/retrieval;
5. normalize into the existing retained-evidence boundary without condition defaults;
6. reuse E2G/E2H, HISTORY-018, and E2J through typed source projections and the existing historical repository.

A future acceptance fixture/operation may use `ram_corsair_cmk32gx4m2e3200c16` as data, searching its exact MPN without a hard-coded ASIN. Normal Standard Queue maximum: Products, optional ASIN, and Sellers; three paid tasks and `$0.0045`. Success requires one contradiction-free Atlas-to-ASIN binding, an unambiguous governed seller/retailer binding, explicit standalone condition/comparability, complete provenance/rights, DF003 retention, and E2J eligibility. Multiple compatible ASINs, variants, bundles, renewed/used offers, unknown condition, seller ambiguity, price ranges, conditional offers, or incomplete lineage fail closed.

No implementation or production operation occurred in this investigation. The Google checkpoint `mer_histbootcp_a2442076e9cc3d9d5c234e7f` remains immutable `COHORT_STOPPED/BLOCKED_IDENTITY`.
