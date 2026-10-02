# IC-CURRENT-DISPLAY-PUBLICATION-SCHEMA-1.1-MULTI-OFFER-ELIGIBILITY-P1

## Purpose

The Current publication-eligibility boundary accepts canonical Current schema 1.1 snapshots whose distinct offer identities share an Atlas product and commerce channel. This is eligibility compatibility, not a public marketplace-offer selection policy.

## Durable rules

- Schema 1.0 retains legacy Atlas-product/channel uniqueness and fails closed with `CURRENT_SOURCE_CONFLICT_REVIEW_REQUIRED` when that key repeats.
- Schema 1.1 uses deterministic `offerIdentity` as its uniqueness boundary. Repeated identical offer identities fail closed as `CURRENT_DISPLAY_OFFER_DUPLICATE`; different identities are independently rights- and eligibility-qualified.
- Destination identity, seller presence, and acquisition source do not replace offer identity. A shared destination is not a duplicate offer; an unknown seller is permitted when deterministic listing identity establishes the offer; source remains provenance.
- The publication-eligible internal snapshot preserves every rights-grounded eligible offer. Rows without explicit source-rights lineage remain excluded from this publication path.
- Legacy public portfolio consumers continue to receive at most one offer per Atlas product/channel. When schema 1.1 has multiple offers, the compatibility projection retains the single offer identity present in the predecessor snapshot. If exactly one predecessor identity cannot be established, it fails closed with `CURRENT_DISPLAY_PUBLICATION_SELECTION_POLICY_REQUIRED`.
- The compatibility projection creates no ranking rule. It does not prefer cheapest, newest, manual, automated, known-seller, affiliate, or first-party evidence.
- Cheapest, Picks, Terminal aggregation, product-page offer presentation, structured data, and affiliate routing are unchanged. A separately governed policy is required before multiple same-channel offers can become customer-facing.

## Certified real-state behavior

Canonical snapshot `mer_display_64e9570356f18c96c972e735` contains 189 offers. Eighty-two carry explicit source-rights lineage and pass into internal publication eligibility; 107 legacy/unspecified-source rows remain outside that path. The two Newegg offers for `ram_g_skill_f5_5600s4645a16gx2_rs` remain distinct internally, including unknown-seller Item `9SIA1K6KCT0998`, while the legacy compatibility projection preserves previously public manual offer `mer_offer_e7e945f7f97c4741a63ee2db`. The new Rakuten offer does not become a public winner.

The Crucial offer `mer_offer_eba86bfe779fd6c9c125ba0c` remains one distinct Newegg offer for Item `9SIB3T1KSA7837`, seller `TECH_JUNKIE`, at `$439.12`.

## Downstream classification

- `deriveCurrentDisplayPublicationEligibleSnapshot`: **MULTI_OFFER_READY**.
- `createPublicCurrentRetailProjection`: structurally multi-offer-capable, but its price ordering makes it **LEGACY_SINGLE_OFFER** for same-channel publication until a selection policy exists.
- RAM release portfolio, RAM Terminal, RAM product pages, catalog/category/homepage current-price surfaces, comparison/Lowest/Cheapest projections, and release preview: **LEGACY_SINGLE_OFFER** through the compatibility projection.
- Picks: **NO_OFFER_CONSUMPTION** in this boundary and unchanged.
- Product structured data: **NO_CURRENT_OFFER_CONSUMPTION** and unchanged.
- Retailer action/affiliate routing: **NO_PRICE_SELECTION_CONSUMPTION**; existing destination precedence is unchanged.

## Authority and isolation

Eligibility and compatibility create no publication, release, or deployment authority. They do not mutate Current, History, Atlas, destinations, workbook evidence, URLs, or affiliate state and perform no provider operation.

