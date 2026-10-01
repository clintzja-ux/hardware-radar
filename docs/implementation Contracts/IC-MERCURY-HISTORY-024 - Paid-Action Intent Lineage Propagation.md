# IC-MERCURY-HISTORY-024 — Paid-Action Intent Lineage Propagation

## Status

`MERCURY_HISTORY_PAID_ACTION_LINEAGE_PARTIAL`.

The optional internal `paidActionIntentId` now propagates through governed task execution, PRODUCT_INFO and SELLERS proposals/authorizations, the existing DataForSEO provider-task ledger, acquisition execution/spend records, and HISTORY-023 reconstruction. Ordinary acquisition records without the field remain valid and unchanged.

## Record extensions

Bootstrap composition supplies an ID matching `mer_histbootintent_<24 hex>`. Product Info and Sellers include it in proposal binding digests, authorization records, and execution metadata, so substitution changes the authorization binding. PRODUCTS carries it through the existing acquisition-plan execution metadata. `ControlledAcquisitionExecutor` preserves a single intent on the run and corresponding task record.

`DataForSeoAcquisitionService` uses the intent only in Hardware Radar's internal request identity and durable task record. It is deliberately omitted from DataForSEO request payloads. `DataForSeoTaskLedger` supports exact intent lookup and rejects a second provider task for one intent. Existing request keys and records are unchanged when no intent is supplied.

Reconstruction validates intent, operation, product, source, task authorization, provider task, execution record, provider task ID, and spend lineage. Zero, one, and multiple task matches are distinguished; mismatches fail as `PAID_ACTION_LINEAGE_CONFLICT`, `PAID_ACTION_SPEND_LINEAGE_CONFLICT`, or `PAID_ACTION_INTENT_CONFLICT`. Provider/execution ledgers remain authoritative over checkpoint projection.

No evidence or historical schema expansion is needed. DF003 and E2J already trace provider task/acquisition identity, allowing the paid intent to be resolved backward without making it evidence or observation identity.

## Remaining command seam

Production command exposure remains closed. The task-specific production PREPARE scripts do not yet accept the intent exclusively from the trusted bootstrap composition, and the lifecycle commands are not composed end-to-end with their operation-specific retrieval/process owners. Allowing a free CLI intent argument would permit lineage injection. A final narrow composition must create task-specific proposals internally from the validated continuation and expose fixture-certified inspect/authorize-next/execute-next/retrieve/process/cancel commands. No run-all command is permitted.

Atlas remains the product-knowledge owner. The intent is Mercury orchestration metadata only and creates no current, public, recommendation, affiliate, or Rakuten authority.
