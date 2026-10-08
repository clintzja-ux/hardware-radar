# IC — Mercury retained-commerce History lineage and PREPARE P1

## Ownership

Mercury History remains the sole normalized historical-market owner. Provider acquisition remains source-owned. `RETAINED_COMMERCE_FEED` is an additive, source-neutral provenance classification; it is not a History store, acquisition mechanism, rights grant, or provider-specific policy.

## Required immutable lineage

A retained-commerce historical observation binds provider/source ID, feed family, SHA-256 artifact digest, FULL/DELTA event type, validated provider evidence time, source-local product and listing identity, Atlas product, retailer channel, selected provider price semantic, condition provenance, and the applicable source-rights profile and digest. It may retain an unknown seller. It must not invent provider tasks or use paths, filenames, processing time, download time, or SFTP mtime as evidence identity or market time.

## Zero-authority lifecycle

`createRetainedCommerceHistoryPlan` deterministically binds the canonical History byte hash, sequence/count, rights digest, candidate identities, and projected diff. `prepareRetainedCommerceHistory` creates an immutable preparation with `authority = NONE`. Before any future execution, `assertRetainedCommercePreparationCurrent` must reject changed History, rights, artifact/candidate material, or plan/preparation binding. This increment creates no production execution authority.

## Compatibility

Existing manual, DataForSEO initial, Amazon initial, refresh, and repeat observations remain valid without migration. Repository sequence stays append-only and distinct from `observationTime` chronology.

## Newegg retained cohort

Three reconstructable events were streamed through existing Rakuten parsing, price, condition, exact Atlas-MPN, rights, and comparability boundaries. Two state-only DELTAs and the diagnostic OOM partial are excluded. The prepared cohort contains 326 qualified observations across 88 products: 320 FULL-derived and six DELTA-derived. One DELTA D row is withdrawal-only; two alternative-condition rows fail comparability. Canonical Current and History remain unchanged. See `CURRENT-STATE.md` for the exact plan and preparation IDs.
