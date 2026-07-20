# Sentinel Rule Specification

**Document ID:** SENTINEL-RULE-SPECIFICATION  
**Version:** 0.1  
**Status:** Canonical Draft  
**Owner:** Mirabelle Labs  
**Applies To:** Sentinel, Atlas, Mercury, Forge, Hardware Radar  
**Last Updated:** 2026-07-18

---

## 1. Purpose

Sentinel is the governance and validation engine for the Mirabelle Labs platform.

It answers:

> Is this record, observation, page, or publication action permitted to proceed?

Sentinel does not own product truth, market observations, workflow state, or presentation. It evaluates those domains against explicit rules and returns deterministic results.

This specification defines:

- rule structure;
- rule identifiers;
- validation inputs and outputs;
- severity levels;
- blocking behavior;
- rule execution order;
- evidence and traceability;
- exception handling;
- remediation metadata;
- versioning;
- audit requirements;
- the initial rule catalog for Atlas, Mercury, Amazon compliance, Forge, and publication safety.

---

## 2. Architectural Position

```text
Atlas ───────────────┐
                     │
Mercury ─────────────┼──► Sentinel ───► Forge ───► Hardware Radar
                     │
Page/Template Data ──┘
```

Sentinel may read from:

- Atlas records;
- Mercury observations;
- Forge workflow context;
- publication payloads;
- page-render metadata;
- configuration;
- approved exception records;
- source and requirements registers.

Sentinel must not directly mutate Atlas or Mercury records.

---

## 3. Core Principles

### SEN-PRINCIPLE-001 — Determinism

The same input, rule-set version, and configuration must produce the same result.

### SEN-PRINCIPLE-002 — Fail Closed

When a critical dependency cannot be validated, Sentinel returns `BLOCKED`, not `PASS`.

### SEN-PRINCIPLE-003 — Traceability

Every rule must trace to one or more of:

- an official requirement;
- an internal architecture rule;
- a data invariant;
- an approved operational decision;
- an editorial standard.

### SEN-PRINCIPLE-004 — Evidence Preservation

Every failure, warning, override, and final decision must preserve sufficient evidence for later review.

### SEN-PRINCIPLE-005 — Separation of Concerns

Sentinel validates. Forge decides workflow transitions based on Sentinel's result. Sentinel must not publish content.

### SEN-PRINCIPLE-006 — Explicit Unknowns

Unknown or unverifiable conditions must never be silently treated as valid.

### SEN-PRINCIPLE-007 — Versioned Rules

Every validation run must identify the exact Sentinel rule-set version used.

### SEN-PRINCIPLE-008 — Minimal Privilege

Sentinel should receive only the data required to evaluate its rules.

---

## 4. Validation Scope

Sentinel validates five primary object classes:

| Object Class | Purpose |
|---|---|
| `ATLAS_RECORD` | Canonical product identity and specification validation |
| `MERCURY_OBSERVATION` | Retailer observation, freshness, source, and provenance validation |
| `PUBLICATION_CANDIDATE` | Combined page or component data prepared by Forge |
| `TEMPLATE_RENDER` | Disclosure, attribution, destination, and visual-presence checks |
| `WORKFLOW_ACTION` | Permission to transition, approve, publish, refresh, or archive |

A single publication may require several validation runs.

---

## 5. Validation Result Model

Every rule returns one of:

- `PASS`
- `WARN`
- `FAIL`
- `NOT_APPLICABLE`
- `ERROR`

### Meaning

| Result | Meaning |
|---|---|
| `PASS` | Rule condition satisfied |
| `WARN` | Non-blocking concern requires attention |
| `FAIL` | Rule condition violated |
| `NOT_APPLICABLE` | Rule does not apply to the input |
| `ERROR` | Rule could not execute or required evidence was unavailable |

`ERROR` inherits the blocking behavior of the rule's severity unless explicitly configured otherwise.

---

## 6. Severity Model

| Severity | Default Forge Effect | Typical Meaning |
|---|---|---|
| `CRITICAL` | `BLOCKED` | Legal, licensing, security, identity, or material data-integrity risk |
| `HIGH` | `BLOCKED` | Important compliance or factual-integrity failure |
| `MEDIUM` | `REVIEW` | Human judgment or correction required |
| `LOW` | `WARN` | Quality, consistency, or maintainability concern |
| `INFO` | No block | Informational diagnostic |

