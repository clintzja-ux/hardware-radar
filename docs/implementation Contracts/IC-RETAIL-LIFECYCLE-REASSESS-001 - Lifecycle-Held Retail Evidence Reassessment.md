# RETAIL-LIFECYCLE-REASSESS-001 — Lifecycle-Held Retail Evidence Reassessment

Status: IMPLEMENTED / FIXTURE-CERTIFIED / PRODUCTION REASSESSMENT COMPLETED

## Purpose

Reassess the immutable retail-discovery findings that were held only because their Atlas products were not active when the findings were first reviewed. The boundary admits exact retailer destinations after lifecycle activation without repeating retailer research or changing the original evidence.

## Ownership and inputs

Mercury owns destination admission through the existing `RetailerDestination` contract and production destination repository. The reassessment consumes the original ignored lifecycle-hold artifact, the completed manual-review inspection, canonical Atlas product and retailer state, existing destination heads, and the current replaceable display snapshot.

The original hold artifact remains immutable. A separate deterministic reassessment artifact records the source digest, policy version, reviewer, reassessment time, per-finding outcome, resulting destination identity, current-display outcome, and zero-operation/spend declaration.

## Admission rules

- The source artifact must contain exactly the governed 22 findings across 14 Atlas products.
- Every product must resolve to one canonical `ACTIVE` + `READY` Atlas RAM record.
- Every retailer must resolve to an active canonical Atlas retailer.
- Product, manufacturer-part-number, retailer, listing identifier, and exact destination URL bindings must validate.
- Existing destination/listing conflicts fail closed; exact existing records are replay-safe.
- Only `LIFECYCLE_BLOCK_ONLY` findings may pass this boundary.
- No new URL, listing identifier, price, or retailer evidence may be inferred.

## Current-display binding

Destination admission and current-price eligibility remain separate. An existing reviewed numeric offer may be rebound only when its product, retailer, listing URL, and manual price match the governed source row. Its original `observedAt`, condition, availability, marketplace semantics, price, currency, shipping-knownness, and source context are preserved.

Missing manual price produces `PRICE_NOT_EXPOSED`; it is not recovered from stale search-result text. Null condition remains null and fails `StandardRetailNewConditionPolicy`; it is never inferred as `NEW`. Eligibility is recomputed through the existing current-display policy owner.

The snapshot repository continues to retain only current and immediately previous replaceable snapshots. Reassessment creates no durable Mercury price history.

## Prohibited effects

This boundary creates no Atlas mutation, provider call, paid task, retained provider evidence, historical or canonical observation, identity/review decision, E2S/publication authority, durable Current Price, delivered-cost Cheapest, Pick, affiliate state, or deployment.

## Replay and audit

Destination identities are derived by the existing `RetailerDestination` model. Exact replay reuses matching effective destinations and cannot create conflicting heads. The reassessment artifact identity is deterministic over its governed source and bindings; conflicting state fails before repository writes.

Production execution admitted 22 exact destinations and rebound 19 pre-existing reviewed numeric offers. Three destinations remain `PRICE_NOT_EXPOSED`. All 19 rebound offers preserve null condition and remain item-price ineligible; the public eligible-offer set is unchanged.
