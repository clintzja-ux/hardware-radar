# IC-MERCURY-HISTORY-039 — Final Scalable Historical Bootstrap Production Lifecycle

## Status

`MERCURY_HISTORY_SCALABLE_PRODUCTION_LIFECYCLE_PARTIAL`.

## Composition completed

The existing H025 lifecycle now accepts any execution-eligible schema-1.1 artifact by immutable ID instead of the obsolete H019 constant. INIT is replay-safe and creates only H022 checkpoint state. INSPECT remains read-only. AUTHORIZE-NEXT creates H023 continuation authority. PREPARE-NEXT dispatches to the existing operation owner with continuation-derived metadata and records `PREPARE_BOUND`. EXECUTE-NEXT delegates to H023/H032 exact resolution and single-use task execution. RETRIEVE delegates to H034 canonical result persistence. PROCESS delegates to H032/H034 result dispatch. SELLERS results now append a terminal outcome rather than being misclassified as identity progression, so only `ADMITTED` or `DUPLICATE` advances to the next artifact product.

`createProductionHistoricalBootstrapLifecycleService` composes the canonical H022 checkpoint, H023 continuation, and H032 PREPARE repositories with injected certified operation owners. Its artifact reader is ID-addressed and read-only. No lifecycle policy, queue, automatic loop, or alternate persistence system was added.

## Certified state and isolation

Fixture composition proves dynamic INIT replay, read-only inspection, continuation, PREPARE binding, one-task execution, result availability, PRODUCTS progression, SELLERS terminal admission, next-product readiness, originating-rights preservation, spend projection, caller-override rejection, and absence of publication/Current Price/Cheapest/Pick authority. Cohort membership and order come only from artifact data.

No run-all, resume-all, execute-cohort, or background progression exists. Schema-1.0 artifacts remain execution-ineligible. Atlas remains canonical product owner; Mercury remains market-evidence and history owner. No Current Display, publication, affiliate, or Rakuten boundary is involved.

## Exact remaining production interface

The remaining blocker is the immutable downstream proposal handoff from H034 progression to the existing H030/H027 PRODUCT_INFO and SELLERS production owners.

- Producer: immutable H034 `mer_progression_*` state and H032 PREPARE artifacts.
- Consumers: `createProductionProductInfoPrepareOwner`, `createProductionSellersPrepareOwner`, `ProductInfoResultRetrievalService`, and `createProductionSellersDf003ProcessingOwner`.
- Incompatibility: the consumers still read proposal/authorization context from mutable ordinary-workflow latest files, while bootstrap composition must supply the exact proposal and authorization resolved from immutable progression/PREPARE IDs. H034 progression does not yet expose one complete immutable consumer reference for both the direct and PRODUCT_INFO paths.
- Unsafe outcome: composing the current file readers could bind a later product's or operation's latest proposal to an earlier checkpoint, causing task, identity, retained-evidence, or historical-admission lineage corruption after replay or crash.
- Why composition-only adaptation is insufficient: an adapter can validate fields it receives, but it cannot manufacture the missing immutable proposal reference or prove that a mutable latest file is the record selected by the checkpoint. The producing progression and consuming owner API must first expose/accept the same immutable reference.

The smallest correction is product-generic: store the owner-produced direct-Sellers or PRODUCT_INFO proposal as part of the existing immutable H034 progression, expose it by progression ID, and add trusted owner methods that accept that resolved immutable proposal/authorization while leaving ordinary latest-file entry points unchanged. No new repository or policy is required.

## Command decision

The eight production commands are intentionally not exposed. Command readiness requires the immutable proposal handoff above; exposing commands earlier would make the production path depend on mutable latest state. Real INIT, INSPECT, authorization, PREPARE, execution, retrieval, and processing remain unrun.

DataForSEO tasks/retrievals: zero. Rakuten/other providers: zero. Production mutation: none. Spend: `$0.000`.
