# IC-DATAFORSEO-004E2L.4 — Refresh Identity Reuse Integration Into Promotion Assessment

**Status:** Implemented
**Increment:** DF004-E2L.4

## Durable reuse governance

E2L.3 already persisted its explicit `HISTORICAL_REFRESH_IDENTITY_REUSE` assessments in the historical-refresh retrieval result envelope. E2L.4 reuses that state rather than creating copied identity-review decisions. The promotion CLI loads the persisted retrieval envelope and refresh plan, then produces an immutable governed binding for each assessment before projection.

The governed record deterministically binds its assessment ID, source and target evidence, refresh plan, authorization, new SELLERS task, Atlas product, original product and merchant decision IDs, canonical retailer, provider identity, compatibility dimensions, outcome, assessment time, and retrieval provenance. Substitution or malformed binding fails closed. New E2L.3 results emit this governed form directly; the existing certified envelope is validated and upgraded in memory without mutating production state.

## Effective identity

Raw retained identity and `eligibilityAtRetention` remain immutable audit truth. Effective identity may evolve only through explicit governance:

- original evidence can use approved evidence-bound review decisions;
- refresh evidence requires an exact governed reuse assessment with outcome `APPLICABLE`;
- `REVIEW_REQUIRED` does not project VERIFIED or REGISTERED;
- `BLOCKED`, malformed, missing, duplicated, or substituted reuse fails closed.

An applicable record still requires the referenced original decisions to be effective and evidence-bound. It does not broaden those decisions globally.

## Eligibility and aggregation

E2G recomputes current DF003 eligibility from the effective VERIFIED product projection and Atlas-backed REGISTERED merchant projection. Retention-time `REVIEW_REQUIRED` is preserved but does not permanently block later governed reassessment.

Multi-evidence stability compares current effective Atlas product and canonical retailer identities. Different raw retention-time outcomes such as PROBABLE and RESOLVED are not instability when both records effectively resolve to the same VERIFIED product and REGISTERED retailer.

E2H may therefore return `HISTORICAL_ELIGIBLE`. Canonical and publication eligibility remain false because those policies are separate and missing. E2J admission remains an explicit operator action and is never invoked by assessment.
