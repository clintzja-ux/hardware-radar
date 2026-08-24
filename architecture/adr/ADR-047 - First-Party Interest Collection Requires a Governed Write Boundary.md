# ADR-047 — First-Party Interest Collection Requires a Governed Write Boundary

**Status:** Accepted  
**Date:** 2026-08-24

## Context

ADR-020 assigns behavioral and demand evidence to Beacon. Hardware Radar is currently a static site: it has no Gateway or server-side application endpoint capable of validating Atlas identity and durably accepting public writes. Browser storage, static files, and third-party analytics tags are not trustworthy substitutes for governed Beacon persistence.

## Decision

Beacon defines a strict first-party product-interest collection application boundary, but production browser transport remains `NOT_CONNECTED` until a governed server write boundary exists. The browser must never receive filesystem access, repository credentials, or authority to create persisted Beacon evidence directly.

Collection is product-centric and retains no visitor, session, account, IP, advertising, fingerprint, precise-location, or cross-site identity. Supported events are validated against Atlas and converted to immutable DF005-C signals. Existing Google Analytics and Microsoft Clarity tags remain separate and do not become Beacon evidence authority.

## Consequences

- DF005-D can validate collection, replay, privacy, provenance, and summary integration without fabricating production activity.
- Production interest remains `NO_DATA` until legitimate activity passes through a future governed endpoint.
- A transport deployment requires a separate security/privacy review and persistence decision.
- Interest evidence grants no Mercury cadence, acquisition, ranking, recommendation, publication, or spend authority.

## Governed boundary implementation

DF005-E defines the framework-neutral Gateway contract at `POST /api/beacon/product-interest` and a Beacon-owned atomic file repository adapter. The handler owns method, content-type, raw-size, parsing, and minimal-response behavior; Beacon remains authoritative for schema, privacy, Atlas identity, signal creation, and replay validation.

The file adapter proves durable semantics for development and deployment-adapter testing but is not designated production storage. No deployable Gateway runtime, production storage configuration, operational rate limiter, or browser connection exists, so production transport remains `NOT_CONNECTED`. Deployment must select managed storage, concurrency controls, abuse protection, retention, and operational monitoring before activation.
