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

Operator-curated RAM observations introduced by MVP-002 Increment 4 gain no E2S status during ingestion. Before E2S can qualify one, its retailer-specific curated adapter must be registered in the evaluated composition, an approved source-rights profile must resolve, and a separately approved production freshness policy must match the exact source/retailer context. Absence of any owner continues to fail closed.

## Assessment semantics

The immutable semantic result is one of:

- `CURRENT_MARKET_QUALIFIED`
- `CURRENT_MARKET_NOT_QUALIFIED`
- `BLOCKED`

It binds the canonical observation and digest, effective E2R review, Atlas product and retailer, provider/source/task/provenance, rights profile, compatible adapter metadata, explicit evaluation time, production freshness policy, derived freshness and confidence, live-market policy, condition, and availability. Assessment identity and binding digest are deterministic for identical owner state and evaluation time.

Every result explicitly denies publication, published, Current Price, live/public-price, Cheapest, Pick, ranking, and recommendation authority. E2S performs no mutation, provider call, paid task, or spend.

## Production freshness governance

The development 30-minute/120-minute freshness policy is not production policy. E2S resolves only explicitly approved, versioned policies scoped to source, Atlas retailer, and optional Atlas products. Missing, ambiguous, mismatched, malformed, or unsupported policy state fails closed.

E2S initially shipped with an intentionally empty production policy set. DF004-E2S.1 subsequently adds the first explicit provisional policy for DataForSEO Google Shopping at Platinummicro. Unmatched scopes still fail closed, and the development policy is never a production fallback.

## Adapter and confidence governance

The DataForSEO Google Shopping adapter implementation is shared, while compatibility is registered explicitly per Atlas retailer and marketplace. Approved registrations cover `RETAILER-0002` / `platinummicro.com` and `RETAILER-0003` / `memoryc.com`, both for API acquisition and normalization version `1.0.0`. Registration means the adapter exists, is active, matches the Atlas retailer, supports the marketplace and source method, and declares compatibility with the provenance normalization version. Adapter-ID presence alone is insufficient, and registration does not confer retailer identity, source rights, publication eligibility, or affiliate status.

Amazon's certified API and legacy manual normalization versions remain explicitly compatible. Confidence remains derived from observation validation, provenance validation, compatible adapter registration, freshness, and declared validation status. Operators cannot set confidence.

## Condition and rights

DataForSEO `product_condition` mapping is unchanged. Missing provider condition remains retained `null` and canonical `UNKNOWN`; known values normalize to their existing canonical enums. `UNKNOWN`, used, refurbished, and open-box conditions remain ineligible under the current live-market policy. E2S never infers `NEW`.

Existing source-rights policy independently requires current-observation, comparison, and public-display rights. Qualification does not weaken or replace rights governance.

MemoryC uses the existing DataForSEO rights profile; no MemoryC-direct or affiliate-derived rights were created. Its production-shaped fixture proves that compatible adapter registration plus CURRENT freshness can derive HIGH confidence while condition remains `UNKNOWN`. The resulting E2S assessment remains not qualified solely with `CONDITION_NOT_ELIGIBLE`; shipping remains unknown and is not an E2S gate.

## Publication integration and expiry

`PublicationWorkflowService` accepts the E2S qualification service through dependency injection and fails closed when its result is not qualified. Production publication composition requires that dependency explicitly; missing production E2S composition cannot fall back to the development freshness/confidence evaluator. Legacy fixture/development use may select the older evaluator only through the explicit non-required mode.

The governed public projection consumes the E2S-qualified candidate and its derived freshness/confidence result. It does not independently reinterpret production freshness, confidence, condition, adapter, or rights policy. This is an evaluation seam only, not publication PREPARE/EXECUTE governance. Existing append-only `PUBLISH`/`WITHDRAW` history and dynamic snapshot reevaluation remain unchanged: a previously authorized observation that becomes stale or otherwise ceases to qualify is excluded without rewriting its publication history.

## Diagnostic

```text
npm run market:current:qualify -- --observation-id=<ID> --evaluated-at=<ISO_TIME>
```

The diagnostic reads governed local state and the repository-owned production policy set. It performs no network, acquisition, review, publication, canonical, public-snapshot, or price mutation.
