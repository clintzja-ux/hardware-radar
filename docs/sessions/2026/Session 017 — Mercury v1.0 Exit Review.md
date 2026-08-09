# Session 017 — Mercury v1.0 Exit Review

## Certification Target

Mercury v1.0 — Market Intelligence Engine

## Certified Capability Stack

- M001 Observation Foundation
- M002 Adapter Framework Foundation
- M003 Provenance Foundation
- M004 Freshness Engine
- M005 Confidence Engine
- M006 Historical Intelligence
- M007 Hardware Radar Integration
- M008 Certification and cleanup

## Architectural Result

Mercury now provides a coherent market-intelligence pipeline built around immutable observations and retailer-independent adapters. Provenance, freshness, confidence, historical intelligence, and application publication are derived through explicit deterministic contracts rather than browser or retailer-specific assumptions.

## Certification Boundary

Canonical Mercury implementation remains under `packages/mercury/`.

Applications consume `public/data/market-snapshot.json` rather than Mercury internals.

Pre-M001 artifacts remain available only in `packages/mercury/legacy/` for historical engineering reference.

Forge v0.2's legacy Mercury preview is not a canonical publication path and is intentionally deferred to a dedicated Forge/Mercury integration sprint.

## Decision

Mercury v1.0 may be declared **CERTIFIED** only after the complete automated regression suite and manual Forge/Hardware Radar checks pass on the M008 branch.
