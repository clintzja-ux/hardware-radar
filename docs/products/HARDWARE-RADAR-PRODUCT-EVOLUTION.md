# Hardware Radar — Product Evolution and Scope Doctrine

**Status:** ACCEPTED  
**Owner:** Mirabelle Labs  
**Scope:** Durable product evolution, MVP scope interpretation, and complexity control

## Governing principle

**Protect the architecture; defer the capability.**

Hardware Radar is intended to become a hardware intelligence platform and, ultimately, a hardware buying assistant. The current RAM MVP is the first useful and commercial product surface of that larger platform. Reducing MVP scope is a deliberate deferral unless an accepted decision explicitly rejects a capability; it is not abandonment of the long-term vision.

The converse is equally important: **a documented future capability is not an authorized implementation increment.** Implementation authority comes only from the currently approved increment or task.

## 1. Long-term vision

Hardware Radar is not intended to remain merely a RAM price-comparison website. Its long-term trajectory is:

```text
RAM product
→ RAM intelligence
→ hardware intelligence
→ buying intelligence
→ hardware buying assistant
```

The platform should ultimately be capable of understanding:

```text
what a product is
→ what it is compatible with
→ where it is sold
→ what it actually costs
→ how that price compares historically
→ whether an offer is comparable
→ whether the retailer or source is trustworthy
→ whether the evidence is current
→ whether the product suits a particular buyer
→ and why
```

The initial RAM website is the first useful product surface into this larger system.

The accepted ownership direction remains:

- **Atlas** owns hardware knowledge, identity, specifications, attributes, compatibility, and catalog knowledge.
- **Mercury** owns market observations, offers, prices, provenance, and historical market intelligence.
- **Compass** is the intended owner of governed recommendations and buying decisions.
- **Echo** is the intended owner of search and retrieval.
- **Aurora** is the intended owner of AI explanations and buying-assistant experiences.
- **Forge** owns administration and operator workflows.
- **Beacon** owns governed product-centric first-party interest evidence and retention, including the metrics derived within that boundary.
- **Gateway** owns external and public APIs and platform interfaces.

This doctrine does not redesign those boundaries or claim that future subsystems are currently implemented.

## 2. Vision versus MVP scope

Long-term product and architecture vision must remain distinct from the capabilities required for the current release.

**A deferred capability is not a rejected capability.**

**A documented future capability is not an authorized implementation increment.**

For example:

- Compass remains the intended recommendation owner, but the RAM MVP does not require a full recommendation engine.
- Bundle semantics remain protected, but basket optimization is not required now.
- Broad retailer coverage is desirable eventually, but launch does not require the entire market.
- Aurora remains part of the long-term architecture, but launch does not require an AI buying assistant.
- Gateway may eventually support APIs, B2B services, and data products, but they must not be built speculatively.

Accepted subsystem ownership and architectural boundaries should be preserved where practical. Preserve only the minimum contract or seam needed by current work; do not build speculative systems with no current consumer.

## 3. Product evolution

### Stage 1 — Useful RAM product

Deliver a trustworthy RAM comparison product using real products, real retailers, governed evidence, honest monitored-market coverage, useful comparisons, fail-closed presentation, and affiliate monetization where appropriate.

The objective is to reach real users. Do not restore fake fixtures or placeholder Picks merely to make the site appear populated.

### Stage 2 — RAM intelligence

Potential later capabilities include price history, historical lows, richer comparisons, broader retailer coverage, deal-quality assessment, availability, stronger freshness, search and filtering, bundle intelligence, and stronger decision support.

These are directions, not implementation authorization.

### Stage 3 — Hardware intelligence

Expand beyond RAM into additional categories as justified, potentially:

```text
RAM → SSDs → GPUs → CPUs → motherboards → PSUs → cooling → other components
```

Category expansion should reuse the existing platform architecture rather than create disconnected category-specific systems.

### Stage 4 — Buying intelligence

Compass may increasingly help answer “Which product should I buy?” rather than only “Where is this product cheapest?” Potential inputs may eventually include compatibility, workload, budget, price/performance, upgrade value, offer comparability, bundles, basket economics, historical pricing, and appropriately attributed professional testing or review evidence.

These remain future directions unless separately approved.

### Stage 5 — Hardware buying assistant

Atlas, Mercury, Compass, Echo, and Aurora may ultimately support grounded questions such as:

- Is this RAM actually a good deal?
- Should I buy this SSD now or wait?
- What GPU makes sense for my CPU and budget?
- Build the cheapest compatible gaming PC using trustworthy retailers.

Answers should be grounded in governed Hardware Radar knowledge and market evidence rather than unsupported model assertions.

## 4. Parallel execution doctrine

Hardware Radar is now developed as a small product program with multiple independent but coordinated execution tracks, not as one serial chain through every subsystem. A blocker in one track should not unnecessarily halt another independent track. Parallel work must preserve subsystem ownership, governance, provenance, authority boundaries, audit truth, and fail-closed behavior.