### Default aggregation

```text
Any CRITICAL FAIL or ERROR  → BLOCKED
Any HIGH FAIL or ERROR      → BLOCKED
Any MEDIUM FAIL or ERROR    → REVIEW
Only LOW/INFO issues        → READY_WITH_WARNINGS
No applicable failures      → READY
```

---

## 7. Rule Definition Schema

Every Sentinel rule must contain:

| Field | Required | Description |
|---|---:|---|
| `ruleId` | Yes | Permanent unique identifier |
| `title` | Yes | Human-readable rule name |
| `domain` | Yes | ATLAS, MERCURY, AMAZON, FORGE, PUBLICATION, SECURITY, EDITORIAL |
| `objectTypes` | Yes | Supported validation object classes |
| `sourceRequirements` | Yes | Requirement and source IDs |
| `severity` | Yes | CRITICAL, HIGH, MEDIUM, LOW, INFO |
| `status` | Yes | DRAFT, VERIFIED, ACTIVE, DEPRECATED |
| `automationLevel` | Yes | MANUAL, ASSISTED, AUTOMATED |
| `inputs` | Yes | Required input fields |
| `condition` | Yes | Deterministic validation condition |
| `passCriteria` | Yes | Exact success criteria |
| `failureCode` | Yes | Machine-readable code |
| `failureMessage` | Yes | User-facing explanation template |
| `forgeEffect` | Yes | BLOCKED, REVIEW, WARN, NONE |
| `remediation` | No | Correction guidance |
| `evidenceFields` | Yes | Evidence stored for the result |
| `testCases` | Yes | Linked test IDs |
| `introducedInVersion` | Yes | Initial rule-set version |
| `deprecatedInVersion` | No | Deprecation version |
| `owner` | Yes | Responsible subsystem or team |

---

## 8. Rule Identifier Convention

```text
{DOMAIN}-{SUBDOMAIN}-{NUMBER}
```

Examples:

- `ATL-RAM-001`
- `MER-OBS-003`
- `AMZ-CONTENT-014`
- `FORGE-STATE-002`
- `PUB-DISC-001`
- `SEC-CRED-001`

Existing rule aliases may be retained during migration, but the canonical specification should use this structured convention.

---

## 9. Validation Run Record

Each validation run must produce an immutable run record.

```json
{
  "validationRunId": "val_20260718_000001",
  "ruleSetVersion": "0.1",
  "objectType": "PUBLICATION_CANDIDATE",
  "objectId": "page_ddr5_001",
  "startedAt": "2026-07-18T15:00:00Z",
  "completedAt": "2026-07-18T15:00:01Z",
  "triggeredBy": "forge:publication-check",
  "overallDecision": "BLOCKED",
  "results": []
}
```

Minimum fields:

- validation run ID;
- rule-set version;
- object type;
- object ID;
- object revision;
- start and completion times;
- initiating actor;
- configuration version;
- applicable exception-set version;
- overall decision;
- rule results;
- evidence references.

---

## 10. Rule Result Record

```json
{
  "ruleId": "MER-OBS-004",
  "result": "FAIL",
  "severity": "CRITICAL",
  "failureCode": "OBSERVATION_EXPIRED",
  "message": "The selected Amazon observation expired before publication.",
  "evidence": {
    "observationId": "obs_123",
    "retrievedAt": "2026-07-17T14:00:00Z",
    "expiresAt": "2026-07-18T14:00:00Z",
    "evaluatedAt": "2026-07-18T15:00:00Z"
  },
  "forgeEffect": "BLOCKED",
  "remediation": "Refresh the retailer observation and rerun validation."
}
```

---

## 11. Validation Pipeline

Recommended execution order:

```text
1. Schema Validation
2. Identity and Reference Validation
3. Ownership Boundary Validation
4. Data Integrity Validation
5. Provenance Validation
6. Freshness and Lifecycle Validation
7. Compliance Validation
8. Security Validation
9. Editorial Validation
10. Render Validation
11. Workflow Transition Validation
12. Aggregate Decision
```

Rules within the same phase may execute in parallel when they are independent.

A critical schema failure may stop later phases if required fields cannot be trusted.

---

# 12. Atlas Rule Catalog

## ATL-RAM-001 — Capacity invariant

**Severity:** CRITICAL  
**Object:** `ATLAS_RECORD`  
**Condition:**

