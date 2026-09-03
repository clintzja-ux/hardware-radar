# IC-DF005I — Beacon Gateway Abuse Boundary and Rate-Limit Governance

## Certified policy

Policy `beacon_gateway_product_interest_cloudflare_waf_v1` selects `CLOUDFLARE_WAF_RATE_LIMIT` at `EDGE_TRANSPORT` for `POST /api/beacon/product-interest`. It is enabled, uses `NETWORK_REQUEST_IDENTITY` only transiently, encodes `persistIdentifier: false`, and has `automaticExecution: false`.

DF005-I.1 subsequently completes the numeric production threshold: `thresholdConfigured: true`, request limit 20, window 60000 milliseconds, action `BLOCK`, and burst semantics `NONE`. Future changes require explicit policy review.

## Enforcement and response

WAF is primary because it can reject abusive traffic before Worker execution and D1 access. Worker-local memory, D1, and Beacon evidence cannot serve as authoritative rate-limit counters. If traffic reaches the Worker, every existing method, content-type, body-size, schema, privacy, Atlas, replay, and conflict invariant still applies.

A Gateway-denied request returns HTTP 429 with only `{ "error": "RATE_LIMITED" }`. It does not invoke the governed handler, create a signal, or write a transactional record. Thresholds, counters, policy internals, network identity, and repository information are not exposed.

## Privacy and monitoring

Cloudflare infrastructure may transiently use network identity to enforce abuse policy. IP, CF connecting IP, user agent, device, cookie, visitor, session, fingerprint, and geolocation are prohibited from Beacon event identity, signals, D1 persistence, and product-interest analytics. Transport abuse logs remain operational security data, not behavioral evidence.

Privacy-safe operational categories are requests evaluated, requests allowed, requests rate limited, configuration present, configuration missing, and endpoint health. They cannot be interpreted as popularity, unique users, demand, conversion, or cadence evidence.

## Readiness and isolation

Runtime, storage, retention, the rate-limit mechanism, and the threshold are configured. Readiness remains `RUNTIME_SELECTED`, production transport remains `NOT_CONNECTED`, and browser instrumentation remains disabled because monitoring, Atlas packaging, Worker/D1 implementation and verification, recovery procedures, deployment, and browser approval remain incomplete.

DF005-I deploys no WAF rule, Worker, route, D1 database, identifier, token, or secret. It makes no network/provider call and grants no Mercury cadence, refresh, acquisition, automatic execution, unattended LIVE, publication, ranking, or spend authority.
