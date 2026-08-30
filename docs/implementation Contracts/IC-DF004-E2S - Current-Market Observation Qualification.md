# IC-DF004-E2S — Current-Market Observation Qualification

**Status:** Implemented — fixture-certified  
**Increment:** DF004-E2S  
**Policy version:** `DF004-E2S-1.0`

## Purpose

E2S deterministically answers whether one effectively `REVIEWED` canonical observation is currently qualified to enter independent publication-eligibility evaluation. Qualification is derived at an explicit evaluation time and is never persisted as mutable observation truth or a human decision.

The lifecycle remains:

```text
retained evidence
→ historical admission
→ E2P/E2Q canonical admission
→ E2R review
→ E2S current-market qualification
→ publication eligibility
→ future controlled publication authorization
→ dynamically governed public snapshot
```

No earlier stage grants authority owned by a later stage.

## Assessment semantics

The immutable semantic result is one of:

- `CURRENT_MARKET_QUALIFIED`
- `CURRENT_MARKET_NOT_QUALIFIED`
- `BLOCKED`

It binds the canonical observation and digest, effective E2R review, Atlas product and retailer, provider/source/task/provenance, rights profile, compatible adapter metadata, explicit evaluation time, production freshness policy, derived freshness and confidence, live-market policy, condition, and availability. Assessment identity and binding digest are deterministic for identical owner state and evaluation time.

Every result explicitly denies publication, published, Current Price, live/public-price, Cheapest, Pick, ranking, and recommendation authority. E2S performs no mutation, provider call, paid task, or spend.

## Production freshness governance

The development 30-minute/120-minute freshness policy is not production policy. E2S resolves only explicitly approved, versioned policies scoped to source, Atlas retailer, and optional Atlas products. Missing, ambiguous, mismatched, malformed, or unsupported policy state fails closed.

The repository-owned production policy set is intentionally empty in E2S. Consequently, the current production observation returns `BLOCKED` with `PRODUCTION_FRESHNESS_POLICY_MISSING`; freshness and confidence are not evaluated using a silent fallback. Fixture-only policies certify CURRENT, AGING, STALE, and expiry behavior without approving a production threshold.

## Adapter and confidence governance

The DataForSEO Google Shopping adapter is registered only for `RETAILER-0002`, `platinummicro.com`, API acquisition, and normalization version `1.0.0`. Registration now means the adapter exists, is active, matches the Atlas retailer, supports the marketplace and source method, and declares compatibility with the provenance normalization version. Adapter-ID presence alone is insufficient.

Amazon's certified API and legacy manual normalization versions remain explicitly compatible. Confidence remains derived from observation validation, provenance validation, compatible adapter registration, freshness, and declared validation status. Operators cannot set confidence.

## Condition and rights

DataForSEO `product_condition` mapping is unchanged. Missing provider condition remains retained `null` and canonical `UNKNOWN`; known values normalize to their existing canonical enums. `UNKNOWN`, used, refurbished, and open-box conditions remain ineligible under the current live-market policy. E2S never infers `NEW`.

Existing source-rights policy independently requires current-observation, comparison, and public-display rights. Qualification does not weaken or replace rights governance.

## Publication integration and expiry

`PublicationWorkflowService` accepts an optional E2S qualification service and fails closed when its result is not qualified. This is an evaluation seam only, not publication PREPARE/EXECUTE governance. Existing append-only `PUBLISH`/`WITHDRAW` history and dynamic snapshot reevaluation remain unchanged: a previously authorized observation that becomes stale is excluded without rewriting its publication history.

## Diagnostic

```text
npm run market:current:qualify -- --observation-id=<ID> --evaluated-at=<ISO_TIME>
```

The diagnostic reads governed local state and the repository-owned production policy set. It performs no network, acquisition, review, publication, canonical, public-snapshot, or price mutation.
