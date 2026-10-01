# IC-MERCURY-RIGHTS-001 — Source Rights & Data Lifecycle Architecture

**Implementation status:** COMPLETE — pending external verification/certification
**Branch:** `mercury-rights-sprint1-source-rights`

## Objective

Make source rights a first-class Mercury policy so the platform knows not only what evidence it possesses, but which operations are contractually permitted for that evidence.

## Core invariant

> Anything not explicitly permitted is not implicitly permitted.

Rights evaluation distinguishes **original evidence lineage** from **current action authority**. A consuming action may use verified prior evidence after legitimate policy evolution only when the original profile/digest remains reconstructable and the current profile explicitly permits that claim-specific action. The original digest is never rewritten; the current authorizing digest is recorded separately. Current permission cannot legitimize unverifiable evidence, and unrelated profile changes do not block an otherwise authorized action merely because the whole profile digest changed.

## Implemented components

- `SourceRightsPolicy` — canonical rights states and capability names.
- `SourceRightsRegistry` — machine-readable source profiles.
- `SourceRightsEvaluator` — fail-closed capability and acquisition evaluation.
- `SourceRightsValidator` — profile contract validation.
- `RetentionPolicy` — now projects storage/TTL from source rights; unknown rights use `RIGHTS_UNKNOWN`.
- `HistoricalEligibility` — now requires explicit historical-retention permission.
- `PublicationWorkflowService` — governed publication enforces explicit public-display rights while the lower-level publication evidence evaluator remains reusable for legacy/evidence-only tests.
- `IngestionService` — acquisition requires explicit source-method permission in addition to existing Amazon hard gates.
- `FileObservationAcceptanceRepository` — rejects unknown-rights observations from durable acceptance.

## Initial profiles

### Operator-curated RAM offers

MVP-002 Increment 4 adds the code boundary but no production rights profile. A curated source must have a specifically approved profile whose manual acquisition, current observation, comparison, public display, historical retention, and durable audit metadata capabilities are all `ALLOWED`. Missing, blocked, conditional, clarification-required, or generic operator assertions fail closed. Synthetic fixture profiles certify behavior without granting real retailer/source rights.

### AMAZON_CREATORS_API
- API acquisition: ALLOWED
- manual/import acquisition: BLOCKED
- current observation/public display/comparison: ALLOWED subject to existing workflow/compliance gates
- licensed content TTL: 1 hour
- historical retention: BLOCKED
- historical/derived analytics: BLOCKED

### MANUAL_PUBLIC_PAGE_OBSERVATION
- production acquisition/use: BLOCKED
- historical retention/derivation: BLOCKED

### AMAZON / NEWEGG MANUAL PUBLISHER OBSERVATION
- manual acquisition, current observation, and public item-price display: ALLOWED
- exact-product current item-price comparison: ALLOWED; unknown ancillary facts remain unknown
- durable fact-level historical retention and historical item-price analytics: ALLOWED through separate admission
- condition inference, delivered-cost claims with unknown costs, recommendation, and redistribution API: BLOCKED
- current-display execution grants no historical admission, publication, Cheapest, Pick, release, or deployment authority

### BEST_BUY_PRODUCTS_API
Provisional profile pending Best Buy's written response:
- API acquisition: ALLOWED as the approved technical mechanism
- manual/import acquisition: BLOCKED
- current observation/public display: CONDITIONAL
- comparison: CLARIFICATION_REQUIRED
- licensed content TTL: 72 hours
- historical retention: BLOCKED
- analytics: CLARIFICATION_REQUIRED
- historical analytics: BLOCKED

### TEST_FIXTURE / internal synthetic policies
Explicit test-only profiles preserve deterministic testing without granting production publication rights to fixtures.

## Exit criteria

- known source-rights resolution: implemented
- unknown rights fail closed: implemented
- Amazon rights profile: implemented
- Best Buy provisional profile: implemented
- retention projection: implemented
- historical-rights enforcement: implemented
- publication-rights enforcement in governed workflow: implemented
- acquisition-rights enforcement: implemented
- clarification-required fails closed: implemented
- rights-policy validation: implemented
- Amazon one-hour retention behavior preserved: implemented
- test-fixture production isolation preserved: implemented
- full repository regression suite passes: verified locally

## Verification baseline

- Mercury: 75/75 test files PASS
- Atlas: 15/15 PASS
- Sentinel: 7/7 PASS
- Repository layout: PASS
- Public publication boundary: PASS

Final certification requires user-side branch application and normal Forge/site/browser regression checks.


IC-MERCURY-RIGHTS-001 — CERTIFIED ✅
Gate	Result
Mercury	75/75 PASS
Atlas	15/15 PASS
Sentinel	7/7 PASS
Forge	PASS
Hardware Radar	PASS
Browser console	CLEAN
Unknown-source behavior	FAIL CLOSED
