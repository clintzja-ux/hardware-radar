# Hardware Radar canonical handoff

This is the stable orientation layer for new Hardware Radar engineering sessions. It points to authoritative repository artifacts; it does not replace source, tests, policies, ADRs, implementation contracts, runbooks, or Git state. Read [CURRENT-STATE.md](./CURRENT-STATE.md) for the living operational snapshot and [HANDOFF-PROTOCOL.md](./HANDOFF-PROTOCOL.md) before completing a meaningful increment.

## Project identity and mission

Hardware Radar is a Mirabelle Labs hardware decision-support product. Its current public scope is a static, RAM-focused experience for finding and understanding verified DDR4, DDR5, and laptop-memory options. Its mission is to help people make better hardware purchasing decisions and buy with confidence. The long-term direction is a traceable hardware-intelligence platform spanning broader component knowledge, market intelligence, validation, recommendations, and buying assistance.

Canonical orientation sources include [product-bible.md](../../product-bible.md), [product vision and strategy](../products/product-vision-and-strategy.md), the [product evolution and scope doctrine](../products/HARDWARE-RADAR-PRODUCT-EVOLUTION.md), the [Hardware Radar Content Foundation](../products/HARDWARE-RADAR-CONTENT-FOUNDATION.md), the [RAM launch catalog and minimum useful coverage definition](../products/RAM-LAUNCH-CATALOG-AND-COVERAGE.md), the [RAM launch retailer portfolio](../products/RAM-LAUNCH-RETAILER-PORTFOLIO.md), [architecture-bible.md](../architecture-bible.md), and [DATA-PHILOSOPHY.md](../DATA-PHILOSOPHY.md).

## Product evolution and scope interpretation

The RAM MVP is Hardware Radar's first product surface within a long-term hardware intelligence platform and buying-assistant direction. MVP scope reductions are deferrals, not abandonment of the broader Atlas, Mercury, Compass, Echo, Aurora, Forge, Beacon, and Gateway direction unless an accepted decision explicitly says otherwise. The governing rule is **Protect the architecture; defer the capability.** Long-term vision does not authorize speculative implementation: every future capability still requires an explicit approved increment or task. Hardware Radar operates as a small product program with parallel tracks; a track may proceed independently until it reaches another owner's boundary, which requires that owner's governed artifact, contract, decision, or explicit operator action. Future agents must use the [product evolution and scope doctrine](../products/HARDWARE-RADAR-PRODUCT-EVOLUTION.md) when interpreting MVP scope and current execution tracks.

## Established product and engineering principles

- Optimize for purchasing-decision usefulness, confidence, simplicity, and trust before revenue.
- Keep recommendations retailer-independent; affiliate economics must not determine ranking.
- Apply the Commercial-First, Capability-Separated Partnership Doctrine: pursue independently valuable retailer/affiliate relationships without requiring ideal Mercury capability first, then classify feeds, APIs, retention, comparison, and other data rights separately. Commercial approval grants no evidence, publication, Cheapest, Pick, or recommendation authority.
- Preserve Hardware Radar as hardware buying intelligence with a price engine. Editorial Guides support purchasing decisions and qualified discovery but must not displace the homepage's immediate governed price answer, manufacture Atlas/Mercury facts, imply first-party testing, or create Picks and recommendation authority.
- Show evidence and provenance. Never invent production facts, identity, verification, configuration, or eligibility.
- Separate canonical facts, observations, policy decisions, workflow, behavioral evidence, transport, and presentation by owner.
- Treat public RAM specification comparison as an Atlas-derived factual surface only. It may expose deterministic similarities and differences, but it creates no market, compatibility, ranking, recommendation, Cheapest, Pick, or publication authority; see ADR-058.
- Treat ordinary retailer product-page destinations as Mercury-owned navigation metadata only. Atlas retains product and retailer identity; destination eligibility is independent of affiliate state and grants no offer, observation, rights, publication, Current Price, Cheapest, Pick, or recommendation authority; see ADR-059.
- Use GA4 for near-term third-party operational referral measurement; reserve Beacon for canonical Hardware Radar-governed first-party product/business intelligence, and do not deploy Beacon merely to duplicate sufficient GA4 measurement.
- Treat DataForSEO Merchant API use for the externally confirmed Hardware Radar consumer price-intelligence case as the established `DATAFORSEO_MARKET_INTELLIGENCE_USE_AUTHORIZED` premise; do not generically relitigate it during ordinary Mercury work. Revisit rights only for a materially different product, terms, data category, redistribution model, legal requirement, conflicting guidance, or use outside the confirmed case. Permission never bypasses evidence or public-claim governance; see ADR-022.
- A DataForSEO-returned retailer product URL is only a `RetailerDestination` candidate. Market `sourceUrl`/`offerUrl` and admitted navigation `destinationUrl` remain independently governed; only ADR-059/GROWTH-005A admission grants `DESTINATION_NAVIGATION_ELIGIBLE`.
- Apply **MEASURE → LEARN → EXPAND** to audience and authority work: use contextual Search Console, GA4, retailer-referral, and social evidence to choose bounded priorities, never as an automatic rule or override of integrity, privacy, commercial independence, or subsystem authority.
- Treat privacy as an architectural boundary: collect the minimum required data, keep private values server-side, and prohibit behavioral evidence from becoming identity or market truth.
- Use explicit, auditable governance and controlled automation. Unknown, malformed, contradictory, or unauthorized state fails closed.
- Prefer the smallest architecture justified by measured needs. Architecture selection is not configuration, deployment, connection, or authority.

