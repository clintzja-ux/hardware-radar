# Mercury production scale ramp

## Purpose and current decision

This document governs evidence-based promotion of Mercury longitudinal acquisition from the completed five-product production-certification cohort. It is an operations plan, not acquisition authority, a budget change, or downstream market/publication authority.

Current classification: `READY_FOR_25_WITH_PRECONDITIONS`.

There is no P0 engineering blocker. Before paid work, the operator must select and review a diverse 25-product Atlas cohort, project product/source readiness, divide READY work into bounded daily slices under the unchanged `$0.025` UTC-day ceiling, approve a canary and stop conditions, and define the measurement report below. Creating or reviewing that material remains zero-provider work; each paid run still requires its existing bounded authorization.

The zero-provider design step is complete. The non-executable review artifacts are [25-product-candidate-cohort.json](../../config/mercury/scale-ramp/25-product-candidate-cohort.json) and [25-product-canary-candidate.json](../../config/mercury/scale-ramp/25-product-canary-candidate.json). They are deliberately object-shaped `REVIEW_ONLY` documents, not inputs accepted by production planning commands, and confer no authority.

## Selected 25-product candidate cohort

The canonical Atlas RAM corpus contains 103 products; the separate 115-record Atlas release-governance total includes non-product records. All 103 RAM products validate, and all selected records are `ACTIVE + READY` with valid capacity arithmetic. Selection is deterministic: five products per registered manufacturer, comprising 15 DDR5 DIMMs, five DDR4 DIMMs, and five SODIMMs, with four pilot controls and 21 new products. The exact ordered identifiers are owned by the review artifact above.

Across the 50 prospective product/source pairs, the current projection is:

| Operation class | Pairs | Interpretation |
|---|---:|---|
| Repeat observation ready | 6 | Two Google Shopping identities and four Amazon identities already reusable |
| Products identity discovery ready | 19 | Amazon Products paths with active reviewed destinations |
| Manual review only | 0 | No H052 decision is presently ready; results may create later review work |
| Currently blocked / intentionally unscheduled | 25 | 23 Google paths lack justified reusable identity; two Amazon paths lack an active reviewed destination |
| No operation needed | 0 | — |

Google Products is not scheduled merely because identity is absent. The existing discovery-readiness owner reports `PORTFOLIO_PROVIDER_IDENTITY_BINDING_INVALID` for the two established Google control identities in mixed historical state, while the canonical repeat resolver confirms both are reusable. This is a diagnostic limitation to measure and reconcile before 100, not authority for rediscovery and not a blocker to their repeat path.

The maximum presently justified breadth work is 19 Amazon Products tasks (`$0.0285`). The selected controls add two Google Sellers and four Amazon Sellers repeat tasks (`$0.0080`). These `$0.0365` illustrative totals are separate lifecycle envelopes, not one authorization; successful Products discovery also does not automatically authorize later Sellers work.

The proposed canary covers five products and six tasks: three Amazon Products onboarding cases, one Google Sellers repeat, and two Amazon Sellers repeats. Its separate illustrative envelopes are `$0.0045` for identity discovery and `$0.0040` for repeat observation. The combined planning amount is `$0.0085`, but the operations must retain separate plans and authorizations.

Recommended clean-UTC-day slices are: canary identity discovery (3 tasks, `$0.0045`); remaining identity discovery slice one (10 tasks, `$0.0150`); remaining identity discovery slice two (6 tasks, `$0.0090`); and the separate six-task repeat-control stage (`$0.0080`). Current September 15 authoritative spend is `$0.0085`, leaving `$0.0165` under the unchanged `$0.025` ceiling. Every slice must re-read durable spend before authorization and execution.

The seven-pair longitudinal experiment should run **after the 25-product canary**, as a separate bounded authority, so the canary first validates the mixed repeat/onboarding operating surface. Neither review artifact creates that authority.

### Canary A observed result

