# IC-DF005J — Beacon Privacy-Safe Operational Monitoring Governance

## Certified policy

Policy `beacon_gateway_operational_monitoring_30d_v1` enables product-neutral operational monitoring for security, availability, health, and incident diagnosis. It retains validated monitoring records for 30 days (`2592000000` milliseconds) from server-controlled `recordedAt` and encodes automatic deletion and automatic remediation as false.

Approved categories are `REQUESTS_EVALUATED`, `REQUESTS_ACCEPTED`, `DUPLICATES`, `MATERIAL_CONFLICTS`, `VALIDATION_REJECTIONS`, `RATE_LIMITED`, `STORAGE_FAILURES`, `HANDLER_ERRORS`, `ENDPOINT_HEALTH`, and `HANDLER_LATENCY`.

## Record boundary

An operational record contains an operational ID, controlled category, monitoring timestamp, route classification, and only applicable safe HTTP status, bounded duration, controlled error classification, non-identifying runtime classification, or storage-outcome classification.

Strict field omission rejects request bodies, event payloads, event/signal/product/retailer IDs, source URLs, IP and CF connecting IP, user agent, session/visitor/cookie/advertising/device identifiers, fingerprint, geolocation, arbitrary headers, raw stack/exception text, credentials, and secrets. Operational rate-limit records never copy the WAF network identity.

Safe error classifications are validation rejected, rate limited, storage unavailable, storage conflict, handler failure, and Atlas resolution failure. Arbitrary exception text is not monitoring data.

## Retention and sink semantics

Before `recordedAt + 2592000000`, a monitoring record is retained. At or after the boundary it is deletion-eligible. Evaluation requires explicit `asOf`; there is no implicit wall clock or deletion execution.

`GatewayOperationalMonitoringSink` accepts only validated immutable records. It clones the record before forwarding to a provider-neutral writer. A writer failure produces `MONITORING_DEGRADED` with a controlled code and never echoes raw errors. Monitoring is secondary: failure after durable Beacon acceptance does not retroactively reject or corrupt the behavioral record. Handler and storage failures remain visible in their primary response paths even if their monitoring attempt degrades.

## Isolation and readiness

Monitoring has no behavioral analytics, product-interest, cadence, popularity, ranking, recommendation, acquisition, publication, automatic execution, unattended LIVE, or spend authority. Beacon summaries continue to derive only from Beacon evidence. The 90-day Beacon policy, 20/60000 WAF policy, and 24-hour Mercury cadence remain unchanged.

The monitoring policy is configured, but the production destination is `NOT_CONFIGURED`. Initial alert categories may later cover endpoint unhealthy, storage failure rate, handler error rate, rate-limit activity, and deployment health; numeric alert thresholds remain unapproved. Both destination and alert configuration remain readiness gates. No Cloudflare monitoring product, external vendor, binding, record, or live logging configuration is created.

Gateway readiness remains `RUNTIME_SELECTED`; production transport is `NOT_CONNECTED`, and browser instrumentation remains disabled.
