# IC-DATAFORSEO-004E2J — Historical Observation Admission

**Status:** Implemented; B-013A governed operator boundary fixture-certified
**Increment:** DF004-E2J

## Boundary

E2J admits one retained DataForSEO evidence record into immutable internal Mercury history only after current E2G/E2H assessment returns `HISTORICAL_ELIGIBLE`. Retention does not imply history, and eligibility does not itself create a historical record.

Admission loads durable identity decisions and audit remediations, canonical Atlas product and retailer state, and the governed acquisition chain. Product must project `VERIFIED`; merchant must project `REGISTERED` through an actual Atlas-backed `RESOLVED` result. Missing, contradictory, malformed, or substituted state fails closed.

For evidence bound to a governed initial acquisition, E2J reuses the certified B-009A/B-010A `GOVERNED_INITIAL_ACQUISITION_BINDING` composition. The immutable retained DF003 identity is not rewritten. Claimed governed lineage cannot fall back to weaker generic resolution; the exact retention audit, proposal, PRODUCTS/PRODUCT_INFO/SELLERS tasks, provider identity, validation digests, active/ready Atlas product, retained evidence, and merchant decision must still agree.

## Record semantics

Historical observations use deterministic immutable `mer_hist_<16 lowercase hex>` IDs derived from the retained evidence ID. This distinct namespace prevents internal history from colliding with or impersonating canonical `mer_obs_` records. Append-only local persistence also binds the idempotency key `E2J_HISTORICAL_ADMISSION:<retainedEvidenceId>`, ensuring one retained observation enters history at most once.

The record stores original `observationTime` separately from `admittedAt`. Provider base price, total price, shipping, tax, currency, condition, availability, seller URL, and seller identity are copied losslessly. Null values remain null, and total price is never recomputed from unknown components.

Provenance binds the record to retained evidence, provider/source, raw payload reference, the PRODUCTS/PRODUCT_INFO/SELLERS task chain, and the product/merchant review decisions used during assessment. Provider payloads are referenced rather than duplicated.

## Governance

E2J requires:

- `historicalEligible = true`
- `canonicalEligible = false`
- `publicationEligible = false`

Admission neither invokes publication nor creates canonical eligibility. It does not modify Atlas, retained evidence, identity reviews, or audit remediation state.

The governed operator path separates assessment from mutation:

1. `PREPARE` recomputes E2G/E2H, the effective product/merchant projections, acquisition lineage, expected historical observation, and current `DATAFORSEO_GOOGLE_SHOPPING` source-rights profile. It writes only an immutable, expiring, single-use authorization.
2. The authorization binds the exact evidence, material evidence fingerprint, Atlas product, governed product projection, retailer, merchant decision, deterministic historical observation ID, acquisition chain, expected-observation digest, rights source, and rights-profile digest.
3. `EXECUTE` accepts only authorization ID, the literal confirmation token, and operator identity. It reloads current owner state, repeats assessment, rejects binding drift, delegates persistence to `HistoricalObservationAdmissionService`, and records one authorization consumption.

Required rights are API acquisition, historical retention, durable audit metadata, and historical analytics. Missing, denied, or source-conflicting rights fail closed. Retailer registration, affiliate status, and commercial outreach are not source-rights authority.

## Operations

The governed production commands are:

```text
npm run evidence:historical:prepare -- --evidence-id=<ID> --requested-by=operator:<label> --reason=<REASON>
npm run evidence:historical:execute -- --authorization-id=<ID> --confirm=ADMIT-HISTORICAL-OBSERVATION --executed-by=operator:<label>
```

PREPARE creates no history. EXECUTE creates historical evidence only. Both create no provider task, make no network call, spend `$0.000`, and confer no canonical, review, E2S, publication, Current Price, Cheapest, Pick, recommendation, or affiliate authority. The earlier direct command remains a legacy compatibility surface; governed initial-acquisition production admission uses the authorization path.