The first identity-breadth canary is terminal `COMPLETED`: plan `mer_iddiscplan_e47c662645df252dfdf00afa`, run `mer_iddiscrun_81e0ab6faed84de5ba5f93f3`, three Amazon Products tasks, exact authorized/actual spend of `$0.0045`, zero retry, zero pending/provider/systemic failure, and no Sellers, evidence/history, or downstream authority. TeamGroup `ram_teamgroup_ctced532g6000hc30dc01` resolved `STRONG_UNIQUE_ASIN`; Crucial `ram_crucial_ct16g56c46s5` and G.SKILL `ram_g_skill_f5_6000j3038f16gx2_fx5` terminated `MULTIPLE_COMPATIBLE_ASINS`. The two member-local ambiguities did not block the third member and require no per-SKU engineering change.

Observed identity yield is one automatic strong identity and two ambiguous identities from three attempts (`33.3%` and `66.7%`, respectively), with zero immediately available H052 review. This `n=3` canary is operational evidence, not a statistically predictive rate. All 16 remaining reviewed Amazon Products members still project `READY_FOR_DISCOVERY` with unchanged rights. No systemic stop gate fired, so the scale decision is `PROCEED_WITH_REMAINING_16_AS_DESIGNED`, preserving separate 10-task (`$0.015`) and 6-task (`$0.009`) slices. Current September 15 spend is `$0.0085`, leaving `$0.0165`; only the 10-task slice fits today, and no later slice inherits authority.

### Amazon identity Slice 1 preparation

The deterministic first 10 members of the reviewed 16-member remainder are checked in as [25-product-slice-1-amazon-identity.json](../../config/mercury/scale-ramp/25-product-slice-1-amazon-identity.json). Zero-provider PREPARE created plan `mer_iddiscplan_5426b3781c0774286442ad01` for cycle `2026-09-15T16:11:38.026Z`; INSPECT confirms 10 requested, 10 READY, zero blocked, maximum 10 paid tasks / `$0.0150`, zero automatic paid retries, `NOT_AUTHORIZED`, and `NOT_STARTED`. Durable UTC-day spend remains `$0.0085`, leaving `$0.0165`; this headroom is a current projection, not reserved or consumable authority, and must be re-read before authorization and execution. The final six-member slice remains unprepared and outside this plan.

Measured on the production-composed local boundary, PREPARE took 700.231 ms and INSPECT took 622.645 ms. The immutable plan payload is 11,354 bytes versus 3,823 bytes for the three-member Canary A plan. The indexed identity-discovery store grew from 176,128 to 200,704 bytes, adding one plan and 10 plan-member rows; authorizations, runs, run members, child authorities, and dispositions did not grow. The existing Amazon acceptance artifact store grew from 11 to 21 artifacts (41,107 to 78,305 bytes) because PREPARE materializes one zero-authority source preparation per member. These bounded measurements expose no blocker at 10 members; they do not replace the planned 25/100 measurement gates.

### Amazon identity Slice 1 terminal result

The real Slice 1 run `mer_iddiscrun_bfcdfbce45853a42add00506` is terminal `COMPLETED`: 10/10 members terminal, 10 unique paid tasks and canonical results, zero retries, zero pending/provider/systemic failures, and exact spend of `$0.0150`. Eight members established `STRONG_UNIQUE_ASIN`; `ram_crucial_ct2k32g56c46s5` ended `MULTIPLE_COMPATIBLE_ASINS`, and `ram_crucial_ct16g4dfra32a` ended `ASIN_VARIANT_CONFLICT`. Both exceptions are member-local governed domain ambiguity, expose no H052 action, and did not impede later members. The previously pending G.SKILL member reused its original task on the second RESUME, added no spend or authority, and finalized once as `STRONG_UNIQUE_ASIN`.