```text
capacityGb = moduleCount × capacityPerModuleGb
```

**Failure code:** `CAPACITY_INVARIANT_FAILED`  
**Forge effect:** `BLOCKED`  
**Remediation:** Correct the total capacity, module count, or per-module capacity.

---

## ATL-RAM-002 — Canonical MPN uniqueness

**Severity:** CRITICAL  
**Condition:** No active Atlas record may share the same normalized manufacturer and manufacturer part number unless explicitly modeled as an approved regional or packaging variant.

**Failure code:** `DUPLICATE_MANUFACTURER_PART_NUMBER`

---

## ATL-RAM-003 — Stable product identifier

**Severity:** CRITICAL  
**Condition:** `atlasProductId` exists, is globally unique, and does not contain retailer IDs or mutable price data.

**Failure code:** `INVALID_ATLAS_PRODUCT_ID`

---

## ATL-RAM-004 — Speed-label consistency

**Severity:** HIGH  
**Condition:**

```text
speedLabel = memoryType + "-" + dataRateMtps
```

for supported DDR records.

**Failure code:** `SPEED_LABEL_MISMATCH`

---

## ATL-RAM-005 — Kit-state consistency

**Severity:** HIGH  
**Condition:**

```text
moduleCount > 1  → isKit = true
moduleCount = 1  → isKit = false
```

**Failure code:** `KIT_STATE_MISMATCH`

---

## ATL-RAM-006 — ECC classification evidence

**Severity:** CRITICAL  
**Condition:** Side-band, registered, or advanced ECC claims require verified evidence. Ordinary DDR5 on-die ECC must not be classified as system-addressable ECC.

**Failure code:** `ECC_CLASSIFICATION_UNVERIFIED`

---

## ATL-RAM-007 — Retailer-field exclusion

**Severity:** CRITICAL  
**Condition:** Atlas records must not contain retailer price, availability, affiliate tags, ASINs, retailer URLs, or retailer-specific content.

**Failure code:** `RETAILER_DATA_IN_ATLAS`

---

## ATL-RAM-008 — Required provenance

**Severity:** HIGH  
**Condition:** Every publication-critical field has at least one acceptable source record and a non-conflicting verification status.

**Failure code:** `REQUIRED_PROVENANCE_MISSING`

---

## ATL-RAM-009 — Unknown-value integrity

**Severity:** HIGH  
**Condition:** Unknown values are represented as `null`, `UNKNOWN`, or an approved equivalent, not inferred from another variant.

**Failure code:** `UNSUPPORTED_INFERENCE_DETECTED`

---

## ATL-RAM-010 — Lifecycle consistency

**Severity:** MEDIUM  
**Condition:** Launch, discontinuation, archive, predecessor, and replacement states are logically ordered.

**Failure code:** `LIFECYCLE_INCONSISTENCY`

---

## ATL-RAM-011 — Timing-value integrity

**Severity:** HIGH  
**Condition:** Timing components are positive integers and the human-readable timing string matches the structured fields.

**Failure code:** `TIMING_DATA_INVALID`

---

## ATL-RAM-012 — Unit normalization

**Severity:** MEDIUM  
**Condition:** Dimensions use millimetres, mass uses grams, voltage uses volts, and transfer rate uses MT/s.

**Failure code:** `UNIT_NORMALIZATION_FAILED`

---

## ATL-RAM-013 — Overclock-profile evidence

**Severity:** HIGH  
**Condition:** XMP and EXPO claims require explicit supporting evidence.

**Failure code:** `PROFILE_SUPPORT_UNVERIFIED`

---

## ATL-RAM-014 — Source-conflict resolution

**Severity:** CRITICAL  
**Condition:** No unresolved source conflict affects a required or displayed technical field.

**Failure code:** `SOURCE_CONFLICT_UNRESOLVED`

---

# 13. Mercury Rule Catalog

## MER-OBS-001 — Observation identifier uniqueness

**Severity:** CRITICAL  
**Condition:** `observationId` is globally unique.

**Failure code:** `DUPLICATE_OBSERVATION_ID`

---

## MER-OBS-002 — Atlas reference validity

**Severity:** CRITICAL  
**Condition:** `atlasProductId` resolves to an eligible Atlas record.

**Failure code:** `ATLAS_REFERENCE_INVALID`

---

