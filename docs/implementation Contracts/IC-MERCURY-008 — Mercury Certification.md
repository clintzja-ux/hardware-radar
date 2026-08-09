# IC-MERCURY-008 — Mercury Certification

**Status:** Implemented — Pending Exit Review  
**Subsystem:** Mercury  
**Target Version:** 1.0.0

## Objective

Certify Mercury as the stable Market Intelligence Engine of the Hardware Intelligence Platform by auditing architecture, contracts, legacy artifacts, documentation, package boundaries, deterministic behavior, and application publication boundaries.

## Certification Scope

- Observation architecture and immutable identity
- Adapter isolation
- Provenance
- Freshness
- Confidence
- Historical intelligence
- Publication eligibility
- Atlas/Sentinel/Forge/application boundaries
- Schemas and manifest
- Repository APIs and exports
- Legacy artifact isolation
- Dead-code cleanup
- Documentation consistency
- Full regression suite

## Corrective Actions

- Archive pre-M001 `PRICE-*` observations beneath `packages/mercury/legacy/`.
- Archive the pre-M001 price observation schema beneath `packages/mercury/legacy/`.
- Remove obsolete browser Atlas/Mercury compatibility adapters.
- Consolidate duplicate ADR/EDR artifacts created by filename encoding drift.
- Update Mercury architecture and package README to the certified M007 publication boundary.
- Mark the Mercury manifest as version `1.0.0` and `certified`.
- Explicitly quarantine Forge v0.2's historical Mercury preview as non-canonical pending dedicated Forge-to-Mercury adapter integration.
- Add a certification regression contract.

## Exit Criteria

Mercury may be certified v1.0 only when:

- all canonical observations are `mer_obs_*` records registered by the Mercury manifest;
- legacy records cannot enter the canonical repository accidentally;
- the canonical observation schema is singular and explicit;
- adapter/provenance/freshness/confidence/history/publication boundaries remain deterministic;
- Mercury implementation remains internal to the platform package;
- Hardware Radar consumes published intelligence artifacts only;
- Forge's remaining legacy preview is explicitly non-canonical;
- documentation reflects the implemented architecture;
- Mercury, Atlas, Sentinel, repository-layout, publication-boundary, Forge, and Hardware Radar regressions pass.
