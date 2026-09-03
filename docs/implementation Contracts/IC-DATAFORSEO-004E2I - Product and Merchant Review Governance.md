# IC-DATAFORSEO-004E2I — Product & Merchant Review Governance

## Objective

Provide explicit, independent, durable review governance for `PROBABLE -> VERIFIED` product identity and `DISCOVERED -> REGISTERED` merchant identity without mutating retained evidence or authorizing promotion.

## State models

Product records use subject `PRODUCT_IDENTITY`, previous state `PROBABLE`, requested state `VERIFIED`, and outcome `APPROVED` or `REJECTED`.

Merchant records use subject `MERCHANT_IDENTITY`, previous state `DISCOVERED`, requested state `REGISTERED`, outcome `APPROVED` or `REJECTED`, stable merchant ID, canonical name/domain, and active status.

Both preserve Mercury decision ID, reviewer/time/reason, supporting evidence IDs, contradiction status, request provenance, recorded time, and explicit `retainedEvidenceModified:false` / `promotionAuthorized:false` invariants.

## Governance flow

`review decision -> identity projection -> E2G reassessment -> E2H policy -> eligibility result`

Projection is scoped to the reviewed subject and referenced evidence ID. Approved reviewed identities enter the existing DF003 boundary as product `CONFIRMED` and merchant `RESOLVED` inputs solely for eligibility recomputation. No raw record or Atlas identity is rewritten.

Historical eligibility requires verified product, registered merchant, positive DF003 eligibility, and complete provenance. One valid observation is sufficient. E2H does not define canonical-observation promotion, so canonical and publication eligibility remain false. Missing policy or critical contradictions fail closed.

## Persistence

The file repository is atomic, append-only, sequence ordered, and assigns `mer_idrev_*` IDs. Exact replay returns the existing record. An already-approved subject cannot receive conflicting canonical state.

## Operator boundary

- `npm run review:product-identity:prepare -- --atlas-product=<id>`
- `npm run review:merchant-identity:prepare -- --domain=<domain> --canonical-name=<name> --merchant-id=<id>`

PREPARE writes review requests with `PENDING_OPERATOR_REVIEW`, creates no approval, provider task, network request, or spend. Production approval is not performed by this increment's commands.

## Locked E2H rules

P1–P15 are represented by the explicit E2H policy: retention is not promotion; counts resolve neither identity; verified/registered identities are required; DF003 and provenance gates remain mandatory; one observation may qualify; publication is separate; contradictions and missing policy fail closed; review is specific and auditable; reassessment needs no reacquisition; assessment is zero-spend.
