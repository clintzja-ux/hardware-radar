# ADR-045 — Historical Refresh Cycles Are Provider-Task Scoped

**Status:** Accepted
**Date:** 2026-08-23

## Context

Historical accumulation must distinguish repeated processing from genuinely new market observations. Price, URL, retailer, and product values can remain identical across legitimate observations, while a repeated retrieval of one provider task is still the same acquisition cycle. Existing product and merchant identity decisions should remain reusable when new evidence is compatible, without weakening their original evidence binding.

## Decision

A subsequent DataForSEO historical acquisition uses the existing governed provider identity and performs a new SELLERS paid task under a new proposal-bound, single-use authorization. Paid PRODUCTS and PRODUCT_INFO tasks are not repeated while their governed provider identity remains compatible; their provenance is referenced by the refresh plan.

An independent cycle requires a new completed governed acquisition run and a new provider SELLERS task ID. The result retains its provider observation time and task-scoped raw item reference. Retrieval or retention of the same provider task/item is replay, not a new cycle.

Evidence identity is task/result scoped rather than value scoped. Identical price and seller values from distinct provider tasks create distinct evidence and may later create distinct `mer_hist_*` records. Reprocessing the same task/item is idempotent only when its material evidence fingerprint is unchanged. A different local retrieval timestamp alone remains replay; different material evidence under the same task/item identity is an immutable-provider-evidence contradiction and fails closed as `ACQUISITION_EVIDENCE_CONFLICT`.

Existing identity decisions are reused only through an explicit compatibility assessment bound from the original evidence to the new evidence. Stable provider identity, Atlas product binding, absence of product contradiction, and Atlas-backed merchant resolution are required. Unknown merchants remain `DISCOVERED`; contradictory product or merchant evidence fails closed.

## Consequences

- Refresh PREPARE is local and zero-spend.
- Every eventual refresh still requires operator review, a new authorization, explicit confirmation, single-use execution, and existing run/day budgets.
- Seller absence creates no price or availability observation.
- New retained evidence is reassessed by E2G/E2H and is never automatically admitted by E2J.
- An eligible refresh enters E2J only through explicit evidence-scoped admission with the current governed reuse binding; equal prices do not collapse distinct evidence-scoped historical records.
- No current-price, freshness, canonical, or publication policy is introduced.
- Cycle status may be reconstructed read-only from existing artifacts to automate sequencing, never authority; recurrence remains cadence-neutral and scheduled dry runs retain no LIVE capability.
- Any future refresh cadence is an explicit versioned policy evaluated from observation time and caller-supplied `asOf`; scheduler wake frequency is not market-refresh cadence, and missing production cadence fails closed.
- The initial approved production cadence is 24 hours for `ram_corsair_cmk32gx5m2b6000z30` only, with automatic execution disabled; this product policy neither changes the independent six-hour dry scheduler nor defines public freshness.
