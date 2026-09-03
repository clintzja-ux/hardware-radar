# IC-DF005M — Beacon Gateway Alert Notification Governance

Policy `beacon_gateway_alert_email_notification_v1` enables plain-text `EMAIL` notification for the five DF005-L operational rules. It is active-only: `ACTIVE` may create an `ACTIVATED` intent, while `CLEAR` and `BLOCKED` create none. Recovery notifications, automatic retry, and automatic remediation are false.

Recipients must be explicit operator-controlled server configuration. They cannot derive from browser users, Beacon, Atlas, product data, analytics, or Cloudflare request metadata. Recipient configuration and delivery provider are both `NOT_CONFIGURED`; no address or vendor is source-controlled or selected.

An intent contains only its deterministic ID, type, channel, rule ID, active state, explicit episode start, evaluation time, safe observed count/value, threshold, window, controlled reason, and canonical plain-text subject/body. It excludes requests, monitoring events, Beacon payloads, product/retailer/signal IDs, URLs, IPs, user agents, cookies, sessions, raw errors, stack traces, secrets, and provider configuration.

`GatewayAlertNotificationSender` validates the canonical intent before an injected provider may receive it. Results are `DELIVERED`, `DUPLICATE_SUPPRESSED`, `PROVIDER_NOT_CONFIGURED`, or `DELIVERY_FAILED`; failures expose no provider error and never mutate alert truth. Prior intent IDs may be supplied for deterministic suppression, but DF005-M creates no production delivery-history repository or retry cadence.

Alert notification policy and email channel are configured. Provider and recipients remain unconfigured, Gateway readiness remains `RUNTIME_SELECTED`, production transport is `NOT_CONNECTED`, and browser instrumentation remains absent. Notification has no behavioral, cadence, WAF, acquisition, publication, automatic-execution, unattended-LIVE, or spend authority.
