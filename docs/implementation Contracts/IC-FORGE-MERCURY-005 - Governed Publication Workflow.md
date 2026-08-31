# IC-FORGE-MERCURY-005 — Governed Publication Workflow

**Status:** Implemented — Pending Exit Review  
**Subsystems:** Forge / Mercury / Hardware Radar

## Objective

Establish an explicit, durable, auditable publication workflow between reviewed Mercury observations and Hardware Radar's application-facing market snapshot.

## Invariants

- Evidence eligibility remains separate from workflow authorization.
- Only an effective `REVIEWED` decision may support `PUBLISH`.
- `HOLD`, `REJECTED`, or missing review state blocks publication.
- Publication decisions are append-only and use `mer_pub_*` identities.
- `PUBLISH` references the effective qualifying `mer_rev_*` decision.
- `WITHDRAW` preserves publication history while removing effective publication authorization.
- Canonical observations are never modified by publication workflow.
- Test-fixture evidence cannot receive production publication decisions.
- Expired or purged licensed payload cannot contribute to snapshots.
- Amazon manual/import evidence remains unauthorized; only the approved Creators API license context can pass the Amazon source gate.
- Public snapshots contain application-facing intelligence only, not internal review/publication workflow records.

## Implementation

- `PublicationDecision`
- `PublicationDecisionRepository`
- `FilePublicationDecisionRepository`
- `PublicationWorkflowService`
- `PublicationAtlasResolver`
- `GovernedMarketPublicationService`
- `publication:record` operational CLI
- governed `build:public` integration

## Public Build Behavior

The public build fails closed. Unless durable acceptance, review, and publication state paths are explicitly supplied, the generated market snapshot contains `INSUFFICIENT_DATA` states. Canonical Mercury manifest observations are no longer implicitly publication-authorized.

Production build composition also requires the certified E2S current-market qualification owner. `PUBLISH` remains durable publication authorization, but it cannot override a current E2S failure. Snapshot generation reassesses E2S at the explicit build time and projects only candidates that remain qualified; it does not independently apply the development/default freshness, confidence, or condition interpretation. Missing or invalid E2S dependencies or production freshness policy fail closed to no published candidate.

The lower-level publication workflow retains an explicit legacy development/fixture mode for existing tests. That mode is not production composition and cannot be selected implicitly by the governed public build.

Operational state paths are supplied through:

- `HARDWARE_RADAR_ACCEPTANCE_STATE`
- `HARDWARE_RADAR_REVIEW_STATE`
- `HARDWARE_RADAR_PUBLICATION_STATE`

## Exit Criteria

- durable publication identities;
- append-only publication history;
- effective state derivation;
- explicit withdrawal;
- restart durability;
- atomic failure recovery;
- review reference integrity;
- governed snapshot generation;
- no internal workflow leakage into public artifact;
- prior Mercury/Atlas/Sentinel regression suites remain green;
- Forge and Hardware Radar remain operational.

## IC-FORGE-MERCURY-005 — CERTIFIED ✅

Final certification state:
| Gate                        |         Result |
| --------------------------- | -------------: |
| Mercury                     | **63/63 PASS** |
| Atlas                       | **15/15 PASS** |
| Sentinel                    |   **7/7 PASS** |
| Repository layout           |       **PASS** |
| Public publication boundary |       **PASS** |
| Forge                       |       **PASS** |
| Hardware Radar              |       **PASS** |
| Browser console             |      **CLEAN** |
