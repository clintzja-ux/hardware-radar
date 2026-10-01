# IC-MERCURY-HISTORY-044 — Layered Atlas Corroboration and Explicit Provider Product Grouping

## Status

`MERCURY_LAYERED_PROVIDER_IDENTITY_CERTIFIED`.

## Boundary and policy

PRODUCTS identity policy `MERCURY-HISTORY-044-1.0` separates Atlas identity corroboration from provider identity resolution. It inherits the official DataForSEO semantics recorded by H043: `product_id` and `gid` are nullable provider product/product-entity identifiers, while `data_docid` identifies an individual SERP element/document.

The deterministic resolution contains two independent projections:

- Atlas: `CONTRADICTED`, `UNRESOLVED`, or `CORROBORATED`.
- Provider: `UNIQUE_DOCUMENT_ANCHOR`, `SHARED_DOCUMENTED_PRODUCT`, `MULTIPLE_DOCUMENTS_UNGROUPED`, or `UNRESOLVED`.

One clean exact-MPN document preserves the certified unique-document path even when `product_id` and `gid` are null. Multiple materially concordant clean documents corroborate one Atlas product. That corroboration grants no provider task authority by itself.

## Explicit provider grouping

Multiple documents form `SHARED_DOCUMENTED_PRODUCT` only when every relevant clean document supplies the same non-null `product_id` or every document supplies the same non-null `gid`. If both keys are universally present, both must remain consistent. Different non-null values for either key fail closed; no identifier receives heuristic precedence.

A shared group produces one product-level downstream anchor containing only its common `product_id` and/or `gid`; `dataDocId` is null. The sorted constituent document tuples remain visible in the resolution for immutable lineage. No DataDoc is selected as a representative.

Multiple documents with no universally shared documented product key produce `MULTIPLE_DOCUMENTS_UNGROUPED`, Atlas remains `CORROBORATED`, and routing produces `UNRESOLVED` with `PROVIDER_IDENTITY_UNRESOLVED`. Price, seller, domain, URL, retailer registration/destination, affiliate state, trust, input order, and result order have no grouping or selection authority.

## Routing and downstream safety

The existing routing owner now distinguishes:

- Atlas contradiction → `MANUAL_IDENTITY_REVIEW`.
- Atlas corroborated plus one unique document anchor → existing SELLERS path.
- Atlas corroborated plus one explicitly shared provider product → existing SELLERS path using the product-level anchor.
- Atlas corroborated plus ungrouped/conflicting documents → `UNRESOLVED`, with no PRODUCT_INFO or SELLERS execution.
- Insufficient Atlas evidence → existing manual review or unresolved path.

PRODUCT_INFO and SELLERS still receive exactly one certified provider anchor. Their authorization and substitution checks are unchanged. No multi-document collection enters those owners. Existing rights, spend, PREPARE, retrieval, DF003, comparability, E2J, history, current-display, and publication policies remain unchanged.

## Real-result replay and immutable history

Offline replay of `mer_providerresult_8fe5fcdc9709ad24b4ee51d6` under H044 produces:

```text
Atlas identity:               CORROBORATED
Provider identity:            MULTIPLE_DOCUMENTS_UNGROUPED
Provider grouping key:        NONE
Downstream provider execution: BLOCKED
Reason:                       PROVIDER_IDENTITY_UNRESOLVED
```

The three clean DataDocs remain distinct and unselected. Terminal checkpoint `mer_histbootcp_4fa3d069973180b29221c6aa` remains immutable `COHORT_STOPPED/BLOCKED_IDENTITY` audit evidence under the policy that produced it; H044 does not rewrite or revive it.

## Certification and scalability

Fixtures certify product-ID grouping, GID grouping, conflicts in either namespace, product-ID/GID contradiction, null-key multi-document behavior, the single-document path, order-independent replay, price/retailer neutrality, downstream product-level anchors, safe real-result replay, and identical behavior across parameterized Atlas products. No product, brand, retailer, or cohort ID is embedded in policy.

The identity semantic class is therefore ready for a separately authorized new acceptance run: `SAFE_FOR_NEW_ACCEPTANCE_RUN`. That classification does not create a checkpoint or authorize paid work. No provider call, retrieval, paid task, production mutation, manual selection, Atlas/history/current-display/publication change, commit, push, or deployment occurred; spend is `$0.000`.