## Canonical architecture and ownership

| Subsystem | Canonical responsibility | Current character |
|---|---|---|
| **Atlas** | Canonical product, brand, category, and retailer identity and specifications | Implemented repository-owned knowledge layer |
| **Mercury** | Retailer observations, provenance, rights, acquisition, retention, identity resolution, historical admission/intelligence, current-market qualification, and publication eligibility | Implemented market-intelligence layer with governed production state |
| **Sentinel** | Deterministic engineering, architecture, data, compliance, and publication-safety validation | Implemented validation/rule layer |
| **Forge** | Internal authoring, review, readiness, and publication workflow | Implemented static internal application with a certified read-only Mercury operations projection; legacy Mercury preview remains explicitly noncanonical |
| **Beacon** | Product-centric first-party interest evidence and retention | Implemented application/domain boundary; production transport is not connected |
| **Gateway** | Server transport, storage adapter, abuse control, operational monitoring/alerts, and controlled email-delivery governance | Implemented contracts and Cloudflare target plans; production backend is not deployed or connected |
| **Hardware Radar** | Public presentation of approved outputs, buying guidance, disclosures, accessibility, and responsive experience | Implemented generated static site under `public/` |

Dependency direction is governed by the architecture bible: Mercury resolves against Atlas; Forge coordinates Atlas/Mercury/Sentinel; the public experience consumes approved published outputs. Atlas does not depend on Mercury, and presentation must not bypass governance.

Compass, Echo, and Aurora appear in long-term platform documentation as future recommendation, indexing/search, and explanation/intelligence concepts. They are not implemented packages in the current repository and must not be described as deployed systems.

## Technology stack

- Node.js with modern JavaScript ES modules; npm scripts provide builds, tests, diagnostics, and controlled operator workflows. The root package currently declares no third-party runtime dependencies.
- Static HTML, CSS, and browser JavaScript for Hardware Radar and the internal Forge projection.
- Deterministic JSON records, validators, repositories, policies, and Node test modules for platform subsystems.
- `npm run build:public` generates governed public artifacts; `npm run verify:public` checks their canonical relationship.
- Cloudflare Workers and D1 are the selected future Gateway runtime/storage architecture. A draft D1 migration exists, but neither Worker nor D1 is configured or deployed.
- Cloudflare WAF rate limiting, Workers Logs, and Cloudflare Email Service are selected future provider boundaries. Selection and policy configuration do not mean deployment.
- DataForSEO acquisition is governed through Mercury rights, planning, budget, authorization, execution, retention, replay, and promotion boundaries. LIVE commands are operator-controlled and never implicit.
- Repository-owned DataForSEO network commands run Node with the certified system-CA trust policy so operating-system trust roots are honored while full TLS certificate validation remains enabled; insecure certificate bypasses are prohibited.
- Git owns version history. Operator inspection of the Cloudflare dashboard confirmed that Cloudflare Pages project `hardware-radar` continuously deploys connected repository `clintzja-ux/hardware-radar`, with `main` as production and non-main branches as Preview deployments. Repository inspection alone did not establish this external configuration.
- Local operational tooling is Node-based, with PowerShell wrappers for sensitive ephemeral operator input. Secrets must not be passed as command arguments or written into source, public artifacts, logs, chat, or handoff documents.

