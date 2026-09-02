# Hardware Radar current state

```text
Last updated:                  2026-09-02
Branch:                        dataforseo-sprint3-mercury-observation
HEAD at inspection:            6a3ea82f1aae1e7ebd980a26a0a5a1513134a5fb
Working tree at inspection:    clean committed baseline before MAIN-PROMOTION-R1 release-hardening changes
Current release-hardening increment: MAIN-PROMOTION-R1 — clean-checkout reproducibility and release governance fixture-certified
Main promotion:                BLOCKED until R1 certification and a repeat promotion audit succeed
Current content-foundation increment: CONTENT-006A — launch QA remains complete; six editorial routes; editorial discovery intentionally remains in Guides navigation, footer, index, and article links
Current implementation increment: MVP-002 Increment 4 — Curated RAM Offer Ingestion and Qualification Boundary complete
Previous completed increment:  MVP-002 Increment 3 — RAM Comparison Snapshot Projection
Current product-definition increment: A-001 — RAM Launch Catalog and Minimum Useful Coverage complete
Current public-product increment: A-002A — scoped cheapest-RAM proposition correction implemented and certified
Current market-data planning increment: B-001 — 22-product Mercury acquisition plan complete; no acquisition authorized
Current cohort-lifecycle increment: B-002A — six-product ACTIVE/READY transition completed and certified
Current acquisition selection increment: B-004 — product-scoped initial acquisition inspection/PREPARE fixture-certified
Current acquisition operation: B-014A — governed initial-acquisition E2P/E2Q composition fixture-certified; production E2P reassessment not rerun
Current budget correction:     B-006A — shared UTC-day spend composition and execution revalidation fixture-certified
Current retailer-strategy increment: C-001 — RAM Launch Retailer Portfolio and Relationship Strategy complete
Current outreach reconciliation: C-001A — MemoryC and Adorama outreach recorded
Current commercial reconciliation: Rakuten publisher onboarding 3/4; Newegg and Adorama pending; B&H declined without a stated specific reason
Current retailer-registration increment: B-011A — `RETAILER-0003` MemoryC canonically registered; independent merchant approval recorded
Current catalog-resolution increment: D-001 — 24 RAM launch candidates resolved for operator review
Current catalog-balance review: D-001A — brand and retailer relevance reviewed; 22 ready, 2 need evidence
Current Atlas-admission increment: D-002B — authorized 21-record batch admitted; 22/24 launch slots in Atlas
Current brand-registration increment: D-002A — four launch brand prerequisites canonically registered
```

This snapshot records repository and local governed-state evidence. It does not infer external provider state. Underlying source, tests, policies, contracts, ADRs, and Git win if a conflict is found.

## Current product-program posture

Hardware Radar now operates through parallel, coordinated tracks rather than one serial engineering chain. Current emphasis is **primary/high** for A — Public Product / Launch, B — Mercury / Market Data, and C — Retailer & Commercial; **supporting/demand-driven** for D — Atlas / Intelligence Foundation; and **guardrail/as-needed** for E — Governance / Platform Evolution. Public-product work may proceed while Mercury coverage expands, and retailer/commercial work may proceed independently of Mercury engineering until either reaches an owner boundary that requires a governed artifact or explicit action.

Mercury automated acquisition remains the durable target; curated ingestion remains transitional bootstrap infrastructure. Production publication remains governed by E2S and the separate publication boundary. No documented future-stage capability is implementation authority, and this parallel posture changes none of the operational facts below.

A-001 defines a 24-product target across 9 DDR5 desktop, 7 DDR4 desktop, and 8 laptop/SODIMM slots, with a launch floor of 18 publication-ready Atlas products and at least 6 per category. Minimum public coverage requires every category to be available with at least 3 qualifying offers spanning at least 2 products and 2 retailers, and at least 3 retailers overall. Atlas now represents 22 target products, but the governed snapshot still has zero qualifying offers, so launch remains `BLOCKED` on market/public coverage rather than catalog-floor knowledge. Track B owns finite observation/public-coverage requirements, Track C owns retailer-portfolio/commercial development, and Track D owns the two remaining evidence gaps. A-001 created no production state.

D-001 resolved the original 24 A-001 slots into exact-MPN candidates; D-001A subsequently rebalanced the set to 22 ready and two needing more evidence. D-002B has now admitted the ready set, while exact Track C retailer stocking remains unverified and Atlas admission still creates no Mercury evidence, rights, publication, Current Price, Cheapest, or Pick authority.

D-001A proposes a consumer-relevance rebalance from Kingston 21 / Corsair 2 / G.SKILL 1 to Kingston 6 / Corsair 4 / G.SKILL 6 / Crucial 7 / TeamGroup 1. The fixed 9 DDR5 desktop / 7 DDR4 desktop / 8 SODIMM model and all capacity invariants remain intact. Exact-MPN target-retailer research leaves 22 candidates `READY_FOR_OPERATOR_REVIEW`, 2 `NEEDS_MORE_EVIDENCE`, 0 rejected, and 0 unresolved; retailer evidence remains launch-relevance evidence only. No Atlas or market authority changed.

