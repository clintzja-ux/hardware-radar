# IC-MERCURY-RIGHTS-002 — Live Market Intelligence Policy

## Status

Implementation Candidate

## Objective

Establish Mercury's canonical current-market decision layer so Hardware Radar can rank only authorized, fresh, available, actionable offers while Historical Intelligence remains an optional rights-dependent capability.

## Scope

MR002 introduces:

- `LiveMarketPolicy`;
- `LiveMarketEligibility`;
- `LiveMarketIntelligence`;
- rights-aware current observation, comparison, and display gates;
- freshness-first current-market semantics;
- availability-before-ranking semantics;
- deterministic cheapest eligible offer selection;
- explicit `AVAILABLE` and `INSUFFICIENT_DATA` live-market states;
- integration with governed publication evaluation;
- regression coverage for rights, freshness, availability, ranking, and workflow behavior.

## Core Invariant

Only an authorized, technically valid, Atlas-resolved, currently available, sufficiently fresh and publication-eligible observation may participate in Mercury's Live Market.

## Required Rights

A live-market candidate requires explicit permission for:

- `live.currentObservation`;
- `live.comparison`;
- `live.publicDisplay`.

`BLOCKED`, `CONDITIONAL`, `CLARIFICATION_REQUIRED`, undeclared, and unknown rights do not authorize participation.

## Ranking Rules

Eligibility occurs before price ranking.

Therefore:

- stale or expired observations are excluded;
- unavailable observations are excluded;
- unresolved Atlas references are excluded;
- insufficient confidence is excluded;
- source-rights failures are excluded;
- invalid observations are excluded.

Eligible candidates are ranked by:

1. lowest price;
2. newest observation time when prices tie;
3. deterministic observation ID ordering as a final tie-breaker.

## Insufficient Data

If no candidate passes all live-market gates, the result is:

`INSUFFICIENT_DATA`

No legacy or historical fallback price is permitted.

## Historical Intelligence

M006 Historical Intelligence remains implemented and unchanged in purpose, but is not a dependency of Live Market Intelligence.

Historical analysis remains dormant for sources that do not explicitly permit historical retention and the relevant derivations.

## Publication Integration

`PublicationWorkflowService` now evaluates governed observations through the live-market eligibility contract. Existing explicit review and publication decisions remain required.

`REVIEWED` still does not mean `PUBLISHED`, and `PUBLISHED` does not permanently guarantee live eligibility.

## Non-Goals

MR002 does not:

- implement a new retailer adapter;
- make live third-party API calls;
- activate historical pricing;
- implement Beacon;
- collect user behavioral data;
- introduce legacy price fallbacks;
- alter Atlas canonical product ownership.

## Exit Criteria

MR002 is complete when:

- current-use rights are explicitly enforced;
- comparison rights are explicitly enforced;
- public-display rights are explicitly enforced;
- unknown rights fail closed;
- stale/expired evidence cannot rank;
- unavailable offers cannot rank;
- cheapest ranking considers only eligible evidence;
- no eligible evidence produces `INSUFFICIENT_DATA`;
- governed publication uses live-market eligibility;
- existing publication/review controls remain intact;
- existing Mercury tests remain green;
- Atlas and Sentinel regressions remain green;
- Forge and Hardware Radar remain operational.

MR002 — CERTIFIED ✅

IC-MERCURY-RIGHTS-002 — Live Market Intelligence Policy

Verification gate	Result
Mercury	82/82 PASS
Atlas	15/15 PASS
Sentinel	7/7 PASS
Public pages	PASS
Forge	PASS
Browser console	CLEAN