Across Canary A and Slice 1, 13 attempts produced nine strong identities (`69.2%`), three multiple-compatible outcomes (`23.1%`), and one variant conflict (`7.7%`), with zero provider/systemic failures, duplicate tasks, or engineering interventions. This small cohort is operational acceptance evidence, not a catalog-wide yield forecast. Canonical repeat resolution now exposes 19 durable product/source pairs, including the eight new Slice 1 Amazon identities.

The reserved final six remain exactly the committed deterministic partition and reassess 6/6 `READY_FOR_DISCOVERY` with unchanged Amazon rights. Their six-task / `$0.0090` envelope does not fit September 15: authoritative spend is `$0.0235`, leaving `$0.0015`. On a clean UTC day it would leave `$0.0160` under the unchanged `$0.025` ceiling. Therefore the current decision is `READY_TO_PREPARE_SLICE_2_ON_FRESH_BUDGET_DAY`; no Slice 2 plan or authority exists yet. The separate longitudinal control should wait until `AFTER_25_IDENTITY_STAGE` so it does not compete for the final breadth slice's budget.

Stage numbers mean **Atlas products under review**, not interchangeable counts of product/source pairs or paid tasks. The governed work unit is a product/source pair. A product may contribute zero, one, or two ready pairs, and each ready repeat pair normally creates one paid Sellers task per observation cycle.

## Certified baseline

The production pilot covered five Atlas products. Durable owner projections currently expose seven repeat-ready pairs:

| Product | Google Shopping | DataForSEO Amazon |
|---|---|---|
| `ram_corsair_cmk32gx5m2b6000z30` | Ready | Ready: `STRONG_OPERATOR_CONFIRMED_ASIN` via `mer_amzidconfirm_e82029010fc43100abd5ecac` |
| `ram_crucial_cp2k16g56c46u5` | Ready | Ready: `STRONG_UNIQUE_ASIN` |
| `ram_corsair_cmh32gx5m2b6400c36` | `REPEAT_OBSERVATION_GOOGLE_IDENTITY_DISCOVERY_REQUIRED` | Ready |
| `ram_corsair_cmh32gx5m2e6000c36w` | `REPEAT_OBSERVATION_GOOGLE_IDENTITY_DISCOVERY_REQUIRED` | Ready |
| `ram_corsair_cmk16gx5m2b5200z40` | `REPEAT_OBSERVATION_GOOGLE_IDENTITY_DISCOVERY_REQUIRED` | Ready |

The unresolved Google pairs are expected domain exceptions, not scale blockers. Google discovery is not a blind fallback. Strong existing identities may be reused; Amazon automated identity onboarding is preferred where independently justified; H052 remains an evidence-backed operator exception.

The first bounded repeat run proved one parent authorization over five paid tasks, exact task/result recovery, member-local processing, ten retained evidence records, ten admitted fact-level historical observations, zero duplicate paid work, and no downstream authority. The production incidents exposed by that pilot are classified as follows:

