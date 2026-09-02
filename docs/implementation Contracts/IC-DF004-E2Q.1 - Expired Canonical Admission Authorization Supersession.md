# IC-DF004-E2Q.1 — Expired Canonical Admission Authorization Supersession

**Status:** Implemented — fixture-certified
**Increment:** DF004-E2Q.1

## Purpose

E2Q.1 closes the expired, unconsumed E2Q authorization dead end without reviving, extending, replacing, or deleting an immutable authorization. It adds an explicitly confirmed, append-only successor operation inside the E2Q operator-governance boundary. E2P remains the sole canonical-eligibility authority, and `ObservationAcceptanceRepository` remains the sole canonical observation store.

## Lifecycle

```text
expired + unconsumed E2Q authorization
→ exact SUPERSEDE-EXPIRED-CANONICAL-AUTHORIZATION confirmation
→ fresh current-state E2P assessment
→ current canonical eligibility and binding validation
→ new immutable successor authorization
→ immutable predecessor/successor supersession event
→ later independent E2Q EXECUTE decision
```

Supersession performs no canonical admission. It creates no review approval, publication eligibility or authority, current/live/public-price authority, Cheapest/Pick authority, provider request, network operation, or paid task.

## Persisted lineage

Legacy schema-1.0 authorizations remain valid and unchanged. A successor uses authorization schema `1.1` and adds:

- `lineage.rootAuthorizationId`;
- `lineage.predecessorAuthorizationId`;
- `lineage.generation`;
- `lineage.bindingChange`, exactly `EXACT_BINDING` or `CHANGED_BINDING`;
- `lineage.predecessorAssessmentId`;
- `lineage.predecessorCandidateBindingDigest`.

The repository appends a separate schema-1.0 `CANONICAL_AUTHORIZATION_SUPERSESSION` event. It binds the lineage root, predecessor, successor, evidence, generation, old/new assessment IDs, old/new binding digests, predecessor expiry, supersession time, operator, and reason. The predecessor object is never updated with successor data.

`byEvidence` retains its legacy meaning as the immutable lineage-root index. Schema 1.1 adds the unambiguous `activeAuthorizationByIntent` index and `supersessions` event map. Reading legacy state performs no write. The first explicitly authorized successor write evolves only the state envelope and indexes while preserving the legacy authorization object.

## Effective lifecycle

Effective state is derived without rewriting authorization records:

- a consumption yields `CONSUMED`;
- an outgoing supersession event yields `SUPERSEDED`;
- an unconsumed authorization at or after `expiresAt` yields `EXPIRED`;
- otherwise it remains `PENDING_OPERATOR_APPROVAL`.

Only an unconsumed, effectively expired authorization may be superseded. An active or consumed predecessor fails closed. One predecessor may have exactly one successor; branching, conflicting, malformed, or ambiguous lineage invalidates repository state.

## Determinism and concurrency

The successor ID deterministically binds its predecessor ID, current E2P assessment and policy, current candidate-binding digest, operator, and reason. Exact supersession replay returns the existing successor. A changed request against the same predecessor fails closed. Each later generation names the immediately preceding authorization, producing a linear auditable chain.

The repository reuses Mercury's file-based cross-process single-writer boundary. Under the repository lock it reloads and validates state, confirms the predecessor is the current intent tip, appends the successor and event, advances the active-intent index, and commits atomically. Thus at most one unconsumed, unexpired authorization can exist for an evidence/admission intent.

## Changed binding

A fresh E2P-certified binding may differ from its predecessor. The successor is explicitly labeled `CHANGED_BINDING`, and the lineage event preserves both assessment IDs and both binding digests. It is never described as an exact renewal. If fresh E2P assessment is missing, malformed, contradictory, or not canonical eligible, supersession fails closed.

## Operator command

```text
npm run evidence:canonical:supersede -- \
  --authorization-id=<EXPIRED_AUTHORIZATION_ID> \
  --confirm=SUPERSEDE-EXPIRED-CANONICAL-AUTHORIZATION \
  --requested-by=<OPERATOR> \
  --reason=<REASON>
```

The command is local and zero-network. It exposes lineage, generation, binding relationship, old/new assessment IDs and digests, expiry, and the absence of admission or downstream authority. Production supersession remains a separate operator decision and was not run during implementation.

Fixture certification covered legacy version-1.0 reads without migration, immutable generation-0 predecessor preservation, fresh E2P reassessment, exact and changed bindings, deterministic replay, conflicting and branching lineage rejection, repeated linear generations, cross-process single-active enforcement, and unchanged E2Q execution gates. The focused E2Q suite passed 62 cases, the E2Q.1 suite passed 74 cases, Mercury passed 154 files, and the full repository passed 200 subsystem test files.
