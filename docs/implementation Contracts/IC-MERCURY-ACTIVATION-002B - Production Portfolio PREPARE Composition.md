# IC-MERCURY-ACTIVATION-002B — Production Portfolio PREPARE Composition

Status: implemented and fixture-certified  
Owner: Mercury acquisition orchestration  
Provider spend authority: none

## Contract

The production portfolio composition is a zero-network adapter around the certified MERCURY-ACTIVATION-002 domain. It loads the canonical Atlas product repository, the canonical DataForSEO source-rights profile, immutable historical observations and their retained evidence, and the existing acquisition execution ledger. It never copies a product cohort or manufactures provider identity.

Reusable provider identity is derived only when a historical observation admitted by Mercury points to retained DataForSEO Google Shopping evidence whose SELLERS task binding is exact. Missing history is `ABSENT`; conflicting governed identities are `REVIEW_REQUIRED`. Only `REUSABLE` begins at `SELLERS`. All other non-conflicting eligible products begin at the existing `PRODUCTS` boundary.

`mercury:portfolio:prepare` requires an explicit ISO `--as-of`. The UTC-day spend already recorded by the existing execution ledger is bound into the immutable portfolio identity alongside Atlas inventory, eligibility, provider identity, rights, query/market, task, and cost state. PREPARE performs no provider call, needs no credentials, creates no paid-task authorization, and grants no retention, observation, review, publication, Current Price, Cheapest, Pick, or destination authority.

Artifacts are operator-local under `.forge-review/mercury/acquisition-portfolios/<portfolio-cycle-id>/prepare.json`. Exact material replay returns the existing artifact. A different material state produces a different deterministic cycle identity; an attempted conflicting write to the same identity fails closed. `mercury:portfolio:inspect` reloads the artifact and verifies current Atlas and rights bindings without provider access.

Portfolio acknowledgment is not added by this increment. The domain's existing `PORTFOLIO_REVIEWED` value remains an advisory review record and is not required to create this zero-spend artifact; it never authorizes a task. Every future paid operation remains delegated to the existing operation-specific PREPARE, exact confirmation, single-use authorization, execution ledger, and current-day spend revalidation.

Progress is projected from future task-level events rather than by mutating the PREPARE artifact. There is no batch executor or automatic paid advancement.

## Operator commands

```text
npm run mercury:portfolio:prepare -- --as-of=<ISO-8601 timestamp>
npm run mercury:portfolio:inspect -- --portfolio-cycle-id=<cycle-id>
```

Both commands are local. The first persists only a zero-spend review artifact; the second is read-only.
