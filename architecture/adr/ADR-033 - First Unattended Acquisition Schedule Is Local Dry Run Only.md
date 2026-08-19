# ADR-033 — First Unattended Acquisition Schedule Is Local Dry Run Only

## Status
Accepted

## Decision
Hardware Radar's first unattended Mercury acquisition schedule runs on the Windows development host and may invoke only `npm run acquisition:dry-run`.

The scheduled task has no DataForSEO credential requirement and no live-acquisition command. Windows Task Scheduler supplies cadence only; Mercury retains cadence enforcement, single-writer locking, planning, and audit semantics.

The initial observation cadence is six hours. Windows Task Scheduler is configured to ignore overlapping instances and start a missed task when the machine becomes available.

## Safety boundary
The scheduled wrapper must not contain DataForSEO credentials, live transport construction, paid retry logic, or a mode switch to LIVE. E1.2 does not authorize unattended spending.

## Exit evidence
Before live scheduling is considered, unattended dry-run operation must demonstrate multiple clean cycles with zero paid calls, zero actual spend, consistent audit output, and no overlap violations.
