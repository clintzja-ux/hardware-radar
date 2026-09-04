# IC-MERCURY-ACTIVATION-005G — Explicit Kingston Brand Alias Normalization

Status: implemented and fixture-certified
Owner: Atlas canonical brand aliases consumed by Mercury provider-to-Atlas identity comparison
Provider spend authority: none

## Policy

Atlas brand `Kingston` explicitly records `Kingston Technology` as an alias. Mercury policy `MERCURY-ACTIVATION-005G-1.0` canonicalizes only exact normalized brand-field values from that Atlas-owned alias set. Case, spacing, and punctuation normalization remain deterministic. Fuzzy, substring, prefix, edit-distance, title-derived, and AI alias inference are prohibited.

Product families and series remain separate identity dimensions. `Kingston FURY`, `Kingston FURY Beast`, `Kingston FURY Renegade`, and `Kingston ValueRAM` are not brand aliases and are not collapsed by this policy. MPN and every non-brand product attribute remain unchanged.

## Reassessment

Previously persisted provider evidence may be reassessed locally without reacquisition. A reassessment binds the original task/result/digest, Atlas product, exact selected provider tuple, canonical brand, alias set, policy version, provider-identity validation, and new Atlas validation. The original result remains immutable. Exact reassessment replay is idempotent; conflicting material fails closed.

Reassessment may derive `READY_FOR_SELLERS` when the existing Product Info validator reports no contradictions. This is readiness only and creates no Sellers proposal, authorization, task, retention, history, canonical observation, publication, Current Price, Cheapest, or Pick authority.

## Operator command

```text
npm run acquisition:enrichment:result:reassess -- --task-id=<PRODUCT_INFO_TASK_ID> --as-of=<ISO_UTC>
```

The command reads local retained evidence and canonical Atlas state only. It performs no provider call and incurs `$0.000` spend.
