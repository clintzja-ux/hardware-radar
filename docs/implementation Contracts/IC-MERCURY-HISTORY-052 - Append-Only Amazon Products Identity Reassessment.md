# IC-MERCURY-HISTORY-052 — Append-Only Amazon Products Identity Reassessment

## Status

Fixture-certified local reassessment boundary. It reuses an immutable `DATAFORSEO_AMAZON` Products result and appends an identity reassessment to the existing Amazon acceptance action repository. It performs no retrieval, provider call, paid task, authorization, history or Atlas write, Current Display change, or publication action.

## Ownership and eligibility

`AmazonAcceptanceExecutionService` owns orchestration. H051's pure identity assessor remains the identity owner. `FileAmazonAcceptanceActionRepository` remains the single owner of original outcomes, authorizations, and now reassessments. The canonical provider-result repository, task ledger, and historical repository remain independent existing owners.

Reassessment requires one exact artifact, one original blocked Products outcome, one Products task, and its exact immutable canonical result. Artifact, product, source, operation, result ID, result digest, and original outcome lineage must match. The stored operation result is rehashed. Existing Sellers authorization/task or history dependent on the Products task/outcome blocks reassessment. The correction reference is fixed to `IC-MERCURY-HISTORY-051`; operators cannot use this as arbitrary re-review.

## Append-only record and effective projection

The reassessment binds `reassessmentId`, artifact and Atlas product, operation, canonical result and digest, original outcome/assessment/state, new assessment/state/reasons, governed ASIN, H051 identity-policy version, H052 reassessment-policy version, correction reference, operator, reason, creation time, and binding digest. It stores no raw provider payload and grants only local identity reassessment.

The original outcome is never rewritten. Effective Products identity is the original outcome plus zero or one validated reassessment linked by `originalOutcomeId`. No reassessment returns the original state. One valid reassessment projects its governed state for future Sellers authorization validation. Multiple competing reassessments fail closed; filesystem order and modification time are irrelevant.

Exact replay uses the first record's immutable creation time and returns the same content-derived reassessment. Changed operator, reason, result, product, digest, policy, state, or ASIN conflicts. Concurrent identical attempts produce one record. The caller supplies only artifact ID, operator, reason, and exact confirmation; all identity and evidence fields are derived.

## Downstream separation

`STRONG_UNIQUE_ASIN` makes the effective outcome eligible for a future, separate Sellers authorization review. H052 creates no authorization, plan, task, provider call, retained evidence, history, current/public price, Cheapest, Pick, affiliate CTA, or publication authority. Blocked current-policy states remain stopped.

## Operator command

`npm run mercury:amazon:acceptance:reassess-products -- --artifact-id=<ID> --operator=<LABEL> --reason=<REASON> --confirm=REASSESS-DATAFORSEO-AMAZON-PRODUCTS`

The command reports reassessment and lineage IDs, prior/new state, governed ASIN if established, next permitted action, zero provider calls, and `$0.000` spend. It does not print provider payloads.

## Operator-confirmed destination continuation

The narrow `MERCURY-HISTORY-052-1.1` continuation preserves H051 automatic matching unchanged. It applies only when the immutable original Products outcome is `INSUFFICIENT_ASIN_EVIDENCE` and one active, operator-reviewed Amazon US `RetailerDestination` exactly matches the artifact's Atlas product and MPN, Amazon ASIN/URL binding, corroboration, provenance, and current source-rights lineage. A current H051 replay must still reproduce the original insufficient assessment; an automatic strong outcome, changed result, competing destination, retired/superseded destination, or any binding conflict fails closed.

The existing acceptance action repository appends one content-addressed `OPERATOR_VERIFIED_PUBLIC_OBSERVATION` record. It binds the artifact, original outcome/assessment, canonical result/digest, Atlas product/MPN, destination ID/digest/evidence/reviewer, Amazon retailer, ASIN/URL, source-rights digest, confirming operator, reason, decision time, policy versions, and binding digest. Original provider, H051, outcome, destination, and Atlas records remain immutable. Exact replay is idempotent; altered operator/reason or competing H052 identity state conflicts.

The effective projection is `STRONG_OPERATOR_CONFIRMED_ASIN`, exposed to the existing separately authorized Sellers readiness boundary as `STRONG_UNIQUE_ASIN`. It creates no authorization, task, provider call, retained evidence, history, Current Price, Cheapest, Pick, affiliate, or publication authority.

`npm run mercury:amazon:acceptance:confirm-products-identity -- --artifact-id=<ID> --operator=<LABEL> --reason=<REASON> --confirm=CONFIRM-DATAFORSEO-AMAZON-DESTINATION-IDENTITY`
