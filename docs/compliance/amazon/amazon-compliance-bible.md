# Amazon Compliance Bible

**Document ID:** AMZ-COMP-BIBLE  
**Version:** 0.1  
**Status:** Living Document — Verified Foundation  
**Owner:** Mirabelle Labs  
**Applies To:** Hardware Radar, Mercury, Sentinel, Forge  
**Research Cut-off:** 2026-07-18  
**Marketplace Scope:** Amazon.com / United States Associates Program

> This document is an internal engineering interpretation of current official requirements. It is not legal advice and does not replace Amazon's controlling agreements, policies, specifications, or written instructions. Where a conflict exists, the applicable official Amazon document controls.

---

## 1. Purpose

This document translates Amazon Associates Program requirements into:

1. traceable business requirements;
2. implementation-oriented engineering requirements;
3. Sentinel validation rules;
4. Forge publication gates;
5. repeatable compliance tests.

The canonical trace is:

```text
Official Source
      ↓
Extracted Requirement
      ↓
Engineering Requirement
      ↓
Sentinel Rule
      ↓
Test Case
      ↓
Implementation
```

No production compliance rule should be marked `VERIFIED` without a current official source.

---

## 2. Status Vocabulary

### Source status

- **VERIFIED:** Official source reviewed and relevant text confirmed.
- **PENDING:** Official source identified but not yet fully reviewed.
- **SUPERSEDED:** Replaced by a newer official source.
- **INTERNAL:** Mirabelle Labs authority rather than an external rule.

### Rule confidence

- **VERIFIED:** Directly supported by a reviewed official source.
- **NEEDS_REVIEW:** Likely applicable, but interpretation or implementation scope remains unresolved.
- **PENDING:** Topic identified but not yet translated into a rule.
- **DEPRECATED:** Replaced or no longer applicable.

### Severity

- **CRITICAL:** Violation may create material program, legal, licensing, or publication risk. Publication must be blocked.
- **HIGH:** Likely to mislead users or violate an important program requirement. Publication normally must be blocked.
- **MEDIUM:** Requires human review or correction but may not always require a full block.
- **LOW:** Documentation, consistency, or best-practice matter.

---

## 3. Official Source Register

| Source ID | Official document | Authority | Status | Last reviewed |
|---|---|---|---|---|
| SRC-001 | Associates Program Operating Agreement | Amazon | VERIFIED | 2026-07-18 |
| SRC-002 | Associates Program Policies | Amazon | VERIFIED | 2026-07-18 |
| SRC-003 | Associates Program Participation Requirements | Amazon | VERIFIED | 2026-07-18 |
| SRC-004 | Associates Program IP License and Usage Requirements | Amazon; incorporated within Program Policies | VERIFIED | 2026-07-18 |
| SRC-005 | Associates Program Trademark Guidelines | Amazon; incorporated within Program Policies | PARTIALLY VERIFIED | 2026-07-18 |
| SRC-006 | Creators API Documentation | Amazon | PARTIALLY VERIFIED | 2026-07-18 |
| SRC-007 | Hardware Radar Architecture Bible | Mirabelle Labs | INTERNAL | 2026-07-18 |
| SRC-008 | Applicable advertising and endorsement law/guidance | External legal authority | PENDING | — |

### Canonical source locations

- SRC-001: `https://affiliate-program.amazon.com/help/operating/agreement`
- SRC-002 / SRC-004 / SRC-005: `https://affiliate-program.amazon.com/help/operating/policies`
- SRC-003: `https://affiliate-program.amazon.com/help/operating/participation/`
- SRC-006: `https://affiliate-program.amazon.com/creatorsapi/docs/`

---

## 4. Key Architectural Interpretation

### 4.1 Amazon Program Content is licensed content

Amazon-provided data, images, text, links, widgets, APIs, and related materials are not canonical Hardware Radar product truth. They are licensed retailer content governed by Amazon's current terms.

### 4.2 Atlas remains independent

Manufacturer specifications and normalized RAM attributes belong in Atlas when obtained and verified from an independently lawful source.

Amazon-derived Product Advertising Content belongs in Mercury or an approved retailer-content reference layer.

### 4.3 Licensed content must remain identifiable

Every field displayed on Hardware Radar must be classifiable as one of:

- `ATLAS_CANONICAL`
- `MERCURY_AMAZON_PROGRAM_CONTENT`
- `HARDWARE_RADAR_EDITORIAL`
- `DERIVED_INTERNAL`
- `UNKNOWN_SOURCE`

`UNKNOWN_SOURCE` is not publishable.

### 4.4 Immutable observations require licensed-content controls

