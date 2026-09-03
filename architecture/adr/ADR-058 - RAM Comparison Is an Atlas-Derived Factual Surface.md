# ADR-058 — RAM Comparison Is an Atlas-Derived Factual Surface

**Status:** Accepted
**Date:** 2026-09-02

## Context

Hardware Radar needs a shareable way to compare canonical RAM specifications without creating another product identity, a market-data projection, or recommendation authority. Arbitrary pair URLs also risk generating duplicate or thin indexable pages if treated as independent published documents.

## Decision

RAM specification comparison has the authority `DETERMINISTIC_FACTUAL_SPECIFICATION_COMPARISON`. It resolves Atlas public slugs through the existing public catalog projection and compares exactly two canonical Atlas products. It does not read Mercury and cannot establish price, availability, retailer preference, performance ranking, compatibility, recommendation, Cheapest, or Pick authority.

The route contract is:

```text
/ram/compare/?products=<public-slug-a>,<public-slug-b>
```

Order is preserved and displayed neutrally as Product A and Product B. Exactly two distinct, known, safely formed slugs produce a ready comparison. Missing, duplicate, unknown, malformed, or additional values fail closed. One known slug is retained only as an incomplete selection state so catalog and product-detail entry points can populate the other slot. No browser storage or opaque state participates in reconstruction.

Comparison rows expose Atlas-owned facts as `SAME`, `DIFFERENT`, or `NOT_AVAILABLE`; a difference carries no positive or negative meaning. Missing data remains “Not listed” and differs from an explicit Atlas value such as `NONE`. Approximate first-word CAS latency may be derived only when rated transfer speed and CAS latency both exist, using `(CL × 2000) / MT/s`, and must remain labelled as an estimate rather than a score.

The base route is included once in the sitemap. The comparison shell, including query-state comparisons, is `noindex` and canonicalizes to `/ram/compare/`; pair permutations are not generated as static pages or sitemap entries. The surface emits no comparison-specific structured data.

## Consequences

- Atlas product IDs remain the canonical machine identity and Atlas slugs remain the shareable public identity.
- Copied URLs reconstruct the same ordered factual comparison without hidden state.
- Comparison can evolve independently from market publication and recommendation systems without bypassing either.
- Pair-specific indexing requires a future explicit SEO policy rather than emerging accidentally.
- Future analytics may observe comparison events only through a separately authorized Beacon boundary; comparison does not depend on tracking.
