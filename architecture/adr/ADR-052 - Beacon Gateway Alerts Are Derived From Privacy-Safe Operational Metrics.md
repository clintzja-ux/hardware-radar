# ADR-052 — Beacon Gateway Alerts Are Derived From Privacy-Safe Operational Metrics

**Status:** Accepted  
**Date:** 2026-08-24

## Context

DF005-J governs privacy-safe Gateway monitoring and DF005-K selects an undeployed Cloudflare Workers Logs destination. Operational failures need deterministic alert rules without turning monitoring into behavioral evidence or granting remediation authority.

## Decision

Gateway derives five read-only alerts from validated DF005-J records: three consecutive failed explicit health checks; at least five storage failures, ten handler errors, or fifty rate-limited events in `(asOf - 300000ms, asOf]`; and nearest-rank p95 handler latency greater than 1000 milliseconds over the same window.

All evaluation requires explicit `asOf`. A successful health check resets consecutive failures. Window-start records and future records are excluded. Nearest-rank p95 sorts numeric durations ascending and selects rank `ceil(0.95 × n)`. No data is `CLEAR` with reason `NO_DATA`; malformed required evidence is `BLOCKED`.

## Consequences

- Alert evaluation is immutable, provider-neutral, and derived on demand; there is no second alert-history repository.
- Alerts contain no product, retailer, signal, person, session, network, URL, or payload identity.
- Automatic remediation, WAF authority, behavioral authority, cadence authority, acquisition authority, and publication authority are all absent.
- Alert policy is configured, but notification destination, monitoring deployment, Worker deployment, and browser connection remain unresolved.
- Cloudflare Alerts, notifications, APIs, and live resources are not configured by this decision.

## Related documents

- ADR-051 — Beacon Gateway Monitoring Stores Operational Categories, Not Behavioral Payloads
- IC-DF005L — Beacon Gateway Operational Alert Policy
