# IC-MERCURY-REPEAT-PROPOSAL-PREPARE-001 — Repeat Review Proposal to PREPARE Direct Binding

Status: IMPLEMENTED / FIXTURE-CERTIFIED / PRODUCTION-SHAPED-CERTIFIED

## Ownership and input boundary

The existing `MERCURY_REPEAT_SCALE_SELECTION / 1.0` owner selects immutable repeat operations. The existing bounded repeat PREPARE lifecycle owns current readiness, repeat preparation, plan construction, SQLite persistence, and INSPECT. This increment composes those owners; it creates no new selector, readiness policy, repository, workflow, authorization, or paid-execution owner.

`mercury:repeat-run:prepare` accepts either legacy `--cohort-file=<file> --observation-cycle=<cycle>` or direct `--selector-proposal-file=<file>`. The inputs are mutually exclusive. Direct input derives exact product, source, Sellers operation, and observation cycle from the validated proposal; a redundant cycle is optional and must equal the proposal cycle.

## Validation, readiness, and anti-substitution

Only schema `1.0` `MERCURY_REPEAT_SCALE_REVIEW_PROPOSAL` artifacts in `REVIEW_ONLY / authority NONE` state are accepted. The certified proposal owner replays and validates stage/experiment policy, selector policy/version, source/operation, cycle, candidate pool/count/digest, requested size, exact selected operations, selected-member digest, proposal ID/digest, and zero-authority fields before PREPARE persistence.

The selected operations are immutable historical input, not readiness authority. Every selected pair is then processed by the existing repeat preparation owner, which revalidates current Atlas lifecycle, reusable source identity, rights, destination requirements, same-cycle uniqueness, and canonical conflicts. Drift may block a selected member but cannot replace or remove it, add an unselected member, rerun the selector, or substitute source, operation, or cycle.

## Plan provenance and persistence

Direct plans persist complete `selectionProvenance`: proposal schema/type/ID/digest, stage and experiment policy, selector policy/version, source/operation/cycle, candidate count/digest, requested size, selected-member digest, exact selected Atlas IDs, and exact selected product/source/operation/cycle tuples. This provenance participates in the existing deterministic plan binding digest. INSPECT revalidates plan integrity and reports exact selector membership equivalence.

The existing repeat SQLite repository remains the sole owner. Provenance lives in its immutable plan payload, so no schema migration is required. Exact replay and concurrent identical PREPARE resolve through deterministic IDs and repository uniqueness. Historical plans remain readable as `LEGACY_COHORT_INPUT`; no selector provenance or new digest is retroactively invented.

## Authority and operating model

Direct PREPARE calculates only the existing task/spend ceiling. It creates zero provider calls, result retrievals, paid tasks, spend, authorization, run, evidence/history, or downstream authority. Paid authorization and START remain separate explicit boundaries.

The resulting chain is:

`current repeat readiness → deterministic selector → immutable review proposal → human review → direct PREPARE → current safety revalidation → provenance-bound repeat plan → INSPECT → separate paid authorization review → explicit START`.

Human governance remains responsible for experiment policy, requested size, Google-control participation, proposal review, paid-envelope approval, START approval, exception review, and stage promotion.

## Certification

Fixtures cover Amazon Sellers and Google Shopping Sellers, strict proposal validation, mutually exclusive inputs, proposal-cycle authority, membership/source/operation anti-substitution, readiness drift without replacement, same-cycle protection and later-cycle legitimacy, complete provenance, digest tamper detection, legacy compatibility, replay/restart/concurrency, zero authority, and INSPECT. Isolated mechanics pass at 6, 24, 43, 100, and 1,000 selected operations. These timings certify local composition only, not provider throughput.

Fresh production state is inspected read-only for compatibility. No real larger cohort is selected, no production proposal or repeat plan is created, and no provider operation occurs.
