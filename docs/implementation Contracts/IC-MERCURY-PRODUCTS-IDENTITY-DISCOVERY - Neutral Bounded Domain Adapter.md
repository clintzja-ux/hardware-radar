# IC-MERCURY-PRODUCTS-IDENTITY-DISCOVERY — Neutral bounded domain adapter

## Status

Fixture-certified. No production discovery plan, authorization, task, retrieval, or identity decision has been created.

## Boundary

`ProductsIdentityDiscoveryDomainAdapter` is the typed domain adapter over `NeutralBoundedPaidActionCoordinator`. It derives deterministic member identity from source, Atlas product, and explicit discovery cycle; asks an injected canonical identity owner for current readiness; delegates source preparation, child authorization, execution, task resolution, retrieval, and identity finalization to existing Google or Amazon owners; and stops when the Products identity outcome is durable.

It owns no parent authority, aggregate budget, transport, rights registry, task ledger, provider-result repository, or identity interpretation. Google uses `PRODUCTS` with a `$0.001` ceiling. Amazon uses `AMAZON_PRODUCTS`, its required acceptance-artifact lineage, and a `$0.0015` ceiling. Destination ASINs remain corroboration only.

## Lifecycle

PREPARE accepts only an explicit cycle and `atlasProductId`/`sourceId` cohort pairs. Only `READY_FOR_DISCOVERY` members enter paid scope. INSPECT is read-only. AUTHORIZE creates one expiring neutral parent for the exact ready set. START revalidates identity and rights, derives one source-owned child per member, and delegates at most one Products task per member. PENDING becomes `WAITING_FOR_PROVIDER`; RESUME reuses the recorded task and cannot add authorization or scope. AVAILABLE results go to the existing source identity owner. Product-local ambiguity, insufficient evidence, review-required, no-result, and ordinary provider failures do not become systemic failures. Rights, parent/child, budget, task-persistence, immutable-result, repository, or systemic-transport integrity failures stop the run.

## Terminal separation

The terminal boundary is Products identity only. `STRONG_UNIQUE_ASIN` and `INSUFFICIENT_ASIN_EVIDENCE` remain exact Amazon owner states; the latter may expose H052 review availability but creates no H052 confirmation. No Sellers task, evidence, historical fact, Current Price, Current Display, Cheapest, Pick, recommendation, publication, or affiliate authority is created.

## Certification

The five-pair fixture produces five ready members, five maximum tasks, `$0.006` maximum spend, zero retries, and `$0.0125` projected UTC-day spend from a `$0.0065` starting fixture. Deterministic replay, single-start behavior, pending/resume, indexed neutral persistence, source-owned child lineage, downstream isolation, and 10/100/1,000/10,000-member planning are covered. The immutable full-cohort plan payload remains an observed storage-size concern, but direct member operations are indexed and no per-product shell workflow is required.

Executable production commands remain intentionally unavailable until a production composition binds the adapter to canonical Google/Amazon readiness, task, retrieval, and identity owners. This contract does not authorize that composition or any provider operation.
