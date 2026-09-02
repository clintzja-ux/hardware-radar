# ADR-048 — Beacon Production Gateway Uses Cloudflare Workers and D1

**Status:** Accepted
**Date:** 2026-08-24

## Context

DF005-F established provider-neutral runtime and transactional-storage requirements for Beacon. Hardware Radar currently deploys a generated static `public/` artifact to Cloudflare, but has no write-capable runtime, production persistence, deployment configuration, or browser connection. The first-party interest workload is a small, privacy-minimized append-only event stream requiring governed HTTP handling, Atlas validation, storage-level uniqueness, deterministic replay, conflict detection, retention deletion, and low operational overhead.

## Decision

The target production Gateway runtime is Cloudflare Workers and the target Beacon persistence service is Cloudflare D1. This selection does not deploy either service. Production transport remains `NOT_CONNECTED`, Gateway readiness is `RUNTIME_SELECTED`, and browser instrumentation remains prohibited until separately approved.

The Worker will expose only `POST /api/beacon/product-interest` and a record-free health route, adapt requests to the existing `BeaconGatewayTransportAdapter`, enforce request controls, use transient transport attributes only for rate limiting, and resolve Atlas identities from a generated read-only snapshot packaged with the Worker. It cannot mutate Atlas or write Mercury.

D1 owns concurrency and uniqueness. `event_id` is the primary key and `signal_id` is independently unique. In one D1 batch transaction, the adapter attempts `INSERT OR IGNORE` and then selects by `event_id`. A changed row count means `ACCEPTED`; an ignored insert followed by an equal material fingerprint means `DUPLICATE`; an unequal fingerprint, a missing event row caused by another unique collision, or any storage ambiguity means `CONFLICT` or storage failure. Application locks are not authoritative.

## Alternatives considered

- **Workers + Durable Objects + D1:** stronger explicit coordination, but D1 already serializes each database's statements and unique constraints provide the required low-volume idempotency boundary. A Durable Object adds routing and operational complexity without a demonstrated requirement.
- **Supabase/Postgres + serverless API:** mature relational operations and portability, but adds a second hosting/control plane, connection and credential management, and cross-provider latency.
- **Traditional Node/Postgres:** maximum runtime and database control, but materially higher deployment, patching, availability, and operational burden for the expected low traffic.

Durable Objects or Postgres remain scaling options if measured D1 contention, the 10 GB per-database limit, complex analytics, or multi-region transaction requirements become material.

## Consequences

- The deployment footprint stays aligned with the existing Cloudflare edge while preserving a separate write runtime from static assets.
- D1 migrations, binding configuration, deployment workflow, endpoint tests, export/recovery procedures, and overload handling are required before deployment.
- D1 is a managed SQLite-compatible service with a serialized per-database execution path and finite size/throughput limits; the design must use indexed point operations and fail closed on overload.
- No PII, raw request body, IP, user-agent, visitor, session, account, fingerprint, or third-party analytics identity may enter Beacon persistence or application logs.
- Retention duration remains undecided. D1's indexed `recorded_at` supports governed batched deletion after policy approval, but production readiness remains blocked meanwhile.
- Cloudflare rate limiting/WAF may use transient client attributes, but those attributes do not become event identity or evidence.
- Canonical metrics are categorical counts, latency, storage errors, and endpoint health; health output exposes no records.
- This decision grants no cadence, acquisition, unattended LIVE, publication, ranking, or spend authority.

## Related architecture documents

- ADR-047 — First-Party Interest Collection Requires a Governed Write Boundary
- IC-DF005F — Beacon Gateway Runtime and Production Storage Architecture
- IC-DF005G — Beacon Production Runtime Selection and Deployment Plan
- `architecture/gateway.md`
