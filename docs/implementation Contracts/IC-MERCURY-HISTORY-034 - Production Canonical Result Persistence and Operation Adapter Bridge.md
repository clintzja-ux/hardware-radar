# IC-MERCURY-HISTORY-034 — Production Canonical Result Persistence and Operation Adapter Bridge

## Status

`MERCURY_HISTORY_PRODUCTION_RESULT_BRIDGE_CERTIFIED`.

## HISTORY-033 mismatch closed

HISTORY-032 defined a source-neutral result reference and dispatcher, but real production retrieval returned operation-native results while PRODUCTS, PRODUCT_INFO, and SELLERS owners required different input signatures. No cross-operation immutable result owner connected them. HISTORY-034 closes only that interface seam; it does not retry the Stage-A lifecycle factory or expose operator commands.

## Repository ownership

PRODUCT_INFO's existing repository remains authoritative for its ordinary reviewed result workflow, but there was no suitable immutable repository shared by PRODUCTS and SELLERS. `FileHistoricalBootstrapProviderResultRepository` is therefore a narrow Mercury bootstrap orchestration repository—not a provider-task ledger, DF003 evidence store, workflow database, or second historical repository.

Each `mer_providerresult_*` identity is deterministic from source, operation, provider task, and paid-action intent. Its immutable record additionally binds checkpoint, Atlas product, cohort index, provider status, retrieval time, exact operation-native result, and content digest. The corresponding `MERCURY-HISTORY-032-1.0` `mer_resultref_*` record contains only canonical result ID, operation, provider task, digest, status, intent, and recording time. Checkpoints reference the compact record, never provider payload.

Exact task/intent replay returns the existing record. Different material content under the same identity fails with `BOOTSTRAP_PROVIDER_RESULT_CONFLICT`. Lookup is available by result-reference ID, canonical result ID, exact task/intent, and uniquely by task for escalated lineage recovery. No newest-file selection exists.

## Retrieval and adapters

`ProductionHistoricalBootstrapResultBridge` derives task, operation, product, and intent from the checkpoint, invokes the already-certified operation retrieval owner, and persists an AVAILABLE result. Pending results create no available record. Provider terminal failure remains a provider failure.

Three typed adapters satisfy `HistoricalBootstrapResultDispatcher` without changing its contract:

- PRODUCTS resolves the exact Atlas product and canonical provider result, then calls `createProductsIdentityProgressionOwner().resolve({atlasProduct, providerTaskId, providerResult})`.
- PRODUCT_INFO passes the exact stored governed retrieval outcome to `createProductInfoIdentityProgressionOwner().resolve({retrievalOutcome})`.
- SELLERS derives the SELLERS and optional PRODUCT_INFO task/result lineage from checkpoint events and canonical records, then calls the existing DF003 processing owner with its exact signature. Direct lineage passes explicit null Product Info inputs; escalated lineage resolves them immutably.

Owner-produced progression output is persisted once as `mer_progression_*` and referenced from the checkpoint. When configured, SELLERS historical finalization delegates only the retained evidence ID returned by DF003 to the existing historical-admission owner. The bridge contains no identity scoring, recommendation, rights, spend, comparability, DF003, E2J, retailer, Current Display, or publication policy.

## Recovery and isolation

Canonical result persistence permits exact reconciliation after retrieval but before checkpoint recording. Progression persistence permits reconciliation after owner dispatch but before checkpoint append. Existing DF003 and E2J replay rules remain authoritative after their respective writes. Mutable latest files cannot override canonical bootstrap results.

Atlas remains canonical product owner; Mercury owns only acquisition/result orchestration evidence and historical market knowledge anchored to Atlas IDs. No Stage-A command, provider task, production retrieval, retained evidence, history, Current Price, Cheapest, Pick, review, publication, affiliate, or Rakuten authority is created here.

The next bounded increment is to retry final HISTORY-033 lifecycle composition using this certified bridge.
