# Mercury — Market Intelligence Engine

**Version:** 1.0.0  
**Status:** Certified  
**Owner:** Mirabelle Labs

Mercury is the canonical market-observation and market-intelligence subsystem of the Hardware Intelligence Platform.

Atlas answers **what is this product?** Mercury answers **what was observed in the market, where, when, and with what evidence?**

## Canonical responsibilities

Mercury owns:

- immutable retailer and market observations;
- retailer adapter normalization;
- provenance;
- freshness evaluation;
- explainable confidence evaluation;
- deterministic historical intelligence;
- market-publication eligibility and application-facing market snapshots.

Mercury does not own canonical product truth, public presentation, editorial workflow, or AI reasoning.

## Architecture

```text
External retailer representation
        ↓
Registered RetailerAdapter
        ↓
Canonical normalized candidate
        ↓
Mercury / Sentinel validation
        ↓
Canonical immutable observation
        ↓
ObservationRepository
        ├── Provenance
        ├── Freshness
        ├── Confidence
        └── Historical Intelligence
        ↓
MarketPublicationService
        ↓
public/data/market-snapshot.json
        ↓
Hardware Radar
```

## Public boundary

Mercury is an internal platform package. Its implementation is **not** copied into `public/data/mercury/`.

`npm run build:public` executes the publication boundary and writes the application-facing artifact:

```text
public/data/market-snapshot.json
```

Applications consume published intelligence artifacts. They do not execute Mercury directly in the browser or independently determine publication eligibility.

## Core contracts

- Canonical observation schema: `schemas/observation.schema.json` (v1.1)
- Canonical repository manifest: `mercury-manifest.json`
- Canonical observation IDs: `mer_obs_NNNNNNNNN`
- Canonical adapters: `adapters/`
- Publication boundary: `publication/`

## Certified principles

1. Observations are immutable.
2. Retailer-specific behavior is isolated behind registered adapters.
3. Provenance records factual lineage; it does not score trust.
4. Freshness is derived temporal state, not stored truth.
5. Confidence is explainable derived state, not an opaque stored score.
6. Historical intelligence is derived from immutable observations, not a second mutable history store.
7. Applications consume published intelligence artifacts rather than platform internals.

## Legacy artifacts

Pre-M001 `PRICE-*` records and the original `price-observation.schema.json` are preserved only under `legacy/` for historical engineering reference. They are not canonical repository members and cannot be loaded through the Mercury manifest.

Forge v0.2 still contains a legacy Mercury preview workflow. It is explicitly non-canonical and must not be treated as a Mercury publication path. Canonical Forge-to-Mercury ingestion will use the registered adapter and validation pipeline in a later Forge integration sprint.
