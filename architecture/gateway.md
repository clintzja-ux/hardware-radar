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

Transient network identifiers may be used by infrastructure for rate limiting but must never enter Beacon evidence. Operational metrics are categorical counts and latency/error health; raw bodies, IPs, user agents, and analytics records are not diagnostic output.
