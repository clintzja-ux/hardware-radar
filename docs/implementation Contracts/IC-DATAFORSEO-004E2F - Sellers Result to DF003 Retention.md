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