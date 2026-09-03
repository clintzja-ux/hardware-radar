# IC-DATAFORSEO-004E2I.1 — Explicit Review Approval Commands

## Objective

Consume prepared E2I identity-review requests through explicit, local operator commands and record durable approvals through `IdentityReviewService` without modifying evidence or authorizing promotion.

## Commands

- `npm run review:product-identity:approve -- ...`
- `npm run review:merchant-identity:approve -- ...`

Product approval requires the exact request ID, Atlas product ID, `APPROVE-PRODUCT-IDENTITY`, reviewer, human reason, and contradiction status. Merchant approval requires the exact request ID, canonical domain, canonical retailer ID, `APPROVE-MERCHANT-IDENTITY`, reviewer, human reason, and contradiction status.

Generic `--yes` confirmation is prohibited. `CRITICAL` contradictions cannot be approved.

## Binding and revalidation

Each command loads the prepared request, rederives its expected evidence binding from the current retained repository, and rejects changed subject, transition, identity, domain, retailer ID, or evidence references. Only `PROBABLE -> VERIFIED` and `DISCOVERED -> REGISTERED` are supported.

## Persistence and replay

Approved decisions retain request provenance in audit metadata and receive the existing `mer_idrev_*` durable identity. Replay equivalence ignores only the newly evaluated `reviewedAt` timestamp. The same request, reviewer, reason, evidence, contradiction state, and canonical identity returns the existing decision; any changed approval intent fails closed.

## Separation and safety

Approval writes only append-only identity-review state. It does not modify Atlas, retained DataForSEO evidence, historical storage, canonical observations, or publication state. Eligibility changes only when durable decisions are later supplied to identity projection and E2G/E2H reassessment.

The commands contain no provider client, credential loading, network operation, paid-task creation, or acquisition execution. Actual spend is `$0.000`.
