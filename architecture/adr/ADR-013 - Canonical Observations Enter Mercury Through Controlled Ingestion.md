# ADR-013 — Canonical Observations Enter Mercury Through Controlled Ingestion

## Status
Accepted for FM001 implementation.

## Decision
Canonical Mercury observations may only be created through a controlled ingestion boundary. External applications, including Forge, submit ingestion requests; they do not manufacture canonical observations.

The ingestion boundary owns request validation, source-policy enforcement, adapter resolution, Atlas identity resolution, canonical observation identity, normalization, provenance construction, canonical validation, idempotency and repository acceptance.

Failure before acceptance produces no canonical observation.

## Compliance
Source capability does not imply source permission. Retailer-specific acquisition methods are gated before adapter execution. Under FC001, Amazon MANUAL, IMPORT, FEED and AUTOMATED_CHECK ingestion are blocked for production. API ingestion requires the AMAZON_CREATORS_API license context and a future production adapter explicitly supporting that source method.

TEST_FIXTURE is an ingestion-only test method. Fixture observations must carry TEST_FIXTURE license context and are explicitly publication-ineligible.

## Consequences
Forge becomes an orchestrator of ingestion rather than an observation generator. Mercury owns mer_obs_* identity and canonical construction. Network acquisition, Creators API authentication, credential handling and production persistence are intentionally outside FM001.
