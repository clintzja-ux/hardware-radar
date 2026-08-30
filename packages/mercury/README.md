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

Forge still contains a legacy Mercury preview workflow. It is explicitly non-canonical and must not be treated as a Mercury publication path. FM007 provides the certified read-only operations projection under `operations/`; it composes existing governed results and never performs ingestion, review, publication, or acquisition.

FM008 exports that projection locally with an explicit `asOf` using `npm run forge:mercury:operations:export -- --as-of=<ISO_TIMESTAMP>`. The artifact remains under `.forge-review/forge/` for manual Forge loading and is never a public market snapshot.

DF004-E2P adds record-specific canonical observation admission after E2G/E2H historical eligibility and E2J historical admission. Its assessment binds retained evidence, internal history, Atlas identities, provenance, source rights, and policy version before the existing observation-acceptance repository may accept a canonical `mer_obs_*` record. Canonical admission exposes no publication authority; review and publication remain separate. The older DataForSEO historical-promotion name is only a compatibility delegate and cannot accept caller-supplied identity resolutions.

## Governed publication workflow

Canonical observations are not implicitly public. Publication proceeds through separate evidence eligibility, durable review, and durable publication authorization. `PUBLISH` and `WITHDRAW` decisions are append-only `mer_pub_*` workflow records. The public build consumes only governed published observations when durable operational state paths are supplied; otherwise it fails closed to insufficient-data output.


## Live Market Intelligence

Mercury treats current-market eligibility as a separate rights- and freshness-aware decision layer. A stored price is not automatically a live offer. Current observation, comparison, and public-display rights must be explicitly allowed; Atlas identities must resolve; evidence must validate; freshness/confidence/availability must satisfy policy; and licensed payload must remain usable.

`LiveMarketIntelligence` returns `AVAILABLE` only when at least one observation passes every gate. Otherwise it returns `INSUFFICIENT_DATA`. Historical Intelligence remains independent and may remain dormant when historical-retention rights are unavailable.
