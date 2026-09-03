# IC-ATLAS-004 — Repository Integrity

## Objective

Validate Atlas as a complete repository graph rather than as isolated records.

## Implemented

- Repository-wide integrity validator
- Product-to-brand resolution
- Product-to-category resolution through canonical product types
- Brand-to-supported-category validation
- Cross-repository duplicate identity detection
- Manifest validation integration
- Machine-readable repository health result
- Human-readable Atlas Repository Health report
- Atlas facade methods for integrity validation and health reporting
- Automated failure-path tests for broken references and duplicate identities

## Scope boundary

Mercury observation-to-retailer and observation-to-product relationships are intentionally deferred until Mercury repositories exist.

## Acceptance criteria

- Current canonical Atlas graph passes integrity validation
- Broken brand and category references fail deterministically
- Duplicate identities fail deterministically
- Manifest failures propagate into the integrity report
- Existing Sentinel and Atlas tests remain green
- Forge and Hardware Radar remain operational
