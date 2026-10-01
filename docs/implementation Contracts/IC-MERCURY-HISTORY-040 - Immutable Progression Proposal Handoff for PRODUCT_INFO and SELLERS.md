# IC-MERCURY-HISTORY-040 — Immutable Progression Proposal Handoff for PRODUCT_INFO and SELLERS

## Status

`MERCURY_HISTORY_PROPOSAL_HANDOFF_CERTIFIED`.

## Boundary

H040 closes the sole H039 production-composition blocker. The existing H034 provider-result repository now owns immutable, ID-addressable downstream proposal records alongside its canonical results and progressions. A progression stores only `nextProposalId`, `nextProposalDigest`, `nextOperation`, and the applicable provider-selection/review reference; it does not embed the proposal or a provider payload.

The proposal record binds the exact proposal ID and digest to the H034 result reference, checkpoint, Atlas product, product index, next operation, originating source-rights profile digest, and provider-selection/review reference. Exact replay returns the same record. A different proposal for the same result/operation lineage conflicts. Stored ID, digest, product, operation, checkpoint, result, and rights mismatches fail closed. If proposal persistence succeeds before progression persistence, the unique result-bound proposal is reused to reconcile the progression; no first/latest heuristic is permitted.

## Existing owners preserved

- PRODUCTS escalation continues to use the existing Product Enrichment proposal builder.
- Direct PRODUCTS → SELLERS continues to use the durable PRODUCTS review and `createDirectProductsSellersProposal`.
- PRODUCT_INFO → SELLERS continues to use the existing governed Product Info result boundary and Sellers proposal builder.
- H030 PRODUCT_INFO and SELLERS PREPARE owners retain their ordinary latest-file entry points. Bootstrap composition alone may supply a resolved trusted proposal, and only together with validated bootstrap metadata.
- H027 SELLERS DF003 processing retains its ordinary file-backed entry point. H034 may instead supply the exact authorization and proposal from the immutable H032 PREPARE artifact.

No proposal, identity, rights, routing, pricing, budget, retention, or admission policy moved or was added.

## Reconstruction and isolation

Bootstrap PREPARE derives the prior progression reference from the current checkpoint, resolves the exact proposal from H034, verifies its digest and product/operation/checkpoint/result/rights lineage, and passes it internally to H030. No operator-facing proposal-ID input exists. A mutable ordinary latest file cannot override this proposal.

Product Info retrieval now returns the already-derived governed Sellers proposal in its zero-cost outcome so H034 can persist the exact escalation handoff. SELLERS processing can resolve the exact H032 authorization/proposal rather than rereading mutable latest files. Provider retrieval semantics are unchanged.

The handoff is product-generic, operation-scoped, checkpoint-scoped, and cohort-size independent. It adds no queue, workflow engine, repository family, provider authority, automatic continuation, or run-all command.

## Authority and safety

The proposal handoff creates no provider task and grants no paid execution, historical admission, canonical admission, review, publication, Current Display, Current Price, Cheapest, Pick, affiliate, or Rakuten authority. Atlas remains the canonical product owner; Mercury remains the acquisition-provenance and historical-market owner.

No live Stage A command was executed during certification. Provider tasks/retrievals: zero. Production mutation: none. Spend: `$0.000`.
