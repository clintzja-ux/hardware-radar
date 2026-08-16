# ADR-024 — Merchant Identity Is Independent of Affiliate Relationships

**Status:** ACCEPTED  
**Date:** 2026-08-16  
**Owner:** Mirabelle Labs / Hardware Radar

## Context

DataForSEO can surface legitimate merchants that do not have an affiliate relationship with Hardware Radar. Mercury must preserve market truth independently of monetization, while canonical Mercury observations still require a stable retailer identity.

## Decision

A merchant/retailer is a canonical market entity independent of affiliate enrollment. Affiliate status is a separate, mutable commercial relationship and must not determine whether Mercury recognizes a merchant as part of the observable market.

External seller identity is resolved conservatively against Atlas retailer records using canonical hostname evidence. A leading `www.` label is treated as presentation noise; other subdomains remain identity-significant unless a future canonical alias contract explicitly says otherwise.

Unknown merchants are represented as `DISCOVERED` with a deterministic evidence key such as `domain:centralcomputer.com`. Mercury must not synthesize a `RETAILER-####` identifier. Domain/URL disagreement or duplicate canonical retailer matches fail closed as `CONFLICT`.

A discovered or conflicting merchant may have licensed raw source evidence retained for review, but it is not eligible for canonical Mercury historical analytics until both merchant identity and Atlas product identity satisfy the canonical observation boundary.

## Consequences

- Market truth is not limited to affiliate partners.
- Affiliate state remains outside immutable market observations.
- DataForSEO evidence can be durably retained without inventing canonical retailer identity.
- Canonical Mercury observations require a resolved Atlas retailer ID.
- Historical analytics consume canonical observations; unresolved evidence does not contaminate price history.