| Incident | Classification | Repeating now needs code? | Scope |
|---|---|---:|---|
| Stale in-memory DataForSEO task-ledger snapshot | `FIXED_SYSTEMIC_DEFECT` | No | Shared task persistence |
| Independent file-ledger writers overwriting task rows | `FIXED_SYSTEMIC_DEFECT` | No | Shared task persistence |
| Repeat canonical task persistence/recovery | `FIXED_SYSTEMIC_DEFECT` | No | Repeat lifecycle |
| Rakuten successful-transfer timing race | `FIXED_TEST_ONLY_DEFECT` | No | Test only |
| Google Products child-authority durability/recovery | `FIXED_SYSTEMIC_DEFECT` | No | Google discovery |
| Missing canonical readiness owner | `FIXED_SYSTEMIC_DEFECT` | No | Identity discovery |
| Neutral Google result/finalization ownership | `FIXED_SYSTEMIC_DEFECT` | No | Google discovery |
| Amazon pre-execution recovery | `FIXED_SYSTEMIC_DEFECT` | No | Amazon discovery |
| Incomplete production source-owner composition | `FIXED_SYSTEMIC_DEFECT` | No | Discovery subsystem |
| Same-parent spend progression | `FIXED_SYSTEMIC_DEFECT` | No | Shared spend governance |
| Consumed expired taskless child disposition | `FIXED_SYSTEMIC_DEFECT` | No | Shared bounded lifecycle |
| Disposition-aware existing-task continuation | `FIXED_SYSTEMIC_DEFECT` | No | Shared bounded lifecycle |
| Google `NO_USABLE_IDENTITY` readiness wiring | `FIXED_SYSTEMIC_DEFECT` | No | Google discovery |
| Checked-in destination/private repository composition mismatch | `FIXED_SYSTEMIC_DEFECT` | No | Amazon discovery |
| Heterogeneous Amazon Products result containers | `FIXED_SYSTEMIC_DEFECT` | No | Amazon normalization |
| Amazon canonical-result-first recovery | `FIXED_SYSTEMIC_DEFECT` | No | Amazon discovery |
| H051/H052 result-repository composition mismatch | `FIXED_SYSTEMIC_DEFECT` | No | H052 review |
| Unresolved identity, insufficient ASIN evidence, provider pending/failure, rights or destination block, unknown comparability | `EXPECTED_DOMAIN_EXCEPTION` | No | Member-local/review |

The reusable defects above would have multiplied at scale if the pilot had not exposed them. No currently known incident is an open correctness blocker for 25. File-backed growth, review ergonomics, observability, and repeated manual RESUME are open scale risks at later stages.

## Normal and exception operation

The normal repeat path is:

```text
governed reusable identity and source rights
→ read-only readiness
→ deterministic PREPARE and INSPECT
→ operator-reviewed bounded authorization
→ explicit START
→ one source-native provider task per READY pair
→ zero-cost retrieval and immutable canonical result
→ source-owned assessment and evidence retention
→ H058 fact-level historical admission
→ terminal member state
→ later separately prepared observation cycle
```

Identity discovery is a separate bounded lifecycle. It may establish reusable provider identity but creates no Sellers, history, or public authority by itself. Operator approval is intentionally required for each bounded spend envelope and for evidence-backed identity exceptions; that is not engineering intervention.

Expected member-local exceptions include unresolved identity, Google `NO_USABLE_IDENTITY`, Amazon `INSUFFICIENT_ASIN_EVIDENCE`, H052 review availability, provider pending or ordinary failure, rights block found during readiness, unsupported source, missing retailer destination, unknown comparability, and identity review. They become terminal blocked/exception states or explicit review work; automatic paid retry remains zero. Unrelated members continue unless the failure proves shared integrity loss.

Systemic failures correctly stop the bounded run: authorization or parent/member digest substitution, immutable-result conflict, canonical task persistence/recovery failure, repository corruption, shared budget or spend drift, rights-integrity failure, and ambiguous durable lineage. These fail-closed rules must not be weakened for throughput.

Stopping a stage means creating no further paid tasks, preventing the next cohort authorization, preserving immutable authorizations/tasks/results/evidence/history, allowing already-created paid tasks to be retrieved and reconciled through existing recovery rules, and leaving member-local exceptions unresolved for later review. It never means deleting evidence.

## Execution, concurrency, and recovery

Current bounded advancement is sequential within a process. A shared acquisition single-writer lock serializes paid execution and protects authoritative execution/spend accounting. SQLite bounded/repeat stores use WAL, `synchronous=FULL`, foreign keys, `busy_timeout=5000`, transactions, uniqueness, and indexed identifiers. Independent products have deterministic member/child identities; same-parent spend progression accounts for earlier member execution. Member-local exceptions are isolated; systemic faults stop the run.

