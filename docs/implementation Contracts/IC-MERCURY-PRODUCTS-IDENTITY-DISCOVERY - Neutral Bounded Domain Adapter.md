# IC-MERCURY-PRODUCTS-IDENTITY-DISCOVERY — Neutral bounded domain adapter

## Status

Fixture-certified through durable Google child-authorization recovery. No production discovery plan, authorization, task, retrieval, or identity decision has been created, and production commands remain unavailable pending production-owner composition.

## Boundary

`ProductsIdentityDiscoveryDomainAdapter` is the typed domain adapter over `NeutralBoundedPaidActionCoordinator`. It derives deterministic member identity from source, Atlas product, and explicit discovery cycle; asks an injected canonical identity owner for current readiness; delegates source preparation, child authorization, execution, task resolution, retrieval, and identity finalization to existing Google or Amazon owners; and stops when the Products identity outcome is durable.

It owns no parent authority, aggregate budget, transport, rights registry, task ledger, provider-result repository, or identity interpretation. Google uses `PRODUCTS` with a `$0.001` ceiling. Amazon uses `AMAZON_PRODUCTS`, its required acceptance-artifact lineage, and a `$0.0015` ceiling. Destination ASINs remain corroboration only.

## Lifecycle

PREPARE accepts only an explicit cycle and `atlasProductId`/`sourceId` cohort pairs. Only `READY_FOR_DISCOVERY` members enter paid scope. INSPECT is read-only. AUTHORIZE creates one expiring neutral parent for the exact ready set. START revalidates identity and rights, derives one source-owned child per member, and delegates at most one Products task per member. A bounded member cannot enter recoverable `AUTHORIZED` state unless its exact child execution authority is durably persisted and content-bound.

For Google Products, the complete neutral-derived authorization request is stored in the existing immutable H032 PREPARE-artifact repository before the neutral child reference and `AUTHORIZED` checkpoint. The H032 artifact binds the parent, plan, member, product, source, operation, rights, task ceiling, child authority, expiry, and exact execution request, and is indexed by parent authorization/member. Exact replay returns the same artifact; changed immutable material conflicts. Amazon retains its equivalent durable authority in the existing acceptance-action repository rather than duplicating it in H032.

PENDING becomes `WAITING_FOR_PROVIDER`; RESUME normally reuses the recorded task and cannot add authorization or scope. The only pre-execution exception is recovery of an already-existing immutable Google child authority: recovery resolves and validates the exact H032 artifact, checks for an existing exact provider task first, and only when none exists delegates the same durable request to the existing single-use Google executor. It creates no parent or child authority. Missing, expired, malformed, or substituted artifacts and parent/member/source/operation/product/rights/cost/digest conflicts fail closed as systemic integrity failures. AVAILABLE results go to the existing source identity owner. Product-local ambiguity, insufficient evidence, review-required, no-result, and ordinary provider failures do not become systemic failures. Rights, parent/child, budget, task-persistence, immutable-result, repository, or systemic-transport integrity failures stop the run.

## Terminal separation

The terminal boundary is Products identity only. `STRONG_UNIQUE_ASIN` and `INSUFFICIENT_ASIN_EVIDENCE` remain exact Amazon owner states; the latter may expose H052 review availability but creates no H052 confirmation. No Sellers task, evidence, historical fact, Current Price, Current Display, Cheapest, Pick, recommendation, publication, or affiliate authority is created.

## Certification

The five-pair fixture produces five ready members, five maximum tasks, `$0.006` maximum spend, zero retries, and `$0.0125` projected UTC-day spend from a `$0.0065` starting fixture. Deterministic replay, single-start behavior, pending/resume, indexed neutral persistence, source-owned child lineage, downstream isolation, and 10/100/1,000/10,000-member planning are covered. Recovery fixtures cover interruption before and after `AUTHORIZED`, existing-task-first behavior, exact artifact replay/conflict, source parity, single-use replay, and downstream isolation. The immutable full-cohort and H032 JSON payloads remain observed storage-size concerns; identities and member lookups are direct and no per-product shell workflow is required, but storage migration should be considered before sustained workloads approach roughly 1,000 concurrent authorization artifacts.

Executable production commands remain intentionally unavailable until a production composition binds the adapter to canonical Google/Amazon readiness, task, retrieval, and identity owners. This contract does not authorize that composition or any provider operation.
