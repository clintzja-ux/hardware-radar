# IC-DATAFORSEO-004E2E — Governed Sellers Enrichment

## Scope
Create the governed bridge from validated PRODUCT_INFO evidence to merchant-level SELLERS acquisition.

## Contract
1. Retrieve an existing PRODUCT_INFO task result without creating a new task.
2. Require identity continuity with the governed PRODUCT_INFO authorization.
3. Export a zero-spend SELLERS proposal for operator review.
4. Bind authorization to Atlas product, source PRODUCTS task, source PRODUCT_INFO task/authorization, exact provider identity, and SELLERS operation.
5. Limit execution to one paid task, $0.001 maximum, and zero automatic retries.
6. Consume authorization before paid transport; replay fails closed.
7. SELLERS output does not automatically enter Mercury history; DF003 remains the ingestion/eligibility boundary.

## B-007A lineage and identity hardening

Before Product Info retrieval, the supplied task ID must resolve uniquely through the durable DataForSEO task ledger to the sole completed `PRODUCT_INFO` task of the exact plan, proposal, consumed authorization, Atlas product, source PRODUCTS task, and provider binding. Unknown tasks, unconsumed or conflicting authorization state, non-completed or duplicate executions, and operation or lineage substitution fail closed before credentials or transport are used.

After retrieval, every provider identifier populated on both the authorization and result (`productId`, `dataDocId`, and `gid`) must be exactly equal; one matching identifier cannot mask another identifier's drift. At least one shared populated identifier is required. The bound Atlas product is assessed with the existing DataForSEO product-evidence vocabulary. Explicit MPN, brand, memory-generation, capacity, module-configuration, speed/timing, or form-factor contradictions fail closed. Missing optional Product Info evidence remains `UNKNOWN` and is not itself a contradiction. Price is never identity evidence.

Only a zero-cost, exactly-one-item Product Info result that passes lineage, provider-identity, and Atlas validation can create the existing `PENDING_OPERATOR_REVIEW` SELLERS proposal. The proposal preserves the exact PRODUCTS task, Product Info proposal/authorization/task/execution, Atlas product, validated provider identity, and deterministic validation digest. It creates no SELLERS authorization or task, retention, identity decision, history, canonical observation, review, publication, Current Price, Cheapest, or Pick authority. Condition and shipping remain SELLERS-owned evidence and are not inferred here.

## DF004-E2E passes the code quality gate.

Mercury    123/123 PASS
Atlas       15/15 PASS
Sentinel     7/7 PASS


Forge       PASS
Site        PASS
Console     CLEAN


DF004-E2E code boundary   CERTIFIED
