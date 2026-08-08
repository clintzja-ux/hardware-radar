# IC-PLATFORM-001 — Repository Modernization

**Status:** Implemented  
**Scope:** Structural migration only

## Objective

Evolve Hardware Radar from an application-centric source layout into a
platform-centric monorepo layout without changing runtime behavior.

## Canonical ownership

- `packages/atlas/` owns Atlas source, data contracts, records, and tests.
- `packages/mercury/` owns Mercury source, data contracts, records, and tests.
- `packages/sentinel/` owns Sentinel source and tests.
- `apps/forge/` owns the Forge internal application.
- `public/` remains the static deployment root.

Atlas, Mercury, and Forge assets under `public/` are generated deployment
projections. Sentinel is internal and is not published.

## Build contract

`npm run build:public` regenerates deployable Atlas, Mercury, and Forge assets.
`npm run verify:public` fails when a deployment projection drifts from its
canonical source.

## Non-goals

- No Mercury adapter framework implementation.
- No public-site redesign.
- No application behavior changes.
- No Atlas, Mercury, Sentinel, or Forge contract changes.

## Acceptance criteria

- Existing subsystem tests pass from their package locations.
- Forge and Hardware Radar retain their existing browser paths.
- Public projections match canonical sources.
- Sentinel is absent from the deployment tree.
- Documentation and Git history remain intact.
