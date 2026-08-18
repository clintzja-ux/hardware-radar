# IC-DATAFORSEO-004E1.1 — Scheduled Run CLI and Operator Audit Export

## Purpose
Operationalize the certified DF004-E1 dry-run boundary with a manual CLI before attaching an external scheduler.

## Command
`npm run acquisition:dry-run`

## Inputs
- Canonical ACTIVE/READY Atlas products.
- Optional `HARDWARE_RADAR_ACCEPTANCE_STATE` for canonical Mercury freshness.
- Optional `HARDWARE_RADAR_DATAFORSEO_EVIDENCE_STATE` for retained DataForSEO freshness.
- `HARDWARE_RADAR_ACQUISITION_TIME_ZONE` (default `America/Jamaica`).
- `HARDWARE_RADAR_ACQUISITION_INTERVAL_MINUTES` (default 360; minimum 60 enforced by E1).

## Outputs
- `.forge-review/acquisition/scheduled-dry-runs.json`
- `.forge-review/acquisition/operator-latest.json`
- concise terminal summary

## Safety invariants
The CLI imports no DataForSEO API client, loads no DataForSEO credentials, accepts no paid transport, performs no paid retry, and reports zero actual spend. Cadence and the DF003-E single-writer lock remain authoritative.

## Candidate rule
Each ACTIVE/READY Atlas product becomes a PRODUCTS acquisition candidate keyed by canonical Atlas product ID and queried by manufacturer part number. `lastObservedAt` is the newest known timestamp across configured canonical observations and retained DataForSEO evidence. Unknown history remains null.

## DF004-E1.1 Operational Gate — PASS
Mode                 DRY_RUN              ✅
Paid transport       UNREACHABLE          ✅
Actual spend         $0.000               ✅


Candidates           1                    ✅
Approved             1                    ✅
Estimated live cost  $0.001               ✅


Run outcome           SKIPPED_NOT_DUE      ✅
Audit persisted       NO                   ✅