START may advance all members until they are terminal or pending. RESUME may retrieve/finalize existing tasks but is forbidden from creating new paid work. Exact replay is idempotent, canonical task/result ambiguity fails closed, and automatic paid retries are zero. Operators currently need run IDs and may need repeated RESUME commands for pending work. That is acceptable for 25, becomes an operational precondition before 100, and is not acceptable as the ordinary surface by 1,000.

Sequential execution is not an architectural blocker for 25 or 100 under the current daily spend ceiling. Measure it at 25. Introduce concurrency only with proof that provider latency/throughput requires it and without weakening the single-writer and spend invariants.

## Spend and illustrative cost ceilings

The authoritative execution ledger owns actual spend. Authorization and execution both revalidate durable UTC-day spend. The operational ceiling remains `$0.025`; Google `PRODUCTS`/`SELLERS` is capped at `$0.001` per task and Amazon `AMAZON_PRODUCTS`/`AMAZON_SELLERS` at `$0.0015` per task. The ceiling is intentionally conservative, not an architectural maximum.

| Task count | All Google | All Amazon | Approximate 50/50 mix |
|---:|---:|---:|---:|
| 25 | $0.0250 | $0.0375 | $0.0315 (12 Google, 13 Amazon) |
| 100 | $0.1000 | $0.1500 | $0.1250 |
| 1,000 | $1.0000 | $1.5000 | $1.2500 |
| 10,000 | $10.0000 | $15.0000 | $12.5000 |

At `$0.025` per UTC day, the theoretical maximum is 25 Google tasks, 16 Amazon tasks, or 20 tasks in an even mix. Actual bounded slices must also fit remaining ledger capacity. A 25-product stage therefore uses source prioritization and, when necessary, multiple reviewed daily slices. A future ceiling change requires a separate governance decision supported by observed cost accuracy, zero unauthorized/duplicate spend, stable recovery, provider latency, and operator workload; convenience alone is insufficient.

## Persistence and scale evidence

| Owner/store | Storage and lookup | Current approximate state | Scale posture / first concern |
|---|---|---:|---|
| Neutral bounded and repeat run state | SQLite, indexed IDs/member keys, transactional WAL | Repeat DB: 5 preparations, 5 task authorizations, 1 plan/run, 5 members; identity-discovery DB: 3 plans, 2 runs, 5 members | Certified fixture mechanics through 10,000; safe for 25/100/1,000. Measure production composition before 10,000. |
| Acquisition execution ledger | Whole JSON file, append by atomic replacement under execution lock | 41 runs, ~43 KB | Safe for 25/100; measure at 1,000; migration likely before sustained 10,000-cycle history. |
| DataForSEO task ledger | Whole JSON array, reload/merge/atomic replacement | 38 tasks, ~20 KB | Corrected for stale writers; safe for 25/100. Cross-process safety relies on the shared execution lock; measure/consider indexed migration before 1,000 sustained cycles. |
| Canonical provider results | Whole JSON object, task/intent maps plus some filtered scans | 20 results across current Google/Amazon result stores, ~0.7 MB combined | Safe for 25/100; measure scans and rewrite cost before 1,000; likely indexed/blob-separated storage before 10,000. |
| Retained evidence | Whole JSON object and idempotency map | 39 records, ~160 KB | Immutable payload growth is a likely first storage bottleneck; safe for 25/100, measure at 100, plan migration before sustained 1,000 if latency/rewrite growth is material. |
| Historical observations | Whole JSON object and idempotency map | 34 records, ~124 KB | Safe for 25/100; measure query/write latency and growth at 100; indexed migration likely before sustained 1,000–10,000 longitudinal operation. |
| Amazon acceptance/actions | Whole JSON, in-process queue, atomic replacement | 8 artifacts; 17 authorizations, 8 outcomes, 1 reassessment, 3 confirmations; ~203 KB | Safe for 25/100; needs measurement and cross-process review before 1,000. |
| Canonical observations/reviews/publication | Whole JSON, small governed downstream corpus | 3 canonical and 3 effective reviews; no relevant publication authority | Not driven automatically by acquisition volume; measure only if operator promotion volume grows. |
| Retailer destinations | Checked-in validated source plus private repository adapter | 3 production destinations | Small and independent; destination review coverage, not storage, is the constraint. |