## MER-OBS-003 — Observation immutability

**Severity:** CRITICAL  
**Condition:** A persisted observation's protected fields have not changed after creation.

Protected fields include:

- observed price;
- availability;
- image URL;
- affiliate URL;
- observation time;
- source method;
- raw-response hash.

**Failure code:** `OBSERVATION_MUTATED`

---

## MER-OBS-004 — Observation freshness

**Severity:** CRITICAL  
**Condition:** The observation has not expired under the applicable retailer and content rules.

**Failure code:** `OBSERVATION_EXPIRED`

---

## MER-OBS-005 — Provenance completeness

**Severity:** HIGH  
**Condition:** Source method, adapter version, retrieval timestamp, rule-set version, and source evidence are present.

**Failure code:** `OBSERVATION_PROVENANCE_INCOMPLETE`

---

## MER-OBS-006 — Approved retailer adapter

**Severity:** CRITICAL  
**Condition:** `sourceMethod` is allowed for the retailer and adapter status is approved.

**Failure code:** `UNAPPROVED_RETAILER_SOURCE`

---

## MER-OBS-007 — Supersession-chain validity

**Severity:** HIGH  
**Condition:** `supersedesObservationId`, when present, references an earlier observation for the same Atlas product, retailer, and marketplace without cycles.

**Failure code:** `INVALID_SUPERSESSION_CHAIN`

---

## MER-OBS-008 — Currency and price integrity

**Severity:** HIGH  
**Condition:** Price is non-negative, currency is valid, and price/currency fields appear together when a price exists.

**Failure code:** `PRICE_CURRENCY_INVALID`

---

## MER-OBS-009 — Availability normalization

**Severity:** MEDIUM  
**Condition:** Raw availability is mapped to an approved normalized status without losing the original observation.

**Failure code:** `AVAILABILITY_NORMALIZATION_FAILED`

---

## MER-OBS-010 — Observation ownership boundary

**Severity:** CRITICAL  
**Condition:** Mercury does not overwrite Atlas canonical identity or specifications.

**Failure code:** `MERCURY_OWNERSHIP_VIOLATION`

---

# 14. Amazon Compliance Rule Catalog

The rules below must trace to the Amazon Compliance Bible and current verified source requirements.

## AMZ-SOURCE-001 — Approved Amazon acquisition source

**Severity:** CRITICAL  
**Condition:** Amazon Product Advertising Content was obtained through an approved Amazon mechanism.

**Failure code:** `AMAZON_SOURCE_NOT_APPROVED`

---

## AMZ-LINK-001 — Special Link validity

**Severity:** CRITICAL  
**Condition:** The published destination uses an approved tagged Amazon Special Link or equivalent approved format.

**Failure code:** `AMAZON_SPECIAL_LINK_INVALID`

---

## AMZ-LINK-002 — Content-destination relevance

**Severity:** CRITICAL  
**Condition:** Amazon content links only to the corresponding or directly relevant Amazon destination.

**Failure code:** `AMAZON_DESTINATION_MISMATCH`

---

## AMZ-CONTENT-001 — Semantic integrity

**Severity:** HIGH  
**Condition:** Amazon-originated content is not altered beyond permitted proportional resizing, safe truncation, or approved formatting.

**Failure code:** `AMAZON_CONTENT_ALTERED`

---

## AMZ-CONTENT-002 — Image-hosting restriction

**Severity:** CRITICAL  
**Condition:** Amazon-provided image binaries are not downloaded or self-hosted where prohibited.

**Failure code:** `AMAZON_IMAGE_SELF_HOSTED`

---

## AMZ-CONTENT-003 — Image-reference freshness

**Severity:** CRITICAL  
**Condition:** Amazon image-reference storage and use remain within the allowed validity period.

**Failure code:** `AMAZON_IMAGE_REFERENCE_EXPIRED`

---

## AMZ-CONTENT-004 — Non-image freshness

**Severity:** CRITICAL  
**Condition:** Amazon-originated non-image content remains within its allowed cache period.

**Failure code:** `AMAZON_CONTENT_EXPIRED`

---

## AMZ-CONTENT-005 — Amazon text disclaimer

**Severity:** CRITICAL  
**Condition:** Required Amazon-origin disclosure is present in plain view whenever applicable Amazon text is displayed.

**Failure code:** `AMAZON_TEXT_DISCLAIMER_MISSING`

