# Mercury Data Dictionary

**Document ID:** MERCURY-DATA-DICTIONARY  
**Version:** 0.1  
**Status:** Canonical Draft  
**Owner:** Mirabelle Labs  
**Applies To:** Mercury, Sentinel, Forge, Hardware Radar

---

# 1. Purpose

Mercury is the market-observation system.

Atlas answers:

> What is this product?

Mercury answers:

> What was observed, from where, when, and under what license?

Mercury never owns canonical product truth.

---

# 2. Core Principles

1. Observations are immutable.
2. Every observation references exactly one Atlas product.
3. Retailer data is never merged into Atlas.
4. Every observation records provenance.
5. Expired retailer content is never silently reused.
6. Compliance metadata is first-class data.

---

# 3. Observation Lifecycle

DISCOVERED

↓

RETRIEVED

↓

VALIDATED

↓

PUBLISHABLE

↓

PUBLISHED

↓

SUPERSEDED

↓

ARCHIVED

---

# 4. Core Observation Record

| Field | Type | Required | Notes |
|---|---|---:|---|
| observationId | string | ✓ | Globally unique immutable ID |
| atlasProductId | string | ✓ | Foreign key to Atlas |
| retailer | enum | ✓ | AMAZON, NEWEGG, etc. |
| marketplace | string | ✓ | e.g. amazon.com |
| observationTime | datetime | ✓ | Retrieval timestamp |
| sourceMethod | enum | ✓ | API, manual, feed |
| validationStatus | enum | ✓ | PASS/WARN/FAIL |
| supersedesObservationId | string | | Previous observation |
| expiresAt | datetime | | Cache expiry if applicable |

---

# 5. Amazon Observation Extension

| Field | Required |
|---|---:|
| asin | ✓ |
| affiliateTag | ✓ |
| affiliateUrl | ✓ |
| detailPageUrl | ✓ |
| imageUrl | |
| imageUrlExpiresAt | |
| title | |
| availability | |
| price | |
| currency | |
| requiredDisclosureShown | ✓ |
| requiredPriceDisclaimerShown | ✓ |
| amazonContentDisclaimerShown | ✓ |

These fields are governed by Amazon licensing and caching rules.

---

# 6. Retailer-Neutral Observation Fields

Common fields available regardless of retailer:

- stockStatus
- shippingAvailable
- sellerType
- observationHash
- responseHash
- rawPayloadReference
- apiVersion
- requestId
- retrievalDurationMs

---

# 7. Provenance

Every observation stores:

- retrieval source
- retrieval time
- adapter version
- validator version
- compliance rule set version

---

# 8. Sentinel Validation Rules

| Rule | Description |
|---|---|
| MER-001 | observationId unique |
| MER-002 | atlasProductId exists |
| MER-003 | observation immutable |
| MER-004 | expiry valid |
| MER-005 | provenance complete |
| MER-006 | retailer adapter approved |
| MER-007 | required compliance metadata present |
| MER-008 | supersession chain valid |

Critical failures block publication.

---

# 9. Refresh Policy

Refresh creates a NEW observation.

Never update:

- price
- availability
- image URL
- timestamps

Instead:

old observation

↓

SUPERSEDED

↓

new observation

---

# 10. Ownership Matrix

| Data | Owner |
|---|---|
| Product identity | Atlas |
| Technical specs | Atlas |
| Retailer price | Mercury |
| Availability | Mercury |
| Affiliate URL | Mercury |
| ASIN | Mercury |
| Compliance metadata | Mercury |
| Publication state | Forge |
| Validation results | Sentinel |

---

# 11. Example Observation

```json
{
  "observationId":"obs_20260718_000001",
  "atlasProductId":"ram_corsair_cmk32gx5m2b6000c30",
  "retailer":"AMAZON",
  "marketplace":"amazon.com",
  "observationTime":"2026-07-18T14:30:00Z",
  "sourceMethod":"CREATORS_API",
  "asin":"B0XXXXXXX",
  "affiliateTag":"hardwareradar-20",
  "price":109.99,
  "currency":"USD",
  "availability":"IN_STOCK",
  "validationStatus":"PASS"
}
```

---

# 12. Forge Integration

Forge should never edit Mercury observations.

Editors may:

- trigger refresh
- compare observations
- review validation
- approve publication

They may not overwrite retailer observations.

---

# 13. Future Retailers

The schema is retailer-neutral.

Retailer-specific extensions should exist for:

- Amazon
- Newegg
- Best Buy
- B&H
- Micro Center

while preserving the common observation contract.

---

# 14. Definition of Done

Mercury v1.0 is complete when:

- immutable observation model approved
- Atlas references validated
- retailer ownership separated
- compliance metadata defined
- Sentinel rules implemented
- Forge workflow integrated
- historical supersession chain validated

---

# Canonical Summary

Mercury stores observations—not truth.

Truth belongs to Atlas.

Every observation is immutable, traceable, licensed where required, and linked to exactly one Atlas product.