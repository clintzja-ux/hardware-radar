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

## DF004-E2E passes the code quality gate.

Mercury    123/123 PASS
Atlas       15/15 PASS
Sentinel     7/7 PASS


Forge       PASS
Site        PASS
Console     CLEAN


DF004-E2E code boundary   CERTIFIED