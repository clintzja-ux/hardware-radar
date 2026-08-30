# IC-DF004-E2Q — Controlled Canonical Admission Operator Governance

**Status:** Implemented — fixture-certified  
**Increment:** DF004-E2Q

## Purpose

E2Q adds the smallest controlled operator boundary in front of certified E2P canonical admission. It grants no ambient or caller-manufactured canonical authority. E2P remains the canonical-policy owner, and `ObservationAcceptanceRepository` remains the only canonical observation store.

## Lifecycle

```text
E2P CANONICAL_ELIGIBLE assessment
→ E2Q PREPARE immutable authorization
→ explicit operator review and exact confirmation
→ E2Q single-use EXECUTE
→ E2P reassessment and binding validation
→ E2P canonical admission
→ append-only authorization consumption
```

Assessment, authorization, and mutation are separate. PREPARE is local and zero-network. EXECUTE accepts only an authorization ID, the exact `ADMIT-CANONICAL-OBSERVATION` confirmation, and an operator label; it reloads owner state and cannot accept identity, provider, provenance, rights, eligibility, or policy substitutions.

## Immutable binding and replay

The authorization preserves E2P assessment ID, policy version, evidence ID, the complete certified candidate binding, and its deterministic SHA-256 digest. It is time-limited, explicitly reasoned, operator-attributed, and single-use.

Exact PREPARE replay returns the existing authorization. A different binding for the same evidence fails closed. Missing, malformed, expired, substituted, or unconfirmed authorization fails closed. Successful execution records one immutable consumption. Exact execution replay returns `ALREADY_CONSUMED`; a conflicting consumption fails closed.

## Scope separation

Canonical admission creates no review approval, publication eligibility, publication authority, publication, cheapest/current/live/public-price authority, acquisition, or provider operation. The E2Q services report network operation `NONE`, paid task created `false`, and actual spend `$0.000`.

## Operator commands

```text
npm run evidence:canonical:prepare -- --evidence-id=<ID> --requested-by=<OPERATOR> --reason=<REASON>
npm run evidence:canonical:execute -- --authorization-id=<ID> --confirm=ADMIT-CANONICAL-OBSERVATION --executed-by=<OPERATOR>
```

Fixture certification proved exact candidate binding, deterministic PREPARE replay, fail-closed conflicting PREPARE and consumption, exact confirmation, rejection of caller substitutions, current-state E2P reassessment, single-use execution, and explicit review/publication/current/live/public-price separation. These commands were not run against production state. Production PREPARE and admission remain explicit later operator decisions.
