# Amazon Creators API Technical & Operational Specification

**Document ID:** AMZ-CREATORS-SPEC  
**Version:** 0.2  
**Status:** Verified Technical Baseline — Production Controls Pending  
**Owner:** Mirabelle Labs  
**Last verified:** 2026-08-09

---

# 1. Purpose

This specification defines the verified technical baseline for Hardware Radar's Amazon Creators API integration. It constrains later implementation in Mercury, Sentinel and Forge; it is not itself implementation code.

Amazon's controlling agreements, policies and current Creators API documentation supersede this internal specification if they conflict.

# 2. Production acquisition decision

Creators API is the supported Amazon catalog API and the production acquisition target for Amazon Product Advertising Content. PA-API 5.0 is deprecated.

Manual copying from Amazon retail pages is not an approved Hardware Radar production ingestion method.

# 3. Architectural position

```text
Amazon Creators API
        │
        ▼
Server-side Amazon Acquisition Client
        │
        ▼
Amazon Adapter / Normalizer
        │
        ▼
Mercury + source-aware retention controls
        │
        ▼
Sentinel / Amazon compliance gates
        │
        ▼
Forge review / publication orchestration
        │
        ▼
Published intelligence artifact
        │
        ▼
Hardware Radar
```

Hardware Radar browser code must never call Amazon Creators API directly.

# 4. Enrollment and credentials

Current Amazon documentation states that Creators API registration is available to accepted Associates who have referred qualified sales. Only the primary account owner can register an application.

Credentials must remain server-side and outside source control, browser bundles, logs and generated pages.

# 5. Authentication

Creators API uses Login with Amazon OAuth client-credentials authentication.

Current token behavior:

- grant type: `client_credentials`;
- scope: `creatorsapi::default`;
- token type: bearer;
- documented access-token lifetime: 3,600 seconds;
- token should be cached/reused until near expiry rather than fetched for every API request.

Regional token endpoints differ, while the catalog API endpoint is common.

# 6. API endpoint and marketplace

Current catalog endpoint:

`https://creatorsapi.amazon`

Marketplace is selected through the required marketplace request context. Hardware Radar's initial scope remains Amazon.com / United States and requires the correct Partner Tag for that marketplace.

# 7. Operations and resources

Current principal operations include:

- `GetItems`
- `SearchItems`
- `GetVariations`
- `GetBrowseNodes`

Relevant high-level resources include:

- `OffersV2`
- `ItemInfo`
- `Images`
- `BrowseNodeInfo`
- `BrowseNodes`
- `ParentASIN`
- `SearchRefinements`
- `VariationSummary`

`OffersV2` is the required current offer-resource family for offer listing data. It exposes price, availability, condition, merchant information and related offer fields.

# 8. Rate limits

Amazon documents both TPS (transactions per second) and TPD (transactions per day).

The documented initial allocation is up to:

- 1 TPS;
- 8,640 TPD;
- for the first 30-day period after credential creation.

Later allocation is performance-dependent and updated based on shipped revenue. Access can also be affected by lack of qualifying referred sales.

Therefore no static platform constant may be treated as the permanent account allocation. Forge/operations must record the current account allocation and the acquisition client must enforce it centrally.

# 9. Caching and retention

Current Creators API best-practice guidance is resource-specific:

| Resource class | Current documented TTL |
|---|---:|
| Offers | 1 hour |
| BrowseNodeInfo | 1 hour |
| Other listed fields/resources such as BrowseNodes, DetailPageURL, Images, ItemInfo | 1 day |

Customer information derived from Amazon must not be cached.

These TTLs are operational/license constraints, not Mercury market-freshness classifications. The stricter applicable rule controls.

For Hardware Radar, Amazon price and availability from `OffersV2` must therefore be treated as ephemeral offer content with an expiry no later than one hour after retrieval under the current guidance.

# 10. Link and Partner Tag integrity

The correct Partner Tag must be supplied. Amazon-vended links must retain their attribution parameters; Hardware Radar must not rewrite them in a way that breaks attribution.

# 11. Mercury observation contract

Each successful approved retrieval may create a canonical Mercury observation, but durable observation identity must be separated from ephemeral licensed payload semantics.

Required durable/audit context includes, subject to controlling terms:

- observationId
- atlasProductId
- retailerId
- marketplace
- ASIN mapping
- retrievedAt
- sourceMethod
- API/adapter version
- request/audit metadata where lawful
- validation/compliance outcomes

Ephemeral Amazon fields may include:

- price
- currency
- availability
- offer condition
- merchant/offer data
- Amazon text
- image URL
- detail/affiliate URL

Each licensed field/resource requires a source class and expiry appropriate to its controlling TTL.

# 12. Historical intelligence

Creators API technical availability does not grant Hardware Radar permission to retain Amazon Program Content indefinitely or use it for historical analytics.

Until the applicable license question is separately resolved:

`AMAZON_PROGRAM_CONTENT -> MERCURY_HISTORICAL_INTELLIGENCE = BLOCKED`

This does not disable M006 for independent or otherwise permitted sources.

# 13. Failure handling

The acquisition layer must distinguish at least:

- `PASS`
- `RETRY`
- `RATE_LIMITED`
- `AUTH_FAILED`
- `INVALID_RESPONSE`
- `LICENSE_BLOCK`
- `UNKNOWN`

429 and retryable server errors require bounded retry/backoff behavior and respect for `Retry-After` where supplied. Token-expiry failures require token renewal rather than publication fallback.

Only a validated `PASS` path may progress toward publication.

# 14. Sentinel / publication gates

Initial Amazon-specific gates include:

- approved Creators API source;
- credential/Partner Tag context valid;
- required fields/resources present;
- resource-specific expiry valid;
- affiliate/vended-link integrity;
- timestamp/disclaimer rendering capability;
- image-storage policy;
- historical-analytics exclusion;
- retailer kill switch;
- required notices/disclosures available.

Failure of a critical Amazon gate blocks publication.

# 15. Forge workflow

```text
Acquire through approved client
        ↓
Normalize through registered Amazon adapter
        ↓
Validate canonical observation
        ↓
Apply Amazon source/license gates
        ↓
Store permitted observation/audit state
        ↓
Forge review
        ↓
READY / REVIEW / BLOCKED
        ↓
Publication eligibility
```

Forge orchestrates this process. Forge does not manufacture canonical Mercury observations or bypass source policy.

# 16. Remaining open operational questions

The following remain deployment-specific and must not be guessed:

1. Whether the Hardware Radar account is currently eligible/enrolled and has active Creators API credentials.
2. Current account-specific TPS and TPD allocation at deployment time.
3. Exact first-operation/resource request set for FM001.
4. Exact current Partner Tag to use for Amazon.com.
5. Whether Amazon grants any additional retention/aggregation/history rights beyond the baseline currently documented.
6. Final rendering placement for all required disclosures and timestamps.

# 17. Definition of done for FM001 dependency

This specification is sufficient to begin FM001 design when:

- Creators API is the only production Amazon acquisition path unless another path is expressly approved;
- OAuth/token behavior is represented server-side;
- resource-specific TTL is modeled separately from generic freshness;
- source/license metadata is represented;
- historical intelligence fails closed for Amazon Program Content;
- publication gates fail closed;
- credentials and Partner Tag remain operational secrets/configuration;
- manual/test normalization cannot become production-publishable Amazon data.