---

## AMZ-PRICE-001 — Price timestamp

**Severity:** HIGH  
**Condition:** A visible date/time stamp appears where required by retrieval frequency or source method.

**Failure code:** `AMAZON_PRICE_TIMESTAMP_MISSING`

---

## AMZ-PRICE-002 — Price and availability disclaimer

**Severity:** CRITICAL  
**Condition:** The required price-and-availability disclaimer is adjacent or available through an approved mechanism.

**Failure code:** `AMAZON_PRICE_DISCLAIMER_MISSING`

---

## AMZ-DISC-001 — Associate disclosure presence

**Severity:** CRITICAL  
**Condition:** Required affiliate relationship disclosure is present on applicable pages.

**Failure code:** `ASSOCIATE_DISCLOSURE_MISSING`

---

## AMZ-DISC-002 — Associate disclosure prominence

**Severity:** CRITICAL  
**Condition:** Disclosure is clear, legible, and not hidden, obscured, or materially separated from the relevant affiliate experience.

**Failure code:** `ASSOCIATE_DISCLOSURE_NOT_PROMINENT`

---

## AMZ-IP-001 — Trademark authorization

**Severity:** HIGH  
**Condition:** Amazon marks and third-party seller trademarks are used only where permitted.

**Failure code:** `TRADEMARK_USE_UNAUTHORIZED`

---

## AMZ-IP-002 — Required notice preservation

**Severity:** HIGH  
**Condition:** Required proprietary notices and attribution are preserved and visible.

**Failure code:** `REQUIRED_NOTICE_REMOVED`

---

## AMZ-DATA-001 — Model-training exclusion

**Severity:** CRITICAL  
**Object:** `WORKFLOW_ACTION` or export job  
**Condition:** Amazon Program Content is excluded from model training, fine-tuning, and model-improvement datasets.

**Failure code:** `AMAZON_CONTENT_IN_TRAINING_EXPORT`

---

## AMZ-DATA-002 — Aggregation and analytics license gate

**Severity:** CRITICAL  
**Condition:** Historical aggregation, generalized analysis, or repurposing of Amazon Program Content occurs only with documented permission and approved scope.

**Failure code:** `AMAZON_ANALYTICS_NOT_AUTHORIZED`

---

## AMZ-CRED-001 — Credential secrecy

**Severity:** CRITICAL  
**Condition:** Amazon credentials are absent from client assets, repositories, rendered pages, logs, and analytics payloads.

**Failure code:** `AMAZON_CREDENTIAL_EXPOSURE`

---

## AMZ-CRED-002 — Assigned identifier ownership

**Severity:** CRITICAL  
**Condition:** API credentials and associate tags belong to the approved Mirabelle Labs account and environment.

**Failure code:** `UNAUTHORIZED_AMAZON_IDENTIFIER`

---

## AMZ-API-001 — Rate and payload compliance

**Severity:** HIGH  
**Condition:** Requests conform to configured limits and approved retry behavior.

**Failure code:** `AMAZON_API_LIMIT_VIOLATION`

---

## AMZ-TERM-001 — Termination suppression capability

**Severity:** CRITICAL  
**Condition:** Amazon Program Content and links can be globally suppressed without removing independent Atlas records.

**Failure code:** `AMAZON_KILL_SWITCH_UNAVAILABLE`

---

## AMZ-AGENT-001 — Automated-agent transparency

**Severity:** CRITICAL  
**Condition:** Automated access identifies itself where required and does not bypass access controls or CAPTCHAs.

**Failure code:** `AUTOMATION_IDENTITY_OR_ACCESS_VIOLATION`

---

# 15. Forge Workflow Rules

## FORGE-STATE-001 — Valid transition

**Severity:** HIGH  
**Condition:** Requested state transition is permitted by the workflow transition matrix.

**Failure code:** `INVALID_WORKFLOW_TRANSITION`

---

## FORGE-STATE-002 — READY eligibility

**Severity:** CRITICAL  
**Condition:** No applicable CRITICAL or HIGH failure exists; required reviews and current validation run are complete.

**Failure code:** `READY_STATE_NOT_ALLOWED`

---

## FORGE-STATE-003 — PUBLISHED eligibility

**Severity:** CRITICAL  
**Condition:** Candidate is `READY`, validation is current, all required approvals exist, and the selected observations remain fresh at publication time.

