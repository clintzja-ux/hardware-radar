# FM006 — Amazon Creators API Technical Verification Pass

**Status:** VERIFIED IMPLEMENTATION BASELINE — LIVE CREDENTIALS NOT YET EXERCISED  
**Date:** 2026-08-10  
**Scope:** Pre-implementation verification for `forge-mercury-sprint6-amazon-acquisition`

## 1. Decision

The certified Forge–Mercury workflow is ready to proceed to an Amazon acquisition foundation, but live production calls remain blocked until the Hardware Radar Amazon account, credential version, Partner Tag and current account allocation are confirmed operationally.

This verification updates the internal Creators API technical baseline and does not change Mercury v1.0, FM001–FM005, or FC001 compliance policy.

## 2. Current official technical contract

### 2.1 API transport

- Catalog base URL: `https://creatorsapi.amazon`.
- First operation: `POST /catalog/v1/getItems`.
- US marketplace: `www.amazon.com`.
- Required common headers include `Content-Type: application/json`, authorization, and `x-marketplace`.
- Request body carries `marketplace` and `partnerTag`.
- GetItems supports batching up to 10 ASINs per transaction.

### 2.2 Authentication is credential-version aware

The earlier v0.2 internal specification described only the v3.x Login with Amazon flow. Current official documentation also documents v2.x Creators API credentials. FM006 must therefore select authentication from the issued credential version.

For North America:

- v2.1 uses the regional Cognito token endpoint, form-encoded client-credentials scope `creatorsapi/default`, and includes the credential version in the API Authorization header.
- v3.1 uses `api.amazon.com/auth/o2/token`, JSON client credentials with scope `creatorsapi::default`, and a normal Bearer authorization header.
- both token families are documented at roughly one-hour lifetime and must be cached/reused.

No implementation may infer credential version from marketplace alone.

### 2.3 First product acquisition strategy

FM006 should use **GetItems by known ASIN**, not SearchItems, for the first production path. Atlas owns product identity; Amazon search ranking should not decide which canonical product an observation represents.

Initial resources should be intentionally minimal:

- `offersV2.listings.price`
- `offersV2.listings.availability`
- `offersV2.listings.condition`
- `offersV2.listings.merchantInfo`

The vended `detailPageURL` must be preserved without rewriting attribution parameters. ItemInfo and Images are deferred unless needed because they increase licensed-content/retention surface.

### 2.4 OffersV2 semantics

OffersV2 represents featured offer listings. Legacy Offers summary fields such as aggregate lowest price, highest price and offer count are not present and must not be reconstructed as if Amazon supplied them. Hardware Radar's cheapest-price comparison is performed across independent canonical retailer observations, not by relying on a removed Amazon summary field.

The acquisition client/adapter must explicitly handle MAP-related signals such as `violatesMAP` before a price is display eligible.

### 2.5 Rate governance

Amazon currently documents an initial allocation up to 1 TPS and 8,640 TPD for the initial period, followed by performance-dependent allocation. Those values remain defaults/upper initial guidance, not permanent constants.

The acquisition layer must:

- maintain account-configured current TPS/TPD;
- batch ASINs where appropriate;
- throttle centrally;
- preserve vended URL parameters for attribution;
- distinguish catalog throttling from token-endpoint throttling.

### 2.6 Error behavior

Creators API errors are structured. FM006 must map at least validation, authorization, throttling, not-found, server and unknown failures into the acquisition result contract.

`ThrottleException` may provide `retryAfterSeconds`. Token-expired responses require token renewal. Batched GetItems can return partial success, so each ASIN result/error is handled independently and never silently converted into a successful observation.

No API failure may fall back to manual page copying, legacy PRICE records, or placeholder prices.

## 3. Existing repository gap analysis

| Area | Current repository | FM006 required evolution |
|---|---|---|
| Amazon adapter | Normalization-only; MANUAL/IMPORT manifest | Add production API capability only behind approved acquisition client |
| Amazon normalizer | Generic pre-collected offer shape | Add explicit Creators API response mapping while retaining adapter isolation |
| Authentication | None | Server-side version-aware token provider/cache |
| HTTP transport | None | Injected Creators API client; no browser/Forge credentials |
| Partner Tag | No production client | Environment/config only; never source-controlled |
| Rate control | None | Central configurable TPS/TPD limiter |
| Errors | Adapter exceptions only | Structured acquisition results + bounded retry policy |
| Retention | FM002 supports source retention | Feed Creators API license/source classification into existing retention policy |
| Publication | FM005 governed | No change; Amazon remains subject to all FC001 gates |

## 4. FM006 implementation boundaries

FM006 **does** implement:

- a server-side Amazon Creators API acquisition client abstraction;
- version-aware authentication provider contracts;
- token caching/refresh behavior;
- GetItems request construction for Amazon.com;
- minimal OffersV2 resource selection;
- response/error normalization into acquisition results;
- rate-governance abstraction;
- Amazon adapter evolution from normalization-only to API-capable input;
- handoff into FM001 controlled ingestion;
- deterministic tests using injected fake transport/authentication.

FM006 **does not**:

- put credentials in Forge/browser code;
- commit credentials, Partner Tag or tokens;
- use manual Amazon page copying;
- enable Amazon historical analytics;
- bypass FM003 review or FM005 publication decisions;
- publish real Amazon data merely because the client can retrieve it;
- require live credentials to run the automated test suite.

## 5. Live-call gate

A real API request may be attempted only after all of these are confirmed outside source control:

1. Associates account is fully accepted and currently Creators API eligible.
2. Creators API application exists.
3. Credential ID/client ID, secret and **credential version** are known.
4. Correct Amazon.com Partner Tag is known.
5. Current account TPS/TPD is recorded.
6. Target ASIN is already mapped to the intended canonical Atlas product.
7. Secrets are loaded through server-side environment/configuration.
8. No secret or token is logged.

## 6. Verification outcome

**Technical documentation:** VERIFIED WITH AUTHENTICATION CORRECTION  
**FM006 architecture:** CLEARED FOR IMPLEMENTATION  
**Live Amazon call:** BLOCKED UNTIL OPERATIONAL GATE IS SATISFIED  
**FC001 compliance controls:** REMAIN IN FORCE  
**Historical Amazon analytics:** REMAIN BLOCKED BY DEFAULT