D-002 fixture-certified the 21 proposed new READY Atlas product records as a single batch, D-002A established their four missing canonical brands, and the operator explicitly authorized D-002B to admit that exact batch. Atlas now contains 22 RAM products covering 9 DDR5 desktop, 6 DDR4 desktop, and 7 SODIMM launch slots. The existing Corsair product and all five brand records remain unchanged; `F4-3200C16D-64GVK` and `CT32G4SFD832A` remain excluded as `NEEDS_MORE_EVIDENCE`. The 22-product Atlas count exceeds A-001's 18-product knowledge floor but is not public market coverage. No retailer, Mercury, rights, publication, Current Price, Cheapest, or Pick authority changed.

A-002/A-002A align the public shell around truthful monitored listed-price comparison while restoring the clear consumer proposition: find the cheapest RAM among the qualifying offers Hardware Radar tracks. “Cheapest” is valid scoped product language, not a claim of exhaustive whole-market knowledge or final delivered cost. The homepage now presents only DDR5, DDR4, and Laptop RAM/SODIMM as current launch categories; deferred Server/ECC is absent. Detailed monitored-coverage, unknown shipping/fees, stale-data, and affiliate-ordering protections remain in methodology and result context. The governed snapshot remains `INSUFFICIENT_DATA` in every scope, with no fake offers, Picks, estimates, Atlas-as-offer fallback, or silent stale fallback. Mercury and publication governance are unchanged. The operator has intentionally deferred the A-002/A-002A live-site release until Hardware Radar is closer to publishing governed live prices; the committed development public state remains the intended future release and no immediate deployment correction is authorized.

B-001 maps all 22 canonical RAM products to the existing exact-MPN Mercury path. B-002 fixture-certified and B-002A applied the exact operator-authorized `ACTIVE/READY` revisions for six new members of the representative cohort. Reviewer `human:Clinton_Ramsook` is recorded; the original Corsair anchor remains byte-for-byte unchanged; the other 15 launch records remain outside the batch. Seven products are lifecycle-ready and are constructed as exact-MPN `PRODUCTS` candidates. The governed Crucial canary created exact PRODUCTS (`09011702-2304-0179-0000-c977c7e8a824`), PRODUCT_INFO (`09011739-2304-0455-0000-2f32c707dfc6`), and SELLERS (`09011802-2304-0183-0000-b27c074679a9`) tasks for total spend `$0.003`, with zero retries or duplicates and exact proposal/authorization/plan/execution/consumption lineage. B-007A and B-008A fixture-certify Product Info and retention lineage, populated provider-identity equality, and contradiction-first Atlas validation. Retrieval retained ten USD offers with zero duplicates/rejections; all preserve explicit availability and null/unknown condition, while only Microless and Grooves-Inc have known positive shipping. Their stored DF003 identities remain immutable `AMBIGUOUS` records because the former composition independently applied the generic sparse-evidence resolver. B-009A adds deterministic, non-persisted `GOVERNED_INITIAL_ACQUISITION_BINDING`: exact active/ready Atlas, task, provider, and validation-digest prerequisites plus contradiction-free seller evidence produce DF003 `CONFIRMED` and effective E2G/E2H `VERIFIED`; missing projection input falls back to the generic resolver and contradictions fail closed. B-010A fixture-certifies production composition: the assessment CLI selects the exact cohort through validated retention bindings, reconstructs projections from durable proposal/retention/Atlas state, fails closed on governed-lineage defects, and preserves generic legacy behavior. This creates no E2I product decision or downstream authority. Production reassessment has run read-only; the ten retained records remain unchanged. MemoryC now resolves independently through `RETAILER-0003` and merchant decision `mer_idrev_000000003`; the other nine merchants remain `DISCOVERED`. Current-day spend remains `$0.003`, cumulative spend remains `$0.008`, and no Crucial history, canonical observation, review, E2S, publication, Current Price, Cheapest, or Pick authority exists.

C-001's portfolio follows the durable Commercial-First, Capability-Separated Partnership Doctrine: Hardware Radar may pursue independently valuable retailer/affiliate relationships before ideal Mercury capabilities exist, then inspect and classify actual feeds, APIs, catalogs, terms, and data rights separately after access. Rakuten publisher onboarding is `3/4`: Hardware Radar's validated site/profile, Jamaica onboarding, company/tax details, Google Analytics connection, and verified PayPal method are complete; `Partner with Advertiser` remains. Newegg US MID `44583` is `APPLIED / PENDING` through Rakuten and Adorama is `APPLIED / PENDING` through Partnerize. B&H was declined on 2026-09-02 without a stated specific reason; its generic list of possible reasons establishes no cause, disposition is `RETRY LATER / REAPPLY AFTER MATERIAL SITE GROWTH OR CHANGE`, and no affiliate or data authority exists. MemoryC direct outreach and affiliate onboarding remain unresolved. Atlas `affiliateEnabled` remains unchanged, and no feed/API, Mercury rights, observable/comparable, publication, Current Price, Cheapest, Pick, or recommendation authority was created. B-017A remains fixture-certified with zero production supplemental-condition sources, policies, evidence, or resolver configuration; production MemoryC condition remains `UNKNOWN`.

