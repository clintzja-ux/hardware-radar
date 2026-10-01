# IC-MERCURY-HISTORY-026 — Reusable Production Owner Extraction

## Status

`MERCURY_HISTORY_REUSABLE_PRODUCTION_OWNERS_PARTIAL`.

## Boundary

HISTORY-026 begins moving the production composition embedded in the DataForSEO task scripts into reusable Mercury-owned factories. `createProductionDataForSeoTaskOwner` is now the single production composition for paid PRODUCTS, PRODUCT_INFO, and SELLERS task execution. The three established execution scripts call that factory and retain their existing command names, arguments, task-specific binding checks, confirmation, authorization, repository paths, task pricing, daily/run budgets, zero automatic retries, and single-use consumption semantics.

The factory accepts dependency overrides for offline fixtures. Production defaults lazily load the established DataForSEO configuration only when execution reaches the provider boundary, use the existing task/execution/consumption repositories and writer lock, and preserve operation-specific error behavior. Optional `paidActionIntentId` remains internal task lineage: it is carried from a trusted plan into task and spend records and is not added to the provider request. Ordinary command inputs expose no intent argument.

## Fail-closed limit

This increment is not fully certified. PREPARE composition, PRODUCTS and PRODUCT_INFO retrieval, combined SELLERS retrieval/DF003 retention, comparability/E2J local processing, and their injection into `HistoricalBootstrapLifecycleService` remain owned by standalone scripts. Reimplementing them in the lifecycle would create a parallel path, so the seven production bootstrap command shells remain unavailable. Real Stage A INIT and INSPECT were not run.

Completion requires extracting those remaining script compositions into reusable owners, refactoring the scripts to use them, injecting the exact same owners into the lifecycle service, and fixture-certifying end-to-end two-task and escalation flows plus crash reconstruction. No provider operation or production-state mutation is authorized by this partial extraction.

## Safety

This work performs no DataForSEO or Rakuten call, creates no paid task, accesses no credentials, and changes no Atlas, retained evidence, history, current display, review, publication, Current Price, Cheapest, Pick, affiliate, or public state. Actual spend is `$0.000`.