> A track may proceed independently until it reaches a boundary owned by another track. Crossing that boundary requires the owning subsystem's governed artifact, contract, decision, or explicit operator action.

No track may manufacture an artifact owned by another track or bypass another subsystem's authority to unblock itself. Cross-track dependencies must be explicit. In particular:

- Commercial or affiliate status must not silently alter recommendation, retailer-trust, or market-evidence authority and must not determine Cheapest or Pick eligibility.
- Public UX must consume governed outputs; it must not manufacture prices, Picks, evidence, retailer eligibility, publication authority, or recommendations.
- Atlas catalog presence does not imply historical, canonical, review, current-market, or publication eligibility.
- Mercury evidence does not imply Compass recommendation authority.
- Historical evidence remains historically truthful when acquisition strategies change.
- Temporary or bootstrap infrastructure must not silently become permanent architecture.

### Current operating tracks

| Track | Purpose and representative work | Current emphasis |
|---|---|---|
| **A — Public Product / Launch** | Make Hardware Radar useful through public UX, RAM category and comparison presentation, mobile QA, SEO, methodology/content, analytics alignment, truthful empty/error states, launch-catalog presentation, and user-facing clarity. It consumes governed market output and creates none of the upstream authority it displays. | **PRIMARY / HIGH** |
| **B — Mercury / Market Data** | Build scalable governed acquisition: DataForSEO recurrence, historical refresh, source coverage, condition and shipping evidence, offer classification, reliability, retention, replay/idempotency, E2S qualification, publication composition, and eventual replacement of transitional curated acquisition. Mercury automated provider/source paths remain the durable owner. | **PRIMARY / HIGH** |
| **C — Retailer & Commercial** | Develop affiliate and retailer relationships, specialist-retailer outreach, rights clarification, authorized feeds/APIs, deep links, commerce-data partnerships, and data-quality collaboration. Commercial capability remains separate from trust, evidence, recommendation, Cheapest, and Pick authority. | **PRIMARY / HIGH** |
| **D — Atlas / Intelligence Foundation** | Expand RAM catalog completeness, product and retailer identities, specifications, relationships, and validation when approved product or Mercury work requires it. Preserve `capacityGb = moduleCount × capacityPerModuleGb`. Avoid speculative catalog population. | **SUPPORTING / DEMAND-DRIVEN** |
| **E — Governance / Platform Evolution** | Maintain contracts, ADRs, publication governance, ownership, Forge/operator boundaries, Beacon/Gateway boundaries, and justified future seams for Compass, Echo, or Aurora. | **GUARDRAIL / AS NEEDED** |

This emphasis is current program posture, not a permanent architectural hierarchy. A future `CURRENT-STATE` reconciliation may change priorities without narrowing the accepted product vision or changing subsystem ownership.

### Commercial and data strategy

#### Commercial-First, Capability-Separated Partnership Doctrine

Hardware Radar's business and user value lead; its internal systems exist to support that mission. In practical shorthand, **the dog wags the tail, not the other way around**. A retailer, affiliate program, distribution relationship, or commercial partnership may be worth pursuing because it improves retailer coverage, consumer utility, monetization, product/category reach, commercial resilience, diversification, or another legitimate Hardware Radar objective even when it does not yet provide ideal Mercury data rights.

The normal relationship sequence is:

```text
commercially valuable retailer or partner
→ pursue or apply for the relationship
→ establish commercial/affiliate access if approved
→ inspect the actual tools, feeds, APIs, catalogs, terms, and permissions
→ separately classify capabilities available to Mercury and other owners
→ request expanded data rights later when strategically worthwhile
```

Affiliate/commercial onboarding and data-rights qualification are separate decisions. Missing Mercury-compatible feed, API, comparison, retention, historical-analysis, or AI rights does not by itself disqualify an otherwise useful commercial relationship. Conversely, affiliation grants none of those capabilities: Mercury may use only rights actually established, and terms that conflict with Hardware Radar's core operation may still justify rejecting or limiting a program.

Hardware Radar should pursue three complementary paths in parallel:

1. independent market evidence through governed sources such as DataForSEO where rights permit;
2. direct retailer relationships that provide useful feeds, APIs, data-quality cooperation, attribution, affiliate economics, or other legitimate value; and
3. transitional operator-curated evidence for explicitly approved launch paths where automation is not yet sufficient.

Earlier outreach to large retailers including Newegg and Best Buy for data-rights clarification did not receive responses. DataForSEO work was pursued partly because direct retailer response could not remain an acquisition dependency. Retailer relationships and Mercury acquisition should therefore proceed in parallel; lawful, governed independent acquisition need not wait for major-retailer replies.

