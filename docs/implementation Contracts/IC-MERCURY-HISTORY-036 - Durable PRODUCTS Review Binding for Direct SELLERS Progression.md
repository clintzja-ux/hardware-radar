# IC-MERCURY-HISTORY-036 — Durable PRODUCTS Review Binding for Direct SELLERS Progression

## Status

`MERCURY_HISTORY_PRODUCTS_REVIEW_BINDING_BLOCKED`.

## Existing owner and attempted composition

`ProductsCheckpointReviewService` and `createDurableProductsReview` remain the sole certified owner of durable PRODUCTS review records. A record binds its deterministic `mer_productsreview_*` identity to portfolio, checkpoint, Atlas product, provider task, query, retrieval time, originating `sourceRightsDigest`, result identity, identity state, reasons, and material digest. `FileAcquisitionCheckpointRepository` preserves the immutable record and rejects conflicting replay with `PRODUCTS_REVIEW_MATERIAL_CONFLICT`.

H036 attempted to invoke that owner from the H034 PRODUCTS adapter after the existing identity progression owner returned `STRONG_UNIQUE`. No identity, MPN, routing, rights, or SELLERS policy was moved into the adapter.

## Exact blocker

The certified Stage-A artifact `mer_histbootstrap_71c280422c057da3b248a43b` contains `rightsStatus = ALLOWED` and an opaque `acquisitionPortfolioBindingDigest`, but not the acquisition portfolio's `sourceRightsProfileDigest`. The selected product rows, H022 checkpoint binding, H023 continuation, H032 PREPARE reference, and H034 result/progression records also omit that digest. The original acquisition portfolio is not available through a durable ID-addressable repository from which the digest can be recovered.

Consequently, bootstrap PRODUCTS processing cannot supply the exact originating `sourceRightsDigest` required by `createDurableProductsReview`. Hashing the current rights profile would substitute present state for historical acquisition lineage. Treating the opaque portfolio binding digest as a rights digest would mislabel a different hash. Omitting the value creates a superficially valid review with `sourceRightsDigest` undefined because the legacy review constructor does not independently require it; that record is not safe for direct SELLERS governance.

## Safety and smallest correction

H036 does not persist a review and does not extend H034 progression with an invalid reference. Doing so could authorize direct SELLERS from an unprovable rights lineage and undermine deterministic crash reconstruction.

The smallest correction is product-generic and does not require a new policy or review system: make the originating acquisition portfolio—or an immutable certified reference exposing its already-computed `sourceRightsProfileDigest`—durably resolvable by the Stage-A artifact, then propagate that exact digest through the existing checkpoint/task lineage into `ProductsCheckpointReviewService`. The already-prepared Stage-A artifact is immutable and must not be rewritten; its compatibility requires an explicitly governed append-only lineage binding or a successor artifact derived from the original portfolio owner. Operator review is required before choosing that migration path.

No production Stage-A command is exposed. No provider operation, paid task, production mutation, Current Display, Current Price, Cheapest, Pick, publication, affiliate, or Rakuten action occurred. Spend remained `$0.000`.