Synthetic evidence already proves: repeat SQLite can store 10,000 preparations plus 10,000 authorizations (about 66 MB in the latest run), direct indexed lookups, and durable uniqueness; neutral/product readiness code is data-driven through 10,000. The measured fixture run took about 49 seconds to insert 20,000 repeat rows. These tests do not prove provider throughput, production file-store performance, operator capacity, result/evidence amplification, multi-process contention, or 10,000-product production readiness.

The current ten-request/five-ready production plan serialized to about 4.2 KB. Linear illustrative payload sizes are roughly 10 KB at 25 pairs, 42 KB at 100, 0.42 MB at 1,000, and 4.2 MB at 10,000. Measure actual artifacts at 25/100; this is not a blocker for 25 or 100.

The first repeat pilot produced ten evidence/history facts from five Sellers tasks (observed amplification 2.0 records/task). It is not a provider guarantee. At that observed ratio, 100, 1,000, and 10,000 tasks would yield roughly 200, 2,000, and 20,000 records per cycle. Storage planning must use measured per-source distributions at 25 and 100.

File-to-indexed migration is triggered by measured lookup/write latency, whole-file rewrite duration, process memory, contention/lock timeouts, or unsafe writer topology—not the future product count alone. Measure all at 25 and 100; do not invent unsupported numeric limits.

## Data quality, rights, and downstream isolation

Atlas continues to own product facts and its RAM capacity invariant. Mercury validates exact product/source lineage and preserves provider evidence. Bundles do not establish standalone history/Cheapest, unknown comparability remains isolated, and unknown shipping or mandatory fees are never treated as zero.

Source rights remain profile-specific. Retailer-authorized commerce data, independent market evidence, retention rights, publication rights, and recommendation authority remain distinct. Affiliate status cannot affect identity, observations, retailer trust, Cheapest, or Picks.

Historical acquisition and admission grant no Current Display, Current Price, public-price, Cheapest, Pick, recommendation, publication, or affiliate authority. Those repositories and policies remain separately gated even for a 10,000-product cohort.

Provider credentials remain environment-bound. Plans, artifacts, state, and command output may expose governed task IDs but must not persist or print credentials. Scaling does not change that boundary.

## Operator surface, review, and observability

Current review artifacts are individually addressable, immutable/idempotent, attributed, and auditable. H052 and Forge projections provide adequate early-stage visibility, but review work is not yet a unified sortable/filterable durable exception queue. Raw CLI/JSON remains acceptable for a canaried 25-product stage with a prepared review worksheet/report; before 100, Forge should summarize cohorts, grouped exceptions, and backlog. Before 1,000, cohort/exception-driven Forge review is required. At 1,000+, ordinary operation must not require searching raw ledgers or knowing individual task/authorization IDs.

Before 100, the operator report/Beacon projection must cover:

- **Safety:** unauthorized spend, duplicate paid tasks, immutable-result conflicts, lineage/integrity failures.
- **Operations:** requested/READY/blocked, pending duration/count, terminal outcomes, recovery count, exceptions grouped by reason, review backlog and age.
- **Cost:** spend by product/source/cycle, authorized versus actual spend, remaining daily capacity.
- **Quality:** identity outcome/rate, H052 rate, unresolved rate, retained evidence, admitted facts, duplicates/conflicts, unknown comparability/condition/shipping.
- **Performance:** PREPARE, INSPECT, authorize, START, retrieval and processing latency; SQLite/file read/write latency; memory; artifact and repository sizes.

