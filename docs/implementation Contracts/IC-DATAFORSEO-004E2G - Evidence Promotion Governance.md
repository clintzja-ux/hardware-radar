# IC-DATAFORSEO-004E2G — Evidence Promotion Governance

## Objective

Add a Mercury-owned, deterministic, fail-closed assessment between retained DF003 market evidence and every later eligibility boundary.

## Contract

1. Assessment reads retained evidence without mutation.
2. Every result exposes a promotion state, independent eligibility booleans, machine-readable reasons, and evidence/provenance dimensions.
3. The assessor recomputes certified DF003 eligibility and blocks contradictions with the eligibility stored at retention.
4. `PROBABLE` product identity and `DISCOVERED` merchant identity cannot enter history, canonical observations, or publication.
5. Malformed, contradictory, unsupported, or unknown governed state fails closed.
6. Evidence confidence cannot mutate Atlas product or retailer identity.
7. Publication cannot be reached from pre-canonical retained evidence; it remains subject to canonical review and publication governance.
8. No threshold is invented where no certified rule exists.

## Operational boundary

`npm run evidence:promotion:assess` reads the local DataForSEO market-evidence repository and prints an operator assessment. It contains no acquisition client, credential loader, paid-task creator, or network operation. Actual spend is `$0.000`.

Unattended LIVE acquisition, scheduler LIVE authority, automatic identity override, and operational promotion are outside this increment.

## Certified real case

For Atlas product `ram_corsair_cmk32gx5m2b6000z30`, seller Platinummicro, product identity `PROBABLE`, merchant identity `DISCOVERED`, and one retained acquisition chain:

- state: `REVIEW_REQUIRED`
- historical eligible: `false`
- canonical eligible: `false`
- publication eligible: `false`

## Verification

- current retained case remains review-only
- invalid/contradictory evidence is blocked
- unknown/incomplete evidence fails closed
- identical input is deterministic
- input remains unchanged
- stored DF003 eligibility cannot be bypassed
- CLI assessment requires no network or paid execution