Smaller or specialist retailers can be disproportionately useful to Mercury when they offer accessible feeds, clearer identity, responsive communication, or cooperative data relationships. Their value to Hardware Radar is a separate assessment that also considers consumer relevance, retailer trust, useful selection, geography, competitive pricing, and sustainable commercial potential. The desired portfolio mixes major and useful specialist retailers rather than optimizing exclusively for either.

The curated bridge bootstraps useful coverage but is not the target architecture. It may be retired progressively per source/product/retailer path after automated Mercury acquisition reaches governed parity. Curated history and provenance must never be rewritten as automated evidence. DataForSEO addresses part of acquisition; it does not eliminate direct relationships. Affiliate relationships address part of commerce; they grant no market-evidence authority. Keep `OBSERVED`, `PUBLICLY COMPARABLE`, `RECOMMENDABLE`, and `AFFILIATE ENABLED` distinct.

The current finite Track C launch portfolio and relationship approach is maintained in the [RAM Launch Retailer Portfolio](./RAM-LAUNCH-RETAILER-PORTFOLIO.md); it is strategy and operator planning, not retailer identity, rights, or publication authority.

Hardware Radar's editorial direction is **hardware buying intelligence with a price engine**, not a generic technology blog. The [Hardware Radar Content Foundation](./HARDWARE-RADAR-CONTENT-FOUNDATION.md) owns the durable editorial mission, evidence classifications, Guides taxonomy, authorship, maintenance rules, and staged content roadmap. Editorial content supports but never displaces the homepage's immediate governed price answer.

### Track status and future-agent interpretation

Each track may be described as `ACTIVE`, `READY`, `BLOCKED`, `DEFERRED`, or `COMPLETE FOR CURRENT INCREMENT`. A blocked track should state what is blocked, its exact dependency, and which other tracks can proceed independently. This is operating language only, not a runtime project-management system.

Future agents must not assume the project has one next step. When reading `CURRENT-STATE`, identify active and blocked tracks, independent work that can continue, cross-track dependencies, and whether the requested work has explicit authority. Do not automatically begin another increment when one finishes. Do not stop useful work because an independent subsystem is unfinished, reinterpret an MVP deferral as a permanent limitation, or treat long-term vision as current implementation authorization.

## 5. Complexity-control doctrine

Apply **Protect the architecture; defer the capability** by classifying proposed work:

| Class | Meaning | Default action |
|---|---|---|
| **A** | Required for correctness or safety now | Implement |
| **B** | Required for the current useful product | Implement |
| **C** | Required to preserve an accepted architectural boundary | Implement only the minimum necessary contract or seam |
| **D** | Valuable only for a future capability | Document and defer |

Category D work should normally remain outside the current increment.

- Do not generalize merely because future expansion is imaginable.
- Do not build speculative abstractions without a current consumer.
- Do not allow future architecture to prevent shipment of a useful current product.
- Do not obtain short-term speed by knowingly destroying an accepted architectural boundary that would be expensive to recover.
- Correctness and governance work remain justified where they protect truthful market claims, provenance, identity, retailer trust, recommendation integrity, publication integrity, or another currently exercised boundary.
- Correctness must not become an excuse to implement unrelated future capabilities.

Ask of proposed work:

> Does this materially improve launch usefulness, market coverage, automation, commercial viability, or protect a demonstrated architectural risk?

If not, it should normally be deferred. **Protect the architecture; then build the product.** Engineering discipline remains essential, but architecture and governance must not indefinitely delay the useful product they exist to support.

Governance effort should be proportional to current product risk. Once a boundary is sufficiently protected and fixture-certified, engineering effort should return to user-facing capability, market coverage, automation, or commercial progress unless new evidence exposes a material governance defect. Do not create governance increments merely because additional theoretical states can be imagined.

## 6. Commercial and product learning

Hardware Radar should reach real users before attempting to complete the entire hardware-intelligence vision. The RAM product should become useful, launchable, and capable of producing real-world user and market learning.

Actual usage, market evidence, economics, and observed user needs should increasingly influence which advanced capabilities are built next. This is not permission to weaken accepted governance merely to launch faster.

## 7. Interpretation rule for future agents

Future ChatGPT, Codex, and engineering agents must interpret phrases such as “MVP only,” “do not generalize,” “do not build Compass yet,” “defer Aurora,” “defer basket optimization,” “limit retailer coverage,” “defer this capability,” and “not needed for launch” as:

> Not required or authorized in the current increment.

They must not automatically interpret those phrases as:

> Removed from the Hardware Radar long-term vision.

Likewise, the existence of a capability in this document does not authorize its implementation. Future capabilities require explicit approved increments or tasks.

This doctrine complements the canonical [Product Vision & Strategy](./product-vision-and-strategy.md): that document owns the high-level product vision, while this document governs staged evolution, MVP-versus-long-term interpretation, complexity control, and future-agent interpretation.