CONTENT-001 establishes Hardware Radar's durable content direction as **hardware buying intelligence with a price engine**. CONTENT-002 supplies the fixture-certified Markdown/front-matter validator, deterministic static generator, reusable article shell, structured data, and sitemap merge defined by ADR-056. CONTENT-003 publishes `/guides/` and the RAM hub with one shared `Guides` navigation entry. CONTENT-004 publishes the evidence-backed cornerstone RAM Buying Guide. CONTENT-005 completes the initial cluster with four focused spokes. CONTENT-006 completes launch QA: the Guides index lists all five validated RAM articles and the hub links all spokes. CONTENT-006A removes the optional homepage editorial-discovery block after operator visual review. Editorial discovery remains intentionally owned by the primary and footer `Guides` links, `/guides/`, and article internal linking; the homepage retains its price-first proposition, governed answer, category access, trust, and footer sequence. Six editorial routes remain published. Metadata, schema, sitemap, mobile layout, accessibility contracts, factual consistency, commercial independence, and existing public-page compatibility are validated. No price, Pick, recommendation, market, or downstream authority changed. The initial content-foundation rollout remains launch-ready; the next product/content action should be chosen from measured user needs rather than adding articles by quota.

B-011/C-002A fixture-certified MemoryC canonical retailer readiness, B-011A registered exactly `RETAILER-0003` in Atlas, and merchant decision `mer_idrev_000000003` approved `DISCOVERED → REGISTERED` for evidence `dfev_bb40abbb467a6497b88a3e2d`. The governed path subsequently admitted immutable history, canonical observation `mer_obs_000000004`, and effective review `mer_rev_000000003 = REVIEWED`. B-014A fixture-certifies one shared durable-lineage context owner across E2J, E2P, and E2Q. Condition remains `UNKNOWN`; publication, Current Price, Cheapest, Pick, recommendation, and affiliate authority remain absent. The next safe MemoryC action is the separately authorized read-only E2S reassessment already identified below.

## Current platform status

| Subsystem | Implemented/tested | Configured/production state |
|---|---|---|
| **Sentinel** | Deterministic rule/validation suites for architecture, Atlas, Mercury, and publication safety | Library/rule layer; no independent external deployment represented |
| **Atlas** | Canonical repositories/validators with 22 RAM products, five RAM launch brands, and retailers `RETAILER-0001` Amazon, `RETAILER-0002` Platinummicro, and `RETAILER-0003` MemoryC | Repository-owned canonical state; public projection generated by build |
| **Mercury** | Acquisition, retention, resolution, identity review, promotion, historical admission/query/refresh/cadence, canonical admission/review, current-market qualification, publication, and rights boundaries | Production publication/build composition now requires certified E2S and projects its qualification without default freshness/confidence reinterpretation; local governed state remains 1 Atlas product, 3 historical observations, and 2 reviewed canonical observations; `mer_obs_000000003` remains current-market-ineligible with no publication or price authority |
| **Forge** | Internal static authoring/review application, generated public projection, certified read-only Mercury operations panel, and local FM008 exporter | Explicit local export materializes governed Atlas/Mercury state under `.forge-review/forge/`; legacy preview remains isolated and noncanonical |
| **Beacon** | Product-interest signal, collection/write boundaries, transactional adapter, and 90-day retention policy | Application boundary ready; durable file adapter available but not production-configured; repository signals 0; automatic execution disabled |
| **Gateway** | Runtime/storage contracts, Cloudflare deployment plan, WAF policy, monitoring, alerts, recipient verification, sender/domain governance, DF005-W PREPARE, and fixture-verified DF005-X onboarding authorization/executor | One valid DF005-W authorization is `PREPARED`; DF005-X production PREPARE/EXECUTE are blocked by missing official least-privilege permission policy; backend remains undeployed, production transport `NOT_CONNECTED`, and browser disconnected |
| **Public Hardware Radar** | Generated static RAM site and category/trust pages under `public/`; consumes a governed winner plus bounded alternatives, preserves listed-price and shipping-knownness semantics, and remains fail closed without qualifying published observations | Launch shell and comparison projection are truthful and fixture-tested but still have zero eligible public observations; catalog breadth and production publication remain later controlled work; current external hosting/deployment was not queried by this task |

## Current test baseline

The current runners declare **219 subsystem test files**:

| Runner | Files |
|---|---:|
| Sentinel | 7 |
| Atlas | 18 |
| Mercury | 170 |
| Beacon | 7 |
| Gateway | 17 |

The root `npm test` additionally runs repository-layout, release-governance, public launch-shell, editorial publishing/route/launch QA, and public-build verification. The counts come directly from the current working-tree runners; rerun the relevant suite before changing behavior.

## Current production and external state

