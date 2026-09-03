# ADR-036 — Product Enrichment Requires Identity Resolution and Separate Authorization

## Decision
Google Shopping PRODUCTS results are discovery evidence only. Hardware Radar must resolve product identity before proposing PRODUCT_INFO enrichment. Price is never an identity signal. Contradictory MPN, memory generation, or capacity evidence fails closed.

A safe recommendation may create a `PENDING_OPERATOR_REVIEW` enrichment proposal, but the proposal itself grants no paid authority. PRODUCT_INFO requires a separate, single-use authorization in a later governed step.

## Consequences
- PRODUCTS false positives cannot become canonical product identity merely by being cheap.
- Exact MPN plus corroborating RAM attributes is preferred.
- Ambiguous/no-safe-candidate sets stop before paid enrichment.
- The existing unattended Windows task remains DRY_RUN only.
