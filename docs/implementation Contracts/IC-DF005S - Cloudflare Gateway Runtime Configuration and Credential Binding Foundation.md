# IC-DF005S — Cloudflare Gateway Runtime Configuration and Credential Binding Foundation

DF005-S defines the server-only Cloudflare runtime configuration model used by Gateway. The only accepted keys are `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, and `BEACON_ALERT_RECIPIENT`. The adapter is dependency-injected, rejects unknown keys and malformed values, never reads process environment or files, keeps values private, and exposes redacted state only. Callback-scoped access is reserved for the controlled DF005-R execution boundary.

Destination-verification readiness requires all three configured values. The Cloudflare Email Routing destination API is account-level and requires the `Email Routing Addresses Write` permission family; a Worker is not a prerequisite. Missing or invalid configuration blocks authorization and provider construction.

Deployment configuration is a separate gate. The selected future topology requires a Cloudflare Worker target, D1 binding `BEACON_DB`, a restricted Workers `send_email` binding whose name remains unapproved, and deployed privacy-safe monitoring. No real Worker name, provider resource identifier, binding, secret, route, D1 database, email configuration, or monitoring resource is created by this increment.

The zero-network status command reports only configured/missing and readiness states plus `Paid task created: NO` and `Actual spend: $0.000`. DF005-S performs no Cloudflare mutation, email, Worker/D1/WAF deployment, DataForSEO acquisition, browser connection, commit, or push. Production remains `RUNTIME_SELECTED` and `NOT_CONNECTED`.