| Capability | Current governed state |
|---|---|
| Main deployment trigger | `DEPLOYMENT_TRIGGER_EXTERNAL_VERIFICATION_REQUIRED`; repository evidence does not establish whether merging `main` deploys production |
| Production Gateway transport | `NOT_CONNECTED` |
| Browser instrumentation/connection | `NO` |
| Cloudflare Worker | Target selected; not configured or deployed |
| D1 | Target selected and draft migration present; no binding/resource configured or deployed |
| WAF rate limiting | Policy enabled and threshold configured (20 requests / 60 seconds, `BLOCK`); not deployed |
| Workers Logs | Destination selected; not deployed/configured |
| Operational monitoring | Policy configured; production monitoring not configured |
| Operational alerts | Five-rule policy configured; no production notification destination/transport |
| Email provider | `CLOUDFLARE_EMAIL_SERVICE` selected; not deployed; sending disabled |
| Recipient | Operator approval exists; governed verification evidence exists and projects `VERIFIED`; current runtime recipient presence is `NO` |
| Sender/domain | Exact sender and `cheapestram.com` proposal are approved in one valid DF005-W authorization; neither is provider-configured or onboarded |
| Email binding | Proposed `BEACON_ALERT_EMAIL` name is approved; binding configuration/deployment remain `NO` |
| Alert email transmission | Disabled; none sent by this task |
| DataForSEO | Governed manual acquisition/refresh tooling and retained evidence exist; unattended LIVE authority is disabled; no acquisition occurred in this task |

## DF005 progression

| Increment | Purpose | State | Key outcome |
|---|---|---|---|
| A | Historical portfolio read model | Implemented | One deterministic portfolio view over Atlas/history/cadence |
| B | Multi-product cadence foundation | Implemented | Explicit, unambiguous cadence configuration |
| C | Product-interest signal | Implemented | Product-centric signal isolated from Mercury truth |
| D–E | Collection and governed write | Implemented, not connected | Beacon validation and durable/replay-safe local boundary |
| F–G | Gateway architecture/provider selection | Implemented, selected | Workers + D1 selected; no resource deployed |
| H | Retention | Configured | 90-day raw first-party-interest retention; automatic deletion still false |
| I–I1 | Abuse control | Policy configured | Cloudflare edge WAF target and 20/60s launch threshold; not deployed |
| J–K | Operational monitoring | Policy/destination selected | Privacy-safe records and Workers Logs target; not deployed |
| L–M | Alerts and notifications | Policy configured | Five deterministic alert rules and governed email intents; no delivery |
| N | Email provider | Selected | Cloudflare Email Service / Workers binding target; not deployed |
| O–Q | Recipient governance | Approved and verified | Address-free approval plus digest-bound verification evidence; runtime value absent |
| R–U | Controlled recipient verification | Implemented; evidence captured | Secure runtime/credential, provider observation, and admission boundaries; current governed evidence is `VERIFIED` |
| V | Sender/domain governance | Implemented | Sender, domain, binding, deployment, and sending remain independent gates |
| W | Sender/domain approval PREPARE | Implemented, committed, and run by the operator | One digest-only authorization is valid, `PREPARED`, unexpired at inspection, and has no mutation/deployment/sending authority |
| X | Controlled Email Sending domain onboarding | Implemented and fixture-verified; production blocked | Separate provider/DNS approvals and single-use executor exist, but no production PREPARE/EXECUTE command exists until Cloudflare documents the exact least-privilege token permission |

Canonical details live in `docs/implementation Contracts/IC-DF005*.md`.

## Verified recipient state

```text
Recipient approved:               YES
Recipient verification evidence: PRESENT
Recipient verification state:    VERIFIED
Runtime recipient presence:       NO
Private recipient disclosed here: NO
```

The evidence is local operational state under `.forge-review`; the private address is intentionally absent from source and this handoff.

## Sender/domain state

```text
Sender approved:                         YES
Sender configured:                       NO
Sending-domain proposal approved:        YES
Sending domain provider configured:      NO
Sending domain provider verified:        NO
DNS impact reviewed:                     YES
DNS mutation approved:                   NO
DNS mutation executed:                   NO
Email-binding name approved:             YES
Email binding configured:                NO
Provider deployed:                       NO
Sending enabled:                         NO
DF005-W authorization ID:                gw_email_onboard_6c1ab984ef84552cefc792f9
DF005-W authorization lifecycle:         PREPARED
DF005-W authorization available:         YES (unexpired at 2026-08-24 inspection)
DF005-W authorization records/conflicts: 1 / 0
```

## Active work

The accepted [Hardware Radar Product Evolution and Scope Doctrine](../products/HARDWARE-RADAR-PRODUCT-EVOLUTION.md) now governs staged evolution and scope interpretation. The RAM MVP is intentionally narrower than the long-term hardware-intelligence and buying-assistant vision: MVP reductions are deferrals unless explicitly rejected elsewhere, while future-stage capabilities remain unauthorized until separately approved. Current implementation focus remains making the RAM product useful and launchable under the existing architecture and fail-closed governance.

MVP-001 establishes an honest fail-closed public launch shell without changing Mercury or production market state. DDR5, DDR4, and SODIMM pages no longer render placeholder Picks or `#` recommendation links; obsolete invented RAM market JSON and its generic production loader are removed; category snapshot failures and insufficient data render controlled announced states; retailer links use safe external-tab attributes; displayed amounts are labeled as listed prices with shipping unverified because the current public snapshot does not establish shipping; update-frequency and whole-market claims are replaced with monitored-coverage language; and the privacy policy names the Google Analytics and Microsoft Clarity scripts already loaded by public pages. The public snapshot remains `INSUFFICIENT_DATA` in every scope and no Cheapest, Pick, publication, or current-price authority was created.