Mercury may preserve an audit record, but Amazon's caching, storage, termination, and usage requirements constrain what content may be retained and for how long. An immutable Mercury design therefore requires separation between:

- durable observation metadata;
- durable ASIN and internal audit identifiers;
- ephemeral Amazon Product Advertising Content;
- independently sourced product specifications.

---

## 5. Requirements Register — IP License and Usage

### REQ-0011 — Limited-purpose license

**Source:** SRC-004  
Amazon grants only a limited, revocable, non-transferable, non-sublicensable license to use Program Content for participation in the Associates Program and within its express scope.

**Engineering interpretation:**  
Amazon content must carry source, license scope, and current eligibility metadata. It must never be treated as owned or unrestricted content.

---

### REQ-0012 — No unapproved extraction methods

**Source:** SRC-004  
The license does not permit data mining, robots, or similar extraction tools. Product Advertising Content is obtained through Creators API, PA API, or an expressly approved data feed.

**Engineering interpretation:**  
Production ingestion of Amazon Product Advertising Content must use an approved Amazon mechanism. General web scraping is not an approved Mercury source.

---

### REQ-0013 — Amazon-directed purpose

**Source:** SRC-004  
Product Advertising Content must be used on a site or application whose principal purpose for that content is advertising and marketing an Amazon Site and driving sales there.

**Engineering interpretation:**  
Amazon content blocks must have an Amazon purchase destination and may not be repurposed as a retailer-neutral data feed.

---

### REQ-0014 — Content-to-destination binding

**Source:** SRC-003 and SRC-004  
Each use of Amazon Program Content must link only to the relevant Amazon product detail page or other directly relevant Amazon page.

**Engineering interpretation:**  
Every Amazon content block requires a validated content-to-ASIN-to-destination relationship.

---

### REQ-0015 — Content alteration restrictions

**Source:** SRC-003  
Amazon Content may not be added to, deleted from, or altered, except proportionate image resizing and text truncation that does not change meaning or create factual inaccuracy.

**Engineering interpretation:**  
Amazon-originated fields must be displayed without semantic rewriting. Hardware Radar editorial copy must be stored separately and visibly distinguishable.

---

### REQ-0016 — No model training or fine-tuning

**Source:** SRC-004  
Program Content may not be used directly or indirectly to develop or improve large-language, multimodal, machine-learning, or related models.

**Engineering interpretation:**  
Amazon Product Advertising Content must be excluded from model-training datasets, fine-tuning corpora, embedding-training corpora, and similar development pipelines.

---

### REQ-0017 — Restricted aggregation and repurposing

**Source:** SRC-004  
Without prior written approval, Creators API, PA API, Data Feeds, and Product Advertising Content may not be accessed or used to aggregate, analyze, extract, or repurpose Product Advertising Content.

**Engineering interpretation:**  
Hardware Radar must not assume that internally retaining Amazon-derived historical prices, producing trend analytics, or building generalized retailer datasets is permitted. These functions remain blocked pending explicit license analysis or written approval.

---

### REQ-0018 — Image storage restriction

**Source:** SRC-004  
Amazon Product Advertising Content consisting of an image may not be stored or cached. A link to the image may be stored for up to 24 hours.

**Engineering interpretation:**  
Hardware Radar must not download and self-host Amazon API image files. Mercury may temporarily store the returned image URL with a hard expiry no later than 24 hours after retrieval.

---

### REQ-0019 — Non-image caching restriction

**Source:** SRC-004  
Non-image Product Advertising Content may be cached for up to 24 hours, after which it must be refreshed and immediately re-displayed from a new approved retrieval.

**Engineering interpretation:**  
Amazon-derived title, price, availability, and other licensed fields require `retrievedAt`, `expiresAt`, `sourceMethod`, and refresh status. Expired content cannot remain publicly displayed.

---

### REQ-0020 — ASIN retention

**Source:** SRC-004  
Unless Amazon states otherwise, individual ASINs may be stored for an indefinite period until termination of the license.

**Engineering interpretation:**  
ASIN is a durable retailer-mapping identifier. It may remain in Mercury independently of ephemeral licensed content, subject to deletion obligations following license termination or Amazon instruction.

---

### REQ-0021 — Pricing and availability timestamp

**Source:** SRC-004  
A date/time stamp must appear adjacent to pricing or availability when content comes from a data feed or is refreshed less frequently than hourly. The date may be omitted on the same day as retrieval.

**Engineering interpretation:**  
Sentinel must determine refresh frequency and enforce a visible timestamp when required. Hardware Radar should default to showing a timestamp for transparency even where hourly refresh could permit omission.

