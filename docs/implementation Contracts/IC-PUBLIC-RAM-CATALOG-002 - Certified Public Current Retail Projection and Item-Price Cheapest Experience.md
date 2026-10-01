# IC-PUBLIC-RAM-CATALOG-002 — Certified Public Current-Retail Projection and Item-Price Cheapest Experience

## Status

Implemented, fixture-certified, and repository-validated.

## Purpose

Expose the existing ephemeral Mercury current-display stream through a deterministic, sanitized public artifact and render truthful current item-price comparisons across the RAM homepage, category surfaces, catalog, and product pages.

## Ownership and inputs

Mercury owns `PublicCurrentRetailProjection`. Its only governed inputs are canonical Atlas RAM products, canonical active retailers, admitted `RetailerDestination` bindings, and the current ephemeral display snapshot. The build reads ignored operator state server-side and writes only the bounded public artifact `public/data/ram-current-retail.json`; browser code never reads `.forge-review`.

The projection does not read or write retained evidence, historical observations, canonical observations, reviews, E2S assessments, publication decisions, affiliate state, or recommendation state.

## Public policy

Policy `PUBLIC-RAM-CURRENT-RETAIL-001-1.0` requires:

- exact active/ready Atlas product identity;
- exact active canonical retailer and destination binding;
- an upstream `itemPriceEligible=true` current-display offer;
- positive USD item price and valid observation time;
- age no greater than 36 hours at the explicit build evaluation time.

Future-dated, stale, blocked, malformed, unavailable, or unbound offers fail closed. Missing source state produces a valid empty artifact.

## Comparison semantics

`Cheapest RAM Today` means the lowest fresh qualifying displayed **item price** within the tracked scope. Deterministic order is item price, retailer ID, Atlas product ID, then destination ID. Overall, DDR5 desktop, DDR4 desktop, and laptop/SO-DIMM scopes are evaluated independently.

This is not delivered-cost Cheapest. Public output preserves shipping and fees as `null` and `taxesIncluded=false`, and every price surface uses the exact disclosure:

> Prices shown exclude applicable shipping, taxes, and fees.

Affiliate state is not an input to eligibility, ordering, or winner selection.

## Public artifact

The versioned artifact contains:

- schema and policy versions;
- explicit `asOf`, freshness threshold, state, semantics, and disclosure;
- bounded counts;
- deterministic scope winners;
- product-grouped eligible offers with public Atlas facts, retailer/destination identity, destination URL, item price, observation time, and explicit unknown-cost fields.

It excludes raw payloads, workbook/review metadata, operator notes, affiliate state, credentials, and private repository paths. Validation rejects wrong policy/semantics, invalid identities, prices, freshness, URLs, unknown-cost representation, winners, or private-field leakage.

## Presentation

- Homepage renders the overall and category winners, with unavailable scopes remaining fail closed.
- Category pages render only their qualifying scope winner.
- `/ram/` remains a complete Atlas catalog; eligible products may show a current tracked price while products without one remain browseable.
- Product pages may render all fresh qualifying tracked offers and the per-product lower current item price.
- No `Offer` structured data is emitted.

## Authority exclusions

Projection and rendering create no retained evidence, historical/canonical observation, review approval, E2S qualification, publication decision, durable Current Price, delivered-cost Cheapest, Pick, recommendation, affiliate, or acquisition authority. The current artifact is replaceable build output and is not Mercury history.

## Safety and operations

This increment performs no provider/network operation, paid task, acquisition, rights mutation, Atlas mutation, current-display source mutation, history mutation, publication operation, deployment, or spend.
