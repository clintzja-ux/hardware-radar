# IC-DATAFORSEO-004E2D.1 — Product Info PREPARE Envelope Validation

## Scope
Correct the Product Info LIVE PREPARE bridge so it consumes the canonical E2C enrichment export envelope rather than treating the wrapper itself as the reviewed proposal.

## Required behavior
1. Read `.forge-review/acquisition/product-enrichment-proposal.json` as the canonical E2C envelope.
2. Require `paidTaskCreated === false`.
3. Require `actualSpendUsd === 0`.
4. Require a `RECOMMENDED` resolution and a `PENDING_OPERATOR_REVIEW` `PRODUCT_INFO` proposal.
5. Require the proposal provider identity to match the resolver's recommended candidate.
6. Require source task and Atlas product binding to agree between wrapper and proposal.
7. Only then create a Product Info authorization request.
8. PREPARE performs no paid API task creation.

## Safety
Any malformed, already-spent, substituted, or non-recommended envelope fails closed before authorization creation.
