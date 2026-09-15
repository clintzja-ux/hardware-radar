# Mercury Scale-Ramp Handoff

## Purpose and ownership

Hardware Radar is scaling governed RAM identity and longitudinal price observation without weakening authority boundaries. Atlas owns canonical hardware facts. Mercury owns source acquisition, provider identity evidence, market observations, and historical market knowledge. Compass owns recommendations; Echo search; Aurora explanations; Forge operator workflows; Beacon analytics; Gateway public APIs.

Retailer/feed identity never owns Atlas identity. A source SKU, provider product ID, ASIN, retailer listing, or destination URL becomes only source evidence until Mercury's governed identity boundary binds it to an Atlas product.

## Current scale-ramp checkpoint

The selected stage contains 25 Atlas products. Amazon identity breadth comprises 19 prospective discovery members. Canary A completed 3 and Slice 1 completed 10, so 13/19 breadth attempts are terminal:

- 9 `STRONG_UNIQUE_ASIN` (69.2%);
- 3 `MULTIPLE_COMPATIBLE_ASINS`;
- 1 `ASIN_VARIANT_CONFLICT`;
- 0 provider failures, systemic failures, retries, or engineering interventions.

Canary A: plan `mer_iddiscplan_e47c662645df252dfdf00afa`, run `mer_iddiscrun_81e0ab6faed84de5ba5f93f3`, three unfamiliar products, one strong and two multiple-compatible, three tasks, `$0.0045`.

Slice 1: plan `mer_iddiscplan_5426b3781c0774286442ad01`, run `mer_iddiscrun_bfcdfbce45853a42add00506`, 10/10 terminal, eight strong, one multiple-compatible, one variant conflict, 10 tasks, `$0.0150`. The pending continuation reused its original task and finalized without new authority or spend. Member-local isolation passed.

The sample is operational acceptance evidence, not a catalog-wide forecast (`n=13`). Canonical repeat resolution currently derives 19 product/source pairs: 2 Google Shopping and 17 Amazon. Use the canonical resolver; do not reconstruct or guess the pairs.

Authoritative September 15 spend was `$0.0235` under the then-current `$0.025` UTC-day ceiling. That historical spend snapshot does not carry into later UTC days. Current governed policy uses a `$0.0500` UTC-day ceiling; it grants no acquisition authority.

## Reserved Slice 2

The reserved six, last assessed 6/6 `READY_FOR_DISCOVERY`, are:

| Atlas product | MPN |
|---|---|
| `ram_kingston_kf560c30bbea_8` | `KF560C30BBEA-8` |
| `ram_kingston_kf560c30bweak2_32` | `KF560C30BWEAK2-32` |
| `ram_kingston_kf432c16bbk2_16` | `KF432C16BBK2/16` |
| `ram_kingston_kf556s40ibk2_64` | `KF556S40IBK2-64` |
| `ram_teamgroup_ctced532g6400hc32adc01` | `CTCED532G6400HC32ADC01` |
| `ram_teamgroup_tlzgd432g3200hc16fdc01` | `TLZGD432G3200HC16FDC01` |

Their maximum future envelope is six Amazon Products tasks at `$0.0015` each, `$0.0090` total, with zero automatic paid retries. The exact checked-in cohort is `config/mercury/scale-ramp/25-product-slice-2-amazon-identity.json`. Production PREPARE/INSPECT at `2026-09-15T22:28:02.044Z` created plan `mer_iddiscplan_e0ec35a7e9f99bd15f824e60`: 6 requested, 6 READY, 0 blocked, `$0.0235` current-day spend, `$0.0265` remaining under the `$0.0500` ceiling, `NOT_AUTHORIZED`, and `NOT_STARTED`. No provider call, paid task, or spend occurred. The next action is separate operator review before any authorization.

## Source roles and exception doctrine

Amazon Products is the preferred automated unresolved-SKU identity route when rights and reviewed destination prerequisites hold. Google Shopping is observation/corroboration evidence and promotes identity only under existing strong rules; terminal noisy Google identities are not blindly rediscovered. H052 is a narrow operator exception over existing immutable Amazon evidence, not a general identity override. Unresolved identity remains unresolved.