## Repository map

| Path | Ownership |
|---|---|
| `docs/architecture-bible.md` | Canonical platform boundaries and lifecycle |
| `docs/governance/ADR-INDEX.md`, `docs/engineering/EDRs/` | Architectural/engineering decisions and index |
| `docs/implementation Contracts/` | Increment-specific implementation contracts |
| `docs/operations/` | Operator runbooks |
| `docs/handoff/` | Stable orientation, living state, and maintenance protocol |
| `docs/developer-daily-routine.md` | Canonical ChatGPT/Codex operating protocol and capacity governance |
| `packages/atlas/` | Canonical catalog and retailer registry |
| `packages/mercury/` | Market observations, acquisition, history, promotion, rights, and review |
| `packages/sentinel/` | Validation engines and rules |
| `packages/beacon/` | Product-interest signals, collection, persistence, and retention |
| `packages/gateway/` | Transport/storage contracts and operational/provider governance |
| `apps/forge/` | Canonical internal Forge source |
| `public/` | Generated public Hardware Radar and Forge projection |
| `scripts/` | Builds, diagnostics, controlled workflows, and operator commands |
| `infrastructure/cloudflare/` | Planned Cloudflare artifacts such as the D1 migration |
| `.forge-review/` | Git-ignored operational authorizations, observations, evidence, and review state |

Never treat `public/forge/` as canonical Forge source or raw retained provider evidence as a canonical/public observation merely because it exists.

## Governance model

- ADRs explain durable architectural choices; implementation contracts define certified increment boundaries.
- Versioned policy repositories own business and operational policy. Validators reject unknown or malformed fields.
- Retained evidence, identity eligibility, historical eligibility/admission, canonical eligibility/admission, review, current-market qualification, publication eligibility, and publication are separate states.
- Canonical Atlas product identity owns public product identity: the permanent Atlas product ID resolves through its validated persistent Atlas slug to `/ram/<slug>/`. The catalog and detail routes are deterministic Atlas-only product-discovery projections and carry no Mercury market evidence, retailer/affiliate data, price, availability, recommendation, Cheapest, Pick, or publication authority.
- Evidence and audit records are immutable or append-only. Replay is deterministic; conflicting replay fails closed.
- Condition is an offer-level claim: `UNKNOWN` must never be inferred as `NEW`. Any supplemental condition evidence must remain additive and preserve exact offer binding, provenance, independent source rights, temporal compatibility, and contradiction handling without rewriting retained, historical, or canonical observations.
- Ephemeral current-display pricing and durable Mercury history are separate streams. Daily Amazon/Newegg display observations may use only minimal replaceable transient state and are not accumulated as historical evidence; governed DataForSEO observations follow their separately authorized historical acquisition and retention cadence. Neither stream bypasses comparability, publication, Current Price, Cheapest, or Pick governance.
- Exact, contradiction-free acquisition lineage may project governed product identity only through a certified binding to an active/ready Atlas product, source tasks, provider identity, and validation digests. Provider assertion alone is never an Atlas mapping; explicit downstream contradictions take precedence, and merchant/downstream authority remains separate.
- PREPARE creates local, reviewable authorization only. EXECUTE is separate, explicitly confirmed, narrowly authorized, and absent when the increment does not define it.
- Operator approval never silently implies provider configuration, deployment, publication, acquisition, or another independent approval.
- Protected production state is isolated from fixtures. `.forge-review` is operational state, not public/source-controlled configuration.
- `.env` is sensitive. Do not read, print, modify, or treat it as governance authority unless a specifically authorized operation requires its established runtime path.
- Every increment report must state external operations and spend. Zero-spend work must remain `$0.000`.

