# IC-DATAFORSEO-004E2J — Historical Observation Admission

**Status:** Implemented  
**Increment:** DF004-E2J

## Boundary

E2J admits one retained DataForSEO evidence record into immutable internal Mercury history only after current E2G/E2H assessment returns `HISTORICAL_ELIGIBLE`. Retention does not imply history, and eligibility does not itself create a historical record.

Admission loads durable identity decisions and audit remediations, canonical Atlas product and retailer state, and the governed acquisition chain. Product must project `VERIFIED`; merchant must project `REGISTERED` through an actual Atlas-backed `RESOLVED` result. Missing, contradictory, malformed, or substituted state fails closed.

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

## Operations

`npm run evidence:historical:admit -- --evidence-id=<ID> --admitted-by=<OPERATOR>` performs only local reads, assessment, construction, validation, and durable admission. It creates no provider task, makes no network call, and spends `$0.000`.
