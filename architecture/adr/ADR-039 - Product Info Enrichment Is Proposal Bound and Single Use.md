# ADR-039 — Product Info Enrichment Is Proposal Bound and Single Use

## Decision
A PRODUCT_INFO paid task requires a separate expiring authorization bound to the exact E2C proposal, source PRODUCTS task, Atlas product, provider identity, and execution plan. Authorization permits one task, at most $0.001, with zero automatic retries, and is consumed before paid transport.

Provider-identity substitution invalidates the proposal binding. The unattended scheduler receives no Product Info LIVE authority.