## Testing and validation

Standard validation is proportional to the change:

```text
npm run build:public
npm test
npm run verify:public
git diff --check
```

Focused runners are `npm run test:sentinel`, `test:atlas`, `test:mercury`, `test:beacon`, `test:gateway`, and `test:layout`. Never weaken or skip existing tests merely to pass an increment. Generated public timestamps or other incidental build changes must be restored when they are not part of the change.

Release certification uses the committed lockfile and `npm ci`, and must reproduce from a fresh checkout of the exact candidate commit on the target operating system. Repository-controlled text checkout is LF across operating systems, except for two explicitly declared legacy Atlas anchors whose accepted tests certify CRLF raw bytes. New byte contracts must declare representation explicitly; other text-based integrity checks should canonicalize only CRLF/LF before hashing, and text-content readers must accept both deterministically. Passing in an existing working tree does not replace clean-checkout certification.

## Deployment philosophy

The repository distinguishes `implemented`, `tested`, `selected`, `configured`, `approved`, `prepared`, `deployed`, `connected`, and `enabled`. None implies the next. Cloudflare Workers/D1, WAF, Workers Logs, and Email Service are target architecture with governed policies, but current backend transport remains `NOT_CONNECTED`. Browser instrumentation is separately gated and absent. Static-site files and historical references to a live domain do not prove current external provider configuration; verify provider state through an explicitly authorized operator process. The operator-verified static-site coupling means updating or merging `main` triggers a Cloudflare Pages production deployment and therefore requires explicit production deployment authorization; non-main branches remain Preview-only.

## Roadmap

- **Current:** trusted RAM catalog and public static experience; governed Mercury market/history pipeline with a certified Forge operations projection; Beacon/Gateway product-interest and operational governance through DF005-X (production onboarding remains fail closed).
- **Near-term:** complete explicit alert sender/domain onboarding decisions, then design separately authorized Cloudflare/DNS/binding deployment steps; build the selected Worker/D1 backend before any browser connection.
- **Medium-term:** connect governed first-party interest collection, expand historical-price and filtering experiences, add retailers only through rights/identity/promotion governance, and continue moving Forge workflows onto certified Mercury boundaries.
- **Long-term:** expand beyond RAM to SSDs, CPUs, GPUs, motherboards, and other hardware; develop compatibility, recommendation, explanation, API, and conversational-assistant capabilities on the same ownership boundaries.
- **Deferred:** user accounts, social/forums, mobile apps, public AI chat, arbitrary browser-controlled email, unattended LIVE acquisition, and automation lacking explicit certified policy.

No roadmap item is a deployment promise or authorization.

## Rules for future AI engineering sessions

Follow the [Codex operating protocol](../developer-daily-routine.md): navigate progressively from this handoff, reserve Codex for bounded repository work, use ChatGPT for work that does not require repository access, and review each meaningful result before spending another run.

1. Inspect Git status, HEAD, relevant source, tests, policies, contracts, ADRs, runbooks, and operational diagnostics before modifying anything.
2. Preserve subsystem ownership and extend existing boundaries instead of creating parallel governance or persistence systems.
3. Never infer or invent missing production state, evidence, configuration, identity, thresholds, credentials, or provider behavior.
4. Use current official provider documentation for external-provider behavior; clearly distinguish documentation from observed production state.
5. Never expose credentials or private addresses. Respect secure operator-input and server-only configuration boundaries.
6. Respect every approval and PREPARE/EXECUTE gate. Never silently deploy, connect, acquire, publish, send, commit, or push.
7. Report mutations, network/provider operations, paid tasks, actual spend, tests, protected-state impact, and Git status precisely.
8. Do not weaken privacy, provenance, immutability, replay, or fail-closed behavior to make an increment easier.
