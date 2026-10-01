# IC-MERCURY-IMMUTABLE-RESULT-REPROCESSING-001

## Status

Implemented and fixture-certified. Production use remains limited to explicitly eligible immutable results and exact operator confirmation.

## Boundary

Mercury may reprocess already-acquired immutable provider results after a reusable source-processor defect has been corrected. Reprocessing creates no provider request, paid task, replacement task, retry, acquisition authorization, or downstream market authority.

Certified read-only operator projections may expose the immutable action and append-only effective event state alongside the unchanged original run/member outcome. That projection is not another persistence owner and must not collapse recovered effective processing into a rewritten original success.

The generic coordinator owns eligibility, exact lineage validation, operator attribution, deterministic action identity, append-only audit events, idempotent composition, and effective-state reporting. Existing source-specific processors continue to interpret provider payloads. Existing DF003 and historical-admission owners continue to own evidence and history idempotency.

## Eligibility

An action requires one canonical immutable result, one exact repeat preparation/task/authorization lineage, one original terminal member exception, a registered processor explicitly supporting that exception, current identity and source-rights validation, and exact source/operation/result bindings. Successful original members, unknown exception classes, ambiguous lineage, missing results, rights drift, and source/operation substitution fail closed.

## Historical truth and audit

The original bounded run and member are never modified. The original execution outcome remains authoritative for what happened during that run. Reprocessing is represented separately by an immutable action and append-only `STARTED`, `SUCCEEDED`, `STILL_UNPROCESSABLE`, `CONFLICT`, or `SYSTEMIC_FAILURE` events. A successful event references resulting evidence and historical observations.

The action is deterministic for the result, original lineage/exception, current processor version, and rights binding. Exact replay returns the prior effective result. Conflicting operator/reason material fails closed. SQLite `BEGIN IMMEDIATE` serialization protects action/event recording; DF003 and historical repositories retain their existing single-writer/idempotency rules.

Source processing may legitimately retain raw seller evidence that is not itself eligible for historical fact admission, such as an item without a governed item price. The coordinator records that evidence and its fail-closed admission reason separately, admits only the evidence that passes the canonical historical assessment, and requires at least one eligible historical fact for a successful action. It never coerces an ineligible row or rolls back valid append-only raw evidence.

## D1 source support

The first registered source processor is `DATAFORSEO_AMAZON / AMAZON_SELLERS`, processor `DATAFORSEO-AMAZON-SELLERS-D1-1.0`, for original `DATAFORSEO_AMAZON_MONEY_INVALID` failures. The processor delegates to the existing repeat-result processing owner and corrected Amazon Sellers normalizer. Amazon money policy does not move into the generic coordinator.

## Authority exclusion

Reprocessing grants no canonical observation, review, E2S, publication, Current Price, public-price, Cheapest, Pick, affiliate, or recommendation authority. D2 Forge projection correction remains a separate increment.