---

### REQ-0022 — Pricing and availability disclaimer

**Source:** SRC-004  
A prescribed price-and-availability disclaimer must be adjacent to the information or accessible through an allowed disclosure mechanism.

**Engineering interpretation:**  
Every Amazon price or availability component requires an associated disclaimer control. Publication is blocked when the required disclaimer cannot be rendered.

---

### REQ-0023 — Amazon textual-content disclaimer

**Source:** SRC-004  
When Amazon Product Advertising Content consisting of text is displayed, the site must show Amazon's required “content comes from Amazon” disclaimer in plain view.

**Engineering interpretation:**  
Pages displaying Amazon-originated titles, descriptions, features, or other textual Product Advertising Content require a plain-view source disclaimer. This is separate from the Associates earnings disclosure.

---

### REQ-0024 — Credentials and account identifiers

**Source:** SRC-004  
API calls require assigned credentials and an Associates tag. Private keys must remain secret and may not be sold, transferred, sublicensed, or disclosed. Assigned identifiers belonging to others may not be used.

**Engineering interpretation:**  
Credentials must remain server-side, secret-managed, access-controlled, and excluded from browser bundles, repositories, logs, analytics payloads, and generated pages.

---

### REQ-0025 — Credential incident response

**Source:** SRC-004  
The Associate is responsible for activity under its identifiers and should contact Amazon immediately if a private key is disclosed, lost, stolen, or suspected of unauthorized use.

**Engineering interpretation:**  
Mirabelle Labs requires a credential-revocation and Amazon-notification runbook, with audit evidence and publication safeguards.

---

### REQ-0026 — API compatibility responsibility

**Source:** SRC-004  
Amazon may change, deprecate, or republish its APIs, feeds, or features, and the Associate is responsible for remaining compatible with current requirements.

**Engineering interpretation:**  
The Amazon adapter must be versioned, monitored, and fail closed on incompatible responses. Compliance-source review is part of release maintenance.

---

### REQ-0027 — Rate and payload limits

**Source:** SRC-004  
Applications must respect applicable request-rate limits and may not send files exceeding 40 KB without prior written approval.

**Engineering interpretation:**  
The adapter requires centralized throttling, payload-size enforcement, retry controls, and observability.

---

### REQ-0028 — Termination cleanup

**Source:** SRC-004  
When the license terminates, use of Program Content must stop and affected Program Content and Amazon Marks must be removed or destroyed promptly.

**Engineering interpretation:**  
The platform requires a retailer kill switch that can suppress Amazon content and links across Hardware Radar without deleting independent Atlas records.

---

### REQ-0029 — Prohibited removal of notices

**Source:** SRC-004  
Notices of intellectual-property or proprietary rights included in APIs, data feeds, Product Advertising Content, or specifications may not be removed, obscured, or altered.

**Engineering interpretation:**  
Display transformations must preserve required notices and attribution. Sentinel must reject templates or CSS that hide them.

---

### REQ-0030 — Autonomous-agent transparency

**Source:** SRC-004  
An autonomous or semi-autonomous agent interacting with Program Content must identify itself in requests, disclose its agent name in the user-agent string, and must not conceal automation, defeat CAPTCHAs, or bypass access controls.

**Engineering interpretation:**  
Any future Mirabelle agent that directly accesses Amazon Program Content must use an explicit `Agent/<name>` identity and may only operate through permitted interfaces. No CAPTCHA bypass or human-behavior emulation is allowed.

---

## 6. Sentinel Rule Catalog — Initial IP License Rules

