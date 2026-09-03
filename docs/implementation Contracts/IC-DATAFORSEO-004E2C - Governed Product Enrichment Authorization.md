# IC-DATAFORSEO-004E2C — Governed Product Enrichment Authorization

## Scope
Resolve DataForSEO PRODUCTS discovery candidates against canonical Atlas RAM identity and create a zero-spend PRODUCT_INFO enrichment proposal for operator review.

## Invariants
1. Price MUST NOT contribute to identity score.
2. Exact target MPN is the strongest positive signal.
3. Conflicting MPN, DDR generation, or capacity MUST fail closed.
4. A proposal MUST contain at most one PRODUCT_INFO target and estimated cost of $0.001.
5. Proposal status is `PENDING_OPERATOR_REVIEW`; `authorizationCreated` is false.
6. Proposal creation performs no DataForSEO task creation and grants no LIVE authority.
7. Automatic paid retries remain zero.

## Exit gate
Fixture tests must select `data_docid 17540895125310173539` and reject the known DDR4 and different-MPN false positives before any real PRODUCT_INFO authorization is considered.

## DF004-E2C code boundary is certified.

Mercury    116/116 PASS
Atlas       15/15 PASS
Sentinel     7/7 PASS


Forge       PASS
Site        PASS
Console     CLEAN


DF004-E2C code boundary   CERTIFIED