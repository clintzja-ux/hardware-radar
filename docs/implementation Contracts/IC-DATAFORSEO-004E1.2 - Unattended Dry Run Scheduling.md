# IC-DATAFORSEO-004E1.2 — Unattended Dry Run Scheduling

## Purpose
Attach Windows Task Scheduler to the already-certified DF004-E1.1 dry-run CLI without expanding its authority.

## Contract
- Scheduled authority is limited to `npm run acquisition:dry-run`.
- Cadence is every six hours during the initial observation period.
- The Windows wrapper runs from the repository root and persists invocation logs under `.forge-review/acquisition/scheduler-logs/`.
- Task Scheduler uses `IgnoreNew` for overlapping instances and `StartWhenAvailable` for missed starts.
- Mercury's own persisted cadence and DF003-E single-writer lock remain authoritative safeguards.
- No paid transport, credentials, live mode, or automatic paid retry is introduced.

## Operator commands
Install: `powershell -ExecutionPolicy Bypass -File scripts/windows/install-mercury-dry-run-task.ps1`

Status: `powershell -ExecutionPolicy Bypass -File scripts/windows/status-mercury-dry-run-task.ps1`

Remove: `powershell -ExecutionPolicy Bypass -File scripts/windows/remove-mercury-dry-run-task.ps1`

## Observation gate
Collect approximately 24 hours of unattended evidence. Target four scheduled opportunities. A recovered missed start is acceptable if clearly represented by Windows/task logs and Mercury audit state. Certification requires zero paid calls and zero actual spend.

## DF004-E1.2 code passes certification.

Mercury    113/113 PASS
Atlas       15/15 PASS
Sentinel     7/7 PASS


Forge       PASS
Site        PASS
Console     CLEAN


DF004-E1.2 code boundary   CERTIFIED