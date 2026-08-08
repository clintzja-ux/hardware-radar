# IC-MERCURY-003 — Provenance Foundation

**Status:** Implemented — awaiting exit review  
**Subsystem:** Mercury  
**Objective:** Evolve the existing M001 provenance object into a first-class, auditable provenance chain without introducing a second provenance mechanism.

## Scope

Mercury provenance records factual lineage only. It does not calculate trust, confidence, freshness, or publication eligibility.

The canonical provenance chain is:

Source → Acquisition → Transformation → Validation

## Deliverables

- First-class `Provenance` model and builder
- Dedicated `ProvenanceValidator`
- Nested provenance schema contract
- Observation schema version 1.1
- Canonical observation migration to the evolved model
- Amazon Adapter integration with the canonical provenance builder
- Public Mercury exports for provenance APIs
- Automated model, validator, and adapter-integration tests

## Boundaries

Deferred to later contracts:

- freshness scoring
- confidence scoring
- historical analytics
- live retailer ingestion
- publication workflow
- provenance quality weighting

## Exit Criteria

- Existing canonical observation validates under schema 1.1
- Adapter-produced observations carry complete provenance
- Provenance source, acquisition, transformation, and validation facts are auditable
- Provenance cannot independently decide trust or confidence
- Full platform regression passes
