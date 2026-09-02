# ADR-049 — Beacon First-Party Interest Evidence Is Retained for 90 Days

**Status:** Accepted
**Date:** 2026-08-24

## Context

Beacon will retain privacy-minimized first-party product-interest evidence after the selected Workers + D1 Gateway is deployed. Indefinite raw behavioral retention is unnecessary and conflicts with Hardware Radar's product-centric privacy boundary. Retention must be deterministic, server-controlled, evidence-class-specific, and independent of Mercury cadence or acquisition.

## Decision

Raw `FIRST_PARTY_PRODUCT_INTEREST` evidence, currently limited to `OUTBOUND_RETAILER_CLICK`, is retained for 90 days (`7776000000` milliseconds). The clock begins at server-controlled `recordedAt`, not browser-controlled `occurredAt`. A record is deletion-eligible when `asOf >= recordedAt + retentionMs`.

Eligibility does not authorize deletion. `automaticDeletion` is false. A later purge must use a deterministic policy-bound plan, explicit execution authority, bounded event-ID deletion, idempotency, and a payload-free audit record. Production has no Beacon records and this decision performs no purge.

## Consequences

- `occurredAt` remains behavioral chronology but cannot manipulate storage lifecycle.
- Assessment and purge planning are read-only and require an explicit reference time.
- Raw evidence deletion requires recomputing summaries from remaining records; no permanent popularity aggregate is introduced.
- A future audit should retain policy ID, plan ID, execution time, count, deterministic candidate digest, operator/runtime identity, and result—not deleted payload or a durable behavioral-ID list unless separately justified.
- Application-visible D1 deletion may remain recoverable temporarily through provider Time Travel or exported backups. Application retention is distinct from provider recovery retention.
- Retention applies only to Beacon first-party interest evidence, not Mercury, Atlas, observations, ledgers, reviews, publication, or operator audit state.
- This policy grants no cadence, refresh, acquisition, ranking, publication, automatic execution, unattended LIVE, or spend authority.
- Changing the duration or scope requires a new versioned policy and explicit review.

## Alternatives considered

- Indefinite raw retention was rejected as unnecessary behavioral accumulation.
- Browser `occurredAt` was rejected as the retention clock because it is client-controlled.
- Immediate automatic deletion was rejected because eligibility, planning, authorization, execution, and audit remain separate governed states.

## Related architecture documents

- ADR-047 — First-Party Interest Collection Requires a Governed Write Boundary
- ADR-048 — Beacon Production Gateway Uses Cloudflare Workers and D1
- IC-DF005H — Beacon Behavioral Evidence Retention Governance
