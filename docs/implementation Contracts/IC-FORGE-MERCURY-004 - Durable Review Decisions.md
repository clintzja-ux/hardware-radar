# IC-FORGE-MERCURY-004 — Durable Review Decisions

## Status
Implementation complete; pending manual exit verification.

## Objective
Persist Forge/Mercury review decisions as durable, append-only workflow history without modifying canonical observations or conflating review with publication authorization.

## Deliverables
- `ReviewDecisionRepository` contract.
- Filesystem-backed durable review repository.
- Atomic `mer_rev_*` decision identity allocation.
- Observation-reference integrity validation.
- Restart durability and chronological history queries.
- Derived effective review state.
- Production isolation for TEST_FIXTURE observations.
- Failure/recovery semantics with no partial committed history.
- `ReviewWorkflowService` for reviewability-gated durable decisions.
- Local `review:record` operational command.
- ADR-016.
- Regression coverage.

## Invariants
1. Review decisions never mutate canonical Mercury observations.
2. Review history is append-only.
3. Effective review state is derived from the latest committed decision.
4. REVIEWED does not mean PUBLISHED or PUBLISHABLE.
5. Durable decisions must reference an existing accepted observation.
6. Test-only observations cannot receive production review decisions.
7. A failed commit leaves no durable decision record.

## Explicitly Out of Scope
- Publication authorization.
- Automatic web/browser persistence from Forge.
- User authentication/role management.
- Remote API/backend infrastructure.
- Editing or deleting prior review history.

## Exit Criteria
All new and existing Mercury tests pass; Atlas and Sentinel regressions pass; repository/public build verification passes; Forge launches and review UI remains operational; Hardware Radar behavior and console remain clean.

## IC-FORGE-MERCURY-004 — CERTIFIED ✅

Final verification:
| Gate              |             Result |
| ----------------- | -----------------: |
| Mercury           |     **56/56 PASS** |
| Atlas             |     **15/15 PASS** |
| Sentinel          |       **7/7 PASS** |
| Forge             |           **PASS** |
| Download Decision | **PASS / visible** |
| Hardware Radar    |           **PASS** |
| Browser console   |          **CLEAN** |
