# ADR-040 — Sellers Enrichment Requires Governed Product Info Provenance

## Decision
A SELLERS acquisition may be proposed only from a zero-cost retrieval of a governed PRODUCT_INFO result whose provider identity matches the reviewed PRODUCT_INFO authorization. SELLERS spend requires a new proposal-bound, single-use authorization.

## Consequences
- PRODUCTS, PRODUCT_INFO, and SELLERS task provenance remains linked.
- Provider identity substitution fails closed.
- PREPARE never creates a paid SELLERS task.
- SELLERS authorization permits one task, at most $0.001, with zero automatic retries.
- Seller responses remain evidence and do not bypass DF003 observation eligibility.
