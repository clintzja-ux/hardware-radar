# IC-MERCURY-HISTORY-038 — End-to-End Bootstrap Source-Rights Provenance Propagation

## Status

CERTIFIED — schema-1.1 bootstrap rights provenance propagates through the existing offline lifecycle boundaries. Production lifecycle commands and real Stage A remain unavailable.

## Decision

The sole originating-rights source of truth is the H037 schema-1.1 artifact's certified acquisition-portfolio provenance. Its exact `sourceRightsProfileDigest` is carried through the H022 checkpoint, H023 continuation, H030/H032 immutable PREPARE artifact and reference, H034 canonical provider result and progression, and the existing durable PRODUCTS review owner. It is never derived from current rights, `rightsStatus`, or the acquisition-portfolio binding digest.

Current executable rights remain an independent `SourceRightsRegistry` check before each future paid action. A changed-but-allowed current profile does not rewrite originating lineage; revoked current rights block the next paid action while preserving that lineage.

## Propagation and storage

- Checkpoints store the artifact ID/digest, originating acquisition-portfolio reference, and originating rights digest.
- Continuations and bootstrap task-specific PREPARE bindings store the digest because substitution must invalidate their deterministic authority.
- Immutable PREPARE artifacts store the digest in their material binding. `PREPARE_BOUND` retains the immutable artifact ID/digest and compact reference; it does not copy a rights profile.
- The prepared-action resolver requires exact equality across checkpoint, continuation, PREPARE reference, and immutable PREPARE artifact before consumption.
- Provider task and execution ledgers do not duplicate the digest: exact reconstruction already follows their immutable PREPARE/authorization lineage.
- Canonical provider results store the originating digest and validate it against the checkpoint before replay or progression.
- A strong PRODUCTS result is translated by the existing identity progression owner and recorded by `ProductsCheckpointReviewService`. Progression stores only review ID, material digest, and originating rights digest.
- The resulting durable review is accepted unchanged by `createDirectProductsSellersProposal`. PRODUCT_INFO escalation creates no direct-Sellers review and retains the same digest through its bootstrap PREPARE/result lineage.

## Fail-closed and replay rules

Missing, malformed, or substituted rights provenance fails before paid execution or downstream progression. Exact continuation, PREPARE, result, progression, and review replay is deterministic. A review replay with a different rights digest is a material conflict. Schema-1.0 artifacts remain readable but execution-ineligible and are never patched from current rights.

Immutable checkpoint, PREPARE, canonical-result, and review records retain the originating digest after restart; reconstruction never consults a mutable latest file or current rights for historical provenance.

## Scalability and ownership

The propagation is artifact/cohort driven, accepts parameterized cohorts larger than three under the same supported semantics, and contains no Stage-A product or retailer special case. Certification applies to lifecycle invariants and semantic classes, not individual products.

Atlas continues to own canonical product knowledge. Mercury owns acquisition provenance, market evidence, and historical knowledge. `SourceRightsRegistry` owns current executable rights; the acquisition artifact owns originating-rights provenance. No owner moved and no ADR is required.

## Isolation and next action

H038 exposes no Stage-A command and grants no Current Display, Current Price, Cheapest, Pick, publication, affiliate, or Rakuten authority. No production checkpoint, continuation, PREPARE artifact, provider result, review, evidence, or history was created.

The next safe increment is to retry final scalable lifecycle composition using the now-certified rights lineage and existing owners. Real Stage A remains prohibited until that composition and command surface are separately certified.

DataForSEO tasks and retrievals: zero. Rakuten and other provider operations: zero. Production mutation: none. Spend: `$0.000`.
