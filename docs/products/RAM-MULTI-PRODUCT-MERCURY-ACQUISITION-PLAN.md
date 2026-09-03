# B-001 — Multi-Product Mercury Launch Acquisition Plan

**Status:** READ-ONLY PLAN — no acquisition authorized
**Owner:** Track B / Mercury market-data planning
**Catalog basis:** 22 canonical Atlas RAM products at repository HEAD `20902418af766d5a1f3eda4e017c8e0ca4a45a1a`
**Actual spend in B-001:** `$0.000`

This plan translates the [RAM launch catalog](./RAM-LAUNCH-CATALOG-AND-COVERAGE.md) into a finite Mercury acquisition progression. It does not create a DataForSEO task, rights profile, cadence or freshness policy, identity decision, observation, review, publication decision, Current Price, Cheapest, Pick, or recommendation authority.

## 1. Existing boundary and immediate gate

Mercury already supports the required staged path:

```text
ACTIVE + READY Atlas product
→ exact-MPN PRODUCTS discovery
→ governed candidate resolution
→ PRODUCT_INFO enrichment
→ governed provider identity
→ SELLERS acquisition
→ DF003 retention
→ product and merchant identity governance
→ historical admission
→ E2P/E2Q canonical admission
→ E2R review
→ E2S qualification
→ separate publication workflow
```

`buildOperationalAcquisitionCandidates` selects only Atlas records with `governance.lifecycleStatus=ACTIVE` and `governance.publicationStatus=READY`. The original Corsair anchor satisfies that contract. The 21 D-002B records deliberately remain `DRAFT` and `PENDING`; Mercury therefore excludes them before planning. This is a **CONFIGURATION / Atlas lifecycle-governance blocker**, not missing acquisition architecture. B-001 does not authorize changing those states.

Once separately reviewed into `ACTIVE` + `READY`, every admitted record has the exact MPN and structured identity/specification inputs needed by the existing PRODUCTS candidate model. No code change is presently justified. Provider results must still pass existing fail-closed identity resolution; queryability is not identity verification.

## 2. Twenty-two-product readiness matrix

Classification describes readiness **now**, not a promise that DataForSEO will return a safe candidate or useful seller.

