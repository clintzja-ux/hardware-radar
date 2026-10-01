# IC-MERCURY-HISTORY-042 — Exact MPN Boundary and Terminal Result Projection Correction

## Status

`MERCURY_EXACT_MPN_BOUNDARY_CERTIFIED`.

## Defect and invariant

The first Stage-A PRODUCTS result exposed a generic inconsistency: title substring matching classified canonical MPN `CMH16GX5M2B5200Z40` as exact inside the longer identity token `CMH16GX5M2B5200Z40W`, while contradiction extraction correctly classified the latter as a different MPN. Routing then allowed that rejected candidate into its exact-compatible set and incorrectly elevated the result to material contradiction.

Exact title evidence now requires a complete MPN-style token bounded on both sides by characters other than letters, digits, or hyphens. Case normalization remains permitted. Ordinary punctuation may delimit an exact token; prefixes, suffixes, and hyphen-extended variants do not. This is exact matching, not fuzzy matching. A materially contradicted or rejected candidate cannot enter the compatible exact routing set, while its contradiction diagnostics remain preserved.

No scoring weight, recommendation threshold, brand/capacity/generation/module rule, provider-selection rule, PRODUCT_INFO escalation rule, rights policy, comparability rule, or historical-admission rule changed.

## Offline production-result replay

Read-only replay of canonical result `mer_providerresult_8fe5fcdc9709ad24b4ee51d6` produces three clean exact-MPN candidates and keeps the `...Z40W` candidate non-exact, rejected, and diagnosed with `DIFFERENT_MPN`. The result remains `AMBIGUOUS` and routes to `MANUAL_PROVIDER_SELECTION`. H042 does not choose, merge, or rank tied provider identities and does not make the stopped checkpoint resumable.

## Terminal result projection

The checkpoint projection now derives `resultState` from durable events: `NONE` before a task, `PENDING` after task creation, `AVAILABLE` after result availability, and `PROCESSED` after result review or result-backed terminal processing. INSPECT renders that field without creating a lifecycle transition. The existing terminal checkpoint therefore projects `PROCESSED` instead of the misleading `NONE_OR_PENDING`.

## Immutability and scalability

The correction is MPN-, product-, brand-, retailer-, and cohort-generic. The original provider task, canonical result, progression, `$0.001` spend, and stopped checkpoint remain immutable audit evidence of the former implementation. Corrected behavior applies only when a future independently authorized artifact/checkpoint processes evidence; no production checkpoint was rewritten or resumed.

## Certification

Fixtures cover exact and case-normalized tokens, punctuation delimiters, prefix/suffix/hyphen-extension rejection, exact/different-MPN consistency, rejected-candidate isolation, one exact candidate with a longer variant, multiple clean exact identities, a safe replay fixture derived from the canonical result, terminal processed projection, and genuine pending projection. Certification performed no provider call, retrieval, paid task, production mutation, Atlas/history/current-display write, commit, push, or deployment.

## Next action

Review and certify a separate generic provider-identity ambiguity boundary before starting a new bootstrap artifact/checkpoint. Do not revive the stopped checkpoint and do not auto-select one of the tied DataDoc identities.
