# IC-MERCURY-HISTORY-029 — Complete Production Historical Bootstrap Lifecycle

## Status

`MERCURY_HISTORY_STAGE_A_LIFECYCLE_PARTIAL`.

## Composition finding

The certified owner inventory is sufficient for provider execution, provider-result retrieval, local identity evaluation, DF003 retention, promotion/rights/comparability assessment, E2J admission, and historical portfolio reconstruction. It is not yet sufficient to construct a production lifecycle safely.

`HistoricalBootstrapPaidTaskHandoff` invokes its trusted task-specific owner with derived continuation data: operation, Atlas product, product index, operator, and `paidActionIntentId`. `createProductionDataForSeoTaskOwner`, however, intentionally accepts an already constructed task-specific authorization request containing a validated acquisition plan. The missing bridge is not mechanical argument adaptation: PRODUCTS, PRODUCT_INFO, and SELLERS each require their existing distinct PREPARE/proposal/authorization composition and durable lineage artifacts.

Those compositions remain in ordinary scripts:

- PRODUCTS planning and manual authorization request creation;
- PRODUCT_INFO proposal/review/provider-selection binding and authorization request creation;
- SELLERS direct-or-PRODUCT_INFO lineage proposal and authorization request creation.

The bootstrap checkpoint currently does not own durable references for those task-specific proposals and authorization requests. Building them inside a lifecycle factory would duplicate certified business rules, while calling existing scripts would make scripts an architectural owner and create unsafe subprocess coupling. Passing a handoff-shaped object to `createProductionDataForSeoTaskOwner` would fail because it is not a valid authorized plan; weakening that validation is prohibited.

## Consequence

No production lifecycle factory or command shell is exposed. INIT and INSPECT remain unrun even though they are locally non-provider actions, because exposing only a stranded partial command surface would misrepresent Stage A readiness. AUTHORIZE-NEXT, EXECUTE-NEXT, RETRIEVE, PROCESS, and CANCEL likewise remain unavailable. No run-all or automatic continuation exists.

The next bounded increment must extract reusable trusted task-specific PREPARE owners and define their append-only checkpoint references. Each owner must preserve the ordinary workflow's proposal, provider-selection, rights, budget, authorization, confirmation, replay, and `paidActionIntentId` bindings. Ordinary scripts and bootstrap composition must then consume the same owners before HISTORY-029 can be retried.

## Preserved safety

All HISTORY-018 through HISTORY-028 owners and tests remain valid. Atlas remains canonical product owner; Mercury remains market-evidence and historical-knowledge owner. No provider request, retrieval, paid task, production mutation, Current Display, Current Price, Cheapest, Pick, review, publication, affiliate, Rakuten, deployment, commit, or push occurred. Actual spend is `$0.000`.
