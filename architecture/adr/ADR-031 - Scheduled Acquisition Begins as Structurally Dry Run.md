# ADR-031 — Scheduled Acquisition Begins as Structurally Dry Run

## Decision
The first unattended Mercury acquisition runner is DRY_RUN only. Its constructor accepts no paid transport and its configuration declares `paidTransportReachable: false`. Scheduling and authorization to spend are separate decisions.

The runner uses the Mercury single-writer lock, a minimum one-hour configurable cadence, explicit IANA time-zone metadata, and durable audit records. A run that is not due or cannot acquire the lock performs no simulated or paid work.

## Consequences
DF004-E1 can validate unattended cadence, overlap suppression, restart/audit continuity and operator visibility with zero provider spend. LIVE unattended acquisition requires a later, separately approved DF004-E2 boundary.
