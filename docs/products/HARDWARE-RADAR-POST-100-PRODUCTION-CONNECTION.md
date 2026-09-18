# Hardware Radar — Post-100 Production Connection Plan

**Status:** PLANNING / READINESS COMPLETE
**Active gate:** `READY_FOR_CERTIFIED_STATIC_PUBLICATION_RELEASE_CONTROL_P1`
**Baseline:** `100_PRODUCT_STAGE_COMPLETE`

## Purpose

This document owns the bounded transition from the completed 100-product operational stage to consumer-visible governed market data. It does not authorize publication, production connection, deployment, provider work, or spend. Mercury's scale-ramp runbook remains the historical and operational authority for the completed stage and continuing market-memory mechanics.

## Connection definitions

| Boundary | Producer → consumer | State | Authority and failure behavior |
|---|---|---|---|
| Beacon production connection | Public interaction → Gateway transport → Beacon validation/persistence | `NOT_CONNECTED` | Observes governed product-interest events only. Failure must not block navigation or create market/recommendation authority. |
| Gateway production connection | Public untrusted request → Cloudflare Worker → governed Beacon handler/D1 | `RUNTIME_SELECTED`, not deployed | Delivery/write interface only. It owns no Atlas, Mercury, publication, Cheapest, Pick, or recommendation truth. |
| Publication connection | Atlas identity + Mercury-qualified current fact + applicable public policy/decision + destination → sanitized artifact | Implemented statically; no fresh eligible production Amazon publication candidate | Authority is granted only by the applicable Mercury qualification/publication boundary. Invalid, missing, stale, or unauthorized input yields no offer. |
| Public-site consumption | Certified static artifact → generated homepage/category/catalog/product surfaces | Implemented and fail closed | Catalog/spec pages remain usable when market artifacts are absent or invalid. |

## Current architecture

The production site is a generated static `public/` tree deployed through Cloudflare Pages from `main`. Atlas builds the catalog and product facts. Mercury creates two intentionally distinct static outputs:

- `public/data/ram-current-retail.json` is the replaceable current-display projection under `PUBLIC-RAM-CURRENT-RETAIL-001-1.0` with a 36-hour maximum age, exact destination binding, positive USD price, and fail-closed unknown/stale handling.
- `public/data/market-snapshot.json` is the governed canonical-observation publication projection. Production composition requires accepted evidence, effective review, current E2S qualification, effective publication authorization, and explicit production state paths; otherwise it is `INSUFFICIENT_DATA`.

The site loads GA4 and supports ordinary outbound links without JavaScript. GA4 is sufficient for the first canary's near-term referral measurement. Beacon currently supports only privacy-minimized `OUTBOUND_RETAILER_CLICK` events and has no browser integration. Gateway is the selected Cloudflare Worker/D1 write boundary for Beacon; it is not an implemented public market-data read API and must not become one merely to serve a static canary.

## Governing hybrid acquisition doctrine

The canonical doctrine is [HARDWARE-RADAR-PRODUCT-EVOLUTION.md](./HARDWARE-RADAR-PRODUCT-EVOLUTION.md), particularly **Current display pricing and durable history** and **Retail commerce source independence**. Post-100 work must preserve Mercury's complementary acquisition lanes:

1. **Independent market intelligence** supports discovery, product and merchant identity evidence, seller discovery, durable historical observations, market breadth, movement, corroboration, and longitudinal intelligence.
2. **Retailer, affiliate, and commerce data** may support retailer-authorized current offers, exact destinations, merchant identity, availability, attribution, commerce metadata, and source-appropriate higher-frequency current-display refresh.

The lanes may corroborate one another, but neither inherits the other's rights, provenance, freshness, retention, current-display, history, publication, Cheapest, Pick, or recommendation authority. An affiliate feed is evidence under its own rights profile, not market truth; affiliate status cannot affect price ranking or historical truth. Product identity and offer identity remain separate.

