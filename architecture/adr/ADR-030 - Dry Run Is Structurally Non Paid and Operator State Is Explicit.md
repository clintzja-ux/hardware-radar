# ADR-030 — Dry Run Is Structurally Non-Paid and Operator State Is Explicit

## Decision
Mercury acquisition has three explicit operator modes: PLAN, DRY_RUN and LIVE. DRY_RUN uses a dedicated executor that has no paid transport dependency and reports zero attempted paid tasks and zero actual spend. Operator visibility is represented by a provider-neutral read model containing kill-switch state, budget state, plan decisions and audit runs.

## Consequences
A dry run cannot accidentally become paid through transport configuration. Forge may inspect exported operator/audit bundles without gaining authority to execute acquisition. LIVE execution remains governed by DF004-A/B and DF003-E.
