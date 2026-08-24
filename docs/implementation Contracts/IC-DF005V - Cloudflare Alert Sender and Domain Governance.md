# IC-DF005V — Cloudflare Alert Sender and Domain Governance

DF005-V adds the independent Gateway-owned sender identity, Email Sending domain, and Workers `send_email` binding governance gates. Recipient verification remains valid but grants none of these gates.

## Cloudflare requirements

Cloudflare Email Sending requires onboarding a domain already in the Cloudflare account. Onboarding may create managed DNS records for bounce MX, SPF, DKIM, and DMARC; sending and routing use separate DNS records and configuration. A sender address must belong to an onboarded Email Service domain. See Cloudflare's [domain configuration](https://developers.cloudflare.com/email-service/configuration/domains/) and [Workers email API](https://developers.cloudflare.com/email-service/api/send-emails/workers-api/).

Workers declare a `send_email` binding by name. Cloudflare supports one `destination_address`, an `allowed_destination_addresses` list, and an `allowed_sender_addresses` list. Hardware Radar retains `EXPLICIT_DESTINATION_ONLY` and additionally requires `EXPLICIT_SENDER_ONLY`. See [Configure send bindings](https://developers.cloudflare.com/email-service/configuration/send-bindings/).

## Certified state

No canonical sender mailbox, local part, display name, reply-to, binding name, or sender-domain approval exists. DF005-V does not infer the verified recipient as sender. Production therefore remains `senderIdentityState=NOT_CONFIGURED`, `senderDomainState=CONFIGURATION_REQUIRED`, and `emailBindingState=NOT_CONFIGURED`. The expected `cheapestram.com` domain is not promoted into canonical governance until an explicit operator decision establishes authority and approves the DNS-impacting Email Sending onboarding.

The model rejects CC, BCC, reply-to, alternate destination, browser sender/recipient selection, relaxed destination restriction, and relaxed sender restriction. Missing sender/domain returns controlled `SENDER_NOT_CONFIGURED / EMAIL_SENDER_DOMAIN_NOT_CONFIGURED` without invoking a binding or changing alert truth.

This increment performs no DNS or Email Routing mutation, domain onboarding, Worker/D1/WAF/monitoring deployment, binding creation, provider activation, email, browser connection, DataForSEO operation, or spend. Readiness remains `RUNTIME_SELECTED` and `NOT_CONNECTED`.