Existing CLI summaries cover cohort counts, spend, pending/completed/exceptions, retained evidence, and admitted facts. They do not yet provide a durable cross-run metric series, backlog management, latency distributions, or systemic alerting. Beacon production transport remains deferred; do not couple scale readiness to a new telemetry authority.

"Unattended" means an operator approves a bounded cohort and spend envelope, Mercury advances ordinary pending/retrieval work within that exact envelope, isolates member exceptions, performs no scope expansion or unapproved retry, stops on systemic integrity failure, and queues review work. It does not mean unrestricted autonomous spending. Current Mercury has the correctness boundaries but lacks scheduling/background progression and a cohort-level exception/metric surface. Repeated manual RESUME is acceptable at 25, a P1 operations gap before 100, and a blocker before 1,000.

## Stage gates

Safety invariants are zero tolerance at every stage: unauthorized spend, duplicate paid tasks, unexplained lineage/result conflicts, authority substitution, repository corruption, and downstream authority leakage must all be zero.

### 5 → 25

- Select 25 diverse active/ready Atlas RAM products across DDR5, DDR4, and SODIMM; include multiple manufacturers, existing strong identities, identity-onboarding cases, varied seller breadth, and likely difficult cases.
- Scale by product/source pair, not by requiring both sources for every product. Project readiness before creating any paid plan.
- Run a small representative canary, inspect it, then use bounded daily slices within the current ceiling.
- Predefine systemic stop conditions and an operator exception report.
- Capture the measurements listed above.
- Require zero safety failures. Member-local provider/identity/comparability failures may be nonzero if classified, isolated, reviewable, and unrelated work continues.

### 25 → 100

- Ordinary successful products require zero engineering intervention.
- No expected recurring exception discovered at 25 may still require a code change.
- Demonstrate deterministic recovery for pending and exact replay with no new paid task.
- Establish cohort-level exception/backlog reporting and a repeatable multi-day operating procedure.
- Measure file repositories and plan/result/evidence growth; run at least the existing 1,000-member production-composition fixture path.
- Review observed identity automation, H052/manual-review, unresolved, provider-failure, processing latency, cost accuracy, and recovery rates. Do not set forecast thresholds until 25 supplies data.

### 100 → 1,000

- Provide automated bounded pending/retrieval progression after operator authorization; no per-member shell orchestration.
- Make Forge (or an equivalent existing owner surface) cohort/exception driven with sortable, auditable review backlog.
- Persist safety, cost, quality, operations, and performance metrics across runs.
- Benchmark the production composition, file repositories, contention, memory, and crash recovery at 10,000 synthetic members.
- Migrate only file stores whose measured latency, rewrite, memory, or contention fails the gate; preserve owner contracts and immutable history.

### 1,000 → 10,000

- Complete production-like storage, concurrency, backup/recovery, and provider-latency benchmarks.
- Eliminate raw-JSON/manual-ID dependence from ordinary operation.
- Prove bounded canary/slice promotion, systemic stop, in-flight result reconciliation, and exception isolation under production-like load.
- Confirm indexed storage for every corpus whose sustained longitudinal growth makes whole-file rewrite or scan unsafe.

## Canary, failure budget, and measurements

Begin the 25-product stage with a representative subset smaller than the full cohort, not a one-product workflow. The exact canary size is an operator choice after readiness projection; it must cover both source classes used and at least one onboarding/exception-prone case. Review safety, spend, task/result lineage, pending recovery, retained evidence, admitted facts, and downstream-false state before authorizing the remainder.

Member-local failure rate need not be zero. A stage passes when failures are correctly classified, unrelated members continue, no paid replay occurs, review items are actionable, and shared integrity remains intact. Stop immediately for any safety invariant breach or repeated engineering intervention on the normal path.

