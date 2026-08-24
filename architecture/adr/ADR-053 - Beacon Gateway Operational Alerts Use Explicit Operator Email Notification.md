# ADR-053 — Beacon Gateway Operational Alerts Use Explicit Operator Email Notification

**Status:** Accepted  
**Date:** 2026-08-24

## Context

DF005-L derives privacy-safe operational alerts but configures no notification channel, provider, or recipients. Operators need a governed delivery boundary that does not alter alert truth or create a behavioral messaging system.

## Decision

Email is the initial channel for explicit operator-approved recipients. Only `ACTIVE` states from the five approved Gateway alert rules may create an `ACTIVATED` notification intent. `CLEAR` and `BLOCKED` do not create email, and recovery notification is not approved.

Intent identity is derived deterministically from notification policy, alert rule, explicit activation-episode start, and `ACTIVATED` type. A previously delivered identical intent may be suppressed without changing the alert. Notification content is plain-text, categorical, and limited to rule, state, evaluation time, safe observed value/count, threshold, window, and controlled reason.

## Consequences

- Provider and recipient configuration remain unresolved and server-side.
- Delivery failure returns a controlled classification and never changes `ACTIVE` alert truth.
- There is no automatic retry, recovery email, remediation, behavioral authority, cadence authority, WAF authority, acquisition authority, or alert-history store.
- Requests, monitoring records, Beacon events, product/retailer identity, network identity, URLs, raw errors, secrets, and provider identifiers are prohibited notification content.
- No email, provider API, Cloudflare resource, deployment, or browser connection is created.

DF005-N selects Cloudflare Email Service through a Workers `send_email` binding as the future provider transport. The binding must use a single explicitly governed verified destination restriction. Provider deployment, binding name, sender/domain onboarding, and recipient configuration remain separate gates; selection does not enable sending.

DF005-O makes the operator recipient a separate Gateway configuration with Cloudflare destination verification as authority. Production stores no address and remains `NOT_CONFIGURED`; a future verified configuration must contain exactly one syntactically valid operator-supplied address and explicit verification evidence. Recipient identity never enters notification intent identity, behavioral evidence, monitoring, alerts, or public output.

DF005-P establishes `BEACON_ALERT_RECIPIENT` as the future Worker server-side secret-compatible runtime key. Supplying a value projects only `PENDING_VERIFICATION`; it does not create verification evidence, deployment, sender/domain configuration, or sending authority.

DF005-Q records operator approval without storing the address. Approval is not configuration or verification. Only narrow Cloudflare destination evidence bound to the configured runtime value may produce `VERIFIED`; even verified state does not configure the sender/domain, deploy the provider, or enable sending.

## Related documents

- ADR-052 — Beacon Gateway Alerts Are Derived From Privacy-Safe Operational Metrics
- IC-DF005M — Beacon Gateway Alert Notification Governance
