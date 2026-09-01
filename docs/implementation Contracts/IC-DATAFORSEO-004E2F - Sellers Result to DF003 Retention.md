# IC-DATAFORSEO-004E2F — Sellers Result → DF003 Retention

## Scope
Bridge an already-paid governed SELLERS result into the certified DF003 market-evidence boundary with zero new paid acquisition.

## Contract
1. Require the SELLERS provider task to exist as a completed task in the acquisition execution ledger.
2. Require that task's run plan to match the current governed SELLERS authorization.
3. Require the supplied PRODUCT_INFO task to match SELLERS provenance.
4. Retrieve SELLERS and PRODUCT_INFO results only; both retrieval costs must be zero.
5. Require PRODUCT_INFO provider identity to match the authorized provider identity.
6. Normalize each `shops_list` item losslessly through DF003-A.
7. Resolve product identity through DF003-B and merchant identity/eligibility through DF003-C.
8. Retain raw licensed market evidence through DF003-D when allowed.
9. Do not create canonical observations, historical promotion, or publication when identity gates block them.
10. Replaying the same task at the same stable acquisition timestamp must be idempotent and return DUPLICATE rather than create new evidence.

## B-008A lineage and identity hardening

Before credentials or provider transport are used, the supplied SELLERS task must resolve uniquely through the durable task ledger to the sole completed task of the exact consumed SELLERS authorization, plan, proposal, execution, Atlas product, source PRODUCTS task, and source PRODUCT_INFO task. The PRODUCT_INFO argument must be the task bound by that proposal; a caller cannot combine a valid SELLERS task with another PRODUCT_INFO task. Unknown, duplicate, malformed, unconsumed, non-completed, or conflicting lineage fails closed before retrieval and before DF003 persistence.

Retrieved result envelopes must identify the exact governed SELLERS and PRODUCT_INFO tasks and both retrieval costs must be zero. For `productId`, `dataDocId`, and `gid`, every identifier populated on two compared boundaries must be equal. Missing values remain `UNKNOWN`, at least one authorization-to-PRODUCT_INFO identifier must positively match, and one match cannot conceal drift in another identifier. Provider task, result-envelope, operation, or product-context substitution blocks retention.

The existing DF003 boundary remains authoritative after validation. It preserves exact-replay idempotency, conflicting-replay rejection, provenance, product and merchant resolution, and null/unknown condition and shipping. Its audit summary includes the validated lineage, Atlas product, provider identity, merchant outcomes, knownness flags, and retention counts. Retention creates no Atlas mutation, retailer approval, history, canonical observation, review, current-market qualification, publication, Current Price, Cheapest, Pick, recommendation, or affiliate authority.

## Expected first real outcome
Platinummicro / $588.99 is retained; product resolution remains PROBABLE; merchant resolution remains DISCOVERED; historical/canonical/publication eligibility remains false; additional spend remains $0.000.

## DF004-E2F passes the implementation quality gate.

Mercury     124/124  PASS
Atlas        15/15   PASS
Sentinel      7/7    PASS

Forge                 PASS
Site                  PASS
Console               CLEAN

DF004-E2F code gate   CERTIFIED
