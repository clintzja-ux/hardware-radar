# IC-DF005G — Beacon Production Runtime Selection and Deployment Plan

## Certified outcome

Cloudflare Workers and D1 are selected as the target production Gateway runtime and Beacon persistence architecture. The selection is architectural only: no Cloudflare resource, database, route, secret, workflow, browser listener, or production event is created. Production transport remains `NOT_CONNECTED`; readiness is `RUNTIME_SELECTED`.

## Discovered topology

The only deployable artifact currently proven by the repository is generated static content under `public/`. Project records identify Cloudflare hosting, GitHub continuous deployment, `cheapestram.com`, and GoDaddy registration, but there is no Wrangler configuration, Pages configuration, `.github` workflow, Worker, Pages Function, server package, D1/KV/Durable Object binding, account ID, project name, database ID, or write-route configuration. The exact Cloudflare static product and integration mechanism are not recoverable from repository state and must be confirmed by the operator.

## Selection analysis

Workers satisfies the DF005-F runtime contract through HTTPS request handling, explicit routing and response control, bounded body inspection before parsing, content-type validation, environment/resource bindings, concurrent isolates, server-side Atlas packaging, Cloudflare security integration, and independent deployment. Application code must keep the certified 2 KiB request limit even though platform plan limits are much larger. Worker CPU, bundle, logging, and account-plan limits remain operational constraints.

D1 satisfies the storage contract for the expected low-volume append-only workload through durable SQLite-compatible storage, primary/unique constraints, sequential transactional batches, concurrent request queuing, process independence, deterministic indexed queries, migrations, deletion, SQL export, and Time Travel recovery. D1 is not unlimited: a database has a serialized execution path, finite query/runtime limits, a 10 GB paid-plan maximum, and can return overload errors. Those errors fail closed. Recovery beyond the platform Time Travel window requires an approved export procedure.

Workers + Durable Objects + D1 adds explicit coordination but is unnecessary until measured contention requires partitioned coordinators. Supabase/Postgres plus a serverless API offers mature relational portability but adds a control plane, network hop, connection/security management, and credentials. Traditional Node/Postgres offers maximum control but the greatest patching, availability, deployment, and cost burden. Workers + D1 has the smallest justified footprint for present traffic while retaining SQL export and a future Postgres migration path.

## Storage and replay contract

The draft migration creates `beacon_product_interest_events` with non-null product, retailer, event, signal, time, count, source, and fingerprint fields. `event_id` is the primary key; `signal_id` is independently unique. No PII columns exist.

The future D1 adapter must execute an `INSERT OR IGNORE` and event-ID lookup within one `D1Database.batch()` transaction:

1. Insert changed one row: `ACCEPTED`.
2. Insert changed zero rows and the selected event has the same material fingerprint: `DUPLICATE`.
3. Insert changed zero rows and the event fingerprint differs: `CONFLICT`.
4. Insert changed zero rows but no row exists for that event ID, including a conflicting signal-ID constraint: fail closed as `CONFLICT`.
5. Query, constraint, overload, or ambiguous result: storage failure; no acceptance.

Storage constraints, not an application mutex, are authoritative. Material fingerprint semantics remain owned by the existing Beacon collection boundary.

## Atlas, privacy, and operations

Canonical Atlas products and retailers will be emitted as a deterministic read-only build snapshot packaged with the Worker. Request handling performs no Atlas network lookup and has no Atlas mutation authority.

Cloudflare WAF/rate-limiting rules or a Worker rate-limit binding should protect only the POST route. Transient IP may be a transport-level counter key but cannot be stored, logged by application code, or used as event identity. Exact thresholds remain unapproved.

Operational signals are accepted, duplicate, conflict, validation rejection, storage error, rate limited, handler latency, and record-free endpoint health. Raw bodies, event records, IPs, user agents, and visitor/session identities are excluded.

DF005-H subsequently approves policy `beacon_first_party_product_interest_retention_90d_v1`: raw first-party product-interest evidence is retained for 90 days from server-controlled `recordedAt`, with automatic deletion disabled. The indexed `recorded_at` column supports later deterministic, bounded, policy-governed deletion. No deletion job currently exists.

## Planned deployment artifacts and gates

Future implementation requires a Worker entrypoint, reviewed Wrangler configuration, non-secret `BEACON_DB` binding name with operator-created resource identifiers, D1 adapter, migrations, generated Atlas snapshot, record-free health route, local Worker fixtures, endpoint security tests, privacy-safe monitoring, rate-limiting configuration, recovery/export runbook, and an approved deployment workflow.

Before browser connection: review the migration; verify the certified retention-policy and numeric WAF-threshold projections; configure monitoring; verify Atlas packaging; test handler and endpoint security locally; create and migrate D1; deploy the Worker; verify storage, health, overload, replay, conflict, export, and recovery behavior; then separately approve browser wiring. No step grants Mercury cadence, acquisition, automatic execution, unattended LIVE, publication, or spend authority.
