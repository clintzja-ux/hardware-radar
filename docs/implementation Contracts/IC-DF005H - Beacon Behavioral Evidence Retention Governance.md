# IC-DF005H — Beacon Behavioral Evidence Retention Governance

## Certified policy

Policy `beacon_first_party_product_interest_retention_90d_v1` governs raw `FIRST_PARTY_PRODUCT_INTEREST` evidence for the currently supported `OUTBOUND_RETAILER_CLICK` signal. It is enabled, retains evidence for `7776000000` milliseconds, uses `recordedAt`, and permanently encodes `automaticDeletion: false` for this version.

The policy is Beacon-owned and does not apply to Mercury evidence, historical or canonical observations, Atlas, acquisition ledgers, identity reviews, publication, or operator audit state. It stores no PII or person identity.

## Deterministic lifecycle

Retention evaluation requires explicit `asOf`; it never reads wall-clock time. Before `recordedAt + retentionMs`, state is `RETAIN`. At or after that instant, state is `DELETE_ELIGIBLE`. Invalid records are `BLOCKED`, and malformed or unsupported policy state fails closed.

`recordedAt` is server-controlled and starts the storage lifecycle. Browser-controlled `occurredAt` remains the chronology of the product-interest action but cannot shorten or extend retention.

`BeaconInterestRetentionAssessment` accepts immutable persisted records, policy, and `asOf`, then reports deterministic counts, valid time range, next eligibility time, blocked records, and sorted eligible event IDs. It performs no write or deletion.

`BeaconInterestRetentionPlan` deterministically binds policy ID, `asOf`, and sorted candidate event IDs into a stable plan ID. It records candidate count and time range, with `automaticExecution: false` and `deletionExecuted: false`. Invalid records block planning. A plan is not execution authority.

## Future purge boundary

A future D1 purge must require an authorized, policy-bound plan and delete only planned event IDs whose `recorded_at` remains at or before the plan cutoff. It must use bounded batches and storage transactions, be idempotent, and refuse newer/substituted records. The audit should retain purge execution ID, policy ID, plan ID, execution time, count, deterministic candidate digest, operator/runtime identity, and result without retaining deleted payload or an indefinite raw behavioral-ID list.

The certified D1 schema already indexes `(recorded_at, event_id)`, so migration 0001 is unchanged. Application-visible deletion is distinct from provider Time Travel/export retention; this policy does not claim immediate erasure of recovery copies.

## Derived summaries and isolation

Product-interest summaries remain derived from currently retained signals. After a future purge they must be recomputed from remaining evidence unless a separately governed aggregate store is approved. DF005-H creates no permanent popularity store and does not copy expired evidence elsewhere.

Retention has `cadenceInfluence: NONE`. It cannot assign cadence, alter the 24-hour Mercury interval, create refresh plans or authorizations, invoke SELLERS/DataForSEO, enable automatic execution or unattended LIVE, publish, or spend.

## Operational state

Production Beacon persistence contains zero governed records. The read-only CLI reports zero records and candidates without creating a state file or deletion. Gateway retention readiness is configured, but production remains `RUNTIME_SELECTED` and transport remains `NOT_CONNECTED`. DF005-I selects the WAF mechanism and DF005-I.1 configures its initial numeric threshold; monitoring, deployment configuration, Worker/D1 creation, runtime verification, recovery procedures, and browser approval also remain incomplete.