| # | Atlas product | Exact PRODUCTS keyword | Class | Current blocker / query note |
|---:|---|---|---|---|
| 1 | `ram_corsair_cmk32gx5m2b6000z30` | `CMK32GX5M2B6000Z30` | `READY_WITH_EXISTING_ACQUISITION_PATH` | Existing governed provider identity and recurrence path; control only. |
| 2 | `ram_crucial_cp2k16g56c46u5` | `CP2K16G56C46U5` | `OTHER_BLOCKER` | `ATLAS_LIFECYCLE_NOT_ACTIVE_READY`; exact-MPN query otherwise supported. |
| 3 | `ram_g_skill_f5_6000j3038f16gx2_fx5` | `F5-6000J3038F16GX2-FX5` | `OTHER_BLOCKER` | Same lifecycle gate; punctuation is preserved in the query and normalized only for result scoring. |
| 4 | `ram_kingston_kf572c38rsk2_32` | `KF572C38RSK2-32` | `OTHER_BLOCKER` | Same lifecycle gate; D-001A found no exact target-retailer listing, increasing seller-coverage risk. |
| 5 | `ram_teamgroup_ctced532g6000hc30dc01` | `CTCED532G6000HC30DC01` | `OTHER_BLOCKER` | Same lifecycle gate; long exact MPN is supported without code changes. |
| 6 | `ram_crucial_cp2k32g56c46u5` | `CP2K32G56C46U5` | `OTHER_BLOCKER` | Same lifecycle gate; strongest repository-recorded target-retailer overlap. |
| 7 | `ram_g_skill_f5_6000j3040g32gx2_tz5n` | `F5-6000J3040G32GX2-TZ5N` | `OTHER_BLOCKER` | Same lifecycle gate; exact-MPN query otherwise supported. |
| 8 | `ram_corsair_cmk96gx5m2b6000c30` | `CMK96GX5M2B6000C30` | `OTHER_BLOCKER` | Same lifecycle gate; high-capacity result ambiguity remains provider-dependent. |
| 9 | `ram_crucial_ct32g56c46u5` | `CT32G56C46U5` | `OTHER_BLOCKER` | Same lifecycle gate; single-module identity must not collapse into similarly named kits. |
| 10 | `ram_kingston_kf432c16bbk2_16` | `KF432C16BBK2/16` | `OTHER_BLOCKER` | Same lifecycle gate; slash must remain literal in the query and exact identity evidence. |
| 11 | `ram_g_skill_f4_3200c16d_32gvk` | `F4-3200C16D-32GVK` | `OTHER_BLOCKER` | Same lifecycle gate; must not collapse into excluded `F4-3200C16D-64GVK`. |
| 12 | `ram_kingston_kf436c16rb12k2_32` | `KF436C16RB12K2/32` | `OTHER_BLOCKER` | Same lifecycle gate; slash query and absent target-retailer evidence are result risks, not code blockers. |
| 13 | `ram_corsair_cmk32gx4m2e3200c16` | `CMK32GX4M2E3200C16` | `OTHER_BLOCKER` | Same lifecycle gate; exact-MPN query otherwise supported. |
| 14 | `ram_crucial_ct16g4dfra32a` | `CT16G4DFRA32A` | `OTHER_BLOCKER` | Same lifecycle gate; single-module capacity/configuration must remain explicit. |
| 15 | `ram_kingston_kvr32n22d8_32` | `KVR32N22D8/32` | `OTHER_BLOCKER` | Same lifecycle gate; slash and ValueRAM near-neighbor identities need exact result evidence. |
| 16 | `ram_crucial_ct8g4sfra32a` | `CT8G4SFRA32A` | `OTHER_BLOCKER` | Same lifecycle gate; exact-MPN query otherwise supported. |
| 17 | `ram_kingston_kvr32s22s8_16` | `KVR32S22S8/16` | `OTHER_BLOCKER` | Same lifecycle gate; slash query and absent target-retailer evidence increase ambiguity/coverage risk. |
| 18 | `ram_g_skill_f4_3200c22d_32grs` | `F4-3200C22D-32GRS` | `OTHER_BLOCKER` | Same lifecycle gate; SODIMM form factor and 2×16GB kit identity must agree. |
| 19 | `ram_crucial_ct16g56c46s5` | `CT16G56C46S5` | `OTHER_BLOCKER` | Same lifecycle gate; single DDR5 SODIMM is a useful form-factor test. |
| 20 | `ram_corsair_cmsx32gx5m1a5600c48` | `CMSX32GX5M1A5600C48` | `OTHER_BLOCKER` | Same lifecycle gate; single 32GB SODIMM must not match desktop or kit variants. |
| 21 | `ram_g_skill_f5_5600s4040a16gx2_rs` | `F5-5600S4040A16GX2-RS` | `OTHER_BLOCKER` | Same lifecycle gate; punctuation-heavy DDR5 SODIMM kit exercises exact-MPN scoring. |
| 22 | `ram_kingston_kf556s40ibk2_64` | `KF556S40IBK2-64` | `OTHER_BLOCKER` | Same lifecycle gate; exact-MPN query otherwise supported. |

Summary: `READY_WITH_EXISTING_ACQUISITION_PATH=1`, `QUERY_REFINEMENT_REQUIRED=0`, `IDENTITY_MAPPING_REQUIRED=0`, `OTHER_BLOCKER=21`. Query refinement or identity mapping may become necessary only after actual PRODUCTS evidence demonstrates ambiguity; B-001 does not pre-classify unobserved provider behavior as a defect.

## 3. Recommended first representative cohort

The first cohort contains seven products but should be executed as separately reviewed, single-task stages—not as a batch authorization.

