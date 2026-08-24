# IC-DF005I1 — Initial Beacon Gateway Rate-Limit Threshold

## Certified decision

The existing production policy `beacon_gateway_product_interest_cloudflare_waf_v1` is completed with the operator-approved initial launch threshold: 20 requests per 60000-millisecond window, `BLOCK`, and burst semantics `NONE`, scoped only to `POST /api/beacon/product-interest` at the Cloudflare edge.

The policy ID is preserved because DF005-I intentionally created this same production policy with explicit unresolved threshold fields. DF005-I.1 completes those fields under operator approval rather than creating a second overlapping policy. Any later change to the configured threshold requires explicit policy review and an appropriate versioning decision.

## Enforcement semantics

Cloudflare WAF groups requests by transient network request identity and blocks the request that exceeds 20 within the modeled 60-second window. A new window permits evaluation again. This is the target configuration model only; DF005-I.1 creates no live WAF rule and makes no Cloudflare call.

The application-facing denial remains HTTP 429 with `{ "error": "RATE_LIMITED" }`. The response exposes no limit, window, counter, identity, policy, or Cloudflare details. A denied request cannot invoke Beacon persistence.

Requests below the threshold remain untrusted behavioral evidence. They are not unique users, purchase intent, conversion, trusted demand, popularity, ranking, or cadence input.

## Privacy, monitoring, and readiness

Network identity remains transient edge-security input. It cannot enter event IDs, replay fingerprints, ProductInterestSignal, raw evidence, D1, summaries, or analytics. Operational monitoring remains restricted to evaluated, allowed, rate-limited, configuration-present/missing, and endpoint-health categories.

Runtime, storage, retention, mechanism, and threshold are now configured. Readiness remains `RUNTIME_SELECTED` because monitoring, Atlas packaging, Worker implementation/testing, D1 creation/migration, backup/export verification, deployment configuration, deployment, and browser approval remain incomplete. Production transport remains `NOT_CONNECTED` and browser instrumentation remains disabled.

This increment grants no Mercury cadence, acquisition, automatic execution, unattended LIVE, popularity, ranking, publication, or spend authority.