MVP-002 Increment 1 enforces E2S as the single production current-market qualification owner consumed by publication and governed snapshot projection. Production composition injects the Atlas repositories, adapter registry, source rights, and repository-owned production freshness policy into E2S; `PublicationWorkflowService` carries the qualified assessment into `GovernedMarketPublicationService`, and `MarketPublicationService` projects that result without independently applying default freshness, confidence, or condition interpretation. An effective `PUBLISH` remains durable history but is dynamically excluded whenever E2S later becomes nonqualified. Missing E2S composition or production freshness policy fails closed. Legacy development/fixture evaluation remains explicit and cannot be selected by the production build. This increment created no publication decision or production authority.

MVP-002 Increment 2 adds controlled `publication:prepare` and `publication:execute` commands inside Mercury's existing publication boundary. PREPARE assesses and binds the exact canonical observation, effective review/publication lineage, Atlas identities, provenance, rights, adapter, production freshness policy, and E2S material candidate state into a short-lived immutable authorization without creating a publication decision. PUBLISH EXECUTE reloads current owner state and reassesses E2S at execution time; WITHDRAW binds an effective predecessor PUBLISH but remains available after dynamic E2S loss. Execution requires decision-specific confirmation, is single-use and replay-safe, and appends only the authorized `mer_pub_*` decision plus authorization consumption. Production PREPARE and EXECUTE have not been run; no production publication decision or downstream price/recommendation authority was created.

MVP-002 Increment 3 adds an additive RAM comparison projection: every available scope retains its existing `cheapest` winner and can expose up to four ordered alternatives from the same governed E2S-qualified and effectively published candidate set. Ordering remains listed price, newest observation, then observation ID; duplicates are removed. Atlas `SO_DIMM` plus `LAPTOP` now maps correctly to the public SODIMM scope and is excluded from desktop DDR4/DDR5. Projected offers distinguish listed price from total cost and preserve known-free, known-paid, and unknown shipping states. Active retailer, US region, supported currency, positive price, and supported RAM classification are required; affiliate state has no effect. The public snapshot remains empty because no production observation currently passes all upstream gates.

MVP-002 Increment 4 adds fixture-certified `curated-offer:prepare` and `curated-offer:execute` commands around Mercury's existing canonical ingestion service. Structured RAM candidates require explicit Atlas product/retailer identities, approved source-rights profile, retailer-consistent source URL/domain, observation time, listed price/currency, availability, condition, shipping knownness, standalone/bundle state, unconditional/conditional-price state, and operator reference. Missing condition becomes `UNKNOWN`, never `NEW`; unknown shipping remains null. PREPARE creates only a short-lived immutable authorization, while confirmed single-use EXECUTE revalidates current Atlas/rights state and delegates idempotent acceptance to Mercury. The adapter is transitional launch infrastructure, not a permanent peer acquisition system: each approved product/retailer/source path can stop accepting new curated inputs by withdrawing or disabling its scoped authority after an automated Mercury path reaches governed lifecycle parity. Existing curated observations and their explicit adapter/source provenance remain immutable audit history. No production curated rights profile, freshness policy, authorization, or observation was created, so production use remains unavailable and all downstream authority remains absent.

DF004-E2P remains the sole canonical-eligibility and admission-policy owner. DF004-E2Q and E2Q.1 are fixture-certified. The first production canonical admission completed for evidence `dfev_4a1ca776de2706f9473653f3`: successor authorization `mer_canauth_29cab41b1c73b1ca9ee364a5` was consumed exactly once and created canonical observation `mer_obs_000000001`. The canonical repository contains exactly that one valid observation under idempotency key `E2P_CANONICAL_ADMISSION:dfev_4a1ca776de2706f9473653f3`. Its product `ram_corsair_cmk32gx5m2b6000z30`, retailer `RETAILER-0002`, DataForSEO source/task/provenance, retained-evidence hash, and historical-observation hash match the certified E2P/E2Q binding.

DF004-E2R is implemented and fixture-certified as the controlled Mercury-owned operator boundary for reviewing a canonical observation. Production authorization `mer_revauth_b7e6ad9d27b0bfa7c7a1a44f` was consumed exactly once and recorded `mer_rev_000000001` as the sole and effective `REVIEWED` decision for `mer_obs_000000001`. Its observation, evidence, Atlas product/retailer, provider/task, provenance/rights, E2P/E2Q lineage, E2R policy, authorization, and decision bindings validate consistently. The canonical observation remains unchanged. `REVIEWED` means acceptable to proceed only to independent publication evaluation and grants no publication or price authority.

DF004-E2S is implemented and fixture-certified as the deterministic, non-persisted current-market qualification boundary. The shared DataForSEO Google Shopping normalizer now has explicit retailer-scoped registrations for Platinummicro (`RETAILER-0002`, `platinummicro.com`) and MemoryC (`RETAILER-0003`, `memoryc.com`), both for API input and normalization version `1.0.0`; arbitrary sellers remain unsupported and confidence requires full contextual compatibility rather than adapter-ID presence. Approved provisional freshness policies now exist separately for both retailer scopes. Each classifies age through six hours as CURRENT, greater than six and less than 24 hours as AGING, and at least 24 hours as STALE. This maximum eligibility age is not refresh cadence, automatic acquisition, or universal policy.

