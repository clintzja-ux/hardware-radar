# ADR-055 — Cloudflare Gateway Secrets Are Supplied Only Through Server-Side Runtime Configuration

## Decision

Gateway owns a strict injected runtime adapter for `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, and `BEACON_ALERT_RECIPIENT`. It rejects unknown or malformed input, retains values privately, exposes only redacted presence/readiness state, and releases credentials only to the narrow controlled provider-operation callback. Source files, public assets, browser configuration, diagnostics, serialized state, and logs must never contain these values.

The minimum token permission family for the DF005-R account-level destination operation is `Email Routing Addresses Write`. Verification readiness requires the three runtime values and no Worker. Deployment readiness is independent and additionally requires an approved Worker target, D1 binding `BEACON_DB`, a restricted Workers email binding, and privacy-safe monitoring deployment.

## Consequences

Missing, malformed, or unsupported configuration fails closed. DF005-S does not choose a Worker name or email-binding name, create resources, deploy code, store secrets, send email, enable browser transport, or authorize production behavior. Production therefore remains `RUNTIME_SELECTED` and `NOT_CONNECTED`.
