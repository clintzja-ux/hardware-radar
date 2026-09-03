# IC-DF005N — Cloudflare Email Service Provider Boundary

Configuration `beacon_gateway_cloudflare_email_service_v1` selects provider `CLOUDFLARE_EMAIL_SERVICE` and transport `WORKERS_SEND_EMAIL_BINDING` for Gateway security and operational-health email. It selects architecture only: provider deployment, recipient configuration, and email sending are false.

Cloudflare supports destination restrictions on `send_email` bindings. Hardware Radar requires `VERIFIED_OPERATOR_DESTINATION` with `EXPLICIT_DESTINATION_ONLY`, corresponding to a future single governed `destination_address`. DF005-N defines no address, binding name, Worker name, account ID, sending domain, routing rule, credential, token, or live resource. Recipient verification and configuration require a separate operator decision.

`CloudflareEmailServiceNotificationAdapter` accepts only canonical validated DF005-M notification objects. It has no recipient, sender, subject, body, HTML, attachment, request, monitoring event, Beacon event, product/retailer identity, network identity, header, cookie, raw error, or secret override surface. With the certified configuration it never calls an injected binding and returns `PROVIDER_NOT_DEPLOYED / EMAIL_PROVIDER_DEPLOYMENT_NOT_CONFIGURED`.

The Gateway sender propagates that controlled undeployed result without exposing raw errors. Provider delivery remains downstream and cannot mutate alert truth, Beacon evidence, summaries, Atlas, history, ranking, publication, WAF, Mercury cadence, acquisition, automatic execution, or unattended LIVE.

Readiness recognizes provider and transport selection while leaving provider deployment, recipient configuration, email sending, monitoring deployment, production transport, and browser connection false. Future gates are explicit recipient governance, verified-destination setup, sender/domain governance, binding-name approval, deployment review, and controlled delivery verification.

DF005-P reserves `BEACON_ALERT_RECIPIENT` as a server-side secret-compatible runtime key. Runtime presence alone is `PENDING_VERIFICATION` and the adapter returns `RECIPIENT_NOT_VERIFIED` without calling the `send_email` binding. Provider deployment and all delivery gates remain unchanged.

DF005-Q adds no provider resource. Even governed `VERIFIED` fixture state returns `PROVIDER_NOT_DEPLOYED` because provider deployment, sender/domain onboarding, destination-restricted binding configuration, and sending remain false.

DF005-V makes the earlier sender/domain placeholder explicit. A verified recipient with missing sender identity or unverified Email Sending domain now fails closed as `SENDER_NOT_CONFIGURED`. Any future binding must preserve the single destination restriction and add an approved-sender restriction. No binding name has been approved.
