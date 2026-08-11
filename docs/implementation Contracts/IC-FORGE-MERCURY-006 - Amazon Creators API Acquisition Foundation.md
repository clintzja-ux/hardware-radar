# IC-FORGE-MERCURY-006 — Amazon Creators API Acquisition Foundation

Status: IMPLEMENTED — AWAITING USER VERIFICATION

## Objective
Create a testable, server-side Amazon Creators API acquisition boundary that converts an approved GetItems/OffersV2 response into an FM001 ingestion request without bypassing compliance, canonical ingestion, review, or publication controls.

## Implemented scope
- version-aware injected token provider with token caching/invalidation;
- centralized rate governor;
- GetItems client for 1–10 known ASINs;
- minimum OffersV2 resource request;
- bearer authentication and marketplace headers;
- bounded retry for authentication, throttling, and retryable server failures;
- acquisition-service mapping into `sourceMethod: API` and `licenseContext: AMAZON_CREATORS_API`;
- Amazon adapter API normalization support;
- no live network calls or embedded credentials;
- no SearchItems-based identity discovery;
- no direct publication behavior.

## Explicitly out of scope
Live credentials, account enrollment, production secrets storage, real Amazon calls, automated scheduling, SearchItems discovery, and publication of real Amazon data.

## Verification target
Mercury 68/68; Atlas 15/15; Sentinel 7/7; repository/public-boundary tests pass; Forge/site regressions remain clean.


C-FORGE-MERCURY-006 — CERTIFIED ✅

Final verification:
| Gate                       |                   Result |
| -------------------------- | -----------------------: |
| Mercury                    |           **68/68 PASS** |
| Atlas                      |           **15/15 PASS** |
| Sentinel                   |             **7/7 PASS** |
| Forge                      |                 **PASS** |
| Hardware Radar pages       |                 **PASS** |
| Browser console            |                **CLEAN** |
| Amazon credentials exposed |                 **None** |
| Live Amazon calls          | **None — intentionally** |