| Product | Cohort role |
|---|---|
| `ram_corsair_cmk32gx5m2b6000z30` | Known DDR5 2×16GB control; validates recurrence and comparison with the established path. |
| `ram_crucial_cp2k16g56c46u5` | DDR5 value/mainstream 2×16GB; clean exact MPN and a new brand/provider-identity chain. |
| `ram_teamgroup_ctced532g6000hc30dc01` | DDR5 low-profile/performance kit; fifth launch brand and long MPN query shape. |
| `ram_g_skill_f4_3200c16d_32gvk` | Mainstream DDR4 2×16GB kit; tests generation separation and avoidance of the excluded 64GB near-neighbor. |
| `ram_kingston_kvr32n22d8_32` | DDR4 single 32GB UDIMM; exercises slash punctuation and kit-vs-single identity. |
| `ram_crucial_ct16g56c46s5` | DDR5 single 16GB SODIMM; exercises laptop form factor and strong recorded retailer overlap. |
| `ram_g_skill_f5_5600s4040a16gx2_rs` | DDR5 2×16GB SODIMM kit; exercises punctuation-heavy identity and kit/form-factor evidence. |

This cohort spans all three public categories, all five canonical launch brands, DDR4/DDR5, DIMM/SODIMM, kit/single-module configurations, value/mainstream/performance shapes, and both simple and punctuation-heavy MPNs. It is deliberately not selected only for ease.

## 4. Retailer-overlap evidence

The repository has no authoritative live cross-retailer inventory source. D-001A recorded mutable listing/index evidence, not rights or current stocking:

| Track C retailer | Repository-recorded overlap signal | Governing limitation |
|---|---|---|
| Newegg | No exact 22-product overlap established in the current catalog artifact. | Affiliate/feed and comparison/history rights remain unresolved. |
| MemoryC | No exact overlap established. | Outreach sent; no response; feed, identity, condition, shipping, and rights unknown. |
| B&H Photo Video | Limited recent/index/literature signals for TeamGroup `CTCED...`, Crucial `CP2K32...`, and G.SKILL `F4-3200C16D-32GVK`. | Current stocking and all relevant data rights remain unverified. |
| Best Buy | Broadest recorded catalog overlap, primarily exact or marketplace listing evidence across DDR5, DDR4, and SODIMM. | DataForSEO observation is not Best Buy permission; Best Buy API comparison rights remain conditional/clarification-required and historical retention blocked. |
| Adorama | Recorded signals for Crucial `CT32G56C46U5`, `CT16G4DFRA32A`, `CT8G4SFRA32A`, and `CT16G56C46S5`. | Outreach sent with no response; current stocking and rights remain unverified. |
| Micro Center | Exact recorded signal for Crucial `CP2K32G56C46U5`. | Store-local versus national-online semantics, feed/API, and rights remain unknown. |
| Provantage | No exact overlap established. | Consumer suitability, catalog overlap, fulfillment, structured data, and rights remain unknown. |

Public listing evidence is not Mercury rights, a retailer relationship, affiliate status, or public comparison authority. A seller returned by DataForSEO would still require canonical Atlas retailer identity, governed merchant resolution, adapter compatibility, freshness policy, rights evaluation, and all downstream decisions.

## 5. DataForSEO fit and identity implications

- PRODUCTS accepts one keyword per paid task. The repository-native candidate source uses the exact manufacturer part number, United States, English, and normal priority.
- Exact MPN is the strongest product-resolution signal. Brand, generation, capacity, module configuration, speed, timings, color, and RGB consistency provide corroboration; contradictory MPN, generation, or capacity fails closed.
- A useful seller observation normally requires three separately governed paid stages for a new product: PRODUCTS, PRODUCT_INFO, then SELLERS. Each stage is reviewed and authorized independently.
- One SELLERS task can yield multiple `shops_list` seller items for one governed provider product identity. Each item retains its own seller/domain/URL and task/item provenance.
- New products cannot reuse the Corsair product decision or provider identity. Product review is evidence/product-specific. Merchant decisions remain independent.
- Identity reuse applies only to later compatible refresh generations for the same Atlas product, governed provider identity, and retailer binding. It is not cross-product authority.
- Stable acquisition identity and material-evidence fingerprints prevent duplicate task/item replay while allowing a genuinely new SELLERS task to become a new observation. Conflicting material under the same task/item fails closed.
- Slash-heavy Kingston MPNs and hyphen-heavy G.SKILL MPNs are valid request strings. Results may omit punctuation, but the existing resolver's normalized exact-MPN signal already handles punctuation differences. No query rewrite is justified before evidence shows a failure.

