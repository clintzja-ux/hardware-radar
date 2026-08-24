# IC-DATAFORSEO-004E2M — Governed Refresh Historical Admission

**Status:** Implemented  
**Increment:** DF004-E2M

## Admission boundary

Historical refresh evidence enters E2J only through an explicit evidence-scoped admission. Aggregate promotion eligibility is insufficient: E2J reassesses exactly the requested retained evidence with its current durable reviews, remediations, Atlas registry, and governed E2L identity-reuse binding. The binding must be `APPLICABLE` and must still validate its source and target evidence, refresh plan, authorization, SELLERS task, Atlas product, retailer, decisions, and governed provider identity.

Missing, malformed, conflicting, substituted, `REVIEW_REQUIRED`, or `BLOCKED` reuse fails closed. Reuse does not broaden original E2I decisions or create replacement decisions. The referenced original decisions must remain effective and the retailer must still resolve in Atlas.

## Historical refresh provenance

The E2J historical schema retains its existing record and deterministic ID contract. Its acquisition provenance has a backward-compatible `HISTORICAL_REFRESH` variant containing the refresh SELLERS task, refresh plan, authorization, governed reuse assessment ID, source evidence ID, and reused provider identity. It deliberately contains no fabricated PRODUCTS or PRODUCT_INFO task IDs. Initial-acquisition records retain their existing three-task representation unchanged.

Market values, raw result reference, and `observationTime` come from the refresh evidence. `admittedAt` remains separate. Evidence identity—not price equality—distinguishes observations, so same-price observations from different governed acquisition cycles remain independent history records.

## Governance and operations

Admission preserves `canonicalEligible=false` and `publicationEligible=false`, creates no `mer_obs_*` record, and invokes no publication path. It does not mutate evidence, retention-time eligibility, Atlas, identity reviews/remediations, refresh governance, or acquisition ledgers.

The existing local command remains:

`npm run evidence:historical:admit -- --evidence-id=<EVIDENCE_ID> --admitted-by=<OPERATOR>`

It loads applicable refresh result and plan state generically when the requested evidence is a governed refresh. Admission is replay-safe through `E2J_HISTORICAL_ADMISSION:<retainedEvidenceId>` and performs no acquisition or spend.
