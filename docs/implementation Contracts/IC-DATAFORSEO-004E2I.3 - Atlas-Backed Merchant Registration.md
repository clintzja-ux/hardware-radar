# IC-DATAFORSEO-004E2I.3 — Atlas-Backed Merchant Registration

**Status:** Implemented  
**Increment:** DF004-E2I.3  
**Owner:** Atlas / Mercury

## Ownership boundary

Atlas owns canonical retailer identity. Canonical retailers are schema-validated records listed in `packages/atlas/atlas-manifest.json`. Mercury owns seller evidence, merchant discovery, and the append-only human decision that maps a discovered seller to an existing Atlas retailer.

A Mercury approval does not create, modify, or impersonate an Atlas retailer. For promotion purposes, `REGISTERED` is projected only after the approved decision's retailer ID, canonical name, canonical domain, active state, and retained-evidence binding resolve successfully against the current Atlas retailer repository.

## Required flow

1. Retained seller evidence remains `DISCOVERED`.
2. The proposed canonical retailer already exists in Atlas and passes repository validation.
3. An explicit Mercury merchant review approves the evidence-bound mapping.
4. Projection resolves the retained seller evidence through the Atlas-backed DataForSEO merchant resolver.
5. Only the resulting actual `RESOLVED` result is supplied to DF003 eligibility.
6. E2G reassesses evidence and E2H applies historical policy.

Mercury must never synthesize `RESOLVED` or a `RETAILER-####` identity from review fields alone.

## Fail-closed conditions

Promotion is blocked when Atlas cannot be loaded or validated, the retailer is absent or inactive, ID/name/domain bindings differ, resolution is ambiguous, retained seller evidence differs from the reviewed discovery, or decision/evidence state is malformed. No fallback creates canonical identity.

## Promotion separation

An Atlas-backed merchant mapping remains independent of product verification. Review does not mutate retained market evidence, Atlas product data, or review history and does not directly authorize history, canonical observations, or publication.

When verified product identity, Atlas-backed merchant resolution, positive DF003 eligibility, and complete provenance satisfy E2H, historical eligibility may be true. Canonical and publication eligibility remain false because canonical-observation and publication promotion policies are not defined. `CANONICAL_PROMOTION_POLICY_MISSING` remains mandatory.

## Existing prepared request

The E2I PREPARE envelope already immutably binds request ID, discovered name, canonical name, canonical domain, merchant ID, evidence references, transition, and preparation timestamp. Atlas validation is deliberately performed again at approval and reassessment time. Therefore a matching prepared request does not require regeneration solely because the canonical retailer was added after PREPARE; approval still fails closed if its bindings do not match current Atlas and retained evidence.

## Operational constraints

This increment performs no provider request, paid task, reacquisition, unattended LIVE operation, publication, or production approval. Atlas creation and Mercury mapping approval are separate operator-governed actions.
