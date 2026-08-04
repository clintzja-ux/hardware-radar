# Session 016 — Mercury Observation Foundation

**Date:** 2026-08-03  
**Implementation Contract:** IC-MERCURY-001  
**Branch:** `mercury-sprint1-observation-foundation`

## Outcome

Mercury now has its first canonical repository capability. The implementation resolves the contract drift between the legacy `PRICE-*` records and the certified Mercury Data Dictionary by introducing a new canonical observation schema and manifest while preserving historical sample records outside the canonical collection.

## Engineering Decisions Applied

- Observations are immutable.
- Mercury references Atlas identity; it does not duplicate product truth.
- Retailer observations use canonical retailer IDs.
- Observation IDs are opaque and immutable.
- Duplicate detection uses both record ID and observation identity tuple.
- The manifest is the only canonical repository membership authority.
- Historical and unresolved legacy records are preserved rather than silently deleted.

## Verification

Expected integrated test result:

- Sentinel: 7 test files
- Atlas: 15 test files
- Mercury: 7 test files

Manual regression checks remain required for Forge and Hardware Radar before the sprint is accepted.
