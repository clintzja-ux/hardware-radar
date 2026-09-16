# IC-FORGE-MERCURY-P1B — Cohort Operations and Exception Projection

Status: implemented, production-shaped repeat projection corrected, fixture-certified, and operator-visibility-confirmed

## Boundary

Forge extends the existing certified Mercury operations artifact with a deterministic, read-only cohort projection. Mercury remains authoritative for bounded plans, authorizations, runs, members, tasks, results, spend, progression, identity assessments, review eligibility, rights, and downstream state. Atlas remains authoritative for product labels and MPNs. Forge persists no independent cohort or exception truth and performs no lifecycle or review action.

The projection requires an explicit `asOf`. Equal canonical inputs and equal `asOf` produce equal output. Missing certified inputs are represented as `null`, never inferred.

## Shared cohort shell

Identity includes cohort type, plan, run, cycle, sources, operations, and `asOf`. Membership includes requested, ready, completed, pending, blocked, and exception counts. Execution includes authorization/run state, paid-task count, bounded progression status/count when supplied, and automatic retry count. Cost includes authorized maximum, actual, UTC-day spend, daily ceiling, and remaining capacity where canonical composition supplies them. Safety exposes unauthorized spend, duplicate task, lineage, immutable-result, rights, systemic, and downstream-leakage state.

Members are classified as `ROUTINE_SUCCESS`, `PENDING_ROUTINE_WORK`, `EXPECTED_DOMAIN_EXCEPTION`, `GOVERNED_REVIEW_AVAILABLE`, `SAFELY_UNRESOLVED`, or `SYSTEMIC_ATTENTION`. Review availability must be supplied by its canonical owner. H052 is shown only when canonical state explicitly marks it available; Forge exposes `ACCEPT`/`REJECT` as the permitted decision class but executes neither. Known unresolved state is legitimate and does not become engineering work.

The same shell supports Products identity discovery and repeat-observation cohorts. Repeat-specific evidence/history counts remain domain details. Every member explicitly has no Sellers, history, canonical, review-mutation, publication, Current Price, Cheapest, or Pick authority from this projection.

Repeat projection uses the canonical durable member shape rather than requiring a synthetic `outcome`. A `COMPLETED` repeat member is routine success; a terminal `EXCEPTION` member is an original execution exception and never pending. Original evidence/history counts derive from the member's durable `evidenceIds` and `historicalObservationIds` arrays. The canonical exception remains the automation stop reason.

Successful immutable-result reprocessing is an additive current-effective dimension. Forge reads the canonical reprocessing action and its append-only events, shows action/status plus effective evidence/history and history-ineligible counts, and continues to show the unchanged original exception and zero original execution effects. Reprocessing never relabels the original run as successful, invents H052 eligibility, or grants downstream authority.

## Operator surface and safety

The existing Forge certified Mercury panel always exposes a visible `Cohort Operations & Exceptions` subsection before the product/history projection. Before file selection it explains that no certified projection is loaded. A selected schema-1.0 artifact explicitly reports that cohort operations are unavailable and requests a current schema-1.1 export. A schema-1.1 artifact containing zero cohorts reports that legitimate empty state. Populated schema-1.1 artifacts render compact cohort summaries and member classifications. Raw JSON remains available only as supporting detail.

The production exporter reads canonical SQLite state in read-only mode and produces the existing replaceable projection artifact; the artifact is not a source of truth. Its operator output reports the artifact path, schema, explicit `asOf`, cohort count, and total member count. The browser consumes only the file explicitly selected by the operator, so exporting does not silently update an open Forge page.

P1-B operational spend presentation preserves Mercury's governed precision. Current acquisition values render with at least four decimal places, retain legitimate precision beyond four decimals, and show unavailable rather than manufacturing zero for invalid or missing operational money. This Forge-only rule does not alter Mercury arithmetic, authorization, budget policy, or shopper-facing historical/retail price formatting.

Local operator verification uses the HTTP-served generated Forge surface at `public/forge/index.html` through the existing local HTTP server or Live Server workflow. `apps/forge/` remains canonical source, not the browser verification entry point. Opening `apps/forge/index.html` directly with `file://` is not a supported verification workflow. The operator must explicitly select `.forge-review/forge/certified-mercury-operations.json`; the private artifact is not copied into public assets, automatically loaded, or persisted by Forge.

P1-B does not invoke P1-A, H052, providers, authorization, paid work, Sellers, repeat observation, publication, or deployment. It creates no mutable state and grants no action authority.

## Certification

Fixtures cover routine success, pending progression, H052-reviewable exception, non-reviewable unresolved state, variant conflict, multiple-compatible results, systemic failure, cost/safety, downstream isolation, Atlas identity, determinism, repeat cohorts, empty/normal cohorts, mixed cohorts, all four visible panel states, and the canonical repository-to-provider-to-exporter-to-artifact-to-panel path. Production-shaped repeat fixtures additionally cover completed members without `outcome`, terminal exceptions, exception preservation, durable-array counts, recovered original exceptions, the Crucial 7-evidence/6-history case, genuine pending work, systemic attention, and no invented review/downstream authority. Human operator verification through the supported HTTP-served generated Forge surface confirmed the D2 lifecycle counts, original exception visibility, separate 7/6, 14/14, and 3/3 reprocessing effects, `Systemic: NO`, and no downstream authority.