| Rule ID | Rule | Input | Pass condition | Failure action | Severity | Confidence |
|---|---|---|---|---|---|---|
| AMZ-011 | Approved Amazon content source | Mercury observation | Source method is an approved Amazon API or expressly approved feed | BLOCKED | CRITICAL | VERIFIED |
| AMZ-012 | Amazon content destination binding | Renderable content block | Amazon content resolves only to its relevant Amazon destination | BLOCKED | CRITICAL | VERIFIED |
| AMZ-013 | Amazon content semantic integrity | Amazon-originated content | No prohibited alteration; allowed truncation remains accurate | BLOCKED | HIGH | VERIFIED |
| AMZ-014 | Amazon image not self-hosted | Image reference | No downloaded/cached Amazon image asset; URL is unexpired | BLOCKED | CRITICAL | VERIFIED |
| AMZ-015 | Amazon image-reference freshness | Image reference | `expiresAt <= retrievedAt + 24h` and current time is before expiry | BLOCKED | CRITICAL | VERIFIED |
| AMZ-016 | Non-image content freshness | Amazon text/data | Current time is no later than 24 hours after retrieval | BLOCKED | CRITICAL | VERIFIED |
| AMZ-017 | Refresh evidence present | Amazon content | `retrievedAt`, `expiresAt`, source method, and retrieval evidence exist | BLOCKED | HIGH | VERIFIED |
| AMZ-018 | Price timestamp displayed | Price component | Required date/time stamp is rendered adjacent to price/availability | BLOCKED | HIGH | VERIFIED |
| AMZ-019 | Price disclaimer available | Price component | Required disclaimer is adjacent or available through allowed UI | BLOCKED | CRITICAL | VERIFIED |
| AMZ-020 | Amazon text disclaimer visible | Page | Required Amazon content disclaimer is in plain view when Amazon text is used | BLOCKED | CRITICAL | VERIFIED |
| AMZ-021 | Training exclusion | Data-export job | Amazon Program Content excluded from model-development export | BLOCKED | CRITICAL | VERIFIED |
| AMZ-022 | Analytics license gate | Analytics feature | No Amazon-content aggregation, repurposing, or historical analytics without approval | BLOCKED | CRITICAL | VERIFIED |
| AMZ-023 | Credentials server-side | Build/configuration | No private credential appears in client assets, repository, page, or logs | BLOCKED | CRITICAL | VERIFIED |
| AMZ-024 | Assigned identifiers only | API request | Credential and tag belong to Mirabelle Labs' approved account | BLOCKED | CRITICAL | VERIFIED |
| AMZ-025 | API limit enforcement | API request | Request complies with configured rate and payload limits | BLOCKED/RETRY | HIGH | VERIFIED |
| AMZ-026 | Termination kill switch | Platform state | Amazon content can be globally disabled and removed promptly | BLOCKED | CRITICAL | VERIFIED |
| AMZ-027 | Required notices preserved | Page/template | Required notices remain visible, legible, and unaltered | BLOCKED | HIGH | VERIFIED |
| AMZ-028 | Agent identity declared | Automated request | Agent identifies itself as required and does not bypass controls | BLOCKED | CRITICAL | VERIFIED |

---

## 7. Forge Publication Gates

Forge should evaluate Amazon publication readiness as a set of explicit gates:

```text
ATLAS_IDENTITY
MERCURY_SOURCE
MERCURY_FRESHNESS
AMAZON_LINK
AMAZON_IMAGE
AMAZON_TEXT
PRICE_DISCLOSURE
ASSOCIATE_DISCLOSURE
TRADEMARK
EDITORIAL
FINAL_PUBLICATION
```

A page cannot reach `READY` unless all applicable critical gates pass.

Example:

```text
ATLAS_IDENTITY          PASS
MERCURY_SOURCE          PASS
MERCURY_FRESHNESS       FAIL
AMAZON_LINK             PASS
AMAZON_IMAGE            PASS
PRICE_DISCLOSURE        FAIL
ASSOCIATE_DISCLOSURE    PASS
FINAL_PUBLICATION       BLOCKED
```

---

## 8. Mercury Data Requirements

The Amazon observation model should minimally support:

```text
amazonObservationId
atlasProductId
marketplace
asin
associateTag
sourceMethod
sourceApiVersion
retrievedAt
expiresAt
price
currency
availability
amazonDetailPageUrl
affiliateUrl
imageUrl
imageUrlExpiresAt
amazonTextFields
priceTimestampRequired
priceDisclaimerRequired
textDisclaimerRequired
licenseStatus
supersedesObservationId
validationStatus
```

### Storage classes

| Class | Examples | Retention approach |
|---|---|---|
| Durable identifiers | ASIN, Atlas mapping, internal observation ID | Durable while license/account remains applicable |
| Durable audit metadata | Retrieval time, rule result, source method, hashes where lawful | Retain according to internal audit policy |
| Ephemeral Amazon text/data | Price, availability, title, features | Maximum 24-hour cache unless a stricter rule applies |
| Ephemeral Amazon image reference | Image URL | Maximum 24-hour storage |
| Amazon image binary | Downloaded image | Prohibited |
| Independent product truth | Manufacturer specifications | Atlas rules, not Amazon cache rules |

---

## 9. Test Catalog — Initial Cases