B-016A is fixture-certified. A production-shaped MemoryC assessment with compatible adapter registration and an explicit CURRENT evaluation derives HIGH confidence while preserving condition `UNKNOWN`, unknown shipping, and satisfied DataForSEO rights; its sole fixture E2S blocker is `CONDITION_NOT_ELIGIBLE`. Production E2S has not been reassessed after the configuration change. Adapter registration is separate from Atlas retailer identity, rights, publication, and affiliate status, and freshness establishes temporal currentness only.

B-017A implements and fixture-certifies the additive supplemental offer-condition evidence boundary. Mercury now owns an immutable append-only record/repository, exact offer binding, independent `derivation.offerCondition` rights, explicit source/retailer/marketplace temporal-policy resolution, deterministic `CONFIRMED_NEW` / `CONFIRMED_NON_NEW` / `UNKNOWN` / `CONFLICT` assessment, and an optional read-only E2S injection seam. Exact replay is idempotent, conflicting replay fails closed, supersession is append-only, and retained, historical, canonical, Atlas, review, publication, and public-price state remain unchanged. No production supplemental source, rights profile, temporal policy, evidence, or E2S resolver is configured. The current MemoryC listing still has no explicit condition assertion, so production condition remains `UNKNOWN` and no downstream authority exists.

The read-only production diagnostic for `mer_obs_000000001` at `2026-08-30T23:00:00.000Z` now resolves the production policy and returns `CURRENT_MARKET_NOT_QUALIFIED`. Exact blockers are `FRESHNESS_NOT_ELIGIBLE`, `CONFIDENCE_NOT_ELIGIBLE`, and `CONDITION_NOT_ELIGIBLE`; the immutable observation is STALE, confidence is LOW, and condition is `UNKNOWN`. All downstream authorities remain false. Canonical, review, and authorization hashes remained unchanged.

The expired E2Q predecessor `mer_canauth_952fbc71ad7acafe0abf0f66` remains immutable and unconsumed. Its one supersession event is valid and linear, with the E2Q successor at generation 1 and `EXACT_BINDING`; the predecessor's effective lifecycle is `SUPERSEDED` and the successor's is `CONSUMED`. No publication decision exists. At the current publication evaluation cutoff, `REVIEW_REQUIRED` is removed but `FRESHNESS_NOT_ELIGIBLE`, `CONFIDENCE_NOT_ELIGIBLE`, and `CONDITION_NOT_ELIGIBLE` remain. Publication eligibility, publication authority, and published state are `false`; current/live/public-price and Cheapest/Pick authority remain absent. The public market snapshot remains fail closed with `INSUFFICIENT_DATA`, zero eligible observations, and no Cheapest result in every scope.

IC-FORGE-MERCURY-008 materializes the FM007 read model through an explicit, local, atomic exporter. Its refresh context now reuses the historical-admission governance boundary that binds identity reuse to Atlas-backed identity decisions and supplies the same governed refresh envelope to `HistoricalObservationPortfolio`; FM008 does not reinterpret raw identity reuse.

Historical-refresh PREPARE now consumes that governed context for second and later generations instead of pairing the latest historical evidence with the original SELLERS enrichment task. The first generation still validates the original authorization/plan/execution lineage. Later generations require exact agreement among the latest historical observation, retained evidence, completed refresh result, prior refresh plan and authorization, provider task, Atlas product/retailer, provider identity, and governed identity-reuse target. Conflicts fail closed before plan persistence. The correction is fixture-certified, and the production retry succeeded with plan `histrefresh_5aa749345b1e27cce2424819`, status `PENDING_OPERATOR_REVIEW`, correctly bound to prior task `08240007-2304-0183-0000-83e8dcdb3c6e`. It created no paid task, authorization, provider operation, or spend.

