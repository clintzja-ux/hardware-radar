# IC-MERCURY-HISTORY-035 — Final Scalable Stage A Production Lifecycle Composition

## Status

`MERCURY_HISTORY_SCALABLE_LIFECYCLE_PARTIAL`.

## Composition result

Direct composition was attempted from the certified HISTORY-018–034 owners. Artifact, checkpoint, continuation, immutable PREPARE, exact prepared-action resolution, task-specific authorization/execution, task and execution ledgers, retrieval, immutable provider result, dispatcher, PRODUCT_INFO progression, SELLERS DF003 processing, historical admission, portfolio, and Forge projection all have compatible certified owners. No new policy owner, queue, workflow engine, ledger, history repository, identity system, or result store is warranted.

One exact interface prevents safe end-to-end composition. `createProductsIdentityProgressionOwner()` produces a `STRONG_UNIQUE` result containing `prepared.resolution`, `prepared.proposal`, `sourceTaskId`, and `atlasProductId`. A direct PRODUCTS → SELLERS transition must be consumed by `createDirectProductsSellersProposal()`, which requires the canonical durable PRODUCTS review shape: `reviewId`, `materialDigest`, `sourceRightsDigest`, `identityState = EXACT_OR_GOVERNED_MATCH`, `resultIdentity`, `providerTaskId`, and `atlasProductId`.

The only certified producer of that shape is `ProductsCheckpointReviewService` / `createDurableProductsReview` in the ordinary acquisition checkpoint boundary. The historical-bootstrap H034 result/progression repository does not contain a durable PRODUCTS review or the exact source-rights digest from the originating acquisition task. Treating the H034 resolver result as that review fails closed with `DIRECT_SELLERS_PRODUCTS_REVIEW_INVALID`.

## Safety proof

A shape-only adapter cannot manufacture the missing review ID, material digest, or rights binding. Doing so would allow a SELLERS authorization to claim reviewed PRODUCTS lineage that was never durably recorded, and could bind current rights state rather than the rights digest governing the paid PRODUCTS task. After a crash or cohort advance this would make direct SELLERS preparation ambiguous and could cause incorrect evidence lineage and historical admission.

The smallest correction is product-generic: reuse `ProductsCheckpointReviewService` (or extract its already-certified record operation behind a narrow injectable owner) when processing a bootstrap PRODUCTS result, persist the resulting canonical review against the exact bootstrap task/result/assessment and originating rights digest, and have progression reference that immutable review. Then the existing direct SELLERS proposal builder and H030 PREPARE owner can consume it without mutable latest files. This is not a new policy or subsystem; it is reuse of the existing durable review owner.

## Scalability and command decision

The blocker is independent of Atlas product ID, retailer, price, timestamp, RAM category, and cohort size. Certification applies to supported lifecycle invariants and semantic classes, not individual products. Stage A remains a system-acceptance cohort and its product IDs remain artifact data.

Because the direct path cannot yet preserve the required durable review lineage, the eight H035 production commands are not exposed. No real INIT, INSPECT, continuation, PREPARE, execution, retrieval, result processing, provider operation, history mutation, Current Display, Current Price, Cheapest, Picks, publication, affiliate, or Rakuten action occurred. Spend remained `$0.000`.
