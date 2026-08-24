# IC-DF005W — Cloudflare Alert Sender Domain Approval and Onboarding PREPARE

## Scope

DF005-W adds the Gateway-owned operator approval and local PREPARE boundary for a future Cloudflare Email Sending configuration. It extends DF005-V and reuses the certified recipient-verification evidence, Cloudflare provider configuration, secure operator input, immutable authorization repository, PREPARE/EXECUTE separation, readiness, and `.forge-review` operational-state conventions.

This increment has no EXECUTE path. A `PREPARED` record is review material only: it does not authorize or perform Cloudflare onboarding, DNS mutation, Worker deployment, binding configuration, provider deployment, sending enablement, or email transmission.

## Current Cloudflare requirements

Cloudflare's current Email Sending documentation requires the sending domain to be a domain in the Cloudflare account. Domain onboarding adds or manages a bounce subdomain MX record, SPF, DKIM, and DMARC. Email Sending and Email Routing are separate products and can coexist because their DNS records and configuration are separate. Cloudflare documents a domain-level onboarding flow; its documented sender requirement is that a sender address belong to an onboarded Email Service domain. DF005-W does not infer an additional mailbox-verification requirement that Cloudflare does not document.

A Workers `send_email` binding can constrain one `destination_address`, `allowed_destination_addresses`, and `allowed_sender_addresses`. Hardware Radar preserves both `EXPLICIT_DESTINATION_ONLY` and `EXPLICIT_SENDER_ONLY`; neither sender nor destination can be browser selected. The established binding naming convention uses an uppercase role name (for example `BEACON_DB`), so DF005-W proposes `BEACON_ALERT_EMAIL`. The proposal remains separately operator-approved and undeployed.

Cloudflare exposes zone-scoped Email Sending subdomain operations and an account-scoped send operation. They are distinct external mutations. DF005-W calls neither. Dashboard and API onboarding may differ in interaction surface, but both can change provider/DNS state and therefore remain outside PREPARE.

Official references:

- [Email Sending domain configuration](https://developers.cloudflare.com/email-service/configuration/domains/)
- [Workers send-email bindings](https://developers.cloudflare.com/email-service/configuration/send-bindings/)
- [Workers Email Sending API](https://developers.cloudflare.com/email-service/api/send-emails/workers-api/)
- [Cloudflare Email Sending API resources](https://developers.cloudflare.com/api/resources/email_sending/)

## Approval model

The approval is versioned as `gateway_alert_sender_domain_onboarding_approval_v1` / `1.0.0` and records two independent operator decisions:

- exact sender approval as `OPERATOR_APPROVED`, stored only as a SHA-256 digest and bound to `cheapestram.com`, with alternate sender substitution prohibited;
- domain authority as `OPERATOR_APPROVED_FOR_PROPOSAL`, meaning only that `cheapestram.com` may be proposed for onboarding.

It additionally records the operator identity and timestamp, purpose, DNS-impact categories and review state, proposed binding name and approval state, explicit sender/destination restrictions, and explicit false values for configuration, deployment, mutation, and sending. Domain proposal approval is not DNS approval. DNS review is not DNS mutation authorization. Binding-name approval is not binding configuration.

The anticipated DNS-impact inventory is `BOUNCE_MX`, `SPF`, `DKIM`, `DMARC`, and `PROVIDER_REQUIRED_OTHER`. No record name or value is invented or persisted before Cloudflare supplies it in a later governed operation.

## PREPARE and authorization

Run the local wrapper only when the operator is ready to create review material:

`npm run gateway:alert-sender-domain:onboarding:prepare`

The PowerShell wrapper collects the exact sender using a hidden prompt, receives explicit domain/DNS/binding decisions, passes them ephemerally to the local process, clears those values, and stops. The sender is never accepted as a command-line argument and is never written to the authorization, diagnostics, source, `.env`, logs, chat, or public artifacts.

PREPARE requires existing verified recipient evidence and the certified Cloudflare Email Service provider configuration. It creates an immutable authorization under `.forge-review` with lifecycle `PREPARED` and a maximum 24-hour validity. The material SHA-256 fingerprint binds the sender digest, sending domain and digest, recipient destination digest and evidence reference, provider and configuration ID, verification authority, proposed binding and approval state, both restrictions, complete DNS-impact categories and review/mutation states, and approval policy/version. The opaque authorization ID additionally binds preparation time.

Exact material replay returns `DUPLICATE`. A different authorization for the same sender/domain/destination tuple fails with `SENDER_DOMAIN_ONBOARDING_AUTHORIZATION_CONFLICT`. Malformed repository state, expired authorization, unknown properties, material substitution, missing recipient evidence, unverified recipient evidence, malformed or out-of-domain sender, missing domain proposal approval, relaxed restriction, and unsupported provider/policy identity fail closed.

The diagnostic is read-only:

`npm run gateway:alert-sender-domain:onboarding:status`

It exposes recipient verification, each approval/configuration/deployment gate, authorization availability, `NOT_CONNECTED` transport, and zero-operation declarations without printing sender/recipient values or their digests.

## Certified stopping point

DF005-W leaves sender configuration, provider domain configuration/verification, DNS mutation approval/execution, email-binding configuration, provider deployment, sending enablement, Gateway deployment readiness, production transport, and browser connection false or unavailable. Network request, Cloudflare mutation, DNS mutation, Worker deployment, email transmission, DataForSEO operation, and spend are all zero. A later separately approved increment must define and authorize any EXECUTE behavior.
