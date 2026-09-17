# IC-MERCURY-REPEAT-SCALE-SELECTION-001 — Deterministic Repeat Scale Selection and Review Proposal

Status: `IMPLEMENTED / FIXTURE-CERTIFIED / PRODUCTION-SHAPED-CERTIFIED`

Policy: `MERCURY_REPEAT_SCALE_SELECTION / 1.0`

Source scope: `SINGLE_SOURCE_OPERATION`

## Boundary and ownership

Mercury scale-ramp governance selects already-eligible repeat operations for operator review. Existing source-specific repeat-readiness owners establish reusable identity, rights, destination requirements, and same-cycle conflict state before candidate construction. The selector does not interpret Amazon or Google provider payloads and is not a readiness, PREPARE, authorization, task, run, evidence, history, publication, Current Price, Cheapest, or Pick owner.

This increment adds no repository, queue, operational-state store, subsystem owner, or ADR. It reuses the domain-neutral scale-ramp SHA-256 canonicalization/digest primitive and the existing repeat observation-cycle and source/operation vocabulary.

## Candidate identity and cycle semantics

The allowlisted candidate contract binds:

- `atlasProductId`, `source`, `operation`, and canonical ISO observation cycle;
- reusable-identity, source-rights, and optional source-owned destination binding digests;
- stable Atlas manufacturer, memory generation, form factor, capacity, and module count attributes used for representative selection.

Exact product + source + operation + cycle duplicates fail closed. The same product/source/operation in a different governed cycle is legitimate when the current repeat owner says it is ready. Historical participation is not a permanent non-repurchase rule for longitudinal observation. Source-specific owners—not the generic selector—decide whether identity, rights, destination, preparation, plan, authorization, run, task, result, or completed-observation state conflicts with the requested cycle.

Mutable provider task/result state, current spend, expected price, seller count, provider yield, affiliate/commercial metadata, and operator preferences are excluded.

## Deterministic selection

Inputs are the stage ID/digest, experiment policy ID/version, selector version, one source/operation boundary, explicit observation cycle, explicit requested size, and exact candidate pool. Requested size must be positive and cannot exceed the pool.

V1 constructs deterministic strata from manufacturer, memory generation, form factor, capacity, module count, source, and operation. Candidate and stratum ordering use canonical SHA-256 material; Atlas product identity is the final collision tie-break. Candidate input permutation cannot change the selected members, ordering, or digests. Any semantic change to normalization, strata, hashing, ordering, tie-breaking, or traversal requires another selector policy version.

The candidate-pool digest binds every allowlisted candidate field, including cycle and eligibility/provenance digests. The selected-member digest additionally binds the explicit requested size and exact selected operations. The proposal digest/ID protects the immutable selection contract and is not path-derived.

## Immutable zero-authority proposal

`MERCURY_REPEAT_SCALE_REVIEW_PROPOSAL / 1.0` is `REVIEW_ONLY` with `authority: NONE`. It contains the exact canonical pool, exact selected members, stage/experiment and selector provenance, source/operation/cycle, counts/digests, descriptive strata, and explicit zero-authority fields.

Strict validation reconstructs the proposal from its canonical pool and rejects schema additions, unsupported source/operation pairs, malformed cycles, same-cycle duplicates, size errors, member injection/deletion, source/operation/cycle/stage/policy substitution, digest changes, proposal identity changes, or any nonzero authority/task/call/spend state.

Proposal creation performs zero provider calls, zero existing-result retrievals, zero task creation, zero spend, zero PREPARE, zero authorization, zero run creation, and zero evidence/history/downstream mutation.

The proposal is immutable historical selection evidence, not current readiness. Later readiness drift never rewrites it or substitutes another member. A future direct proposal-to-PREPARE boundary must revalidate Atlas lifecycle, source identity, rights, destination requirements, and same-cycle conflicts and may block exact selected operations without replacement.

## Source scope and future consumer

V1 proposals are source/operation scoped. Amazon Sellers and Google Shopping Sellers remain separate because their identity and destination semantics differ; a higher-level stage policy may relate separately reviewed proposals without broadening repeat execution semantics.

The current production repeat command still accepts a manually authored cohort file containing product/source pairs plus a separately supplied observation cycle. This proposal already carries the exact operations and complete selection provenance required for a later direct-binding adapter. That adapter should consume the validated proposal, revalidate current owners, and bind proposal provenance into the existing repeat plan. It requires no new persistence owner.

## Certification

Fixtures cover deterministic replay and permutation, explicit cycle identity, same-cycle duplicate rejection, cross-cycle legitimacy, Amazon and Google production-shaped candidates, source/operation isolation, requested sizes, representative strata, prohibited commercial/outcome inputs, readiness-drift separation, zero authority, tampering, and local mechanics at 6, 24, 43, 100, and 1,000 candidates. Timings certify local mechanics only—not provider throughput or production operation.

No real repeat cohort or proposal was selected or persisted during certification.
