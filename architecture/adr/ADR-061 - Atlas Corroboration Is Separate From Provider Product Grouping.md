# ADR-061 — Atlas Corroboration Is Separate From Provider Product Grouping

**Status:** Accepted
**Date:** 2026-09-11

## Context

Google Shopping PRODUCTS results may contain several materially concordant documents for one canonical Atlas product. DataForSEO documents `data_docid` as the identity of a SERP data element and documents nullable `product_id` and `gid` fields as product/product-entity identifiers. Exact manufacturer-part-number agreement can corroborate Atlas identity, but it cannot prove that distinct DataDocs share one provider product identity.

Treating document multiplicity as Atlas ambiguity creates unnecessary human review. Conversely, collapsing documents on title, MPN, seller, price, URL, or result order invents provider semantics and can bind a downstream paid task to the wrong provider anchor.

## Decision

Mercury represents Atlas identity corroboration and provider identity resolution independently.

Multiple clean, contradiction-free, exact-MPN provider documents may corroborate one Atlas product. Each DataDoc remains a distinct immutable document identity. Multiple documents may be grouped automatically as one provider product only when every relevant document supplies an identical non-null provider-documented `product_id` or identical non-null `gid`. Conflicting non-null identifiers fail closed; neither namespace receives heuristic precedence.

A documented shared group supplies downstream owners with one product-level anchor containing only the common `product_id` and/or `gid`; it does not select a DataDoc. Without a common documented product-level key, provider identity remains unresolved and no PRODUCT_INFO or SELLERS task may execute where one provider anchor is required.

Price, seller, retailer identity or destination, affiliate state, trust, and result ordering have no provider-identity authority. Existing task authorization, rights, spend, result, retention, historical, current-market, and publication owners remain unchanged.

## Consequences

- Atlas corroboration can scale across concordant evidence without falsely merging provider documents.
- Downstream provider tasks retain one deterministic, replay-safe anchor.
- Null or conflicting provider product keys remain fail closed.
- Previously persisted results and stopped checkpoints retain their original policy interpretation and are never rewritten.
- The rule is provider-semantic and product-generic; it is certified once for the supported Google Shopping identity class rather than per Atlas product.
- This ADR creates no provider call, paid authority, checkpoint, manual selection, historical admission, Current Display, or publication authority.