Static versus runtime publication is a delivery and release-control decision, not an acquisition-authority decision. The first canary remains static-first because the current Pages topology is the smallest safe delivery surface. Mercury must still maintain qualified current-market state through governed background acquisition and reconciliation; a public page request must never trigger paid acquisition. Gateway is not the current-market owner and must not be introduced as an on-demand price-fetch proxy.

Every current-display candidate must pass the applicable source-specific identity, offer binding, rights, freshness, condition, availability, standalone/bundle and conditional-offer comparability, destination, marketplace/seller, shipping-knownness, conflict, and current-market policies. Unknown shipping is not zero. Source-specific freshness and expiry remain controlling; the existing 36-hour public current-retail ceiling does not create a universal acquisition TTL. Conflicting source observations remain separately provenanced governed conflict state rather than being silently combined or preferred for convenience. No raw provider or feed row may bypass qualification.

## Readiness by source

### Amazon

Amazon destinations and reusable identities exist, and Mercury has immutable evidence/history. Those facts do not establish a current publicable offer. The durable publication workflow's current Amazon source gate requires the authorized API/license context; existing DataForSEO Amazon history does not satisfy it. The current-display stream may publish only a fresh, eligible, exactly bound Amazon observation under its independent source rights and 36-hour policy. No currently checked-in fresh Amazon canary candidate is established.

Shortest future path: establish a fresh authorized current observation through the retailer/commerce current-retail lane; validate offer identity, destination, condition, availability, seller/marketplace state, comparability, price, currency, shipping-knownness, rights, and source-specific freshness; create the bounded static release artifact; obtain explicit publication/deployment approval; deploy; verify; measure; then broaden only after review. Existing independent DataForSEO Amazon evidence may corroborate identity and history but cannot confer current-display authority on this lane.

### Rakuten and Newegg

Newegg is canonical retailer `RETAILER-0004`, has broad reviewed destination coverage, and the checked-in current-retail artifact contains four formerly eligible offers. At the current date those observations are stale and cannot be reused as current prices. Rakuten commercial access and Newegg approval do not by themselves establish public-display, comparison, retention, or freshness rights. Rakuten feed parsing/source-local projection is certified, but public current-data rights remain fail closed.

Manual data is publishable only when its contract records exact product, offer, retailer and destination, observed item price/currency, observation time, source/provenance and operator attribution, availability, condition, shipping-knownness, marketplace/seller state, offer class/conditionality, applicable rights, freshness/expiry, and public eligibility. Missing values remain unknown; a destination is never an offer. Rakuten and Newegg therefore require source-specific rights plus a fresh governed observation before a canary. Rakuten/affiliate commerce data remains an input to the same qualification boundary and receives no preference from commercial status.

## Dependency decision

The first canary should use a **certified build-time static artifact**. It fits the existing Pages topology, has the smallest cost and attack surface, is reproducible, CDN-cacheable, easy to inspect, and fails closed without making the catalog depend on a runtime API.

- Gateway is **not required for the initial static canary**. Its present production purpose is untrusted Beacon event ingestion, not market-data delivery.
- Beacon should connect **after or independently alongside the canary**, not block it. Existing GA4 can measure page/referral behavior. Beacon becomes justified when canonical first-party product/destination aggregation is needed.
- Beacon's future scope may include privacy-safe consumer behavior plus hybrid-acquisition/current-market health signals, but those signals remain observational and cannot create or repair market authority.
- Publication and deployment remain separate human gates. A release-control artifact creates no market fact and cannot override freshness or qualification.

The dependency order is:

```text
certified static publication release control
→ fresh governed current-market candidate and explicit publication approval
→ Preview verification and explicit production deployment approval
→ tiny live-retail canary
→ GA4 measurement and rollback/promotion review
→ Beacon Worker/D1 implementation and connection when first-party evidence is justified
→ broader source-neutral retailer/commerce coverage and independently governed market-intelligence depth
```