| Test ID | Scenario | Expected result |
|---|---|---|
| TC-011 | Observation source is manual copy from an Amazon product page | AMZ-011 FAIL; publication BLOCKED |
| TC-012 | Amazon title links to a non-Amazon retailer | AMZ-012 FAIL; publication BLOCKED |
| TC-013 | Amazon feature text is rewritten in a way that changes meaning | AMZ-013 FAIL |
| TC-014 | Amazon image is downloaded into `/public/images/products/` | AMZ-014 FAIL |
| TC-015 | Amazon image URL is 25 hours old | AMZ-015 FAIL |
| TC-016 | Amazon price was retrieved 24 hours and 1 minute ago | AMZ-016 FAIL |
| TC-017 | Amazon price lacks `retrievedAt` | AMZ-017 FAIL |
| TC-018 | Price refreshed less frequently than hourly and has no visible timestamp | AMZ-018 FAIL |
| TC-019 | Price is shown without required availability disclaimer access | AMZ-019 FAIL |
| TC-020 | Amazon title is displayed without the Amazon content disclaimer | AMZ-020 FAIL |
| TC-021 | Dataset export includes Amazon API titles for model fine-tuning | AMZ-021 FAIL and security alert |
| TC-022 | Trend chart uses stored Amazon prices without approved-license evidence | AMZ-022 FAIL |
| TC-023 | API private key appears in frontend JavaScript | AMZ-023 FAIL and credential incident |
| TC-024 | API call uses an unapproved tracking tag | AMZ-024 FAIL |
| TC-025 | Adapter exceeds configured request rate | AMZ-025 throttles or rejects request |
| TC-026 | Amazon integration is disabled but Amazon content remains publicly visible | AMZ-026 FAIL |
| TC-027 | CSS hides a required Amazon notice | AMZ-027 FAIL |
| TC-028 | Automated browser conceals automation or attempts CAPTCHA bypass | AMZ-028 FAIL; operation terminated |

---

## 10. Immediate Engineering Consequences

### 10.1 Placeholder replacement cannot be based on copied Amazon pages

Until an approved Amazon API workflow is available, Hardware Radar should not populate Amazon-originated prices, availability, images, titles, or feature text by copying them from retail pages into production.

### 10.2 Atlas population may continue independently

Hardware Radar may continue building Atlas records from lawful, independently verified manufacturer sources. Those records must not be mislabeled as Amazon Program Content.

### 10.3 Public price history remains blocked

The current architecture must mark Amazon historical-price analysis as `LICENSE_REVIEW_REQUIRED`. Immutable observation metadata may be useful internally, but public or generalized analytics cannot be assumed permissible.

### 10.4 Amazon image strategy changes

The website should display Amazon API image URLs only while valid. It should not copy those image files into the repository or CDN.

### 10.5 Two separate disclosures are required

The system must distinguish:

1. the Associate relationship disclosure; and
2. the Amazon Product Advertising Content disclaimer.

Price and availability may also require a third, specific disclaimer.

---

## 11. Unresolved Questions

The following remain open and must not be guessed:

1. Exact Creators API eligibility and access path for the Hardware Radar account.
2. Current production rate limits and whether they vary by account performance.
3. Whether Amazon grants any additional retention rights through current Creators API specifications.
4. Whether Hardware Radar's planned comparison and ranking presentation requires additional Amazon-specific wording.
5. Exact operational treatment when API access is unavailable but independent Atlas content remains publishable.
6. Whether any proposed internal historical-observation use qualifies as prohibited aggregation, analysis, extraction, or repurposing.
7. Applicable Jamaican, U.S., and visitor-jurisdiction disclosure/privacy requirements.
8. Whether Hardware Radar should avoid all Amazon-provided textual content and use only independent Atlas/editorial text plus live price, availability, image URL, and affiliate destination.

Until resolved, material items should produce `REVIEW` or `BLOCKED`, not `READY`.

---

## 12. Research Log

| Session | Date | Sources | Outcome |
|---|---|---|---|
| RS-001 | 2026-07-18 | SRC-001, SRC-003 | Operating, disclosure, Special Link, and participation foundation reviewed |
| RS-002 | 2026-07-18 | SRC-004, SRC-005 | IP-license, caching, price, image, API credential, trademark, and agent requirements extracted |
| RS-003 | Planned | SRC-006 | Creators API operations, eligibility, authentication, limits, and migration review |
| RS-004 | Planned | SRC-008 | Applicable disclosure, advertising, privacy, and cross-border legal review |

---

## 13. Next Sprint

The next controlled research sprint is:

**Creators API Technical and Operational Specification**

Deliverables:

1. Creators API source register expansion;
2. access and eligibility requirements;
3. authentication and credential lifecycle;
4. endpoint/resource inventory;
5. response-field ownership mapping;
6. rate-limit and failure-handling rules;
7. Mercury Amazon adapter specification;
8. Sentinel API validators;
9. Forge manual fallback workflow;
10. launch-readiness dependency assessment.