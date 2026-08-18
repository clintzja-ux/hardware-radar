# IC-DATAFORSEO-004E1 — Scheduled Dry-Run Operation

## Purpose
Prove unattended Mercury acquisition operation without granting any path to paid DataForSEO transport.

## Contract
- Mode is always `DRY_RUN`.
- Paid transport is not a dependency of `ScheduledDryRunRunner`.
- `attemptedPaidTasks` and `actualSpendUsd` are always zero.
- Cadence is configurable but cannot be more frequent than hourly.
- Configuration records an explicit valid IANA time zone.
- The DF003-E single-writer lock suppresses overlapping runs.
- Durable audit state records completed scheduled dry runs and survives process restart.
- A run inside the cadence window returns `SKIPPED_NOT_DUE`.
- DF004-A remains the planning authority; DF004-D remains the simulation authority.

## Exclusions
No live DataForSEO transport, paid execution, automatic paid retry, historical promotion, publication, or scheduler-service installation is authorized by E1.

DF004-E1 passes certification.

Mercury    110/110 PASS
Atlas       15/15 PASS
Sentinel     7/7 PASS


Forge       PASS
Site        PASS
Console     CLEAN


## DF004-E1 code boundary    CERTIFIED

At this point the DF004 progression is:

DF004-A  Acquisition planning + budget governance       ✅
DF004-B  Controlled single-run executor                 ✅
DF004-C  Governed execution → DF003                     ✅
DF004-D  Dry-run, audit + operator visibility           ✅
DF004-E1 Scheduled dry-run execution boundary           ✅