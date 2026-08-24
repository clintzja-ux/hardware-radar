# ADR-055 — Cloudflare Gateway Secrets Are Supplied Only Through Server-Side Runtime Configuration

## Decision

Gateway owns a strict injected runtime adapter for `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, and `BEACON_ALERT_RECIPIENT`. It rejects unknown or malformed input, retains values privately, exposes only redacted presence/readiness state, and releases credentials only to the narrow controlled provider-operation callback. Source files, public assets, browser configuration, diagnostics, serialized state, and logs must never contain these values.

The minimum token permission family for the DF005-R account-level destination operation is `Email Routing Addresses Write`. Verification readiness requires the three runtime values and no Worker. Deployment readiness is independent and additionally requires an approved Worker target, D1 binding `BEACON_DB`, a restricted Workers email binding, and privacy-safe monitoring deployment.

## Consequences

Missing, malformed, or unsupported configuration fails closed. DF005-S does not choose a Worker name or email-binding name, create resources, deploy code, store secrets, send email, enable browser transport, or authorize production behavior. Production therefore remains `RUNTIME_SELECTED` and `NOT_CONNECTED`.

DF005-T implements this decision through a local PowerShell secure-prompt wrapper. Account ID, API token, and recipient are entered without echo, inherited only by the PREPARE child process, and removed from the wrapper environment in `finally`. Secret-bearing command-line arguments and `.env` files are prohibited. The API token must never be shared in chat.

PREPARE persists only SHA-256 digests of the recipient and account identifier alongside existing governance bindings. The API token is never persisted or hashed into authorization. EXECUTE independently requires the short-lived authorization and exact confirmation before reading ephemeral environment input or constructing a provider client. PREPARE and EXECUTE remain distinct operator actions.