**Failure code:** `PUBLICATION_NOT_ALLOWED`

---

## FORGE-STATE-004 — Stale validation

**Severity:** HIGH  
**Condition:** Validation result refers to the current object revision, observation IDs, template version, and rule-set version.

**Failure code:** `VALIDATION_RESULT_STALE`

---

## FORGE-STATE-005 — Human approval authority

**Severity:** HIGH  
**Condition:** The approving actor has the required role for the applicable review class.

**Failure code:** `APPROVER_NOT_AUTHORIZED`

---

## FORGE-STATE-006 — Refresh before republish

**Severity:** HIGH  
**Condition:** Any candidate marked `NEEDS_REFRESH` has current retailer observations before returning to `READY`.

**Failure code:** `REFRESH_REQUIRED`

---

## FORGE-STATE-007 — Published-content drift

**Severity:** HIGH  
**Condition:** Published page inputs still match the approved publication candidate or trigger revalidation.

**Failure code:** `PUBLISHED_CONTENT_DRIFT`

---

# 16. Publication and Render Rules

## PUB-IDENTITY-001 — Product identity coherence

**Severity:** CRITICAL  
**Condition:** Product name, MPN, capacity, memory generation, and selected retailer observation refer to the same Atlas product.

**Failure code:** `PUBLICATION_PRODUCT_MISMATCH`

---

## PUB-PRICE-001 — Displayed price matches observation

**Severity:** CRITICAL  
**Condition:** Rendered price and currency exactly match the selected validated Mercury observation.

**Failure code:** `DISPLAYED_PRICE_MISMATCH`

---

## PUB-LINK-001 — CTA destination consistency

**Severity:** CRITICAL  
**Condition:** The displayed retailer, affiliate CTA, and destination correspond to the selected observation.

**Failure code:** `CTA_DESTINATION_MISMATCH`

---

## PUB-DISC-001 — Disclosure render visibility

**Severity:** CRITICAL  
**Condition:** Required disclosures are present in the rendered output, visible at standard desktop and mobile breakpoints, and not hidden by CSS or interaction state.

**Failure code:** `DISCLOSURE_RENDER_NOT_VISIBLE`

---

## PUB-ACCESS-001 — Essential-content accessibility

**Severity:** MEDIUM  
**Condition:** Essential price, retailer, disclosure, and CTA content is available to keyboard and assistive-technology users.

**Failure code:** `ESSENTIAL_CONTENT_NOT_ACCESSIBLE`

---

## PUB-EDITORIAL-001 — Editorial/source separation

**Severity:** HIGH  
**Condition:** Hardware Radar editorial text is distinguishable from retailer-supplied content and does not falsely imply retailer endorsement.

**Failure code:** `EDITORIAL_SOURCE_CONFUSION`

---

## PUB-TIME-001 — Verification-time accuracy

**Severity:** HIGH  
**Condition:** Displayed “last verified” or equivalent timestamp is derived from the selected observation set and is not newer than the underlying data.

**Failure code:** `VERIFICATION_TIME_INACCURATE`

---

## PUB-CATEGORY-001 — Category eligibility

**Severity:** HIGH  
**Condition:** A product displayed in DDR5, DDR4, laptop, gaming, workstation, or other categories satisfies the category's explicit criteria.

**Failure code:** `CATEGORY_CLASSIFICATION_INVALID`

---

# 17. Security Rules

## SEC-CRED-001 — Secret scanning

**Severity:** CRITICAL  
**Condition:** No recognized secret pattern or configured credential is present in source control, build artifacts, or client bundles.

**Failure code:** `SECRET_DETECTED`

---

## SEC-LOG-001 — Sensitive log exclusion

**Severity:** CRITICAL  
**Condition:** Credentials, raw authorization headers, and prohibited personal or licensed content are absent from logs.

**Failure code:** `SENSITIVE_DATA_LOGGED`

---

## SEC-CONFIG-001 — Environment separation

**Severity:** HIGH  
**Condition:** Development, test, and production credentials and associate identifiers are separated.

**Failure code:** `ENVIRONMENT_CREDENTIAL_MIXED`

---

## SEC-AUDIT-001 — Audit-record integrity

**Severity:** HIGH  
**Condition:** Validation, approval, exception, and publication records are append-only or otherwise tamper-evident.

**Failure code:** `AUDIT_RECORD_INTEGRITY_FAILED`

