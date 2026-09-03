# ADR-032 — Scheduled Dry Run CLI Uses Canonical Operational State

## Status
Accepted — DF004-E1.1

## Decision
The first operational acquisition command is structurally DRY_RUN and has no DataForSEO client, credentials, or paid transport dependency. Candidates are derived from ACTIVE/READY Atlas products. Freshness is derived from canonical Mercury observations and retained DataForSEO market evidence when those durable state paths are configured.

The CLI persists scheduled-run audit state and exports the authoritative DF004 operator model for Forge inspection. Repeated invocation is governed by the certified scheduled-run cadence and the Mercury single-writer lock.

## Consequences
A product is not hard-coded into unattended acquisition. Missing optional historical state means `lastObservedAt = null`; it does not invent freshness. The dry-run planning policy may be enabled so the planner can reveal what a future live run would approve, while the scheduled execution path remains incapable of paid transport.
