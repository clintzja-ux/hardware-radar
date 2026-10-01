# IC-MERCURY-HISTORY-021 — Production Historical Bootstrap Composition

## Status

`MERCURY_HISTORY_PRODUCTION_COMPOSITION_PARTIAL`.

The production-owner map is now an explicit, fail-closed Mercury composition contract. It is not yet a live execution command. No provider task, retrieval, retention, or historical admission was performed.

## Owner bindings

`HistoricalBootstrapProductionComposition` accepts only the fixed HISTORY-019 artifact and requires explicit owners for PRODUCTS, conditional PRODUCT_INFO, SELLERS, result retrieval, governed identity, DF003 retention, HISTORY-018 comparability, E2J admission, UTC-day spend, authorization, historical portfolio, and Forge projection. Missing owners or artifact substitution fail closed. The composition contains wiring only and grants no policy authority.

The existing owners remain authoritative: `DataForSeoAcquisitionService` and `ControlledAcquisitionExecutor` create and account for paid tasks; their durable task and execution ledgers preserve task lineage; the existing result boundaries retrieve zero-cost results; `GovernedProviderIdentityResolver` and task-specific result review own identity; `SellersResultDf003RetentionService` owns retention; `HistoricalOfferComparabilityAssessment` owns standalone comparability; and `HistoricalObservationAdmissionService` remains the only E2J writer.

## Remaining production gap

The certified provider stages are asynchronous and separately authorized. A PRODUCTS task can be durably created before its result is available, and PRODUCT_INFO/SELLERS inputs cannot be safely derived until the preceding governed result has been retrieved and resolved. The existing HISTORY-020 authorization is consumed before the first provider call and blind resume is forbidden. Therefore a single synchronous cohort command cannot safely compose these owners without a durable checkpoint/resume lifecycle that preserves each task-specific authorization and records pending retrieval.

No such lifecycle is invented here. Exposing an EXECUTE command now would either poll through a new retrieval implementation, bypass individual task authorization, or risk recreating a paid task after interruption. The production authorize/execute commands remain unavailable until that explicit durable checkpoint lifecycle is certified. This is a fail-closed architecture result, not permission to weaken HISTORY-020.

## Isolation

The fixed artifact remains `mer_histbootstrap_71c280422c057da3b248a43b`, with 9 tasks, `$0.009` cohort spend, `$0.001` per task, `$0.010` UTC-day spend, and zero automatic retries. Current Display, Rakuten, canonical review, publication, Current Price, Cheapest, Picks, affiliate routing, and public artifacts are outside the boundary.