## 6. Cost envelope

The repository does not contain a current authoritative provider price schedule. It does contain governed ceilings and observed production task costs:

- Current production execution ledger: five completed tasks, `$0.005` actual spend.
- The governed task ledger records PRODUCTS, PRODUCT_INFO, and SELLERS at `$0.001` each for the initial chain, plus two `$0.001` SELLERS refreshes.
- Current authorization boundaries cap each relevant paid task at `$0.001`, one task per run, `$0.01` per day, with zero automatic retries.

The figures below are planning estimates based on that observed `$0.001` per task and current governance ceilings, not provider-price guarantees or authorizations.

| Scenario | Assumption | Estimated envelope |
|---|---|---:|
| First seven-product cohort — first discovery stage | Six new PRODUCTS tasks; anchor requires no rediscovery. | `$0.006` |
| First seven-product cohort — full first seller-evidence path | Six new products × three tasks plus one anchor SELLERS refresh. | `$0.019` |
| One refresh cycle of A-001's 12-product market floor | Twelve established provider identities × one SELLERS task. | `$0.012` |
| One refresh cycle of all 22 Atlas products | Twenty-two established provider identities × one SELLERS task. | `$0.022` |
| Hypothetical daily refresh of all 22 for 30 days | `$0.022/day × 30`; **not authorized** and above the current `$0.01/day` policy. | `$0.660` |
| Currently approved recurring cadence | Anchor only, minimum 24 hours, manual/single-use SELLERS; observations may age out without forced acquisition. | Up to `$0.001` per eligible cycle |

No cadence exists for the other 21 products. No universal 24-hour or six-hour cadence may be inferred. The six-hour E2S CURRENT window is independent from acquisition cadence.

## 7. Coverage progression

1. **Lifecycle prerequisite:** separately review which D-002B records may become Atlas `ACTIVE` + `READY`. This creates no market authority.
2. **Single new-path proof:** run the existing governed PRODUCTS → PRODUCT_INFO → SELLERS chain for one cohort product, one authorization at a time.
3. **Cohort proof:** expand to the remaining cohort only after inspecting ambiguity, seller yield, condition, shipping, merchant identity, and cost from each preceding path.
4. **Category minimum:** establish structurally usable observations for at least two products in each of DDR5, DDR4, and SODIMM and inspect whether at least two retailers per category can become independently governed.
5. **A-001 market floor:** grow to at least 12 catalog products with structurally usable governed observations, every category represented, and at least three retailers overall.
6. **Public floor:** separately complete identity, history, canonical admission, review, E2S, publication, and snapshot requirements until each category has at least three qualifying offers covering at least two products and two retailers.

Acquisition success never implies review, E2S qualification, publication, or public snapshot inclusion.

## 8. Condition and shipping evidence

### Condition

Classification for the retained production observations: `NOT_AVAILABLE`.

The existing DataForSEO schema exposes `product_condition`, and `DataForSeoSellerNormalizer` already maps it losslessly when present. Explicit `new` can therefore flow through the current adapter; missing/null remains null and canonical `UNKNOWN`. All three retained Platinummicro observations have `product_condition=null`, so none establishes NEW. No inference from retailer context, reputation, title silence, price, or availability is allowed.

This is currently a **PROVIDER_EVIDENCE** launch limitation, not a missing mapping or reason to create another subsystem.

### Shipping