---

# 18. Exception Handling

Exceptions must be rare, explicit, time-bounded, and auditable.

Each exception record must include:

- exception ID;
- affected rule IDs;
- business justification;
- requested by;
- approved by;
- scope;
- environment;
- object IDs;
- effective date;
- expiry date;
- compensating controls;
- review status;
- evidence;
- revocation reason.

### Exception restrictions

The following rules should not be bypassable through ordinary operational exceptions:

- credential exposure;
- unauthorized data acquisition;
- invalid product identity;
- missing legally or contractually required disclosure;
- prohibited self-hosting of restricted content;
- expired licensed content;
- unauthorized model-training use;
- unauthorized publication.

An emergency suppression action may bypass normal workflow only to remove or hide content, never to publish non-compliant content.

---

# 19. Rule Dependencies

Rules may depend on other rules.

Example:

```text
PUB-PRICE-001
requires:
  MER-OBS-002 PASS
  MER-OBS-004 PASS
  MER-OBS-008 PASS
  PUB-IDENTITY-001 PASS
```

A dependent rule should return `ERROR` or `NOT_APPLICABLE` when its prerequisites cannot be evaluated, according to its definition.

Dependency cycles are prohibited.

---

# 20. Remediation Model

Every actionable failure should include:

- concise explanation;
- affected field or component;
- evidence;
- required correction;
- responsible subsystem;
- whether automatic remediation is permitted;
- rerun instructions.

### Automatic remediation policy

Allowed examples:

- recomputing a derived field;
- normalizing enum casing;
- requesting a fresh Mercury observation;
- regenerating a page preview.

Not allowed:

- inventing unknown product specifications;
- changing a product identity automatically;
- substituting a different affiliate destination;
- hiding required disclosures;
- overriding a licensing failure.

---

# 21. Rule Versioning

Sentinel uses semantic rule-set versions:

```text
MAJOR.MINOR.PATCH
```

- **MAJOR:** Decision behavior or rule meaning changes materially.
- **MINOR:** New rules or backward-compatible validation expansion.
- **PATCH:** Wording, metadata, or non-behavioral corrections.

Every published page should retain:

- rule-set version;
- validation run ID;
- selected Atlas revision;
- selected Mercury observation IDs;
- template version;
- publication timestamp.

A major rule-set change should trigger review of active published pages.

---

# 22. Test Strategy

Each active rule must have:

1. positive test;
2. negative test;
3. boundary test where applicable;
4. malformed-input test;
5. stale-evidence test where applicable.

### Required integration tests

- Atlas record + Mercury observation match;
- Atlas record + Mercury observation mismatch;
- valid Amazon disclosure render;
- hidden disclosure render;
- current observation at validation but expired before publication;
- stale validation after template change;
- supersession chain with a cycle;
- credential leak in client bundle;
- global Amazon suppression;
- exception expiry.

---

# 23. Initial Test Catalog

| Test ID | Scenario | Expected Result |
|---|---|---|
| SEN-TC-001 | Valid 2×16GB kit with total capacity 32GB | ATL-RAM-001 PASS |
| SEN-TC-002 | 2×16GB kit recorded as 64GB | ATL-RAM-001 FAIL |
| SEN-TC-003 | Atlas record contains Amazon price | ATL-RAM-007 FAIL |
| SEN-TC-004 | Mercury observation references missing Atlas ID | MER-OBS-002 FAIL |
| SEN-TC-005 | Persisted observation price is edited | MER-OBS-003 FAIL |
| SEN-TC-006 | Amazon observation is expired | MER-OBS-004 FAIL |
| SEN-TC-007 | Amazon image downloaded into public assets | AMZ-CONTENT-002 FAIL |
| SEN-TC-008 | Affiliate disclosure present but hidden on mobile | PUB-DISC-001 FAIL |
| SEN-TC-009 | Displayed price differs by $0.01 from observation | PUB-PRICE-001 FAIL |
| SEN-TC-010 | Validation uses prior Atlas revision | FORGE-STATE-004 FAIL |
| SEN-TC-011 | API key appears in frontend build | SEC-CRED-001 FAIL |
| SEN-TC-012 | Amazon content included in fine-tuning export | AMZ-DATA-001 FAIL |
| SEN-TC-013 | Expired exception is used | Validation remains blocked |
| SEN-TC-014 | Kill switch suppresses all Amazon content | AMZ-TERM-001 PASS |
| SEN-TC-015 | Product mapped to wrong DDR category | PUB-CATEGORY-001 FAIL |

