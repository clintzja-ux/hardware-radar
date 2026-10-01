# IC-MERCURY-HISTORY-028 — Reusable Identity Progression and Historical Processing Owners

## Status

`MERCURY_HISTORY_LOCAL_GOVERNANCE_OWNERS_PARTIAL`.

## Reused governance

HISTORY-028 exposes local owners around existing certified policy rather than recreating it. The PRODUCTS owner delegates candidate interpretation to `prepareProductEnrichmentFromProductsResult` and route selection to `classifyDefaultAcquisitionRoute`. It returns only `STRONG_UNIQUE`, `ESCALATION_REQUIRED`, or `BLOCKED_IDENTITY`, creates no task, and does not mutate Atlas. The PRODUCT_INFO owner consumes the canonical persisted retrieval outcome and projects `STRONG_UNIQUE` only when its existing Sellers-readiness state is established; every other outcome fails closed.

The historical owner delegates all durable historical authority to `HistoricalObservationAdmissionService`. That service remains the sole composition for E2G/E2H promotion, dynamic source rights, identity/reuse lineage, HISTORY-018 standalone comparability, and E2J immutable admission. After ADMITTED or DUPLICATE, the wrapper may rebuild `HistoricalObservationPortfolio` from canonical repositories; it creates no second summary store. It maps existing safe failures to blocked-rights, blocked-identity, blocked-comparability, or admission-failed outcomes without writing directly to history.

## Preserved boundaries

Provider retrieval remains separate from local processing. Identity progression cannot authorize or create the next paid task. Historical processing cannot create canonical, review, publication, Current Display, Current Price, Cheapest, Pick, affiliate, destination, retailer, or Atlas state. Source remains `DATAFORSEO_GOOGLE_SHOPPING`; retailer identity continues through existing exact Atlas-backed resolution.

## Remaining gap

Full lifecycle production certification remains withheld. The current portfolio PRODUCTS review and PRODUCT_INFO persistence workflows have not yet been refactored to call these wrappers, and `HistoricalBootstrapLifecycleService` has not been production-composed with result-reference repositories, DF003 output handoff, and the historical owner. Full one/three-product, escalation, crash, and race matrices therefore remain outstanding. The seven production lifecycle command shells remain unavailable, and real Stage A INIT/INSPECT were not run.

No provider call, paid task, production mutation, Rakuten operation, public/current operation, commit, push, or deployment occurred. Actual spend is `$0.000`.
