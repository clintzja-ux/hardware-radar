# ADR-034 — Unattended LIVE Requires Explicit Plan-Bound Authorization

## Decision
A scheduler, credentials, enabled acquisition policy, and reachable paid transport do not together authorize spend. LIVE execution requires a separate explicit, expiring authorization bound to one acquisition plan and capped by task count and spend.

## Safety properties
- Authorization is explicit (`authorized: true`), plan-bound, expiring, and budget-capped.
- Disabled acquisition policy is the kill switch and fails closed.
- Automatic paid retries remain zero.
- `AuthorizedLiveAcquisitionExecutor` does not call the controlled paid executor unless the authorization gate returns `LIVE_AUTHORIZED`.
- DF004-E2A tests use fake transports only and authorize no unattended real spending.
