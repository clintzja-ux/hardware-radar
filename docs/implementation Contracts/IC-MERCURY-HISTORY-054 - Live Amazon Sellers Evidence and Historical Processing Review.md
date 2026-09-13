# IC-MERCURY-HISTORY-054 — Live Amazon Sellers Evidence and Historical Processing Review

## Status

Fixture-certified local processing readiness after read-only inspection of immutable Sellers result `mer_providerresult_1f525fa00efc9dcd1bd82d90`. H054 performs no production processing, provider call, paid task, authorization, retrieval, evidence/history write, Atlas change, Current Display change, or public mutation.

## Provider-shape correction

The live DataForSEO Sellers response carries ASIN and observation time on the result envelope, structured current/regular/currency fields under `price`, and structured delivery fields under `delivery_info`. The H047/H048 adapter now maps that documented shape deterministically. Row-level ASIN remains accepted when present, but cannot contradict or replace the governed result lineage. The provider observation time is used instead of local retrieval time.

Missing seller, price, condition, delivery, voucher, discount, or shipping values remain null. Text containing “FREE delivery” does not establish numeric zero shipping. Explicit `New` remains explicit provider evidence; null condition never becomes `New`.

## Seller identity and retention

Amazon marketplace context is not merchant identity. Seller name, seller token, ships-from, and marketplace URL are retained evidence only. `Newegg Business` is not automatically `RETAILER-0004`, and `Amazon Japan` is not automatically `RETAILER-0001`. Existing Atlas-backed, append-only merchant review remains mandatory and neither inspected seller has a supporting decision for this result.

The null main row is eligible only for immutable incomplete-evidence retention and is ineligible for offer/history admission. The two priced rows retain exact `$552.07 USD` and `$728.65 USD` item prices, explicit `New`, unknown shipping, null vouchers/discounts, and exact Amazon source/task/result provenance. Retention does not imply identity, comparability, promotion, or admission.

## Comparability, promotion, and admission

HISTORY-018 remains the comparability owner. The priced rows contain no certified standalone descriptive evidence in the retained offer projection, so both are `UNKNOWN_COMPARABILITY`. Their merchants remain `DISCOVERED`; E2G/E2H therefore remains historical-ineligible. A future separately governed merchant decision alone would not bypass comparability.

Exact processing replay is duplicate-safe; changed material under the same acquisition identity fails with `ACQUISITION_EVIDENCE_CONFLICT`. Amazon evidence remains source-distinct from Google Shopping evidence. Processing returns a local acceptance result, may write retained evidence, and may write history only if existing E2J gates independently pass; it does not persist a separate Sellers outcome record. It cannot create Atlas identity, merchant review, canonical/publication eligibility, Current Display, Current Price, Cheapest, Pick, publication, or affiliate authority.

## Operator boundary

The existing zero-cost command is:

`npm run mercury:amazon:acceptance:process-sellers -- --artifact-id=<ARTIFACT_ID> --authorization-id=<SELLERS_AUTHORIZATION_ID>`

It derives the task and immutable result from durable lineage and performs no provider call or paid task. H054 certifies readiness but does not run the command.
