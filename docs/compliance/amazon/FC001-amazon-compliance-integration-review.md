# FC001 — Amazon Compliance Integration Review

**Status:** APPROVED BASELINE — IMPLEMENTATION BLOCKED UNTIL GAPS BELOW ARE CLOSED
**Date:** 2026-08-09
**Scope:** Forge–Mercury canonical ingestion of Amazon.com Product Advertising Content

## 1. Decision

Amazon compliance is a precondition of FM001, not a post-implementation check.

The certified Mercury v1.0 architecture remains valid as a retailer-neutral platform. However, current Amazon Program Content must be subject to source-specific acquisition, retention, analytics, and publication policy before it enters a production ingestion path.

**Platform principle:** Capability does not imply source permission.

## 2. Current official Creators API baseline verified

Current Amazon documentation establishes the following technical baseline:

- Creators API is the supported successor to PA-API 5.0; PA-API 5.0 is deprecated.
- Creators API uses bearer access tokens obtained through Login with Amazon / OAuth client credentials; access tokens are documented with a one-hour lifetime and should be cached until near expiry.
- The catalog API endpoint is `https://creatorsapi.amazon`.
- Current operations include `GetItems`, `SearchItems`, `GetVariations`, and `GetBrowseNodes`.
- `OffersV2` is the current offer resource for offer listings, price, availability, condition, merchant information, and related offer fields.
- Creators API enrollment requires an accepted Associate with qualifying referred sales; only the primary account owner can register an application.
- Amazon documents an initial allocation up to 1 TPS and 8,640 TPD for the first 30-day period; later allocation is performance-dependent and can change.
- Current Creators API caching guidance is resource-specific: `Offers` = 1 hour; listed other resources = 1 day. Customer information derived from Amazon must not be cached.
- Partner tags must be used correctly and Amazon-vended links must not be altered in ways that break attribution.

## 3. Architecture audit

### 3.1 Amazon adapter — BLOCKED FOR PRODUCTION

The current adapter manifest permits `MANUAL` and `IMPORT` source methods. That was acceptable as a normalization test harness but is not an approved production Amazon acquisition contract.

FM001 must not expose those source methods as publishable Amazon Program Content.

Required change for FM001:

- introduce an approved Creators API source method;
- distinguish test/fixture normalization from production acquisition;
- make manual Amazon page copying publication-ineligible by construction.

### 3.2 Amazon normalizer — REQUIRES EVOLUTION

The current normalizer defaults `licenseContext` to `MANUAL_PUBLIC_PAGE_OBSERVATION` and does not carry the resource-specific retention metadata required for Creators API content.

FM001 must add source-aware compliance metadata rather than treating the current v1.0 normalizer output as production-ready Amazon ingestion.

### 3.3 Mercury immutable observations — CONDITIONALLY COMPATIBLE

Mercury's immutable observation identity and audit model remains valid.

The current observation schema must not be interpreted to authorize indefinite retention of licensed Amazon payload fields. Durable observation/audit metadata and ephemeral licensed payload require explicit separation or redaction/expiry semantics before production Amazon ingestion.

### 3.4 Freshness — NOT A RETENTION POLICY

M004 freshness answers whether an observation is current for market reasoning. Amazon resource TTL answers whether licensed content may remain cached/used.

These are separate policies.

FM001 must not reuse generic Mercury freshness as the Amazon license-retention mechanism.

### 3.5 Historical Intelligence — AMAZON BLOCK REQUIRED

M006 remains valid for sources that permit historical analysis. Current Amazon compliance policy does not authorize Hardware Radar to assume that Amazon Program Content can feed retained historical price analytics.

Until explicit license analysis or written approval establishes otherwise:

`AMAZON_PROGRAM_CONTENT -> HISTORICAL_INTELLIGENCE = BLOCKED`

Historical eligibility therefore requires a source/license gate before Amazon production data is admitted.

### 3.6 Publication Eligibility — REQUIRES AMAZON POLICY GATE

M007's generic publication policy validates observation integrity, Atlas identity, provenance, freshness, confidence, price, availability, condition, and URL presence. It does not yet prove Amazon-specific compliance.

FM001/FM002 must ensure publication cannot reach `AVAILABLE` without the applicable Amazon compliance gates.

### 3.7 Forge — ORCHESTRATOR ONLY

Forge may initiate and review ingestion but must not manufacture canonical Mercury observations or bypass the Amazon adapter/compliance policy.

The quarantined legacy Forge preview remains non-canonical.

## 4. Required source-aware storage classes

Before production Amazon ingestion, the platform must distinguish at least:

| Storage class | Examples | Required behavior |
|---|---|---|
| Durable canonical mapping | Atlas ID, retailer ID, ASIN mapping | Durable subject to controlling agreement/termination rules |
| Durable audit envelope | observation ID, retrieval time, source method, adapter/API version, rule outcomes | Retain only to extent lawful and necessary for audit |
| Ephemeral offer content | price, availability, condition/merchant offer fields | Resource-specific TTL; current Creators guidance: Offers 1 hour |
| Ephemeral other Program Content | title, item info, detail URL, image URL where returned | Applicable current resource TTL; generally 1 day in current Creators guidance |
| Amazon image binary | downloaded image | Do not store/cache under current Compliance Bible rule |
| Independent product truth | manufacturer-derived specifications | Atlas policy, not Amazon Program Content retention policy |

## 5. FM001 mandatory gates

FM001 may begin only with the following constraints locked:

1. No production manual-copy Amazon source.
2. Creators API is the production Amazon acquisition mechanism unless Amazon expressly approves another mechanism.
3. Credentials and token handling remain server-side.
4. Amazon offer content receives a one-hour maximum TTL under current Creators API guidance.
5. Other API resource TTLs are represented independently rather than inheriting the offer TTL blindly.
6. ASIN and Atlas mapping are distinct from ephemeral licensed payload.
7. Amazon Program Content is excluded from Mercury historical analytics by default.
8. Amazon-specific publication eligibility fails closed.
9. Amazon-vended affiliate/detail links preserve required attribution parameters.
10. No Amazon image binary is persisted.
11. Required Amazon disclosures/timestamps remain publication gates.
12. A retailer kill switch can suppress Amazon Program Content without deleting independent Atlas knowledge.

## 6. Remaining operational blockers

The following are not architecture questions and must be resolved before a live API call is treated as production-ready:

- Hardware Radar account is confirmed eligible and enrolled in Creators API.
- Creators API application/credentials exist and are stored outside source control.
- Correct Amazon.com Partner Tag is confirmed.
- Current account-specific TPS/TPD allocation is recorded operationally.
- Exact fields/resources requested by the first ingestion flow are selected.
- Required Amazon disclosures are mapped to the Hardware Radar rendering contract.
- Historical/aggregation rights remain blocked unless separately resolved.

## 7. FC001 outcome

**Architecture:** PASS WITH REQUIRED SOURCE-SPECIFIC CONTROLS
**Current Amazon adapter as production ingestion path:** BLOCKED
**Mercury v1.0 retailer-neutral certification:** UNAFFECTED
**FM001:** MAY PROCEED TO DESIGN/IMPLEMENTATION ONLY UNDER THE MANDATORY GATES ABOVE
