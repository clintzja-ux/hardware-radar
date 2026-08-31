# IC-DF004-E2S.1 — Initial Provisional Production Freshness Policy

**Status:** Implemented — fixture-certified  
**Increment:** DF004-E2S.1  
**Policy:** `mer_current_market_dataforseo_platinummicro_v1` version `1.0.0`

## Approved scope

The first E2S production freshness policy is explicitly approved and narrowly bound to:

- provider `DATAFORSEO`;
- source `DATAFORSEO_GOOGLE_SHOPPING`;
- Atlas retailer `RETAILER-0002`;
- marketplace `platinummicro.com`.

The policy status is `PROVISIONAL`, effective `2026-08-30T00:00:00.000Z`, with approval basis `EXPLICIT_OPERATOR_APPROVAL_DF004_E2S.1`. Other providers, sources, retailers, marketplaces, or malformed/ambiguous policies fail closed. There is no universal production fallback.

## Classification

Using immutable market `observationTime` and an explicit evaluation time:

- age less than or equal to 6 hours is `CURRENT`;
- age greater than 6 hours and less than 24 hours is `AGING`;
- age greater than or equal to 24 hours is `STALE`.

The exact thresholds are `currentUntilMs=21600000` and `staleAfterMs=86400000`. Existing explicit expiry remains stronger: an observation at or after its explicit expiry is `STALE` regardless of age.

Six hours is a maximum eligibility age, not a refresh cadence, scheduler interval, acquisition promise, or guarantee of continuous coverage. The independently governed historical-refresh cadence remains unchanged.

## Rationale

Independent market evidence must be sufficiently recent to participate in current-market evaluation. The former 30-minute development threshold was never approved production policy. Six hours provides a provisional balance between shopper usefulness and paid independent-acquisition economics; the 24-hour boundary preserves an aging period without presenting day-old evidence as current. Hardware Radar does not require continuous current coverage, and observations may age out rather than forcing acquisition. Real Mercury and Beacon evidence should later inform reassessment.

## Preserved boundaries

Freshness does not override condition, confidence, adapter, rights, review, or publication policy. `UNKNOWN` condition remains ineligible and is never inferred as `NEW`. Confidence remains derived and requires every governed signal, including CURRENT freshness and compatible adapter evidence.

E2S qualification continues to grant no publication, published, Current Price, live/public-price, Cheapest, Pick, ranking, or recommendation authority. This increment performs no refresh, provider call, paid task, canonical/review/publication mutation, or public-snapshot mutation.

## Production diagnostic

At `2026-08-30T23:00:00.000Z`, `mer_obs_000000001` resolves this policy but remains `CURRENT_MARKET_NOT_QUALIFIED`. Its exact blockers are:

- `FRESHNESS_NOT_ELIGIBLE`;
- `CONFIDENCE_NOT_ELIGIBLE`;
- `CONDITION_NOT_ELIGIBLE`.

The immutable August 21 observation evaluates `STALE`, derived confidence is `LOW`, and condition remains `UNKNOWN`. All downstream authorities remain false and protected production hashes remain unchanged.
