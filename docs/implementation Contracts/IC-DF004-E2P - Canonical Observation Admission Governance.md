# IC-DF004-E2P — Canonical Observation Admission Governance

**Status:** Implemented — B-014A fixture-certified
**Increment:** DF004-E2P

## Purpose

E2P answers one record-specific question: when may an already retained and historically admitted DataForSEO evidence record become a canonical Mercury observation? It supplies the policy intentionally absent from E2H without changing historical, review, publication, current-price, freshness, ranking, or acquisition policy.

## Owner and lifecycle

Mercury owns the immutable `CANONICAL_OBSERVATION_ADMISSION` assessment and the narrow admission service. The lifecycle remains:

```text
retained evidence
→ E2G/E2H HISTORICAL_ELIGIBLE
→ E2J HISTORICAL_ADMITTED
→ E2P CANONICAL_ELIGIBLE
→ E2P CANONICAL_ADMITTED
→ existing observation review workflow
→ separate publication workflow
```

No state implies the next. Canonical admission makes the observation available to review; it does not approve review, authorize publication, create a public price, or assert freshness/currentness.

## Policy and binding

Policy `DF004-E2P-1.0` is restricted to `DATAFORSEO_GOOGLE_SHOPPING` and binds the canonical source-rights profile by deterministic hash. Required existing rights are API acquisition, current-observation use, historical retention, and durable audit metadata. Public-display rights remain a later publication concern and are not converted into publication authority here.

The assessment binds the exact retained evidence, matching `mer_hist_*` admission, Atlas product, Atlas retailer, provider/source, SELLERS task, raw-payload reference, canonical rights profile, evidence hash, historical-record hash, and policy version. Missing, malformed, substituted, conflicting, aggregate, or caller-supplied identity state fails closed. There is no ambient-time or freshness policy.

Second-and-later historical-refresh generations consume the same governed identity projection produced by E2G/E2J. E2P delegates chained identity reuse to the shared Mercury lineage owner and requires the complete retained-evidence and historical-observation chain; it does not reinterpret review decisions locally. Missing intermediate history, cycles, branches, substituted decisions/remediations/merchant or retailer bindings, provider drift, and ineffective identity state remain fail-closed. Direct-reviewed and one-hop evidence retain the same policy semantics.

Governed initial-acquisition history consumes the certified B-009A/B-010A `GOVERNED_INITIAL_ACQUISITION_BINDING` through the shared read-only initial-acquisition context owner also used by E2J. Detection comes from the exact retained-evidence membership in validated SELLERS retention lineage, not product, retailer, provider, or operator assertion. E2P reconstructs and supplies the same projection to E2G/E2H, while the retained record's stored identity remains immutable. Evidence that claims governed initial-acquisition lineage cannot fall back to generic identity semantics when the retention audit, proposal, Product Info validation, task chain, provider identity, Atlas lifecycle, or seller evidence is missing, contradictory, or substituted.

For this path, the E2P candidate binding additionally preserves the governed projection ID and merchant decision ID. Historical product/retailer, merchant-decision, raw-reference, and PRODUCTS/PRODUCT_INFO/SELLERS lineage must agree with the current projection. E2Q delegates to the E2P owner and therefore reconstructs this same context during both PREPARE and execution-time reassessment; it has no independent initial-acquisition resolver.

## Admission and replay

`CanonicalObservationAdmissionService` recomputes E2G/E2H and E2P from owner repositories, constructs through the existing DataForSEO canonical builder, validates the observation, and writes through the existing `ObservationAcceptanceRepository` implementation. It creates no parallel canonical repository.

Provider date-time strings are immutable evidence, not canonical serialization. The DataForSEO canonical builder parses the governed observation instant and emits canonical UTC ISO-8601 (`toISOString()`) for both `observationTime` and acquisition `retrievedAt`; retained evidence and historical records keep their original provider representation unchanged. Unparseable date-time input fails closed. Admission constructs and validates a provisional observation before allocating a durable `mer_obs_*` identifier, so validation failure creates neither an observation, idempotency entry, nor avoidable sequence advancement.

Idempotency key `E2P_CANONICAL_ADMISSION:<evidenceId>` permits one exact admission. Exact replay compares the observation instant semantically after parsing, so a valid provider representation and its canonical ISO serialization are equivalent. Exact replay returns `DUPLICATE`; conflicting product, retailer, provider task, provenance, or market material fails closed without allocating another identifier. Assessment is non-mutating and deeply immutable.

The older `DataForSeoHistoricalPromotionService` is retained only as a compatibility delegate. It requires an E2P admission service and rejects caller-supplied product resolution, merchant resolution, provider identity, or eligibility, closing its former DF003-only canonical bypass.

## Operator boundary

`npm run evidence:canonical:assess -- --evidence-id=<EVIDENCE_ID>` is read-only and zero-network. This increment exposes no production canonical-admission command and does not admit current production evidence.

Network/provider operations: `NONE`. Paid tasks: `NONE`. Actual spend: `$0.000`.

Fixture certification proved deterministic/deeply immutable assessment, exact candidate binding, read-only CLI behavior, compatibility-path bypass closure, exact replay idempotency, and fail-closed product, retailer, and provider-task replay conflicts. No production evidence was assessed or admitted.

## Downstream compatibility

Canonical observations enter the existing review/publication repositories. FM007/FM008 already represent canonical observations and their independently resolved review/publication states, so no Forge policy or projection schema change is required. Historical values remain `HISTORICAL_OBSERVATION`, with current/live/public/publication-authority flags false.
