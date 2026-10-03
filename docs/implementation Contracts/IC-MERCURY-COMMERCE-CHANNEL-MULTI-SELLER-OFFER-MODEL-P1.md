# IC-MERCURY-COMMERCE-CHANNEL-MULTI-SELLER-OFFER-MODEL-P1

Status: implemented and fixture-certified; production activation not authorized.

## Purpose

Mercury Current schema `1.1` can represent multiple evidence-grounded offers for one Atlas product and commerce channel without collapsing seller, offer, or destination identity. Existing Atlas `Retailer` / `retailerId` remains the canonical commerce-channel owner and is not duplicated or renamed.

## Domain contract

- Product identity belongs to Atlas.
- Commerce channel is the stable shopping organization/site represented by the existing retailer identity.
- Seller is offer-level attribution with `KNOWN` / `UNKNOWN` state, optional source-local identifier, and optional profile URL. Marketplace sellers are not canonicalized into Atlas.
- Offer identity is a deterministic digest of product, commerce channel, listing identity, seller identity when known, and condition. Price, timestamps, acquisition mode, and randomness are excluded.
- Unknown seller is representable only when listing evidence anchors the offer. Otherwise the projection fails closed.
- Seller profile URLs are attribution/navigation evidence, never offer-specific public actions.
- Actionability is independent of market-fact retention: `CHANNEL_PRODUCT_DESTINATION`, `OFFER_SPECIFIC_DESTINATION`, `SELLER_PROFILE_ONLY`, or `NO_ACTIONABLE_DESTINATION`.

## Compatibility

Current snapshot `1.0` remains readable with its original one-product/channel uniqueness. A deterministic `LEGACY_PRODUCT_CHANNEL` projection supplies compatibility offer identity without inventing seller facts. Snapshot `1.1` uses explicit offer identity for uniqueness. No canonical Current or History migration is part of this increment.

Offer-level reconciliation replaces/reprices the same offer identity, retains distinct seller/listing/condition offers simultaneously, scopes competing-source review to the same offer identity, and can withdraw one exact offer without removing unrelated offers on the channel.

## Frozen boundaries

Current qualification, RetailerDestination ownership, affiliate routing, Cheapest, Picks, RAM Terminal, public projection, structured data, publication, release, and deployment are unchanged. Schema capability alone grants no Current readiness or public authority. DataForSEO Amazon availability/actionability blockers remain unresolved; Rakuten unknown-seller observations remain representable only with a listing anchor; Google direct merchants retain their actual commerce channel.

## Certification

Focused fixtures cover commerce-channel semantics, known/unknown seller attribution, first- and third-party sellers, same/different listing behavior, condition isolation, price/time/source-mode identity stability, exact-offer source conflict, independent actionability, seller-profile rejection as an offer CTA, legacy migration simulation, manual/DataForSEO/Rakuten/Google-shaped compatibility, offer update/removal, schema repository acceptance, and public-policy freeze.

Canonical production state and generated public output are not mutated.
