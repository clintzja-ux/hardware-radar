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

## 4. Complexity-control doctrine

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

## 5. Commercial and product learning

Hardware Radar should reach real users before attempting to complete the entire hardware-intelligence vision. The RAM product should become useful, launchable, and capable of producing real-world user and market learning.

Actual usage, market evidence, economics, and observed user needs should increasingly influence which advanced capabilities are built next. This is not permission to weaken accepted governance merely to launch faster.

## 6. Interpretation rule for future agents

Future ChatGPT, Codex, and engineering agents must interpret phrases such as “MVP only,” “do not generalize,” “do not build Compass yet,” “defer Aurora,” “defer basket optimization,” “limit retailer coverage,” “defer this capability,” and “not needed for launch” as:

> Not required or authorized in the current increment.

They must not automatically interpret those phrases as:

> Removed from the Hardware Radar long-term vision.

Likewise, the existence of a capability in this document does not authorize its implementation. Future capabilities require explicit approved increments or tasks.

This doctrine complements the canonical [Product Vision & Strategy](./product-vision-and-strategy.md): that document owns the high-level product vision, while this document governs staged evolution, MVP-versus-long-term interpretation, complexity control, and future-agent interpretation.