Operator review is not engineering intervention. `MULTIPLE_COMPATIBLE_ASINS`, `ASIN_VARIANT_CONFLICT`, `NO_USABLE_IDENTITY`, `INSUFFICIENT_ASIN_EVIDENCE`, and provider pending are expected domain outcomes unless they reveal a reusable correctness or integrity defect. Member-local exceptions do not block unrelated members. Shared lineage, repository, spend, rights, or authority corruption is systemic and stops the bounded run.

## Rakuten source semantics

First-party Rakuten clarification received September 14, 2026 establishes:

- **R1:** different Product IDs/SKUs remain distinct source entries even when destination URL is identical; they may be variants or bundles.
- **R2:** repeated records for the same Product ID/SKU within one delta apply sequentially; the last physical record wins.
- **R3:** a later `*_full` catalog is authoritative for complete current Rakuten source membership and becomes the next baseline for subsequent deltas.

The state sequence is `FULL(N) → DELTA(N+1) → … → FULL(M) → DELTA(M+1)`. A later full's absence makes a Rakuten source entry inactive/absent. It never deletes or rewrites Atlas products, Mercury retained evidence/history, canonical observations, other-source identities, or audit history.

The parser preserves distinct ordered records and the adapter does not URL-deduplicate. The source-local `RakutenCatalogStateProjection` now fixture-certifies R1, folds repeated same-key delta rows in physical order for R2, and replaces complete derived source membership from each later full for R3. It is a deterministic in-memory projection inside the existing adapter boundary, not a new identity or persistence owner. Production current-data retention and downstream Rakuten activation remain fail closed under the unchanged rights profile.

Distinct source SKUs do not automatically establish standalone comparability. Bundles do not compete with standalone Cheapest or establish standalone product history. `UNKNOWN_COMPARABILITY` remains isolated. Unknown shipping, tax, and mandatory fees are not zero.

The clarification does not broaden `IC-RAKUTEN-RIGHTS-017`: feed acquisition, retention, public display, comparison, historical use, derived analytics, and redistribution remain governed independently.

## Durable product and market doctrine

Capabilities remain independent: `OBSERVED`, `PUBLICLY COMPARABLE`, `RECOMMENDABLE`, and `AFFILIATE ENABLED`. Affiliate relationship health is operational metadata and cannot affect Atlas identity, Mercury facts, retailer trust, Cheapest, Picks, or recommendability.

Cheapest means the lowest governed comparable actionable acquisition cost, including reliably known mandatory shipping/fees. Conditional offers remain separate. Picks are policy-governed labels such as Gaming, Workstation, RGB, Upgrade, or Business Pick; do not claim first-party benchmarking with “Best.”

Historical acquisition and identity resolution grant no Current Price, Current Display, Cheapest, Pick, publication, recommendation, or affiliate authority. Independent market evidence and retailer-authorized commerce data remain separate rights/provenance classes.

## Production incidents already fixed

| Incident | Durable lesson | Status |
|---|---|---|
| Stale task-ledger snapshot / multiple writers | Shared task state must not be overwritten by process-local stale snapshots. | FIXED |
| Bounded same-parent spend progression | Sequential child spend must be attributable without accepting unexplained external drift. | FIXED |
| Consumed expired taskless child | Irrecoverable authority gets append-only disposition, never silent renewal. | FIXED |
| Existing-task continuation | Expired authority creates no new execution, while an existing paid task/result may finish retrieval/finalization. | FIXED |
| Google `NO_USABLE_IDENTITY` production wiring | Terminal identity evidence suppresses blind paid rediscovery. | FIXED |
| Destination source/private repository mismatch | Production consumes checked-in canonical destination schema through its canonical loader. | FIXED |
| Heterogeneous Amazon result containers | Only genuine product candidates enter ASIN normalization. | FIXED |
| Canonical-result-first recovery | Check immutable canonical results before provider retrieval/reprocessing. | FIXED |
| H051/H052 result repository composition | H052 resolves the exact result that produced H051 across canonical owners without weakening ID/digest lineage. | FIXED |

## Storage and operations evidence

The 10-member immutable plan is 11,354 bytes. Slice 1 added 57,344 bytes to identity SQLite, 10 task-ledger rows / 6,889 bytes, 10 execution-ledger rows / 10,909 bytes, 132,369 bytes of acceptance actions, and 649,339 bytes of canonical results; evidence/history did not change during identity discovery.

File-backed stores are not a 25-product blocker. Measure them at 25 and 100; migrate only from observed latency, rewrite, memory, or contention evidence. Before/around 100, repeated manual `RESUME` should be replaced by bounded pending progression and cohort exception/metric summaries. Before/around 1,000, Forge batch exception management, durable Beacon scale metrics, and evidence-based persistence decisions are likely required. These are not current P0 blockers.

