# IC-FORGE-OPERATOR-PRODUCT-AND-LINK-MANAGEMENT-P1

Status: implemented read-only vertical slice and fixture-certified mutation/link-verification contracts; authenticated production mutation runtime not connected.

## Principle

**HR-OPS-SIMPLICITY-001 — Internal Complexity, External Simplicity.** Forge presents canonical Atlas and Mercury state in an operator-oriented workflow while preserving canonical ownership and security. The acquisition method, file layout, digests, and internal lifecycle mechanics are not routine UI burdens. Consequential changes still require authenticated, auditable canonical-owner execution.

## Product Manager

`forge:product-manager:export` composes all canonical Atlas products, the complete effective and superseded Mercury destination source, canonical Current/History availability, and optional operator-supplied affiliate evidence into `.forge-review/forge/product-manager.json`. The artifact is read-only, network-free, ignored operational output. Forge supports search by brand, MPN, product name, and canonical ID; DDR, form-factor, capacity, lifecycle, and retailer-coverage filters; complete specification inspection; destination and version inspection; affiliate provenance/precedence; Current/History coverage; missing-link and validation issues. It scales mechanically to at least 200 products.

## Write and verification boundaries

`ForgeProductMutationBoundary` is a narrow adapter contract over existing canonical owners. It rejects unauthenticated actions, validates Atlas products and the capacity invariant, detects repository identity duplication through the Atlas validator, and refuses execution when the canonical mutation/audit runtime is absent. It creates no repository, authority, lifecycle, or canonical record.

`GovernedRetailerLinkVerificationService` is a bounded contract for a future trusted runtime. It permits HTTPS only to configured retailer/affiliate hosts, rejects credentials and local/private targets, caps timeouts, distinguishes working, redirected, broken, retailer-blocked, and identity-review outcomes, and does not treat HTTP 200 as exact-product proof or 403 as broken. The static Forge UI does not invoke it.

Product creation/editing, lifecycle changes, destination supersession/retirement, affiliate mutation, and live link checks remain blocked on a deployed authenticated trusted operator runtime. The browser never writes JSON, SQLite, `.env`, workbooks, or evidence. Existing Atlas validation, lifecycle policy, Mercury destination collision/supersession, and affiliate precedence remain the only canonical owners.

## Safety

No provider call, paid task, Current/History mutation, Atlas mutation, destination or affiliate mutation, public recomposition, release change, or deployment occurs. Forge remains read-only. Affiliate state cannot affect price, Cheapest, Picks, History, Terminal, ordering, recommendations, or trust.
