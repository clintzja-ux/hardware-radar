# Gateway Architecture

Gateway owns external transport and integration runtime concerns. It does not own Atlas identity, Beacon analytics semantics, Mercury market intelligence, or Forge workflow state.

## Current deployment reality

Hardware Radar deploys the generated `public/` directory as a static site. Project records identify Cloudflare hosting and GitHub continuous deployment, but the repository contains no deployable Worker, Pages Function, server package, serverless configuration, production database binding, or write-route deployment workflow. Static Cloudflare hosting is established; it was not by itself treated as approval for a Cloudflare write product.

DF005-G selects Cloudflare Workers with D1 as the target Beacon write architecture after assessing both against the DF005-F contracts. This is a design selection, not a deployment statement: the repository still contains no live Worker configuration, D1 database identifier, account binding, secret, route, or deployed endpoint.

## Beacon production-write requirements

A future runtime for `/api/beacon/product-interest` must provide HTTPS, POST routing, raw request-size and content-type control, server-only configuration, production-storage access, concurrent safety, privacy-safe operational logging, health diagnostics, and independent deployability. It adapts transport requests to `GovernedProductInterestHttpHandler`; it does not reimplement Beacon validation.

Production storage must provide durable atomic compare-and-insert by event ID, material-conflict comparison, unique event constraints, concurrent multi-process/serverless writers, process-independent restart durability, deterministic listing, constraint/corruption failures, backup/recovery, and retention/deletion capability. The DF005-E file adapter does not satisfy cross-process production requirements.

## Activation gates

Production transport remains `NOT_CONNECTED` until the operator approves retention, configures rate limiting and privacy-safe monitoring, packages Atlas as a read-only runtime dependency, supplies deployment configuration, deploys and validates the backend, and separately approves browser instrumentation. The Workers + D1 selection advances architecture readiness only to `RUNTIME_SELECTED`.

The target D1 adapter must implement atomic `INSERT OR IGNORE` plus same-transaction lookup under database uniqueness constraints so exact replay and material conflict are distinguished without application locks. D1's per-database write execution is serialized and bounded; overload and storage failures must remain fail-closed.

DF005-H configures the first retention gate with policy `beacon_first_party_product_interest_retention_90d_v1`: raw first-party product-interest records become eligible for governed deletion 90 days after server-controlled `recordedAt`. Automatic deletion remains disabled. This does not advance readiness beyond `RUNTIME_SELECTED` because rate limiting, monitoring, Atlas packaging, deployment, recovery verification, and browser authorization remain incomplete.

DF005-I selects Cloudflare WAF rate limiting as the primary `EDGE_TRANSPORT` abuse boundary for `POST /api/beacon/product-interest`. DF005-I.1 configures the initial policy at 20 requests per 60000-millisecond window, action `BLOCK`, with no burst allowance. Readiness stays `RUNTIME_SELECTED` because remaining non-threshold gates are incomplete. Network identity is transient infrastructure input only and cannot enter Beacon persistence or analytics. Worker validation remains mandatory if a request passes or bypasses WAF, and below-threshold traffic remains untrusted behavioral evidence.

DF005-J configures policy `beacon_gateway_operational_monitoring_30d_v1` for product-neutral security, availability, health, and incident-diagnosis categories retained for 30 days from monitoring `recordedAt`. Raw requests, event payloads, product/retailer identity, network/user identity, arbitrary headers, raw errors, and secrets are prohibited. The sink is provider-neutral; destination and alert policy remain unconfigured, so readiness remains `RUNTIME_SELECTED` and no live logging exists.

DF005-K selects `CLOUDFLARE_WORKERS_LOGS` as the future destination for validated structured operational records. Native Workers invocation logs must be disabled because they contain request and response metadata. Cloudflare's documented three-day Free and seven-day Paid retention are below the governed 30-day maximum. Destination deployment and alert policy remain unconfigured, so monitoring is not production-ready and Gateway readiness stays `RUNTIME_SELECTED`.

DF005-L configures five provider-neutral operational alert rules derived from validated monitoring records: endpoint health, storage failures, handler errors, rate-limit activity, and p95 latency. Evaluation is explicit-time, immutable, identity-free, and has no remediation, WAF, behavioral, cadence, or acquisition authority. Notification destination and monitoring deployment remain unconfigured, so readiness stays `RUNTIME_SELECTED`.