---

# 24. Forge Decision Contract

Sentinel returns a decision object to Forge:

```json
{
  "decision": "BLOCKED",
  "validationRunId": "val_20260718_000001",
  "ruleSetVersion": "0.1",
  "summary": {
    "criticalFailures": 1,
    "highFailures": 0,
    "mediumFailures": 1,
    "warnings": 2
  },
  "blockingRuleIds": [
    "AMZ-CONTENT-004"
  ],
  "reviewRuleIds": [
    "ATL-RAM-010"
  ]
}
```

Forge must not reinterpret individual compliance rules. It applies the declared decision and workflow policy.

---

# 25. Forge UI Requirements

The validation interface should show:

- overall decision;
- validation time;
- rule-set version;
- grouped failures by subsystem;
- severity;
- affected object and field;
- evidence;
- remediation;
- source requirement;
- test status;
- exception eligibility;
- rerun control.

Critical failures should be visually distinct and impossible to dismiss as ordinary warnings.

---

# 26. Monitoring and Revalidation

Sentinel should support scheduled or event-driven revalidation when:

- a Mercury observation expires;
- an Amazon source document changes;
- a rule-set version changes;
- an Atlas record is revised;
- a page template changes;
- a disclosure component changes;
- an affiliate tag changes;
- a credential is rotated;
- a product is discontinued;
- a publication candidate drifts from its approved inputs.

Published pages that fail revalidation should transition to:

```text
NEEDS_REFRESH
```

or, for critical issues:

```text
HIDDEN / REMOVED
```

according to Forge policy.

---

# 27. Implementation Boundaries

Sentinel should be implemented as:

- pure validation functions where practical;
- a rule registry;
- a validation orchestrator;
- an evidence recorder;
- a decision aggregator;
- a versioned rule configuration;
- an audit writer.

Sentinel should not:

- fetch retailer data directly;
- edit Atlas or Mercury records;
- generate editorial copy;
- publish pages;
- silently repair critical data;
- retain unrestricted copies of licensed retailer payloads.

---

# 28. Suggested Module Structure

```text
sentinel/

├── core/
│   ├── rule-registry
│   ├── validation-runner
│   ├── decision-aggregator
│   ├── dependency-resolver
│   └── evidence-recorder
│
├── rules/
│   ├── atlas/
│   ├── mercury/
│   ├── amazon/
│   ├── forge/
│   ├── publication/
│   └── security/
│
├── schemas/
│   ├── rule.schema
│   ├── result.schema
│   ├── run.schema
│   └── exception.schema
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
│
└── config/
    ├── rule-set
    ├── severity-policy
    └── environment-policy
```

---

# 29. Open Questions

1. Whether Sentinel will initially be a library inside Forge or a standalone service.
2. Whether rule definitions should be code-only, configuration-driven, or hybrid.
3. Which failures may be automatically remediated in the MVP.
4. Whether public pages should expose a user-facing freshness status derived from Sentinel.
5. How validation is triggered in a static-site deployment workflow.
6. Whether rendered-page validation will use DOM inspection, screenshots, or both.
7. Which rules require legal review before being marked `VERIFIED`.
8. How long validation evidence and audit logs should be retained.
9. Whether exception approval requires one or two reviewers.
10. Whether a policy-source change should automatically block publication until review.

---

# 30. Definition of Done

Sentinel Rule Specification v1.0 is complete when:

- all launch-critical Atlas rules are defined;
- all launch-critical Mercury rules are defined;
- Amazon compliance rules trace to verified requirements;
- Forge transition rules are approved;
- rule schemas are implemented;
- every active rule has tests;
- the decision aggregator is implemented;
- exception handling is operational;
- validation evidence is persisted;
- publication cannot bypass Sentinel;
- a complete sample product can pass from Atlas through Mercury, Sentinel, Forge, and Hardware Radar.

---

# 31. Canonical Summary

```text
Sentinel validates; it does not own or publish.

Every rule is deterministic, versioned, traceable, and tested.

Critical uncertainty fails closed.

Every decision preserves evidence.

Forge follows Sentinel's decision.

No content reaches Hardware Radar without passing the applicable gates.