The existing normalizer preserves `shipping_price` as:

- `0` — explicitly known free;
- positive number — explicitly known paid shipping;
- `null` — unknown.

All three retained Platinummicro observations have `shippingPrice=null`. The current sample therefore demonstrates zero known-shipping results out of three observations of one seller/product; it is insufficient to estimate a general yield rate. Total price is preserved independently and is never recomputed into a landed-cost claim.

## 9. Rights, retailer identity, adapter, and freshness dependencies

`DATAFORSEO_GOOGLE_SHOPPING` currently has repository-owned API acquisition, current-observation, comparison, public-display, durable historical retention, audit, and analytics rights marked `ALLOWED`, with conditional attribution. These are source rights; they do not imply retailer permission or relationship.

Current production E2S composition is much narrower:

- canonical retailer: `RETAILER-0002`;
- marketplace: `platinummicro.com`;
- adapter compatibility: DataForSEO Google Shopping normalization `1.0.0` for that retailer/marketplace/API path;
- provisional freshness policy: CURRENT through six hours, AGING after six and before 24 hours, STALE at 24 hours;
- product scope: unrestricted only within that exact retailer/source policy;
- condition: explicit NEW required by current live-market policy;
- confidence: derived, never operator-set.

Other returned sellers fail closed unless their merchant identity resolves to an active Atlas retailer and matching adapter/freshness policy exists. Of the Track C portfolio, none is currently an Atlas retailer. A future seller result cannot be made public merely because DataForSEO returned it.

## 10. Curated bridge

The curated adapter is not a shortcut around the DRAFT/PENDING lifecycle gate, provider ambiguity, missing condition, retailer identity, rights, freshness, or downstream review. It is justified only for a specific launch product/retailer/source path with explicit source-backed condition, shipping knownness, offer/bundle classification, rights, Atlas identities, and controlled operator input where automated acquisition lacks governed parity.

Automated Mercury acquisition remains the durable owner. Any curated path remains explicitly sourced and is progressively disabled per path after automated lifecycle parity; historical curated evidence is never rewritten.

## 11. Scale blockers

| Category | Current blocker |
|---|---|
| `CODE` | `NONE` for exact-MPN staged acquisition. Revisit only if real results expose a resolver or request defect. |
| `CONFIGURATION` | 21 products are `DRAFT` + `PENDING`; only one is an operational acquisition candidate. |
| `IDENTITY` | New product evidence will normally begin unresolved/PROBABLE; non-Platinummicro sellers lack canonical merchant registration. |
| `RIGHTS` | DataForSEO source rights exist; retailer-specific/direct-feed rights for Track C remain separate and mostly unknown. |
| `PROVIDER_EVIDENCE` | Current DataForSEO production evidence supplies no condition and no known shipping; seller yield for new MPNs is unknown. |
| `FRESHNESS_POLICY` | Only DataForSEO/Platinummicro has production E2S freshness/adapter scope. Only the anchor has historical refresh cadence. |
| `RETAILER_COVERAGE` | Atlas has Amazon and Platinummicro only; none of the seven Track C targets is canonically registered. Exact live overlap remains unverified. |
| `COST` | One-task/$0.001 runs and `$0.01/day` limit make staged learning safe but prevent a 12- or 22-product refresh in one day under current policy. |

## 12. Exact next paid-operation decision boundary

B-001 authorizes no paid operation. The next decision sequence is:

1. Track D/operator review decides whether selected cohort records may transition from `DRAFT/PENDING` to the repository-native operational `ACTIVE/READY` state.
2. Re-run a zero-spend operational-candidate inspection and confirm exact Atlas/query binding.
3. If still valid, consider one existing governed PRODUCTS PREPARE/authorization for `ram_crucial_cp2k16g56c46u5`, keyword `CP2K16G56C46U5`, normal priority, United States/English, maximum one task and `$0.001`.

Do not authorize the full cohort at once. Do not run PRODUCTS until the lifecycle prerequisite and a separately reviewed paid authorization are present.
