# EDR-019 — Mercury v1.0 Certification Cleanup

**Status:** Implemented  
**Subsystem:** Mercury  
**Implementation Contract:** IC-MERCURY-008

## Decision

Before Mercury v1.0 certification, transitional artifacts must be explicitly archived, removed, or quarantined so only one canonical Mercury observation contract and one public publication boundary remain.

## Changes

- Pre-M001 `PRICE-*` records moved to the Mercury legacy archive.
- Pre-M001 price schema moved to the Mercury legacy archive.
- Obsolete public `atlasAdapter.js` and `atlasSmokeTest.js` removed.
- Duplicate ADR/EDR filename variants removed.
- Mercury README and architecture documentation updated to the certified model.
- Mercury manifest promoted to v1.0.0 / certified.
- Forge v0.2 Mercury output explicitly classified as a legacy preview rather than a canonical Mercury write path.
- Certification regression contract added.

## Outcome

Mercury's canonical implementation, historical archive, Forge transition state, and application publication boundary are now explicit and non-overlapping.