The shared later-generation cycle composer is fixture-certified for LIVE PREPARE, status, and cadence. LIVE PREPARE revalidated plan `histrefresh_5aa749345b1e27cce2424819`, and the separately authorized LIVE EXECUTE created exactly one completed SELLERS task, `08310644-2304-0183-0000-4c9506a57d97`, at actual spend `$0.001`. Governed result retrieval completed with one seller result and retained evidence `dfev_35c4edb75998718c2846f90f`; duplicates and conflicts are zero, identity reuse `histidreuse_32ca91b02e0cdbd34424f664` is `APPLICABLE`, and retrieval added no spend. Production historical admission created immutable observation `mer_hist_12f71917885717ec`; condition remains `null`, and E2P assessment `mer_canassess_557f5adca51b18485e76eb04` is canonical eligible. The first E2Q EXECUTE failed closed before persistence and left `mer_obs_000000002` as an unused sequence gap. Its authorization `mer_canauth_4f73ce36e1f409878ae42378` remains immutable and unconsumed with effective lifecycle `SUPERSEDED`. Exact-binding successor `mer_canauth_8b1d1c076adff2f987f1bf5e` was consumed exactly once and admitted `mer_obs_000000003`. Canonical construction represents the provider instant `2026-08-31 06:44:59 +00:00` as ISO UTC `2026-08-31T06:44:59.000Z` through the repository boundary without rewriting retained evidence or history. The canonical repository has two records, sequence 3, and two idempotency entries. E2R authorization `mer_revauth_7777431b9d6799c2f8cc3fa3` was consumed exactly once and recorded `mer_rev_000000002` as the sole effective `REVIEWED` decision for `mer_obs_000000003`; the canonical observation remained unchanged. Read-only E2S assessment `mer_cmqual_f783a1cb861ebb9f9cd5f1ec` at `2026-08-31T21:45:00.000Z` returns `CURRENT_MARKET_NOT_QUALIFIED`: freshness is `AGING`, confidence is `MEDIUM`, condition is `UNKNOWN`, and exact blockers are `FRESHNESS_NOT_ELIGIBLE`, `CONFIDENCE_NOT_ELIGIBLE`, and `CONDITION_NOT_ELIGIBLE`. Publication, current/live/public-price, Cheapest, and Pick authority remain absent.

Operator certification succeeded at the explicit cutoff `2026-08-24T23:00:00Z`. Two independent exports produced byte-identical local artifacts at `.forge-review/forge/certified-mercury-operations.json` with SHA-256 `32d0a29e35ebb101ac8d4f764a266b7912a3068c227968a2de6e559cb87d0f1a`. Both the canonical governed portfolio and FM008 report cadence `NOT_DUE`, cycle `COMPLETE`, no cycle blockers, and next action `PREPARE_NEW_REFRESH`; the false `IDENTITY_REUSE_INVALID` blocker is absent. Forge loaded the corrected artifact through its local file-import boundary. Protected Mercury source-state hashes remained unchanged, and no network, provider, paid, mutation, or publication operation occurred.

DF005-X remains independently fail closed:

DF005-X implements the local governance boundary without executing it. Official Cloudflare documentation establishes the endpoint and automatic DNS effects but not the exact accepted least-privilege API-token permission. A clarification request containing the exact question recorded in the DF005-X contract has been submitted to the official Cloudflare Community and is pending moderator approval. Submission is not authoritative permission evidence, support confirmation, policy approval, or execution authority. Production use therefore remains fail closed. No production resource, credential, provider configuration, DNS, binding, deployment, or sending state is changed.

## DF005-X external clarification state

```text
Cloudflare Community clarification request: SUBMITTED
Moderation state:                         PENDING_APPROVAL
Authoritative permission confirmation:    NOT_RECEIVED
Exact token permission:                   UNKNOWN
Permission-group ID:                      UNKNOWN
Single-zone restriction capability:       UNKNOWN
Separate DNS permission requirement:      UNKNOWN
DF005-X production PREPARE:               UNAVAILABLE
DF005-X production EXECUTE:               UNAVAILABLE
Provider mutation:                        NONE
DNS mutation:                             NONE
Actual spend:                             $0.000
```

## Current blockers and operator decisions

- Wait for the submitted Cloudflare Community clarification request to receive moderator approval and a response. The pending post itself establishes no permission fact or authorization.
- Obtain sufficiently authoritative confirmation of the exact API-token permission-group name and public ID accepted by `POST /zones/{zone_id}/email/sending/subdomains`, whether it can be restricted to the specific zone, and whether automatic onboarding requires separate DNS permission; current documentation, schema-derived metadata, permission listings, generated SDK material, and the pending community submission do not establish the mapping.
- Keep production DF005-X PREPARE and EXECUTE unavailable until that permission is adopted into canonical permission evidence.
- Keep post-onboarding provider/DNS observation and verification separate from the mutation itself.
- Keep Worker binding configuration, Worker/D1 deployment, sending activation, test transmission, production transport, and browser connection as later independent gates.
- E2Q production successor-PREPARE: `EXECUTED`; successor consumed: `YES`; production EXECUTE: `CANONICAL_ADMITTED`; canonical observation: `mer_obs_000000001`.
- Production E2R decision `mer_rev_000000001` is effective as `REVIEWED`; it removed only the review prerequisite and did not authorize publication. The scoped E2S.1 policy now resolves, removing `PRODUCTION_FRESHNESS_POLICY_MISSING`, but the immutable observation remains blocked by stale freshness, LOW derived confidence, and condition `UNKNOWN`.
- Evidence `dfev_35c4edb75998718c2846f90f` completed the governed recurring path through paid refresh, retrieval/retention, historical admission, canonical admission, and review. Decision `mer_rev_000000002` is effective as `REVIEWED` for `mer_obs_000000003` and removed only the review prerequisite. E2S remains blocked by `AGING` freshness, `MEDIUM` confidence, and condition `UNKNOWN`; publication and all price authorities remain false. Deliberately stop before publication and discuss the evidence strategy for explicit provider-backed condition rather than inferring `NEW`.
- MemoryC canonical observation `mer_obs_000000004` has effective review `mer_rev_000000003 = REVIEWED`. B-016A added its explicit DataForSEO adapter and freshness configuration and fixture-certified the expected condition-only failure, but production E2S has not been rerun. The next safe action is a separately authorized read-only production E2S reassessment; do not infer `NEW` or proceed to publication.
- The supplemental-condition runtime is fixture-certified, but no safe current MemoryC source, source-specific rights profile, or temporal policy has been established. Prefer a retailer-authorized feed/API with explicit condition and stable offer identity; the existing curated full-offer path must not be used to rewrite the canonical observation. Production use remains unavailable until those independent inputs are deliberately governed.
- Mercury currently has no certified cross-source offer-binding policy or governed retailer-offer identifier for this Platinummicro evidence. The retained URLs contain a stable-looking `variant=44649557459027`, but it is not parsed, separately retained, or established by a retailer/source contract as authoritative; DataForSEO `dataDocId` is provider product identity, not retailer-offer identity. Cross-source condition corroboration must therefore remain unavailable until a real second source exposes an inspectable exact offer identifier and rights, adapter, and temporal policy can be designed from evidence.
- E2S-owned production publication composition and the controlled publication PREPARE/EXECUTE boundary are fixture-certified. The legacy direct record command remains development-only. No production publication PREPARE or EXECUTE has run, and `mer_obs_000000003` remains E2S-nonqualified, so no current production PUBLISH candidate is available.
- The public launch shell now consumes only the governed market snapshot and fails closed cleanly, but all scopes still have zero eligible observations. Before adding public market data, define the narrow launch catalog/retailer coverage and comparable listed-price rules, then implement the separately controlled publication bridge; do not restore placeholder data or Picks.
- The current DF005-W authorization expires; if it expires before a later authorized operation, fail closed and require a fresh DF005-W PREPARE rather than extending or rewriting it.

