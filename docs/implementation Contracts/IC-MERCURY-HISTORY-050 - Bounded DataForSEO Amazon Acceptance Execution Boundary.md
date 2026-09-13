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

Exact authorization persistence replays idempotently and conflicts fail closed. One unexpired authorization may exist per artifact/operation. An expired authorization may receive one new immutable successor only when the shared consumption ledger and provider-task ledger prove every predecessor unused; consumed or task-producing predecessors permanently block replacement. The successor links to its immediate predecessor, rebinds current spend and current source rights, and leaves every earlier authorization unchanged. Atomic repository persistence prevents concurrent successor requests from creating two active authorizations. Existing owners prevent duplicate execution and immutable-result conflicts; retained evidence and E2J retain their existing replay behavior. Rights or spend changes block before transport. Google Shopping and Amazon Creators API tasks/results cannot satisfy `DATAFORSEO_AMAZON` lineage.

No Current Display, Current Price, Cheapest, Pick, publication, affiliate, or public authority exists. Runtime selection is artifact-driven with no hard-coded product or ASIN. The eight thin action commands expose no run-all, auto-next, polling, or background progression.

## H050B transport correction

The first production Products execution exposed a composition defect: the production task owner selected `DataForSeoAmazonAcquisitionService` for Amazon operations while instantiating the Google-only `DataForSeoMerchantApiClient`. H047/H050 fixtures injected a synthetic acquisition service/client that already implemented `postAmazonProductsTask`, so they did not exercise that constructor choice. The canonical task-owner factory now instantiates `DataForSeoAmazonMerchantApiClient` for every `AMAZON_*` operation and retains `DataForSeoMerchantApiClient` for Google operations. Fixture transport certification covers Products, ASIN, and Sellers endpoints and proves provider payload isolation through the same production client construction used by the CLI.

Authorization `mer_amzactauth_4352cadcddff7ba6a43620ee` remains consumed, and failed run `acqrun_6fd3ab05-e95e-4c58-946a-c170512912d5` remains immutable with no provider task and zero spend. H050A correctly prohibits an automatic successor for consumed authority. Recovery from `CONSUMED_WITHOUT_PROVIDER_TASK` therefore remains `EXISTING_POLICY_REQUIRES_OPERATOR_RECOVERY_DECISION`; H050B does not weaken single-use authorization or invent retry authority.

## H050C consumed-without-task recovery

H050C adds one generic, fail-closed recovery assessment for controlled paid acquisition. Durable task lineage or a provider task ID classifies `PROVIDER_TASK_CREATED`; nonzero spend or an outcome that cannot disprove request delivery classifies `PROVIDER_TASK_STATUS_UNKNOWN`; only conclusive local pre-request failure or an explicit provider rejection carrying certified `NO_TASK` evidence, with zero spend and no conflicting task lineage, classifies `SAFE_NO_PROVIDER_TASK`. Missing or ambiguous lineage is never treated as absence.

`SAFE_NO_PROVIDER_TASK` does not retry work or revive authority. After explicit operator review, a separate recovery-authorize action may append one new expiring authorization bound to the consumed predecessor authorization, failed execution run, deterministic recovery assessment, operator, reason, current source rights, and current durable UTC-day spend. The predecessor, consumption, and failed execution remain immutable. The successor retains the same logical `paidActionIntentId` so the shared task ledger continues to prevent two provider tasks for one intent. One-active-authorization, atomic replay/conflict, separate execution confirmation, and zero automatic retries remain authoritative for both Products and Sellers.

The real failed Products run is conclusively `SAFE_NO_PROVIDER_TASK`: its local missing-client-method `TypeError` occurred before the corrected Amazon client could make an HTTP request; the immutable run has no provider task ID, the task ledger has no matching intent, and actual spend is zero. This classification permits a future zero-cost reviewed recovery authorization but creates no authorization during certification and grants no execution, retrieval, retention, history, Current Display, or downstream authority.

## H050D recovery execution-attempt identity

Logical paid-action identity and execution-attempt identity are distinct. The stable `paidActionIntentId` continues to identify one logical provider action across reviewed recovery. Each `SAFE_NO_PROVIDER_TASK` successor instead receives a new deterministic `planId`, derived from the existing artifact/operation/request binding plus predecessor authorization, predecessor execution run, recovery assessment, and recovery classification. Provider task identity remains provider-assigned only after successful task creation.

The executor continues to deduplicate execution by `planId`, authorization consumption by authorization ID, and provider-task persistence by request material plus the stable paid-action intent. Consequently a reviewed recovery can make one new attempt without weakening task uniqueness: exact execution replay consumes no additional authority or task, ambiguous recovery cannot receive a new plan, and the appearance of any durable task stops recovery. Multi-hop recovery remains append-only and requires a fresh explicit `SAFE_NO_PROVIDER_TASK` assessment and operator review at every hop; there is no automatic retry or unbounded retry loop.

The first real recovery authorization `mer_amzactauth_ba353efabf9802657d6e7f8b` used the pre-H050D plan model, was consumed, and replayed the original failed execution without a provider call, task, or spend. It remains immutable and is not reusable. Because the original run remains conclusive zero-task evidence and no task exists for the stable intent, it may serve as the immediate predecessor of one further reviewed recovery authorization under H050D. Certification itself creates no real successor.

## H050E executable active-authority semantics

An authorization is active only while it remains executable: it is unexpired, unconsumed, has not been replaced, and has no durable task governing the action. Repository presence or an unelapsed expiry alone does not make consumed authority active. Recovery authorization creation resolves consumption before checking active authority and supplies that immutable consumption view to atomic authorization persistence. The repository validates that every excluded consumed ID belongs to the exact action lineage, excludes only those IDs from its active check, and still rejects an unconsumed unexpired authorization.

This distinction preserves separate states for active-unconsumed, consumed-no-task, consumed-task-created, expired-unconsumed, and predecessor/superseded authority without adding mutable status fields to immutable authorization records. Consumption, execution, task, and recovery assessment owners continue to determine effective state. Two concurrent successor attempts still yield exactly one active record; exact replay is duplicate and changed material conflicts. Consumed-no-task is not automatically recoverable: the full H050C `SAFE_NO_PROVIDER_TASK`, zero-spend, no-task, explicit-review requirements remain mandatory.

Real authorization `mer_amzactauth_ba353efabf9802657d6e7f8b` is therefore `CONSUMED_NO_PROVIDER_TASK`, not active. It remains immutable and may be the reviewed predecessor of one H050D recovery-plan authorization. H050E certification creates no real authorization or execution.
