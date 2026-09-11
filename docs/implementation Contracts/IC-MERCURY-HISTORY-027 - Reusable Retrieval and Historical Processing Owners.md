# IC-MERCURY-HISTORY-027 — Reusable Retrieval and Historical Processing Owners

## Status

`MERCURY_HISTORY_PRODUCTION_LIFECYCLE_PARTIAL`.

## Extracted owners

`createProductionDataForSeoRetrievalOwner` is the shared lazy provider-result retrieval composition for PRODUCTS, PRODUCT_INFO, and SELLERS. The existing ordinary retrieval commands use it, retain their established task arguments and output, and do not require bootstrap state. Retrieval creates no paid task and performs no retention or historical admission.

`createProductionSellersDf003ProcessingOwner` owns the local production composition formerly embedded after retrieval in `mercury-sellers-df003-retain.mjs`: task/authorization/execution lineage validation, zero-cost result validation, Atlas product lookup, retailer resolution, governed initial-acquisition projection, and DF003 evidence retention. The existing command uses this owner and retains its output and duplicate/conflict behavior. It does not add comparability or E2J admission because the ordinary command did not previously perform those actions.

Both factories use the same canonical production task, execution, authorization-consumption, evidence, Atlas, and retailer paths as the prior scripts. Credentials are loaded lazily only when retrieval is invoked. Tests may inject a mock acquisition service; production callers cannot use CLI arguments to inject an intent, product, operation, source, task price, spend ceiling, or alternate repository path beyond previously supported arguments.

## Remaining certification gap

Full lifecycle certification is intentionally withheld. Canonical PRODUCTS and PRODUCT_INFO result-to-identity progression remains distributed across portfolio/review commands, and no single reusable owner yet provides the lifecycle's required `STRONG_UNIQUE`, `ESCALATION_REQUIRED`, or blocked result. HISTORY-018 comparability, E2J admission, portfolio reconstruction, full production lifecycle dependency injection, crash/race matrices, and the seven thin command shells therefore remain unavailable.

The bootstrap lifecycle must not synthesize these missing owners or reinterpret results. Real Stage A INIT/INSPECT were not run. No provider retrieval, paid task, production evidence/history mutation, current-display operation, or downstream authority occurred.

## Ownership and safety

Atlas remains the owner of canonical product identity. Mercury owns provider retrieval, retained evidence, and historical market knowledge. No Rakuten, public/current, review, publication, Current Price, Cheapest, Pick, or affiliate boundary is involved. Actual spend is `$0.000`.