## First implementation gate

Implement `CERTIFIED_STATIC_PUBLICATION_RELEASE_CONTROL_P1` as the smallest checkpointable prerequisite. Reuse the existing Mercury projections, validators, build, and public consumers. Add no source, acquisition, truth, publication-decision, or analytics owner.

The boundary should provide one strict, versioned, repository-native release manifest or equivalent existing-pattern control that binds:

- projection kind and schema/policy version;
- exact sanitized artifact digest;
- explicit evaluation/build time;
- enabled canary surfaces/scopes;
- fail-closed default `OFF`;
- source and retailer scope without inventing eligibility;
- rollback to `OFF` without touching Atlas, Mercury evidence/history, or Beacon records;
- validation that the referenced artifact is currently eligible and contains no private fields;
- deterministic replay and conflict rejection.

It must be fixture-certified using existing governed snapshots and must make zero provider calls, production publication decisions, deployment changes, or public-state mutations. A complex feature-flag platform is not warranted.

## First publication canary design

The future canary should use the smallest deterministic eligible population—prefer one canonical product with one or two independently qualifying standalone retailer offers; use a review-only deterministic artifact if more than one candidate is eligible. Do not hand-pick an attractive price.

Initial fields are product identity, retailer, canonical destination, positive USD item price, observation time/age, availability when explicit, condition when explicit, and shipping only when known. Taxes and unknown fees remain undisclosed/unknown with the existing exclusion statement. Bundle and conditional offers remain outside the ordinary Cheapest comparison.

Initial surfaces should be the affected product page plus the smallest applicable aggregate scope. Unknown, stale, unavailable, malformed, unbound, or unqualified observations render no current offer while the catalog/specification surface remains intact. Cheapest may be shown only under the applicable certified semantics; unknown shipping is never zero.

Success requires correct contract/digest, exact destination and price, truthful freshness/unknown behavior, zero authority leakage, reversible `OFF`, intact catalog fallback, no material performance regression, and independently observed GA4 behavior if measurement is in scope. Stop for stale-as-current display, wrong product/retailer/destination/price, malformed contract, private-field leakage, authority substitution, rollback failure, or analytics privacy/security defect.

## Beacon and Gateway plan

Beacon's minimum current event remains `OUTBOUND_RETAILER_CLICK`. Before browser connection, evolve the contract only as already anticipated: prefer canonical `destinationId` and derive product/retailer/marketplace server-side; retain no account, persistent visitor, advertising ID, fingerprint, precise location, raw URL, price, or persisted IP. The 90-day raw-event policy applies, automatic deletion remains disabled, and a separate purge execution boundary is still required.

Gateway implementation requires the existing selected Worker/D1 architecture: Worker entrypoint, D1 adapter/migration, packaged read-only Atlas data, strict 2 KiB body limit, content-type validation, WAF rate limiting, privacy-safe categorical monitoring, record-free health, backup/export/recovery procedure, reviewed bindings/configuration, and separate deployment/browser approvals. Public reads and administrative mutation are out of scope.

Beacon owns product analytics and may later retain governed hybrid-acquisition/current-market health observations; Gateway/Cloudflare logs own endpoint health, rejection classes, rate limiting, storage failures, and latency. Forge may later operate established current-market/publication exceptions and display source mode, rights, current/stale/conflict/rollback state, and health summaries, but owns none of those truths.

## Backlog classification