DF005-M selects plain-text email as the initial operational-alert notification channel. Only active alert episodes may create deterministic notification intents; clear, blocked, and recovery notifications are excluded. Provider and explicit operator recipient configuration remain unconfigured, delivery failure cannot alter alert truth, and no retry, remediation, behavioral, cadence, or deployment authority is granted.

DF005-N selects Cloudflare Email Service with a Workers `send_email` binding as the future notification provider. The binding must be restricted to one separately governed verified operator destination. No address, binding name, sender domain, account, routing configuration, resource, or deployment is created; provider deployment, recipient configuration, and sending remain false.

DF005-O defines the single verified-operator-recipient boundary. Production contains no address and remains `NOT_CONFIGURED`; Cloudflare destination verification is the future authority, and verified fixtures require explicit evidence. Recipient identity is server-side operational configuration excluded from notification identity, Beacon, monitoring, alerts, Mercury, Atlas, diagnostics, and public assets. Sender/domain and deployment remain unresolved.

DF005-P reserves `BEACON_ALERT_RECIPIENT` as the future Cloudflare Worker server-side secret-compatible configuration key. Source control owns the DF005-O rules but never the address. A strict Gateway runtime adapter accepts only an explicitly extracted single value, keeps it out of serialization and diagnostics, and projects a valid address to `PENDING_VERIFICATION`; it cannot assert verification or enable sending. Production supplies no value and remains `NOT_CONFIGURED`, `RUNTIME_SELECTED`, and `NOT_CONNECTED`.

DF005-Q records that the operator approved one controlled destination without persisting its address. Approval is separate from runtime configuration, Cloudflare verification, sender/domain onboarding, provider deployment, and sending. A narrow provider-evidence model can project a matching server-side runtime destination to `VERIFIED` only when Cloudflare authority, destination binding, opaque reference, and verification time validate; production has no runtime value or evidence and therefore remains `NOT_CONFIGURED`. Recipient readiness exposes only these gate states, never recipient identity.

DF005-R adds zero-network PREPARE and single-use EXECUTE boundaries for creating the account-level Cloudflare Email Routing destination verification request. That operation requires only the approved recipient runtime value, Cloudflare account identifier, and a token with Email Routing Addresses Write permission; it does not require a Worker. A fixture authorization is short-lived, destination-digest bound, explicitly confirmed, and consumption guarded; requesting the provider verification email leaves identity `PENDING_VERIFICATION`. This boundary cannot deploy the provider or enable sender/domain, alerts, transport, or browser behavior.

DF005-S defines one strict, injected Cloudflare runtime-configuration boundary for `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, and `BEACON_ALERT_RECIPIENT`. It exposes only presence/readiness states and releases values solely to the narrow verification execution callback. Verification readiness is separate from deployment readiness: a future Worker target, D1 binding `BEACON_DB`, restricted Workers email binding, and monitoring deployment are additional deployment gates. No Worker name, binding name, provider resource, secret, or deployment is created, and production remains `RUNTIME_SELECTED` and `NOT_CONNECTED`.

DF005-T supplies those three values through a local hidden-prompt wrapper and ephemeral child-process environment, never CLI secret arguments or `.env`. PREPARE binds recipient and account digests but no token representation; EXECUTE remains separately confirmed and single-use. This provisions a safe operator path only—it performs neither PREPARE nor provider execution during certification and grants no sending or deployment authority.

DF005-U adds a GET-only Cloudflare destination observation followed by a separate explicit evidence-admission boundary. Private in-memory matching yields a digest-only candidate; admission revalidates approval and binding before persisting DF005-Q evidence. Governed evidence survives deliberate clearing of ephemeral credentials and may project `VERIFIED`, but it cannot deploy the provider, configure sender/domain or email binding, enable sending, connect transport, or connect browser behavior.

DF005-V models sender identity, Email Sending domain approval/provider verification, and the Workers email binding as independent gates. No sender or binding name is selected. Future binding configuration must retain one explicit verified destination and restrict allowed senders to the separately approved sender. Cloudflare Email Sending domain onboarding is DNS-affecting and requires a later controlled operator decision; recipient verification alone never authorizes it.

Transient network identifiers may be used by infrastructure for rate limiting but must never enter Beacon evidence. Operational metrics are categorical counts and latency/error health; raw bodies, IPs, user agents, and analytics records are not diagnostic output.
