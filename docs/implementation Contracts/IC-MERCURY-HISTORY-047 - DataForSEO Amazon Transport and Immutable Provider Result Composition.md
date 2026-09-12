# IC-MERCURY-HISTORY-047 — DataForSEO Amazon Transport and Immutable Provider Result Composition

## Status

Fixture-certified. H047 adds reusable production-compatible owners but exposes no live Amazon command and performs no provider operation, retention, or historical admission.

## Reuse graph

`DataForSeoAmazonMerchantApiClient` owns source-isolated HTTP transport. `DataForSeoAmazonAcquisitionService` supplies source-specific request construction while the existing `DataForSeoTaskLedger`, `ControlledAcquisitionExecutor`, authorization consumption, execution repository, run lock, and durable spend checks retain paid-operation authority. `ProductionDataForSeoTaskOwner` and `ProductionDataForSeoRetrievalOwner` dispatch Amazon operations without a parallel ledger or orchestration stack. The H034 `FileHistoricalBootstrapProviderResultRepository` remains the immutable canonical provider-result owner.

## Endpoint and request contracts

The official Standard Queue contracts are:

- `AMAZON_PRODUCTS`: `POST /v3/merchant/amazon/products/task_post`; `GET /v3/merchant/amazon/products/task_get/advanced/{taskId}`; exact canonical Atlas MPN as `keyword`, plus location, language, and priority.
- `AMAZON_ASIN`: `POST /v3/merchant/amazon/asin/task_post`; `GET /v3/merchant/amazon/asin/task_get/advanced/{taskId}`; one governed `asin`, plus location, language, and priority.
- `AMAZON_SELLERS`: `POST /v3/merchant/amazon/sellers/task_post`; `GET /v3/merchant/amazon/sellers/task_get/advanced/{taskId}`; one governed `asin`, plus location, language, and priority.

Request builders are pure, deterministic, immutable, and product-generic. Provider payloads never contain Atlas IDs, paid-action intent, checkpoint, rights, historical, or publication state. Those values remain in Mercury lineage.

## Pricing and authority

Each Amazon operation has a `$0.0015` ceiling. The bounded one-product acceptance envelope is at most three tasks and `$0.0045`, with zero automatic paid retries. These values do not authorize spend. Every paid operation still requires the existing independent plan, authorization, single-use consumption, and execution checks; Google and Amazon spend aggregate through the same durable controls.

## Task and immutable-result lineage

The existing task ledger records source, operation, provider task ID, Atlas product, governed ASIN where required, paid-action intent, checkpoint/product index, source-rights digest, request digest, status, cost, and created time. Retrieval derives the exact task from that ledger and fails closed on missing, duplicate, cross-source, or incomplete lineage.

Canonical Amazon result identity binds source, operation, provider task, request digest, paid-action intent, checkpoint/product, rights digest, and material result digest. Same-task/same-material-result replay is idempotent. Same-task/changed-material-result is `BOOTSTRAP_PROVIDER_RESULT_CONFLICT`; no latest-wins behavior exists. Pending remains pending, provider failure remains distinct, and retrieval never creates paid work or an automatic next action. This composition relies on existing single-writer and replay protections and does not claim distributed atomicity.

## Products identity and null semantics

The typed Products adapter feeds immutable provider evidence to H046 `assessAtlasAmazonAsinIdentity`. Only `STRONG_UNIQUE_ASIN` yields a governed ASIN anchor and `SELLERS_READY`; it does not create Sellers work. Multiple compatible ASINs, variants, bundles, renewed/used offers, not-found, and insufficient evidence preserve their certified fail-closed outcomes. H046 does not justify an `ASIN_ENRICHMENT_REQUIRED` state, so H047 does not invent one.

Sellers normalization preserves provider condition and delivery exactly: missing condition is `null`, explicit new remains explicit, missing delivery price is `null`, and numeric zero remains zero. Parent/modification ASIN evidence is retained without automatic collapse.

## Isolation and remaining boundary

Amazon results cannot be processed as Google Shopping or Amazon Creators API evidence, and the reverse is also blocked. H047 adds no run-all, polling loop, product/ASIN auto-selection, live CLI, DF003 retention, E2J admission, Current Display, publication, Cheapest, or Pick authority. The remaining increment is a source-specific, fixture-certified Amazon DF003/promotion/admission composition using existing evidence and history owners before any bounded live acceptance authorization.
