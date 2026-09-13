# IC-MERCURY-HISTORY-057 — Amazon Pilot Durable State Projection Correction

## Status

Fixture-certified read-only correction. H057 replaces the preparation-only pilot display with deterministic reconstruction from existing durable Amazon acceptance owners. It creates no pilot lifecycle, mutable checkpoint, progression repository, paid command, provider operation, or downstream authority.

## Root cause and ownership

The H056 inspector validated the immutable pilot and its five embedded H049 artifacts, then called a pure projection with no durable product outcomes. Every missing caller-supplied outcome therefore defaulted to `NOT_STARTED`, and the displayed spend came from immutable PREPARE-time budget context rather than current ledgers.

`AmazonPilotProjectionService` now reads existing authoritative state only: H050 action authorizations and effective H052 Products outcomes, the DataForSEO task ledger, immutable provider-result repository, DF003 retained-evidence repository, historical-observation repository, and durable execution-spend projection. The pilot artifact remains immutable selection/binding evidence.

## Derived operator states

The resolver projects `NOT_STARTED`, `PRODUCTS_AUTHORIZED`, `PRODUCTS_RESULT_PENDING`, `PRODUCTS_RESULT_AVAILABLE`, `PRODUCTS_IDENTITY_BLOCKED`, `SELLERS_REVIEW_REQUIRED`, `SELLERS_AUTHORIZED`, `SELLERS_RESULT_PENDING`, `SELLERS_RESULT_AVAILABLE`, `COMPLETED_RETAINED_ONLY`, and `COMPLETED_ADMITTED`. Detailed owner state remains authoritative; these labels are a compact read-only operator projection.

Retained Sellers evidence establishes `COMPLETED_RETAINED_ONLY` unless an exact historical observation references one of those retained evidence IDs, in which case the projection is `COMPLETED_ADMITTED`. Retention never fabricates history. Effective Products state uses H052 reassessment where present; original blocked outcomes remain immutable audit evidence.

Multiple paid tasks for the same acceptance artifact and operation fail closed as `AMAZON_PILOT_PROJECTION_TASK_CONFLICT`. Existing result/action repositories retain their own conflict validation. Ordering does not select authority, and INSPECT writes nothing.

## Production reconciliation

At explicit evaluation time `2026-09-13T12:00:00.000Z`, pilot `mer_amzpilot_5dc5801dc0c970f3bb3b14fa` projects:

- products 1 and 2: `COMPLETED_RETAINED_ONLY`, with governed ASINs and two tasks each;
- products 3–5: `NOT_STARTED`;
- status: `PILOT_IN_PROGRESS`;
- paid tasks: four (`AMAZON_PRODUCTS=2`, `AMAZON_SELLERS=2`, `AMAZON_ASIN=0`);
- pilot spend: `$0.0060`;
- durable UTC-day spend: `$0.0090`;
- next action: `WAIT_FOR_SPEND_CAPACITY`.

This projection contains the product, compact stage, governed ASIN, task identifiers/count, evidence/history references, blocker, spend, and next action required for a future Forge view without ChatGPT/Codex interpretation. H057 does not implement Forge UI.
