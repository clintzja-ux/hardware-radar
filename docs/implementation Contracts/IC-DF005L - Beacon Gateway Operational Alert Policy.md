# IC-DF005L — Beacon Gateway Operational Alert Policy

Policy `beacon_gateway_operational_alerts_v1` is enabled, operational-only, and defines exactly five immutable rules. `ENDPOINT_UNHEALTHY` becomes active at three consecutive failed explicit `BEACON_HEALTH` records. `STORAGE_FAILURE_RATE`, `HANDLER_ERROR_RATE`, and `RATE_LIMIT_ACTIVITY` become active at respectively 5, 10, and 50 matching records in `(asOf - 300000ms, asOf]`. `LATENCY_DEGRADATION` becomes active when nearest-rank p95 duration is strictly greater than 1000 milliseconds in that interval.

Every evaluation requires explicit `asOf`; future and exact window-start records do not count. Nearest-rank p95 sorts ascending and selects `ceil(0.95 × sampleCount)`. No minimum sample count is invented. No data is `CLEAR`; invalid monitoring records or missing category-required health/latency values are `BLOCKED`.

Results and summaries are deeply immutable and derived without changing monitoring evidence. The summary exposes policy, evaluation time, active/clear/blocked counts, active IDs, rule results, and false automatic-remediation, behavioral, and cadence authority. No alert history is persisted.

The policy cannot change WAF 20/60000, Beacon or monitoring retention, Mercury cadence, refresh plans, authorization, acquisition, recommendation, or publication. It requires no product, retailer, signal, person, session, or network identity. Alert policy is configured; notification destination and monitoring deployment remain unconfigured. Production transport is `NOT_CONNECTED`, browser instrumentation is absent, and spend is zero.