## Next recommended actions by track

- **A — Public Product / Launch:** continue truthful UX, mobile, SEO, methodology, comparison, and empty-state work using governed outputs; do not manufacture prices, Picks, or publication authority.
- **B — Mercury / Market Data:** plan governed observation coverage against the finite A-001 slots and public-coverage floors; continue automated coverage and condition-evidence work independently, and do not run curated production operations without their separate approvals.
- **C — Retailer & Commercial:** leave Newegg and Adorama pending unless a program requests information or reasonable follow-up becomes necessary; treat B&H as declined with no established cause and consider reapplication only after material site growth or change; continue to await MemoryC's response. Reconcile every outcome by relationship dimension and keep commercial access independent from data, market, and recommendation authority.
- **D — Atlas / Intelligence Foundation:** research and deliberately resolve the unfilled A-001 product slots from authoritative evidence; do not populate Atlas automatically or inflate cosmetic variants.
- **E — Governance / Platform Evolution:** keep established boundaries as guardrails, address demonstrated defects, and wait for sufficiently authoritative Cloudflare permission evidence before changing DF005-X governance.

Do not onboard the domain, mutate DNS, configure a Worker binding, deploy, or send email while the permission policy is unresolved. DF005-W itself has no EXECUTE path and DF005-X exposes no production execution command.

## Recent commits

| Commit | Outcome |
|---|---|
| `d328653` | E2P aligned with governed chained identity reuse |
| `a6699c6` | Chained governed identity reuse for E2G/E2J |
| `a55d3da` | DF004-E2R controlled canonical-observation review governance |
| `3f94277` | DF004-E2Q.1 expired canonical-authorization supersession |
| `7f0608a` | DF004-E2P governed canonical observation admission |
| `0918060` | FM008 export aligned with governed refresh context |
| `ad1e9eb` | FM008 certified Mercury operations exporter implementation |
| `47e6ff6` | FM007 certified Mercury operations projection for Forge |
| `80c5ebf` | Pending Cloudflare permission clarification recorded |
| `b5330b0` | Canonical repository-owned handoff system |
| `183840b` | DF005-W sender/domain onboarding PREPARE governance |
| `c6a0d1b` | DF005-V sender/domain governance |
| `bf04b55` | DF005-U verified-recipient observation/evidence capture |
| `da3ff23`, `87dff53` | Secure Cloudflare verification credential/operator boundaries |
| `0e0e8bb`, `1739364` | Controlled recipient verification runtime and governance |

## Protected state

Protected policy hashes are asserted by Gateway regression tests, especially `packages/gateway/tests/GatewayAlertSenderDomainGovernance.test.mjs`. Key current operational/governance hashes verified during the handoff inspection are:

```text
.forge-review/gateway-alert-recipient-verification-evidence.json
  3a21d6202ed659f7d571a23368d92bf1aabd14691e3873d66313e0d821f8f549

.forge-review/gateway-alert-sender-domain-onboarding-authorizations.json
  f5141ec9aec6f5dcc0f065cd8e6b92455dd8fe6d048842711972ec43ff13ce2a

packages/gateway/GatewayAlertSenderDomainGovernance.js
  2a53fb5d028e24cebbf2a980a87a590ee45f14b47a064216e1cbd135e6f809ea
```

The Beacon retention, WAF, monitoring, Workers Logs, alert, notification, email-provider, recipient-governance, recipient-approval, and Mercury cadence policies remained unchanged during DF005-W and this handoff task.
