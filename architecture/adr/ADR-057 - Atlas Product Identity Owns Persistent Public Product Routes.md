# ADR-057 — Atlas Product Identity Owns Persistent Public Product Routes

**Status:** Accepted
**Date:** 2026-09-02

## Context

Hardware Radar needs stable public product pages that future market, comparison, destination, interest, and decision-intelligence capabilities can reference without redefining product identity. Atlas products already carry permanent `atlasProductId` values and validated repository-unique lowercase slugs. Deriving another routing identity from display copy or current market state would create avoidable churn and competing ownership.

## Decision

Atlas owns public product identity. For RAM, the mapping is:

```text
Atlas identity.atlasProductId
+ Atlas identity.slug
→ /ram/<slug>/
```

The Atlas product ID remains the authoritative machine identity. The existing Atlas slug is the persistent public routing identity; it is not a replacement ID. Public generation validates every product and fails closed on an invalid product, unsafe slug, duplicate slug, duplicate route, or mismatched product/route binding.

The public generator does not manufacture a new slug from mutable display labels. Existing Atlas slugs may contain an MPN where that was part of the canonically reviewed identity, but the public layer does not automatically append MPNs. Once published, a slug is treated as persistent. A genuine identity correction that requires changing a shipped route must be handled by a future explicit alias/redirect migration rather than silent regeneration.

Generated detail pages and the catalog projection may expose shopper-useful Atlas specifications only. Mercury observations, price, availability, retailer, affiliate, editorial, recommendation, and publication state neither define nor authorize the route.

## Consequences

- every canonical Atlas RAM product resolves deterministically to one public Hardware Radar route;
- future subsystems attach to the Atlas product ID and reuse the same public route;
- display-label edits do not automatically rewrite URLs;
- route and sitemap generation share one Atlas-owned identity function;
- no separate public identity registry is needed; and
- redirect/alias lifecycle support remains a future governed increment if an established route ever requires correction.
