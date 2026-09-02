# IC-DATAFORSEO-004E2L.3 — Governed Historical Refresh Result Retrieval and Evidence Retention

**Status:** Implemented
**Increment:** DF004-E2L.3

## Retrieval binding

Retrieval is authorized only for the already-created SELLERS task recorded by the E2L.1 controlled execution. Before provider retrieval, Mercury requires exact agreement among the current refresh plan, its current-source-validated authorization, authorization-consumption record, task ledger, and execution ledger.

The bound execution must be completed, contain exactly one planned/attempted/completed task, identify the same Atlas product and provider identity, and reference exactly one task-ledger entry of kind `SELLERS`. Plan, authorization, product, retailer, provider identity, run, operation, or provider-task substitution fails closed.

The operation calls only `getSellersResult` for that task. It cannot post PRODUCTS, PRODUCT_INFO, or SELLERS tasks, create a replacement authorization, retry a paid operation, or add paid spend.

## DF003 retention and replay

Valid SELLERS items pass through the existing `SellersResultDf003RetentionService`, DataForSEO normalization, Atlas and merchant resolution, DF003 eligibility, and `FileDataForSeoMarketEvidenceRepository`.

Evidence identity remains provider source + SELLERS task ID + raw result-item reference. The material fingerprint independently binds product, merchant/domain/URL, prices, shipping, tax, currency, condition, availability, provider identity, and task/item provenance. Therefore:

- exact same task/item evidence is `DUPLICATE`;
- local/result timestamp-only replay is `DUPLICATE`;
- changed material evidence under the same task/item throws `ACQUISITION_EVIDENCE_CONFLICT`;
- a new SELLERS task creates a new evidence identity even when market values are unchanged.

Provider total price is preserved rather than recomputed. Missing shipping, tax, and condition remain `null`. Empty results retain nothing and report `NO_SELLER_OBSERVATIONS`; seller absence does not imply out-of-stock.

## Identity reuse and downstream boundaries

Each retained result is assessed through `HISTORICAL_REFRESH_IDENTITY_REUSE` against the prior evidence and its effective review projection. Compatible product identity and Atlas-backed `RETAILER-0002` resolution may be `APPLICABLE`; unknown merchants remain `DISCOVERED`/`REVIEW_REQUIRED`; product or merchant contradictions are `BLOCKED`.

Retention is not historical admission. E2L.3 never invokes E2J, canonical promotion, publication, or E2K mutation. Those remain explicit later operations.

## State and spend safety

Fixture/test execution requires explicit temporary paths for every plan, authorization, consumption, task-ledger, execution-ledger, evidence, decision, and result state. Production `.forge-review` paths are rejected in test mode before access.

E2L.3 performs no paid task creation. Additional spend is `$0.000`.
