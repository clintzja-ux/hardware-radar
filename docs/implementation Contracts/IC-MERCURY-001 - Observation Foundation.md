# IC-MERCURY-001 — Observation Foundation

**Subsystem:** Mercury  
**Sprint:** M001  
**Status:** Implemented; pending repository integration verification  
**Date:** 2026-08-03

## Objective

Establish Mercury's first canonical, immutable market-observation repository without introducing freshness, confidence, historical analytics, or publication behavior prematurely.

## Implemented Contract

- Canonical observation schema: `public/data/mercury/schemas/observation.schema.json`
- Opaque immutable observation IDs using `mer_obs_NNNNNNNNN`
- Deterministic identity tuple composed of:
  - `atlasProductId`
  - `retailerId`
  - `marketplace`
  - `observationTime`
  - `sourceMethod`
- Canonical Mercury manifest
- One canonical Amazon observation referencing the certified Atlas product and retailer
- `ObservationRepository`
- `ObservationValidator`
- `ManifestValidator`
- Mercury facade and public exports
- Legacy-record isolation
- Automated Mercury test suite integrated into `npm test`

## Explicit Deferrals

The following remain outside M001:

- freshness and expiry policy;
- confidence calculation;
- historical price calculations;
- current-offer selection;
- supersession-chain execution;
- Sentinel Mercury rule package;
- Forge repository integration;
- Hardware Radar migration to the canonical Mercury repository.

## Exit Criteria

- One canonical observation loads through the repository.
- Observation structure validates deterministically.
- Duplicate IDs and duplicate identity tuples are rejected.
- Atlas product and retailer references can be validated.
- Legacy observations remain preserved but cannot enter the canonical manifest.
- Sentinel, Atlas, and Mercury tests pass.
- Forge and Hardware Radar remain operational.
