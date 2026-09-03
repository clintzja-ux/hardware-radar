# IC-DF005X — Controlled Cloudflare Email Sending Domain Onboarding Boundary

## Scope

DF005-X defines the smallest Gateway-owned authorization and execution boundary for the single Cloudflare Email Sending domain-onboarding mutation for `cheapestram.com`. It consumes, but does not broaden, one valid DF005-W sender/domain authorization. Provider onboarding, Cloudflare-managed sending DNS changes, later provider observation, Worker binding configuration, deployment, sending activation, and email transmission remain independent states.

This increment implements the boundary and fixture-verifies it. It does not expose production PREPARE or EXECUTE commands because Cloudflare's official API documentation does not identify an exact least-privilege API-token permission accepted by the create-sending-subdomain endpoint. Missing permission policy fails closed.

## Official provider behavior and unresolved permission policy

Cloudflare documents `POST /zones/{zone_id}/email/sending/subdomains` with body `{ "name": "cheapestram.com" }` as the operation that creates or reenables an Email Sending subdomain. The response identifies the domain and its enabled state. Cloudflare also documents that onboarding automatically creates or manages sending DNS, including bounce MX, SPF, DKIM, and DMARC records, and that propagation can take time. Mutation acceptance therefore is not provider verification.

The generated endpoint page documents legacy API Email plus Global API Key authentication. Cloudflare generally supports scoped API tokens, but its official permission reference does not currently name the exact least-privilege permission for this endpoint. Hardware Radar does not infer that permission from adjacent Email Routing or send-email permissions and does not authorize a Global API Key. Production permission evidence is therefore `NOT_DOCUMENTED`, with `productionExecutionAllowed=false`.

Official references:

- [Email Sending domain configuration](https://developers.cloudflare.com/email-service/configuration/domains/)
- [Create Email Sending subdomain](https://developers.cloudflare.com/api/typescript/resources/email_sending/subresources/subdomains/methods/create/)
- [Email Sending subdomain API collection](https://developers.cloudflare.com/api/resources/email_sending/subresources/subdomains/)
- [API token permissions](https://developers.cloudflare.com/fundamentals/api/reference/permissions/)

## Permission-evidence investigation

The 2026-08-24 follow-up investigation inspected the rendered endpoint security metadata, Cloudflare's public permission reference, the permission-group listing API, and Cloudflare-maintained generated SDK/API artifacts. It found no authoritative endpoint-to-permission mapping:

- endpoint/OpenAPI-derived security metadata identifies only legacy API Email plus Global API Key authentication and publishes no accepted API-token permission group;
- the public permission table contains no Email Sending permission entry;
- `GET /user/tokens/permission_groups` is a read-only listing operation requiring `API Tokens Read` or `API Tokens Write` and can return permission names, public IDs, categories, and scopes, but does not map a permission to an API endpoint;
- generated SDK material confirms the resource, route, parameters, and legacy authentication metadata but adds no permission mapping.

The evidence classification remains `UNKNOWN` for the required endpoint-to-permission mapping. An observed permission-group name alone would be `PROVIDER_OBSERVED`, and similarly named third-party guidance is `INFERRED`; neither is sufficient to set `DOCUMENTED` or permit production execution. Hardware Radar did not call the permission-group API because the existing Cloudflare runtime credential is governed for recipient verification, does not grant `API Tokens Read`, and a listing response could not resolve the mapping in any event.

Authoritative written Cloudflare confirmation is required. The exact support question is:

> Which API-token permission group name and public permission-group ID authorizes `POST /zones/{zone_id}/email/sending/subdomains`, and can that permission be restricted to one specific zone? Please confirm whether any separate DNS permission is required when onboarding automatically creates or manages the Email Sending DNS records.

Until Cloudflare answers this explicitly, permission state remains `NOT_DOCUMENTED`; production PREPARE and EXECUTE remain unavailable.

## Authorization model

The immutable `gateway_email_sending_domain_onboarding_authorization_v1` record binds:

- the exact DF005-W authorization ID and material fingerprint;
- sender, sending-domain, and verified-recipient digests;
- Cloudflare provider/configuration identity and a zone-identifier digest;
- the single operation `CREATE_CLOUDFLARE_EMAIL_SENDING_DOMAIN`;
- separate affirmative provider-mutation and DNS-mutation approvals;
- DNS scope `CLOUDFLARE_EMAIL_SENDING_MANAGED_RECORDS_ONLY`;
- documented permission name and official evidence source;
- creation/expiry timestamps, a maximum 30-minute lifetime, and single-use state.

Provider verification, Worker binding, Worker deployment, sending, email transmission, browser connection, and DataForSEO authority are explicitly false. Exact replay is `DUPLICATE`; conflicting material for the same parent/domain/zone fails closed. Repository records are append-only, strictly validated, and store no zone ID, token, sender, or recipient.

## PREPARE and EXECUTE separation

`GatewayEmailSendingDomainOnboardingPrepareService` is zero-network. It requires an existing, unexpired, structurally valid DF005-W authorization; the certified provider configuration; both mutation approvals; a private runtime zone/token configuration; and documented permission evidence. It writes only the digest-bound child authorization.

`GatewayEmailSendingDomainOnboardingExecutor` requires the exact confirmation `ONBOARD-CLOUDFLARE-EMAIL-SENDING-DOMAIN`, revalidates child and parent bindings and expiry before loading credentials, and reserves the authorization before the provider call. The narrow client can call only the documented zone endpoint for `cheapestram.com`. Repeated execution is `ALREADY_CONSUMED`; failure after reservation is not automatically retried.

An accepted provider response reports mutation acceptance only. DNS mutation execution is `NOT_VERIFIED`, provider verification remains false, and every binding/deployment/sending state remains false. A later read-only observation boundary must verify provider/DNS state separately.

No production PREPARE or EXECUTE command is registered while permission evidence remains `NOT_DOCUMENTED`. The read-only diagnostic is:

`npm run gateway:email-sending-domain:onboarding:status`

It performs no provider call and reports the permission-policy blocker and unchanged external state.

## Failure and secret handling

Missing, expired, malformed, substituted, or conflicting DF005-W/DF005-X authorization state; missing approval; alternate domain; provider/configuration mismatch; zone mismatch; undocumented permission; malformed credentials; unexpected provider response; and replay all fail closed. Authorization validation and explicit confirmation happen before credential loading.

The zone identifier and API token are execution-time server values only. They are not read from `.env` by this increment, accepted as ordinary source configuration, serialized, logged, placed in command arguments, or exposed to public/browser artifacts.

## Certified stopping point

DF005-X performs no Cloudflare request, DNS mutation, provider verification, Worker binding change, deployment, sending enablement, email transmission, browser connection, DataForSEO operation, or spend. Production PREPARE and EXECUTE remain blocked until an official, exact, least-privilege token permission is documented and adopted through a separately reviewed policy update.
