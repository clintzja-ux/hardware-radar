# IC-MERCURY-HISTORY-055 — DataForSEO Amazon Acceptance Closure and Durable Evidence Audit

## Status

Production evidence reconciliation complete. The bounded Amazon acceptance run is classified `AMAZON_ACCEPTANCE_SUCCESS`, the certified path is `AMAZON_SCALE_OUT_READY`, and `NO_NEW_INFRASTRUCTURE_REQUIRED` applies to another bounded pilot using the same supported semantic class.

H055 is a read-only durable-state audit plus documentation reconciliation. It creates no provider task, retrieval, authorization, review, historical admission, Atlas mutation, Current Display mutation, or public authority. Additional spend is `$0.000`.

## Acceptance lineage

The accepted run is bound to artifact `mer_amzaccept_fe85419f5ef4b52dc9997843`, Atlas product `ram_corsair_cmh32gx5m2b6000c38`, governed ASIN `B0CQQVNCB6`, Products result `mer_providerresult_cf4506268ee32ecc59c63e95`, Products reassessment `mer_amzreassess_3c05017ff0b90e7a4e769745`, Sellers task `09130317-2304-0309-0000-71d6d0d866ca`, and Sellers result `mer_providerresult_1f525fa00efc9dcd1bd82d90`.

The Products authorization recovery chain remains append-only. Its pre-request failed execution created no provider task and spent `$0.000`; the corrected successor produced exactly one Products task. The separately authorized Sellers action produced exactly one Sellers task. No ASIN task, automatic retry, or duplicate provider task exists. Durable provider spend for this acceptance run is `$0.0030` (`$0.0015` Products plus `$0.0015` Sellers).

## Durable evidence audit

Processing the immutable Sellers result retained exactly three `DATAFORSEO_AMAZON` evidence records:

- `dfev_9ce15d73a550598438d7d859`: the incomplete main row, with seller, price, currency, condition, delivery, and shipping remaining null;
- `dfev_4e81932fd3d64eb429bc4798`: Newegg Business, `$552.07 USD`, explicit provider condition `New`, null shipping;
- `dfev_093fc3a58b302ec64fa854a6`: Amazon Japan, `$728.65 USD`, explicit provider condition `New`, null shipping.

All three preserve exact artifact, Atlas product, ASIN, source, task, immutable result, result digest, source-rights digest, item reference, and provider observation-time lineage. Seller names and Amazon seller tokens remain evidence rather than canonical retailer identity. “FREE delivery” text does not convert unknown numeric shipping to zero.

The incomplete row is `BLOCKED` by invalid DF003 eligibility. The two priced rows remain independent `DISCOVERED` merchant evidence, `UNKNOWN_COMPARABILITY`, `REVIEW_REQUIRED`, and historical-ineligible. Their promotion reasons include product identity not verified for this evidence generation, merchant identity not registered, DF003 eligibility not satisfied, and merchant registration required. No retained row is silently joined to Google Shopping evidence or promoted by product-level coincidence.

## Replay and downstream isolation

The first exact PROCESS invocation retained the three records. The second exact invocation resolved to the same evidence identities and created no duplicate or conflict. Same acquisition identity plus changed material evidence continues to fail closed with `ACQUISITION_EVIDENCE_CONFLICT` under the existing repository contract.

There are zero historical observations bound to these evidence records or the Sellers task. PROCESS created no canonical observation, review, E2S qualification, publication decision, Current Display, Current Price, Cheapest, Pick, recommendation, or affiliate authority. Atlas and existing production history remain unchanged.

## Scale-out decision

This run validates the supported DataForSEO Amazon Products-to-Sellers path, immutable result persistence, explicit reassessment, independent single-use paid authorization, source-typed DF003 retention, null preservation, merchant fail-closed behavior, and duplicate-safe processing in production.

The next step does not require a new acquisition, evidence, history, or workflow subsystem. Use an explicit action-by-action pilot for a small operator-reviewed cohort of five to ten eligible Atlas products. Each product remains independently selected and bound; every paid Products or Sellers action retains its own review, authorization, cap, execution, retrieval, and processing stop. Result-dependent identity, merchant, comparability, and historical gates remain authoritative. No run-all or automatic paid continuation is implied.
