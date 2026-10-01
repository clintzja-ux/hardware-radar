# IC-MERCURY-HISTORY-056 — Bounded DataForSEO Amazon Multi-Product Pilot Preparation

## Status

Fixture-certified PREPARE/INSPECT boundary for a five-product `DATAFORSEO_AMAZON` pilot. Complexity classification is `SMALL_ADAPTER_REQUIRED`: the only missing operational seam was binding each selected product to an existing zero-authority H049 acceptance artifact that H050 already consumes. The pilot artifact now carries those exact child artifacts, and PREPARE persists them through the existing repository. No new lifecycle or paid command exists.

Economic classification is `PILOT_AUTOMATION_BORDERLINE`. The pilot is operationally ready and reusable, but the existing safety model still requires substantial operator attention. H056 reduces deterministic selection and lineage-preparation labor; it does not yet prove a lower daily burden than the approximately 30-minute Excel/Python benchmark.

## Existing ownership

Atlas remains the owner of active/ready product identity and canonical MPNs. Existing Mercury destination records supply reviewed Amazon product-page references; `SourceRightsRegistry` owns rights; H046/H051/H052 own effective ASIN identity; H047 owns Products/Sellers transport, immutable results, task and execution ledgers; H048 owns DF003 retention and historical admission; H050 owns each independently reviewed single-use paid action. H056 adds only an immutable cohort preparation/projection record and read-only inspection.

H049 cannot safely represent a cohort because its validated schema and cost envelope bind exactly one product and the former three-operation acceptance maximum. The H056 artifact repository is therefore a narrow append-only preparation store, not another acquisition, authorization, evidence, history, or workflow subsystem. Each embedded child remains an ordinary H049 artifact, so later H050 commands need no paid wrapper or product override.

## Selection and exclusions

Selection is product-generic and deterministic. A product must be Atlas `ACTIVE` and `READY`, have a canonical MPN and an active exact-standalone Amazon `RETAILER-0001` destination, have current `DATAFORSEO_AMAZON` rights, and have neither Amazon-source history nor prior Amazon acceptance lineage. Superseded, malformed, bundle/non-standalone, missing-destination, historical, or already-bound products are excluded. Unresolved marketplace merchants do not block evidence retention.

Eligible products sort by existing Atlas identity/destination completeness descending and Atlas product ID ascending. Price, affiliate value, popularity, brand preference, commission, conversion, and operator favorites never participate. Current production selection naturally yields five DDR5 DIMMs; no repository doctrine authorizes category quotas, so category diversity is `NOT_REQUIRED` rather than manufactured.

## Artifact and cost semantics

The schema binds explicit `asOf`, policy versions, `DATAFORSEO_AMAZON`, source-rights digest, five selected product identity digests, exact destination references/digests and corroborating ASINs, selection reasons, operation plan, and cost envelope. Its ID derives from the full material binding digest. Exact replay is `DUPLICATE`; same-ID conflicting material fails closed.

The normal path is Products followed by Sellers only for `STRONG_UNIQUE_ASIN`; `AMAZON_ASIN` remains unavailable. The five-product envelope is ten tasks and `$0.0150`, with two tasks/`$0.0030` per product, `$0.0015` per task, `$0.010` shared UTC-day ceiling, and zero automatic paid retries. The pilot envelope is not one-day authority or spend reservation. Every later paid action must independently revalidate current rights, durable UTC-day spend, and existing one-active/single-use authorization rules. At zero current-day spend, at most six `$0.0015` actions fit the daily ceiling; fewer fit when durable spend already exists.

## Projection and completion

Existing per-product durable artifacts remain the detailed action state. The pilot projection composes product outcomes without creating another checkpoint engine. `PIPELINE_COMPLETED_ADMITTED` and `PIPELINE_COMPLETED_RETAINED_ONLY` are successful terminal product outcomes. Identity/provider stops remain product-local and permit later selected products to proceed. Rights revocation, spend/governance integrity failure, repository conflict, lineage corruption, or a systemic transport defect stops the pilot globally. The pilot completes when every selected product has a governed completion or product-local terminal stop.

Merchant review remains asynchronous and separate: retain evidence, preserve `DISCOVERED`, and let comparability/history fail closed until their existing governance is satisfied. The pilot grants no Current Display, Current Price, Cheapest, Pick, publication, affiliate, canonical-retailer, or merchant-review authority.

## Operator surface

Zero-cost preparation:

`npm run mercury:amazon:pilot:prepare -- --as-of=<EXPLICIT_UTC_ISO> --confirm=PREPARE-DATAFORSEO-AMAZON-PILOT`

Read-only inspection:

`npm run mercury:amazon:pilot:inspect -- --artifact-id=<PILOT_PREPARATION_ID>`

After operator review, each action continues through the existing Amazon acceptance owner sequence: inspect, authorize one paid action, execute it once, retrieve its task, process locally, inspect, and stop. H056 does not authorize or execute that future work.

For a direct Products-to-Sellers outcome, the present system requires roughly nine explicit command/review interventions per product: artifact inspection, Products authorization, execution, retrieval, processing, Sellers authorization, execution, retrieval, and processing, followed by another inspection checkpoint. Five products therefore imply about 45–50 operator interventions; identity stops reduce that count, while reassessment/recovery increases it. This is safe but operationally borderline against the manual benchmark. The five-product pilot should measure elapsed operator time before any further orchestration is considered.

## Certification

Fixtures prove deterministic five-product selection, immutable replay, ten-product data-driven scale, mixed retained/admitted/identity/provider outcomes, product-local continuation, rights-triggered global stop, daily-cap behavior, source isolation, public isolation, and zero provider work. Certification applies to supported semantics, not individual products, ASINs, merchants, or retailers.
