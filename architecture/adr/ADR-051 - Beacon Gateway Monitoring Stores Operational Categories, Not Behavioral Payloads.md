# ADR-051 — Beacon Gateway Monitoring Stores Operational Categories, Not Behavioral Payloads

**Status:** Accepted  
**Date:** 2026-08-24

## Context

The future Beacon Gateway requires security, availability, health, and incident-diagnosis visibility. Raw requests, product events, product identity, and transport identity would turn operational monitoring into a second behavioral store and could extend deleted Beacon evidence beyond its governed lifecycle. No Cloudflare or third-party monitoring destination has been approved.

## Decision

Gateway operational monitoring stores only controlled product-neutral categories and deliberately minimal safe fields. Approved categories are requests evaluated, requests accepted, duplicates, material conflicts, validation rejections, rate limited, storage failures, handler errors, endpoint health, and handler latency.

Operational records are retained for 30 days (`2592000000` milliseconds) from server-controlled monitoring `recordedAt`. They contain no raw request body, product-event payload, Atlas product or retailer ID, event/signal ID, network or user identity, headers, cookies, secrets, or raw stack/exception text. Safe error classifications and bounded latency values replace arbitrary diagnostics.

The provider-neutral sink validates immutable records before forwarding them. Sink failure is reported as `MONITORING_DEGRADED` without raw error text and does not reverse an otherwise successful durable Beacon write. Monitoring cannot conceal or convert handler/storage failures into acceptance.

## Consequences

- Monitoring is operationally secondary and has no behavioral analytics, product-interest, cadence, ranking, recommendation, acquisition, or publication authority.
- Beacon's 90-day behavioral-evidence retention and Gateway's 30-day operational retention remain separate.
- Monitoring deletion eligibility begins at `recordedAt + 30 days`; automatic deletion is disabled until a destination-specific governed retention mechanism exists.
- Production monitoring policy is configured, but destination and alert thresholds remain unresolved.
- Candidate Cloudflare runtime facilities may later implement the sink, but this ADR selects no Logpush, Analytics Engine, external SaaS, binding, or live configuration.
- Production remains `NOT_CONNECTED`; browser instrumentation remains disabled.

## Alternatives considered

- Raw console logging was rejected because payloads, identities, paths, SQL, or secrets could leak.
- Copying Beacon records into monitoring was rejected because it duplicates behavioral evidence and undermines retention.
- Selecting a monitoring vendor without an operator infrastructure decision was rejected.

## Related architecture documents

- ADR-047 — First-Party Interest Collection Requires a Governed Write Boundary
- ADR-048 — Beacon Production Gateway Uses Cloudflare Workers and D1
- ADR-050 — Beacon Product-Interest Ingestion Is Rate Limited at the Cloudflare Edge
- IC-DF005J — Beacon Privacy-Safe Operational Monitoring Governance
