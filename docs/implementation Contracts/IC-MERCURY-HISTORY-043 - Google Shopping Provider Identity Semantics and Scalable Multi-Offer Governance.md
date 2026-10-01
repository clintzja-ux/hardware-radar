# IC-MERCURY-HISTORY-043 — Google Shopping Provider Identity Semantics and Scalable Multi-Offer Governance

## Status

`PROVIDER_IDENTITY_MODEL_REQUIRES_EXPLICIT_GROUPING`; resolve this semantic boundary before another paid Stage-A acceptance run. This is an investigation result, not a policy or runtime change.

## Provider documentation

The official DataForSEO Google Shopping contracts distinguish several layers:

| Field | Provider-documented meaning | Authority classification |
|---|---|---|
| `product_id` | Unique Google Shopping product identifier; DataForSEO also documents it as shared where several retailers sell the same product; nullable in responses | `DOCUMENTED_PRODUCT_IDENTITY` |
| `gid` | Global identifier assigned to a Google Shopping product entity; nullable | `DOCUMENTED_PRODUCT_IDENTITY` |
| `data_docid` | Unique identifier of the SERP data element | `DOCUMENTED_DOCUMENT_IDENTITY` |
| `seller` | Company placing the corresponding product on Google Shopping | `DOCUMENTED_MERCHANT_IDENTITY` |
| `shopping_url` | URL of the Google Shopping product page | `SEMANTICS_UNSPECIFIED` for stable identity or grouping |
| `domain` | Result domain when present | `SEMANTICS_UNSPECIFIED` for product identity |
| `title`, `price`, `currency` | Descriptive/market attributes of the result item | `SEMANTICS_UNSPECIFIED` for identity |

No inspected field is documented as a distinct offer identifier. A PRODUCTS task/result ID identifies the governed request/result, not a product or offer. The inspected schema supplies no separate documented grouping key beyond a common non-null `product_id` or product-entity `gid`.

Authoritative references reviewed:

- [Google Shopping Products: task_get/advanced](https://docs.dataforseo.com/v3/merchant-google-products-task_get-advanced/)
- [Google Shopping Sellers: task_post](https://docs.dataforseo.com/v3/merchant-google-sellers-task_post/)
- [Google Shopping Product Info: task_post](https://docs.dataforseo.com/v3/merchant-google-product_info-task_post/)
- [Google Shopping Product Info: task_get/advanced](https://docs.dataforseo.com/v3/merchant-google-product_info-task_get-advanced/)
- [Google Shopping API overview](https://docs.dataforseo.com/v3/merchant-google-overview/)
- [What is the Product ID in Google Shopping?](https://dataforseo.com/help-center/product-id-google-shopping)
- [What is a GID in Google Shopping API?](https://dataforseo.com/help-center/whats-a-gid-in-google-shopping-api)

## Real-result finding

Read-only inspection of canonical result `mer_providerresult_8fe5fcdc9709ad24b4ee51d6` establishes three clean exact-MPN records for Atlas product `ram_corsair_cmh16gx5m2b5200z40`:

| `data_docid` | `product_id` | `gid` | Seller | Price |
|---|---|---|---|---:|
| `11576802757176384012` | null | null | PayMore Summerville | USD 235.99 |
| `5327259357682777702` | null | null | Newegg.com | USD 299.99 |
| `83202910179076809` | null | null | Walmart - Newegg Inc. | USD 299.99 |

All three are `google_shopping_serp` items, use Google Shopping URLs carrying their respective headline-offer DataDoc, and have no result `domain`. Their titles contain the exact canonical MPN and have no material Atlas contradiction. They therefore yield `SAME_ATLAS_PRODUCT_CORROBORATED`. They do **not** establish one shared provider product identity because all three lack `product_id` and `gid`; the provider-documented relationship is therefore `THREE_DOCUMENTS_WITH_UNSPECIFIED_PRODUCT_RELATIONSHIP` and `DOCUMENTED_SHARED_PRODUCT_ID_NOT_AVAILABLE` for this candidate set.

## Existing Hardware Radar layers and operation roles

- Atlas owns canonical product identity. Concordant provider documents can corroborate that Atlas identity but never become Atlas IDs.
- `product_id`/`gid`, when present and provider-documented, represent provider product/product-entity identity.
- `data_docid` remains immutable provider result/document identity. It is a valid task key even when product-level keys are absent, but is not promoted into a product grouping key.
- Merchant identity and Atlas retailer identity remain separate governed resolutions. Retailer destinations remain navigation metadata only.
- Seller/marketplace placement and downstream Sellers offer evidence remain separate from product and document identity.
- PRODUCTS discovers candidate records and must yield a governed exact identity tuple before the current PRODUCT_INFO or Sellers task owners can execute.
- PRODUCT_INFO accepts one `product_id`, `data_docid`, or `gid` tuple and returns detail for that selected Google Shopping record/product. It cannot accept this unresolved three-document set as a grouping request.
- SELLERS accepts one governed provider tuple and enumerates sellers/offers for the specified Google Shopping product anchor. Under the current lineage contract, selecting a DataDoc is necessary to bind the task, authorization, result, replay, and subsequent evidence; it must not be disguised as Atlas identity resolution.

The current resolver therefore conflates two outcomes at its routing boundary: Atlas identity may be materially corroborated while the single downstream provider-document tuple remains unresolved. The existing provider-document equivalence assessment already preserves this distinction partially, but its manual selection does not prove that members share one provider product identity and does not merge their identities.

## Evidence survey and scalability

The six existing production PRODUCTS reviews plus this Stage-A result provide seven measurable result sets. Five have no clean exact candidate. Kingston `ram_kingston_kvr32n22d8_32` has five clean exact candidates and routes to manual selection; this Stage-A result has three and would also route to manual selection. Thus the measured counts are: one clean exact candidate `0/7`; multiple clean exact candidates `2/7`; manual-selection routing `2/7`; no observed clean group shares one non-null `product_id`. Both multi-candidate sets include missing product-level identifiers, and all three current Corsair candidates lack both `product_id` and `gid`.

This small sample cannot establish a catalog-wide frequency, but recurrence in two of seven observed production sets makes per-result manual selection a credible scaling bottleneck rather than a demonstrated one-off.

## Doctrine options

- `KEEP_UNIQUE_PROVIDER_ID_REQUIRED` is safe and compatible today, but scales through manual choice and can incorrectly suggest Atlas identity is unresolved.
- `ATLAS_IDENTITY_CAN_BE_ESTABLISHED_FROM_MULTIPLE_CONCORDANT_PROVIDER_DOCUMENTS` is supported for Atlas corroboration only; it must not collapse DataDocs or authorize a downstream provider task.
- `USE_DOCUMENTED_SHARED_PROVIDER_PRODUCT_ID` is safe for grouping only when candidates carry the same non-null, documented product-level key and all contradiction checks pass. It does not apply to the current three records.
- `DEFER_PROVIDER_DOCUMENT_SELECTION_TO_SELLERS` is unsupported by the current API/task and lineage contracts because Sellers requires a concrete provider identifier before execution.

## Recommended generic model

Adopt, in a future separately authorized policy increment, `LAYERED_CONCORDANT_ATLAS_WITH_EXPLICIT_PROVIDER_GROUPING`:

1. Multiple contradiction-free exact-MPN documents may establish `SAME_ATLAS_PRODUCT_CORROBORATED` without choosing or merging a document.
2. Every `data_docid` remains distinct immutable document lineage.
3. Automatic provider-product grouping is permitted only by an identical non-null provider-documented product-level key (`product_id`, or `gid` where the accepted policy explicitly treats its documented product-entity semantics as sufficient).
4. When no shared documented product-level key exists, the downstream provider tuple remains unresolved and execution fails closed; no price, seller, retailer registration/destination, affiliate state, result order, or trust preference may choose it.

This model is product-generic, replay-safe, price-neutral, retailer-neutral, and compatible with immutable lineage. It separates Atlas corroboration from provider grouping and task routing. It does not itself authorize a task or change current policy.

## Operational disposition

Checkpoint `mer_histbootcp_4fa3d069973180b29221c6aa` remains immutable `COHORT_STOPPED/BLOCKED_IDENTITY` and is not revived or reinterpreted. The next-acceptance decision is `RESOLVE_PROVIDER_IDENTITY_MODEL_FIRST`: certify the layered semantic class once, with fixtures for shared and absent provider product keys, before preparing a new artifact/checkpoint. No provider call, retrieval, paid task, manual selection, checkpoint/history/Atlas/current-display mutation, commit, push, or deployment occurred; additional spend is `$0.000`.
