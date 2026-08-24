# ADR-046 — Historical Refresh Cadence Assignment Is Explicit and Unambiguous

**Status:** Accepted  
**Date:** 2026-08-23

## Context

Mercury's first production cadence policy is explicitly scoped to one Atlas product. Scaling the portfolio requires multiple independently versioned policies without turning that initial 24-hour interval into a universal default or letting file order decide between overlapping configuration.

## Decision

Historical-refresh cadence policies remain Mercury-owned configuration with stable IDs and explicit Atlas product scopes. A product has zero or one applicable policy. Multiple policies scoped to the same product are ambiguous and fail closed; no interval-selection heuristic is permitted. Unknown Atlas product references fail integration validation.

The repository returns policies in stable policy-ID order and supports inventory, ID lookup, and product resolution. DF005-A and E2O consume the resolved policy. No policy remains `POLICY_NOT_CONFIGURED`; one disabled policy remains `DISABLED`.

No wildcard/global default, adaptive assignment, interest or popularity input, budget-aware adjustment, or automatic execution authority is introduced.

## Consequences

- The existing Corsair 24-hour policy remains unchanged and product scoped.
- Additional policies can be added later only as explicit configuration.
- Configuration conflicts stop evaluation instead of creating accidental acquisition timing.
- Policy resolution is read-only and grants no authority to prepare, authorize, execute, retrieve, retain, admit, or publish.
