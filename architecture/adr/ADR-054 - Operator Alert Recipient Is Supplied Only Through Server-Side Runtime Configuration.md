# ADR-054 — Operator Alert Recipient Is Supplied Only Through Server-Side Runtime Configuration

**Status:** Accepted  
**Date:** 2026-08-24

## Context

DF005-O governs one verified operator alert destination but deliberately stores no production address. The address is operational configuration: committing it, deriving it from Git or browser input, or placing it in a public build would violate the Gateway privacy boundary.

## Decision

Source control defines recipient governance; a future Cloudflare Worker server-side secret-compatible binding named `BEACON_ALERT_RECIPIENT` supplies the address. Runtime composition must explicitly extract that one binding into `GatewayOperatorRecipientRuntimeConfiguration`; the adapter rejects unknown keys, empty or malformed values, lists, display names, and multiple-address syntax.

The adapter keeps the value private and projects it through the existing DF005-O model. Absence remains `NOT_CONFIGURED`. Presence produces `PENDING_VERIFICATION`, never `VERIFIED`; Cloudflare email-destination verification remains the authority. The source-controlled recipient policy remains authoritative for provider, channel, destination restriction, verification, and sending semantics.

## Consequences

- The configuration key may be documented and committed; its value may not.
- `.env`, Git identity, browser/request data, Beacon, monitoring, alerts, Atlas, and Mercury are not production recipient sources.
- Diagnostics expose only key, source, presence, and governed state, never the address or a derived identifier.
- Supplying an address does not configure provider deployment, sender/domain, verification evidence, sending, retry, remediation, or browser transport.
- DF005-P creates no Worker binding, secret, verification request, email, deployment, Cloudflare resource, or spend.

DF005-Q records approval separately without committing the approved address. It defines private runtime matching against narrow Cloudflare destination evidence; production still supplies neither runtime value nor evidence. A verified fixture remains unable to send until all provider, sender/domain, deployment, and explicit sending gates are independently satisfied.

## Related documents

- ADR-053 — Beacon Gateway Operational Alerts Use Explicit Operator Email Notification
- IC-DF005O — Explicit Operator Alert Recipient Governance
- IC-DF005P — Secure Server-Side Alert Recipient Configuration Boundary
