# IC-MERCURY-HISTORY-050 — Bounded DataForSEO Amazon Acceptance Execution Boundary

## Status

Fixture-certified one-action operator boundary. H050 performs no live authorization, provider call, retrieval, evidence/history write, or downstream mutation. The first real Products authorization remains an operator action after review.

## Truth and ownership

The immutable H049 artifact supplies product, source, rights, identity, and cost bounds. A compact append-only artifact-scoped action repository stores only reviewable authorizations and processed Products outcome lineage because the immutable artifact cannot be mutated and the existing consumption repository owns consumption rather than authorization creation. Existing H047 task, execution/spend, consumption, retrieval, and immutable-result repositories remain authoritative; H046 owns ASIN assessment and H048 owns retention/admission. No general checkpoint, queue, or lifecycle framework was added.

## Products boundary

Products authorization is expiring, operator/reason attributed, single-use, and bound to artifact ID/digest, product, source-rights digest, exact request digest, operation, `$0.0015` task ceiling, and current spend snapshot. The request derives the canonical Atlas MPN; callers cannot provide product, keyword, ASIN, source, price, rights, or budget. Execution requires a separate exact confirmation and rechecks current rights, immutable artifact, spend equality, daily capacity, expiry, and existing single-use consumption before at most one provider task. Retrieval derives the sole task from artifact/operation lineage and persists through the H047 immutable result owner. Processing delegates to H046 and creates no task.

Only `STRONG_UNIQUE_ASIN` produces `OPERATOR_REVIEW_FOR_SELLERS`. Every ambiguous, conflicting, missing, bundled, renewed, or insufficient state stops paid progression. `AMAZON_ASIN` remains unavailable because no certified ambiguity-escalation semantic exists.

## Sellers boundary

Sellers authorization is a separate expiring single-use record derived from the immutable strong Products outcome and exact ASIN; free-form ASIN is prohibited. Execution and retrieval apply the same one-task, `$0.0015`, zero-retry and source-lineage controls. Processing delegates to H048 retention and existing HISTORY-018/E2J owners. Admission, duplicate, retained-only, identity, comparability, and rights outcomes remain governed terminal results.

The practical certified first path is Products plus Sellers: two tasks and `$0.003` maximum. H049's broader three-task/`$0.0045` envelope remains an upper bound, not permission to run the unavailable ASIN operation.

## Replay, races, isolation, and scalability

Exact authorization persistence replays idempotently and conflicts fail closed. Existing owners prevent duplicate execution and immutable-result conflicts; retained evidence and E2J retain their existing replay behavior. Rights or spend changes block before transport. Google Shopping and Amazon Creators API tasks/results cannot satisfy `DATAFORSEO_AMAZON` lineage.

No Current Display, Current Price, Cheapest, Pick, publication, affiliate, or public authority exists. Runtime selection is artifact-driven with no hard-coded product or ASIN. The eight thin action commands expose no run-all, auto-next, polling, or background progression.

