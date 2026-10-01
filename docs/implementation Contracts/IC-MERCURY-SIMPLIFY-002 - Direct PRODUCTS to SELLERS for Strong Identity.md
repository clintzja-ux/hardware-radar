# IC-MERCURY-SIMPLIFY-002 — Direct PRODUCTS → SELLERS for Strong Identity

## Status

Fixture-certified. This increment performs no provider operation and authorizes no spend.

## Contract

Mercury's default acquisition route is `PRODUCTS → SELLERS` only when PRODUCTS establishes one unique usable provider identity through an exact normalized manufacturer-part-number match, an explicit normalized/canonical manufacturer match, compatible supplied Atlas-significant fields, and no material contradiction. Missing provider fields remain unknown. Multiple identities, insufficient evidence, and contradictions use the existing manual-selection, Product Info, or identity-review escalation boundaries.

The existing Sellers proposal and authorization support two immutable lineage forms: `DIRECT_PRODUCTS_STRONG_IDENTITY`, bound to the Atlas product, canonical MPN, durable PRODUCTS task/review/material digest, provider identity, source-rights digest, provider/source and request locale; and the existing `PRODUCT_INFO_VALIDATED` lineage. Both use the same single-use Sellers authorization and unchanged `$0.001` task / `$0.010` UTC-day controls.

DF003 retention, governed initial-acquisition identity projection, historical admission, and E2P composition accept either validated lineage. Direct lineage omits Product Info rather than fabricating it and preserves PRODUCTS and SELLERS provenance. It does not weaken seller/offer validation, source rights, retailer resolution, replay protection, immutable history, canonical review, publication, Current Price, Cheapest, Pick, affiliate, or shipping/fee governance.

Existing Product Info history is not rewritten. Kingston remains an escalation example whose duplicate PRODUCTS documents were resolved through the already-completed manual-selection and Product Info path. TEAMGROUP remains pending. No provider task, paid authorization, evidence, observation, or public state is created by certification; incremental spend is `$0.000` and cumulative activation spend remains `$0.008`.
