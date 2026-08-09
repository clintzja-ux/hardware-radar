# Mercury Architecture

**Subsystem:** Mercury — Market Intelligence Engine  
**Version:** 1.0.0  
**Status:** Certified

## Purpose

Mercury observes the hardware market.

Atlas answers **what is this product?** Mercury answers **what is happening to this product in the market?**

## Certified architecture

Mercury consists of two complementary foundations:

1. **Adapter Framework** — translates retailer-specific representations into canonical observation candidates.
2. **Observation Engine** — preserves immutable observations and derives provenance, freshness, confidence, history, and publishable market intelligence.

```text
Retailer World
     ↓
Adapter Registry
     ↓
Retailer Adapter
     ↓
Canonical Candidate
     ↓
Validation
     ↓
Immutable Observation Repository
     ├── Provenance
     ├── Freshness
     ├── Confidence
     └── Historical Intelligence
     ↓
Publication Eligibility
     ↓
Market Snapshot
     ↓
Applications
```

## Certified implementation contracts

- M001 — Observation Foundation
- M002 — Adapter Framework Foundation
- M003 — Provenance Foundation
- M004 — Freshness Engine
- M005 — Confidence Engine
- M006 — Historical Intelligence
- M007 — Hardware Radar Integration
- M008 — Mercury Certification

## Ownership

Mercury owns retailer/market observations and market-derived intelligence.

Mercury does not own:

- product truth (Atlas);
- deterministic platform validation policy (Sentinel);
- authoring or review workflow (Forge);
- public presentation (Hardware Radar);
- AI reasoning (Aurora).

## Public application boundary

Applications do not import Mercury's internal package in the browser. They consume published application-facing intelligence artifacts generated from eligible Atlas + Mercury evidence.

For Hardware Radar the current artifact is:

```text
public/data/market-snapshot.json
```

## Legacy policy

Pre-M001 `PRICE-*` records are archived beneath `packages/mercury/legacy/` and are not members of the canonical repository.

Forge v0.2's historical Mercury preview is explicitly non-canonical pending the dedicated Forge-to-Mercury ingestion integration.
