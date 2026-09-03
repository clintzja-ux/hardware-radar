# IC-DATAFORSEO-004D — Dry Run, Audit and Operator Visibility

## Contract
DF004-D introduces explicit PLAN, DRY_RUN and LIVE operator modes. `DryRunAcquisitionExecutor` simulates only tasks already approved by an immutable DF004-A plan. It has no paid transport dependency, records `attemptedPaidTasks: 0` and `actualSpendUsd: 0`, and cannot create provider task IDs.

`createAcquisitionOperatorModel` is the authoritative read model for operator surfaces. It exposes acquisition enablement/kill-switch state, retry policy, daily and per-run budgets, approved/skipped plan decisions with skip-reason counts, and execution audit history.

Forge can load this model as a local JSON audit bundle for inspection. Forge does not execute paid acquisition and loading an audit bundle grants no publication or acquisition authority.

## Out of scope
Scheduling, unattended execution, live DataForSEO transport wiring, and automatic publication remain out of scope.