At 25 collect: PREPARE/INSPECT/authorization/START/retrieval/processing latency; provider pending duration and retrieval attempts; SQLite and file-store read/write latency; memory; artifact/file/database sizes; task-to-evidence amplification; identity automatic/manual/unresolved outcomes; H052 and review time/backlog; member-local/systemic failures; recovery success; authorized/actual spend variance.

Provider task-rate limits and completion distributions are not established by repository evidence and remain `MEASURE`. Do not invent external limits.

## Scale scorecard

| Area | Status | Evidence and limitation | Material stage / action |
|---|---|---|---|
| Identity onboarding | YELLOW | Strong Amazon automation, H052 exception, Google fail-closed; five-product sample is not predictive | Measure automation/manual/unresolved rates at 25 |
| Bounded planning | GREEN | Deterministic data-driven plans and 10,000-member fixtures | Measure real payload/latency at 25 |
| Authorization | GREEN | Immutable parent/child binding, expiry, single-use start | No action |
| Paid execution | GREEN | Shared lock, exact task lineage, source owners | Measure sequential throughput |
| Spend governance | GREEN | Ledger-owned actual spend, same-parent progression, dual revalidation | Keep `$0.025`; slice work |
| Task persistence | YELLOW | Stale-writer defect fixed; JSON still rewrites and relies on shared writer topology | Measure at 25/100; indexed migration if evidence requires |
| Result persistence | YELLOW | Immutable/replay-safe but whole-file and payload-heavy | Measure at 25/100 |
| Pending recovery | GREEN for 25 | Exact existing-task RESUME, no paid retry | Automate bounded polling before 100 |
| Exception isolation | GREEN | Member-local continuation and systemic stop fixtures | Verify rates at 25 |
| Operator review | YELLOW | Auditable H052/Forge artifacts; no unified queue | Summary before 100; queue before 1,000 |
| Repeat observation | GREEN | Production recovery completed; seven pairs project ready | Run a separate longitudinal stage |
| Historical admission | GREEN | H058 fact-level, replay-safe, downstream false | Measure amplification |
| Storage scalability | YELLOW | SQLite evidence strong; growing immutable file stores unmeasured | Measure 25/100; migrate by evidence |
| Command scalability | YELLOW | Cohort-first commands exist; repeated RESUME/manual IDs remain | Accept 25; improve before 100/1,000 |
| Observability | YELLOW | Per-run summaries exist; cross-run metrics/backlog/latency absent | Define report at 25; durable metrics before 100 |
| Unattended readiness | RED | No scheduler/background pending progression; bounded authority is present | Not needed for 25; P1 before 100, required before 1,000 |

The RED item is operational automation, not a safety defect and not a blocker for a deliberately supervised 25-product certification stage.

## Limitation classification and priorities

| Priority | Limitation | Type |
|---|---|---|
| P0 before 25 | None | — |
| P1 before 100 | Bounded pending/retrieval progression without repeated manual RESUME; cohort exception/metric report; measurement-driven file-store decision | Operations / observability / performance |
| P2 before 1,000 | Forge batch exception management; durable cross-run metrics; remove ordinary per-ID recovery; migrate measured file bottlenecks | Operations / observability / implementation |
| P3 before 10,000 | Production-like storage/concurrency/backup benchmarks and indexed storage wherever triggered | Performance / operations |
| MEASURE | Provider rate/completion latency, identity resolution/review rate, evidence amplification, file latency/memory/contention | Provider/domain / performance / operations |

No new architectural owner is accepted by this plan. Promotion between stages uses the existing repository process: reviewed scale report, compact CURRENT-STATE checkpoint, explicit operator approval, and a bounded next-stage plan. A larger cohort file is never promotion authority.

## Next actions

Recommended next action: wait for a fresh UTC budget day, then perform a separate zero-provider PREPARE and INSPECT for the exact reserved six-member Slice 2 cohort. Do not authorize it in the same action. The longitudinal experiment remains a separate future authority after the 25-member identity breadth stage. No P0 engineering increment is required.