| Priority | Requirement | Owner | Blocks first static canary |
|---|---|---|---|
| P0 before any connection | Preserve catalog fallback, authority isolation, private-field exclusion, and fail-closed invalid/stale handling | Public/Mercury/Sentinel | Yes |
| P1 | Certified static publication release control and rollback switch | Public build + Mercury projection + Sentinel validation | Yes |
| P1 | Fresh source-rights-qualified current observation and existing publication qualification | Mercury | Yes, operationally after release-control certification |
| P1 | Explicit Preview/production deployment approval and verification | Operator/release governance | Yes at deployment, not implementation |
| P2 | Beacon Worker/D1 production adapter and browser event connection | Gateway/Beacon | No |
| P2 | Forge publication/rollback and health views | Forge | No |
| P2 | Rich canary management and broader retailer rollout | Forge/Public/Mercury | No |
| MEASURE | GA4 canary impressions/referrals, stale/empty-state incidence, performance, rollback need | GA4/operator | No |
| HUMAN GOVERNANCE | Source rights, publication approval, deployment, rollback, and canary promotion | Canonical owner/operator | Yes where invoked |

## Ordered implementation slices

1. **Static release control P1:** strict release manifest/switch, validator, build composition, fixtures, rollback proof; no provider/publication/deployment action.
2. **Canary readiness assessment:** read-only resolution of currently eligible candidates and exact source-specific rights, identity, offer, freshness, condition, destination, shipping-knownness, marketplace, comparability, and conflict blockers.
3. **Separate acquisition/publication operation:** only if explicitly authorized; obtain fresh evidence and use existing qualification/PREPARE/EXECUTE owners.
4. **Preview and production canary:** explicit deployment authorization, live verification, GA4 measurement, rollback/promotion decision.
5. **Beacon/Gateway implementation:** Worker/D1, monitoring, retention operations, then separately approved browser wiring.

Each slice stops at its own authority boundary.

## Product-program relationships

An Atlas-only RAM Market Overview is `INDEPENDENT / BENEFITS_FROM_BEACON`; it needs neither Gateway nor market publication when truthfully labeled catalog coverage rather than market share. The current data foundation is `FOUNDATION_GROWING / FOUNDATION_SUFFICIENT_FOR_EARLY_OVERVIEW / FOUNDATION_NOT_YET_SUFFICIENT_FOR_FULL_TERMINAL`: Atlas breadth is strong, Mercury history is growing, but fresh current-market, retailer/source breadth, cross-cycle density, and public qualification remain limited. **DENSITY IS EARNED BY DATA.**

Consumer production, routine Mercury market memory, and next-Atlas-stage planning may proceed as parallel governed tracks. The next Atlas stage is not automatically started and must answer a new bounded question rather than multiply 100 by ten.

## Security, configuration, cost, and deployment

Static release control needs no runtime secret. A future Beacon/Gateway connection requires non-secret Worker/D1 binding configuration and provider-owned deployment identifiers; any API token or notification credential remains server-side and is never printed or checked in. Exact provisioning state must be verified through an authorized operator process.

The static canary uses existing Pages/CDN architecture and introduces no known incremental provider-acquisition or runtime cost. Future Worker, D1, logs, WAF, and email costs are provider/plan dependent and are not inferred here. Provider acquisition remains separately budgeted.

Deployment changes are distinct: repository code/artifact, build inputs, Worker/D1 configuration, analytics endpoint, browser wiring, DNS/route configuration, and merge to `main` each require their applicable review and approval. Updating `main` triggers production Cloudflare Pages deployment.

## Readiness classifications

- **Gateway:** `READY_FOR_PRODUCTION_CONNECTION_IMPLEMENTATION` for the existing Beacon Worker/D1 scope; not configured, deployed, or connected.
- **Beacon:** `READY_FOR_PRODUCTION_CONNECTION_IMPLEMENTATION` after Gateway runtime/storage composition; browser contract refinement and purge execution remain implementation gaps.
- **Publication:** `READY_FOR_CANARY_IMPLEMENTATION_WITH_P1_RELEASE_CONTROL_AND_FRESH_CURRENT_FACT`; no current candidate is authorized by this plan.
- **Public site:** `READY_FOR_STATIC_CANARY_CONSUMPTION_IMPLEMENTATION`; catalog fallback and fail-closed rendering already exist.

No production connection, publication, public behavior, provider operation, or deployment is authorized by this plan.
