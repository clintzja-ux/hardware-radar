# IC-MERCURY-PER-EVIDENCE-HISTORICAL-ADMISSION-001

## Status

`IMPLEMENTED / FIXTURE-CERTIFIED / PRODUCTION-RECOVERED`

## Boundary

Bounded repeat-result processing evaluates historical eligibility independently for every retained evidence row. An ineligible row remains retained-only and cannot abort later eligible siblings. Eligible siblings use the existing E2J historical-admission identity and repository; all-ineligible results remain fail closed. Mixed results complete with authoritative row-level `historicalObservationIds` and `skippedEvidence` rather than implying every retained row became history.

Recovery reuses `MERCURY-IMMUTABLE-RESULT-REPROCESSING-1.0`. It resolves one canonical immutable provider result, exact preparation/run/member/source/operation/rights lineage, current policy, existing evidence identities, and existing historical identities. Audit actions and events are append-only. Exact replay is idempotent; conflicts fail closed. Original task, execution, provider result, repeat-run state, member outcome, and exception remain immutable.

## Production correction

Run `mer_repeatrun_743625479d2d502f313633e6` retained 118 Amazon rows. Ten had genuinely null item prices; 49 further rows had finite positive normalized prices but were skipped when member processing stopped at the first ineligible sibling. Ten canonical immutable results were assessed under the existing recovery owner. Nine actions succeeded and admitted 49 facts; one all-ineligible action remained `STILL_UNPROCESSABLE`. Evidence stayed 204, history moved from 139 to 188, and ten null-price rows remain retained-only. Provider calls, retrievals, paid tasks, retries, replacements, and spend were zero.

## Authority isolation

This boundary adds historical observations only. It grants no canonical-observation, review, publication, Current Price, Cheapest, Pick, recommendation, public-snapshot, or provider authority. It does not change historical-admission policy or Amazon/Google normalization.

## Certification

Fixtures cover ineligible→eligible, eligible→ineligible, eligible→ineligible→eligible, multiple mixed siblings, all eligible, all ineligible, replay/restart, existing evidence/history, conflict handling, source-neutral bounded processing, and immutable original-run preservation. The full repository suite passed before production recovery.
