# ADR-041 — Retrieved Sellers Results Enter DF003 Without Reacquisition

## Decision
Completed governed DataForSEO SELLERS tasks are integrated into Mercury through a separate zero-spend retrieval/retention operation. The operation retrieves the existing SELLERS result and its governed PRODUCT_INFO evidence, validates acquisition-ledger and authorization provenance, and delegates normalization, Atlas resolution, merchant resolution, eligibility, and durable retention to the existing DF003 processor.

## Consequences
- No new paid task is created during DF003 retention.
- Acquisition and evidence integration remain independently retryable and auditable.
- PRODUCT_INFO provides structured product evidence for Atlas resolution; SELLERS provides merchant/offer evidence.
- Unknown seller fields remain `null`; source totals are preserved rather than recomputed.
- PROBABLE products or DISCOVERED merchants may be retained as evidence but cannot enter canonical/history/publication paths until their existing gates permit it.
