# ADR-050 — Beacon Product-Interest Ingestion Is Rate Limited at the Cloudflare Edge

**Status:** Accepted  
**Date:** 2026-08-24

## Context

The planned Beacon endpoint accepts unauthenticated, privacy-minimized product-interest events. Abusive volume should be rejected before Worker execution and D1 writes where possible, but Hardware Radar has no production Beacon traffic baseline from which to approve a numeric threshold. Abuse prevention must remain separate from behavioral evidence and cannot create identity, analytics, cadence, or acquisition authority.

## Decision

Cloudflare WAF rate limiting is the primary abuse boundary for `POST /api/beacon/product-interest`, enforced at `EDGE_TRANSPORT`. DF005-I.1 approves the initial launch threshold of 20 requests per 60-second window, action `BLOCK`, with burst semantics `NONE`. The threshold is conservative enough for abuse protection while allowing shared NAT/mobile networks, atypical navigation, and retransmissions. Future changes require explicit policy review.

Cloudflare may use transient network request identity for abuse prevention. IP, CF connecting IP, user agent, device, cookie, visitor, session, fingerprint, and geolocation cannot enter Beacon signals, event identity, deduplication, D1 evidence, or application analytics. Operational rate-limit logs remain outside Beacon evidence.

The Worker must continue enforcing the certified method, content-type, size, schema, privacy, Atlas, replay, and conflict rules even when WAF is present. Worker-local memory, D1 records, and Beacon evidence are not authoritative rate-limit counters. A denied request returns HTTP 429 with a minimal `RATE_LIMITED` error and never invokes Beacon persistence.

## Consequences

- Edge rejection reduces avoidable Worker and D1 processing.
- Lack or misconfiguration of WAF grants no Beacon authority; application validation remains fail-safe.
- Monitoring is limited to requests evaluated, allowed, rate limited, configuration present/missing, and endpoint health.
- The numeric threshold is configured in repository policy, but no live WAF rule exists or is deployed.
- Requests below the threshold remain untrusted behavioral evidence and are not unique users, conversions, popularity, rankings, or trusted demand.
- Gateway remains `RUNTIME_SELECTED`; production transport and browser remain disconnected.
- This policy grants no popularity, ranking, cadence, refresh, acquisition, automatic execution, unattended LIVE, publication, or spend authority.

## Alternatives considered

- Worker-local in-memory counters were rejected because isolates do not provide an authoritative global counter.
- D1 counters were rejected because abusive traffic should be stopped before storage and because Beacon evidence is not an abuse ledger.
- No abuse boundary was rejected because an unbounded public write route is not production-ready.

## Related architecture documents

- ADR-047 — First-Party Interest Collection Requires a Governed Write Boundary
- ADR-048 — Beacon Production Gateway Uses Cloudflare Workers and D1
- ADR-049 — Beacon First-Party Interest Evidence Is Retained for 90 Days
- IC-DF005I — Beacon Gateway Abuse Boundary and Rate-Limit Governance
