# Amazon Creators API Technical & Operational Specification

**Document ID:** AMZ-CREATORS-SPEC  
**Version:** 0.1  
**Status:** Research Baseline  
**Owner:** Mirabelle Labs

---

# 1. Purpose

This specification defines how Hardware Radar will integrate with Amazon's approved API mechanisms.

It does **not** define implementation code.

It defines engineering requirements that will later be implemented in Mercury, Sentinel and Forge.

---

# 2. Objectives

The Amazon adapter shall:

- Retrieve Amazon-approved Product Advertising Content.
- Preserve compliance metadata.
- Refresh expiring content.
- Never expose private credentials.
- Produce immutable Mercury observations.
- Supply only validated data for publication.

---

# 3. Architectural Position

```text
Amazon API
      │
      ▼
Amazon Adapter
      │
      ▼
Mercury
      │
      ▼
Sentinel
      │
      ▼
Forge
      │
      ▼
Hardware Radar
```

The website must never call Amazon directly.

---

# 4. Responsibilities

## Amazon Adapter

Responsible for:

- Authentication
- Request throttling
- Response validation
- Error handling
- Compliance metadata
- Retry policy

Not responsible for:

- Editorial decisions
- Product specifications
- UI rendering
- Compliance approval

---

# 5. Credential Policy

Credentials shall:

- remain server-side;
- be stored in a secret manager or environment variables;
- never be committed to source control;
- never appear in client JavaScript;
- never be written to logs.

Credential rotation must be documented.

---

# 6. Mercury Observation Contract

Each API retrieval should create a new observation.

Minimum fields:

- observationId
- atlasProductId
- marketplace
- asin
- retrievedAt
- expiresAt
- sourceMethod
- apiVersion
- affiliateTag
- price
- currency
- availability
- imageUrl
- detailPageUrl
- validationStatus

Observations are immutable.

---

# 7. Refresh Policy

Before publication:

- check expiry;
- refresh expired Amazon content;
- create a new observation;
- supersede the previous observation.

Never overwrite an observation.

---

# 8. Failure States

Possible adapter outcomes:

PASS

RETRY

RATE_LIMITED

AUTH_FAILED

INVALID_RESPONSE

LICENSE_BLOCK

UNKNOWN

Only PASS permits publication.

---

# 9. Sentinel Validators

Initial API validators:

- Approved API source
- Credential validity
- Required fields present
- Expiry window valid
- Affiliate tag valid
- Timestamp requirement
- Required disclaimer availability

---

# 10. Forge Workflow

```text
Retrieve
   ↓
Validate
   ↓
Store Observation
   ↓
Sentinel Checks
   ↓
READY / REVIEW / BLOCKED
```

---

# 11. Open Questions

Items requiring verification against current official Amazon documentation:

1. Exact eligibility requirements for Creators API.
2. Current authentication mechanism.
3. Endpoint catalogue.
4. Rate-limit model.
5. Error-code catalogue.
6. Refresh expectations.
7. Versioning policy.
8. Deprecation process.

No engineering assumptions should be promoted to production until verified.

---

# 12. Definition of Done

This specification is complete when:

- every endpoint is documented;
- every returned field has an owner;
- every field maps to Atlas, Mercury, Sentinel, Forge or Hardware Radar;
- every failure mode has a documented response;
- every compliance dependency is traceable to the Compliance Bible.