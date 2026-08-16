# IC-DATAFORSEO-003 — DataForSEO Market Observation Pipeline

**Status:** IN PROGRESS  
**Owner:** Mercury  
**Source:** DATAFORSEO_GOOGLE_SHOPPING

## Objective

Convert authorized DataForSEO Google Shopping seller evidence into trustworthy Mercury market observations without coupling market truth to affiliate relationships.

## Increment A — Lossless Seller Evidence

Normalize `shops_list` seller results while preserving seller identity, base price, shipping, tax, total price, currency, condition, availability, product evidence, and acquisition provenance. Null remains null and source semantics are not rewritten.

## Increment B — Atlas Product Resolution State

Attach Atlas product-resolution evidence to normalized market evidence. `PROBABLE`, `AMBIGUOUS`, and `REJECTED` evidence must not silently cross the canonical Mercury observation boundary. Publication eligibility remains separate from identity eligibility.

## Increment C — Independent Merchant Identity & Observation Eligibility

Resolve seller identity against canonical Atlas retailer records using normalized domain evidence.

Outcomes:

- `RESOLVED` — exactly one Atlas retailer matches the canonical merchant domain.
- `DISCOVERED` — no canonical retailer currently exists; retain evidence but require registration/review.
- `CONFLICT` — seller domain and seller URL disagree, or multiple Atlas retailers claim the same canonical domain; fail closed.

Canonical observation eligibility requires both:

1. confirmed/automatic Atlas product eligibility; and
2. resolved canonical retailer identity.

Licensed raw DataForSEO evidence may remain durably retainable while unresolved, but unresolved evidence is excluded from canonical historical analytics.

## Explicit Non-Goals

- Creating synthetic `RETAILER-####` identifiers.
- Treating affiliate enrollment as merchant identity.
- Automatically publishing observations.
- Automatically creating Atlas retailer records.
- Collapsing arbitrary subdomains into one merchant identity without an explicit alias policy.