Scale remains 5-product certification → 25 → 100 → 1,000 → 10,000 Atlas products. Product/source pairs and task counts are derived quantities. At 100, ordinary success must need zero engineering intervention. Member-local exceptions are acceptable; systemic integrity failure stops the stage.

## Development and production safety

Use ChatGPT for architecture, contracts, governance, decision framing, and Codex prompt preparation. Use Codex for repository inspection, implementation, tests, and production-state audits. Prefer small increments, explicit preflight, fail-closed outcomes, no surprise provider operation, no automatic commit/push/deploy, and operator-controlled paid boundaries.

No new conversation may casually call DataForSEO, authorize spend, `START`/`RESUME`, perform H052, create Sellers work, mutate Atlas, publish Current Price, or change daily budget. Every such action uses the established review/authorization lifecycle.

## Canonical document index

Read these before acting:

- `docs/handoff/CURRENT-STATE.md`
- `docs/handoff/MERCURY-SCALE-RAMP-HANDOFF.md`
- `docs/operations/MERCURY-SCALE-RAMP.md`
- `docs/implementation Contracts/IC-MERCURY-PRODUCTS-IDENTITY-DISCOVERY - Neutral Bounded Domain Adapter.md`
- `docs/implementation Contracts/IC-MERCURY-HISTORY-051 - Amazon Products ASIN Variant Conflict Forensics.md`
- `docs/implementation Contracts/IC-MERCURY-HISTORY-052 - Append-Only Amazon Products Identity Reassessment.md`
- `docs/implementation Contracts/IC-DATAFORSEO-004A - Acquisition Planning and Budget Governance.md`
- `docs/implementation Contracts/IC-RAKUTEN-NEWEGG-016 - Delta Multiplicity Semantics Investigation.md`
- `docs/implementation Contracts/IC-RAKUTEN-RIGHTS-017 - Rakuten Product Catalog Source Rights and Production-Use Authority.md`
- `packages/atlas/schemas/product.schema.json`
- `docs/implementation Contracts/IC-GROWTH-005A - Mercury Ordinary Retailer Destination Contract.md`

## Current artifact index

- 25-product candidate: `config/mercury/scale-ramp/25-product-candidate-cohort.json`
- Canary candidate: `config/mercury/scale-ramp/25-product-canary-candidate.json`
- Canary A production cohort: `config/mercury/scale-ramp/25-product-canary-a-amazon-identity.json`
- Slice 1 production cohort: `config/mercury/scale-ramp/25-product-slice-1-amazon-identity.json`
- Reserved Slice 2 membership source: the remaining deterministic six documented above and in `docs/operations/MERCURY-SCALE-RAMP.md`; no production artifact exists.

## Decisions not to reopen casually

Atlas independence from retailer feeds; source capability separation; affiliate independence; Pick terminology; bundle and shipping/fee doctrine; Amazon-first unresolved identity; no blind rediscovery of terminal noisy Google identities; H052's exception-only role; member-local isolation; zero automatic paid retries for bounded discovery; downstream authority separation; and the staged 25→100→1,000→10,000 ramp all require explicit contrary evidence and architectural review before change.

## Open questions

- The terminal outcomes and final automatic-resolution rate after Slice 2.
- Operator-review rate once the 25-product stage is complete.
- Longitudinal repeat-cycle behavior after identity breadth.
- Whether manual `RESUME` becomes P1 before 100.
- Measured file-store growth/latency and Forge/Beacon improvements needed before 100/1,000.

## Exact next safe action

Wait for a fresh UTC budget day, verify branch/HEAD/clean tree and authoritative current spend, reassess only the six reserved Amazon pairs and their rights/destinations, create the exact Slice 2 artifact if still legitimate, run PREPARE then INSPECT, and STOP. Do not authorize or start Slice 2 in that increment.

## NEW CHAT BOOTSTRAP

1. Read `docs/handoff/CURRENT-STATE.md`.
2. Read this handoff.
3. Read `docs/operations/MERCURY-SCALE-RAMP.md`.
4. Inspect the current branch, HEAD, and working tree.
5. Do not redesign established architecture.
6. Do not call providers or create paid work without explicit approval.
7. Continue only from the exact next safe action above.
