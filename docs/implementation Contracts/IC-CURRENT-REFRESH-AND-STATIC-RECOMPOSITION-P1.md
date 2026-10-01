# IC-CURRENT-REFRESH-AND-STATIC-RECOMPOSITION-P1

Status: IMPLEMENTED / FIXTURE-CERTIFIED / NO EXECUTION AUTHORITY

## Purpose

Keep the static RAM experience operable under a 36-hour Current ceiling without allowing expiry of Current authority to erase durable certified public intelligence.

## Ownership

No owner changes. Atlas remains canonical product knowledge. Mercury Current owns qualified current offers; Mercury History owns durable observations; existing effective-comparability, destination, acquisition, source-conflict and manual-review owners remain authoritative. Sentinel remains the one static release-control owner. Forge and Beacon consume operational projections only.

## Split authority contract

Portfolio schema `1.1` / policy `RAM-PUBLIC-INTELLIGENCE-RELEASE-P1-1.1` binds two domains under the existing release owner:

- `durablePortfolio`: catalog, routes, effective History, chronology, historical Terminal intelligence and independently governed destinations. It does not expire merely because Current expires.
- `ephemeralCurrent`: qualified Current offers and every freshness-dependent claim. It expires at the earliest bound offer expiry.

Schema `1.0` retains its historical coupled meaning. It is validated and replayed unchanged; the new semantics apply only to newly prepared `1.1` portfolios.

After Current expiry, the release evaluator returns `EXPIRED_DURABLE_ONLY`. The builder consumes the certified empty-Current and History-preserving Terminal artifacts from the same immutable bundle. Product/catalog routes remain; current price, current market statistics and Offer data disappear; History and chronology remain. History is never promoted to Current.

## Current refresh planning

`CURRENT_REFRESH_PLAN` is immutable, deterministic and zero-authority. PREPARE reads canonical Atlas, Current, destinations, manual-inventory, History identity lineage and governed daily spend. It projects 6/12/24-hour expiry, retailer/product loss, stale/uncovered state, destination/review exceptions, available source lanes, a bounded cohort and maximum cost.

Priority is fixed at:

1. product loses all Current;
2. product loses one retailer;
3. stale/uncovered coverage;
4. routine refresh.

Supported projections are `MANUAL_AMAZON`, `MANUAL_NEWEGG`, `DATAFORSEO_AMAZON_SELLERS`, `DATAFORSEO_AMAZON_PRODUCTS_PLUS_SELLERS`, `DATAFORSEO_GOOGLE_SHOPPING`, and `RAKUTEN_NEWEGG`. Lane states are `ROUTINE_READY`, `READY_WITH_REVIEW`, `RESEARCH_ONLY`, `BLOCKED`, or `NOT_APPLICABLE`. Amazon Products alone is not a Current offer. Rakuten is Current-capable but History-prohibited. Manual remains first-class.

Amazon tasks are bounded at `$0.0015`; Google tasks at `$0.0010`; UTC-day spend at `$0.0750`; automatic paid retries are zero. PREPARE/INSPECT create no provider call, task, spend, authorization, release or deployment authority.

## Commands

```text
npm run retail-current:refresh:prepare -- --as-of=<ISO_TIMESTAMP> [--maximum-members=<N>]
npm run retail-current:refresh:inspect -- --plan-id=<PLAN_ID>
```

The ignored plan artifact is suitable for operator inspection and future Forge projection. UI controls, scheduling, provider execution, automatic certification, production release and deployment are outside P1.

## Recomposition and operating order

The near-term architecture remains static:

```text
bounded refresh → existing qualification/history/conflict owners → portfolio recomposition
→ Sentinel certification → explicit release/deployment authorization
```

Recomposition grants no release authority. A scheduler may eventually invoke PREPARE/INSPECT and existing source-specific executors, but P1 adds no scheduler and no paid START.

## Failure policy

Existing Current remains valid only until its true expiry. If fresh recomposition cannot complete, the safe deployment target is the certified durable-History/empty-Current portfolio. Known-stale Current must not remain the intended deployed state.

For the October 2 release boundary, operational targets are: refresh start before the 12-hour bucket, recomposition/certification before the 6-hour bucket, and deployment before the earliest expiry. These are operating deadlines, not artificial observation timestamps.

## Monitoring seams

The plan contract exposes expiry buckets, loss state, lanes, budget, exceptions and recomposition readiness for Forge. Forge UI work is deferred. Beacon may later monitor coverage, provider health, refresh outcome, spend, release-expiry proximity, deployment result and public-artifact age; it never calculates price truth.

## Certification

Fixtures prove legacy `1.0` remains coupled, `1.1` remains exposed after Current expiry, Current becomes empty, all 103 products remain, 410 comparable observations remain in Terminal/chronology, and the planner is deterministic, bounded and zero-authority.
