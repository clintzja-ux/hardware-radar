# IC-DF005K — Cloudflare-Native Beacon Operational Monitoring Destination

## Destination decision

Destination `beacon_gateway_cloudflare_workers_logs_v1` selects `CLOUDFLARE_WORKERS_LOGS` for future Gateway security and operational-health records. No third-party logging vendor, Logpush destination, account identifier, project identifier, binding, or live configuration is introduced.

The destination accepts only records already validated by DF005-J. `CloudflareWorkersLogsMonitoringAdapter` revalidates the strict record and emits one structured object through an injected Worker-compatible logger. It cannot accept a Request, Beacon event, product or retailer identity, network identity, body, arbitrary object, raw error, or exception text. The provider-neutral sink retains its controlled `MONITORING_DEGRADED` behavior when emission fails.

## Provider behavior and privacy boundary

Cloudflare Workers Logs supports structured custom logs and dashboard querying. Its invocation logs are distinct provider telemetry enriched with request, response, and invocation metadata; fetch invocation messages include method and URL. Newly created Workers have observability enabled by default, and invocation logs can be disabled with `observability.logs.invocation_logs = false`.

Hardware Radar therefore prohibits invocation logs for this destination. A future deployment must enable only the intended custom-log path and explicitly disable invocation logs. Provider processing that occurs outside Hardware Radar's emitted structured record is not Beacon evidence and must never be copied into Beacon or Mercury state.

## Retention and readiness

Hardware Radar's operational policy is a 30-day maximum. Cloudflare currently documents Workers Logs retention of three days on Free and seven days on Paid, with a seven-day native maximum. Shorter retention is compatible with the maximum. `retentionCapabilityVerified` records this documented architectural capability; it does not assert that an account or deployment has been inspected.

`monitoringDestinationSelected` is true, while `monitoringDestinationDeploymentConfigured` and `monitoringDestinationConfigured` remain false. Alert policy remains `NOT_CONFIGURED`. Gateway readiness remains `RUNTIME_SELECTED`, production transport remains `NOT_CONNECTED`, browser instrumentation remains absent, and there is no behavioral, cadence, automatic-execution, unattended-LIVE, acquisition, publication, or spend authority.

## Source verification

Capability conclusions were verified against Cloudflare's current Workers Logs, real-time logs, observability, and API documentation on 2026-08-24. Production configuration must be revalidated at deployment time because provider capabilities and plan limits can change.
