# Hardware Radar Commercial Growth Roadmap

## Purpose

Hardware Radar has moved beyond foundational platform construction. The next phase is to turn its governed RAM catalog and price operations into a useful, discoverable, commercially measurable shopping product. Work should now be selected by customer value and commercial evidence, while preserving the integrity of Atlas, Mercury, Sentinel, Forge, and the publication pipeline.

## 1. Current position

### Implemented baseline

- **Catalog:** 159 canonical RAM products across DDR4, DDR5, and SO-DIMM.
- **Market operations:** automated scheduled Newegg acquisition with governed authority, recovery, Current qualification, History admission, QA, and Sentinel certification.
- **Manual operations:** Modern Forge supports governed Amazon and Newegg manual price entry using the existing Mercury Current and History owners. Operator identity, observation time, seller, condition, availability, shipping, fees, provenance, replay protection, and historical admission are preserved.
- **Market evidence:** Current, immutable History, and history-derived analytics are available without making freshness expiry erase historical observations.
- **Amazon Sellers feasibility:** DataForSEO has confirmed that Sellers supplies timestamped marketplace snapshots, seller-profile/all-offers navigation, and displayable returned URLs, but no stable offer-level identifier or documented exact-seller preselection URL. Hardware Radar's marketplace policy permits governed product/all-offers navigation with explicit seller, timestamp, and non-preselection disclosure; it does not permit invented offer IDs or price-selection promises.
- **Public shopping experience:** catalog and product pages expose governed retailer comparisons and direct retailer destinations, including affiliate precedence where an approved destination exists.
- **Publication:** Sentinel certification, release preparation, release-only Git checkpoints, Cloudflare Pages deployment observation, and unattended publication coordination are implemented.
- **Measurement and commerce:** GA4, Microsoft Clarity, retailer-destination, and affiliate-link infrastructure exist. Affiliate state remains independent of price qualification, Cheapest, and product suitability.

### Operational verification still required

- Confirm the corrected stable-runtime handoff completes a full scheduled **Newegg acquisition → certification → unattended publication → live acceptance** cycle without operator intervention.
- Establish measured Amazon and Newegg Current coverage rather than relying on implementation readiness alone.
- Confirm GA4, Search Console, Clarity, affiliate-network reporting, and outbound-link attribution produce usable production baselines.
- Verify live prices and destinations through recurring samples. Certification reduces risk but does not replace customer-facing QA.

Beacon's first-party event, persistence, and projection contracts are implemented but production collection remains disabled. That is intentional until traffic or commercial evidence justifies the operating cost and privacy work.

## 2. Immediate priorities

1. **Prove unattended reliability.** Observe the next natural scheduled Newegg cycle and record acquisition, Current, History, certification, publication, deployment, and live-acceptance outcomes. Treat any failure as a bounded operational exception; do not add retries or parallel pipelines.
2. **Measure retailer coverage.** Record the number and percentage of products with a qualifying Current offer for Amazon, Newegg, either retailer, and both retailers.
3. **Sample live accuracy.** Each week, compare a small risk-based sample of displayed price, seller, condition, shipping/fees, availability, timestamp, and destination with the retailer experience.
4. **Find coverage gaps.** Rank active products lacking a qualifying offer by search demand, existing page traffic, retailer availability, and commercial importance. Use that list to guide manual observations and source improvements.
5. **Close Amazon Sellers eligibility narrowly.** Before any paid Sellers canary, certify the existing adapter against marketplace navigation, source-specific freshness, and explicit shipping/mandatory-fee treatment. Do not reacquire merely to rediscover the confirmed absence of exact-offer identifiers.

## 3. Commercial growth

- Establish weekly Search Console and GA4 baselines for impressions, organic clicks, landing pages, engagement, and outbound retailer actions.
- Improve high-intent pages first: products already receiving impressions, pages near useful search positions, products with fresh multi-retailer coverage, and pages with strong commercial intent but weak engagement.
- Strengthen internal navigation between catalog categories, comparable products, useful price history, and retailer actions without creating thin or repetitive pages.
- Verify affiliate links end to end: correct destination, expected tracking parameters, network click reporting, conversion reporting, and commissions. Never infer a sale from an outbound click.
- Review traffic, outbound referrals, confirmed conversions, and commissions together. Use the evidence to prioritize products and retailers, not to alter Cheapest or Picks.

## 4. Product priorities

Prioritize work in this order:

1. **Usefulness:** fresh, understandable prices; clear seller, shipping, availability, timestamp, and marketplace-navigation disclosures.
2. **Trustworthy retailer coverage:** more products with at least one qualified offer, then more with genuine retailer choice.
3. **Search visibility:** complete product identity, useful page content, healthy indexing, and strong internal links.
4. **Shopping engagement:** direct, correctly bound retailer actions and useful comparison context with minimal friction.
5. **Affiliate revenue:** verified tracking and commercially valuable coverage, always independent of rankings and qualification.
6. **Operator efficiency:** routine entry and exception review in Forge, with scheduled operations independent of Codex or ChatGPT.

## 5. Deferred development

- Keep Beacon production collection disabled until traffic volume, attribution gaps, or revenue decisions demonstrate that first-party collection provides material value beyond GA4 and affiliate reporting.
- Defer major Compass expansion until there is evidence that customers need additional recommendation behavior and the required product-suitability owner is available.
- Defer additional hardware categories until RAM operations, search acquisition, retailer coverage, and monetization show a repeatable model.
- Defer speculative infrastructure, new governance layers, and duplicate operator workflows unless an observed production constraint cannot be handled by an existing owner.
- Defer automated Amazon Sellers acquisition until the existing adapter can qualify a fresh observation without inventing exact-offer actionability and until a bounded canary can measure usable shipping/fee coverage.

## 6. Success metrics

Metrics must distinguish observations from outcomes: an outbound referral is not a verified retailer visit, conversion, sale, or commission.

### Weekly operating scorecard

| Measure | Weekly use |
| --- | --- |
| Products with at least one qualifying Current offer | Coverage count and percentage of 159 |
| Products with two or more retailer choices | Genuine comparison coverage count and percentage |
| Scheduled cycles | Successful, failed, pending, and operator-intervention counts |
| Live-price QA | Samples passed, discrepancies found, and time to disposition |
| Search | Impressions, clicks, CTR, and leading landing pages |
| Shopping engagement | Outbound retailer referrals by retailer, product, page, and placement where available |
| Affiliate results | Network-reported clicks, conversions, commissions, and unexplained attribution gaps |

### Monthly commercial review

- Current coverage trend by retailer and category.
- Multi-retailer coverage trend and highest-value gaps.
- Scheduled acquisition/publication success rate and recurring failure classes.
- Price-accuracy rate, destination-accuracy rate, and material discrepancy count.
- Organic impressions, clicks, CTR, indexed pages, and non-branded growth.
- Outbound referrals, verified affiliate conversions, commission value, and revenue per eligible page.
- Pages and products to improve, maintain, or deprioritize based on combined customer and commercial evidence.

Initial targets should be set after two complete weeks of trustworthy baseline data rather than invented in advance.

## 7. Development principles

- Lead with product and customer outcomes, not platform completeness.
- Reuse existing owners, evidence, commands, and infrastructure.
- Remove unnecessary operator ceremony; keep explicit confirmation only where an existing authority contract requires it.
- Make routine operations independent of Codex and ChatGPT.
- Do not create a new governance framework without demonstrated need.
- Preserve canonical evidence, source rights, security boundaries, replay protection, and publication integrity.
- Keep affiliate economics independent of price qualification and recommendations.
- Prefer small, dependency-complete, independently reviewable production releases.
- Treat failures as evidence to diagnose, not invitations to bypass gates or add automatic retries.

## 8. Thirty-day execution plan

### Week 1 — Establish operational truth

**Actions**

- Observe the next scheduled Newegg cycle through live acceptance.
- Record Current coverage by retailer and identify products with no qualifying offer.
- Verify GA4, Search Console, Clarity, and affiliate reporting access and data flow.
- Define a repeatable live-price QA sample covering categories, retailers, high/low prices, and marketplace navigation.

**Measurable outcome:** one documented end-to-end cycle result, a 159-product coverage baseline, analytics availability status, and the first QA sample.

### Week 2 — Close high-value coverage and trust gaps

**Actions**

- Prioritize the highest-value products without Current offers.
- Use existing automated or Forge manual workflows where evidence and rights permit.
- Correct only confirmed price, destination, disclosure, or operational defects.
- Re-run the weekly QA sample and compare results with Week 1.

**Measurable outcome:** a ranked gap list, a recorded change in qualifying and multi-retailer coverage, and disposition of every material QA discrepancy.

### Week 3 — Improve discoverability and shopping paths

**Actions**

- Select high-impression or near-ranking product pages from Search Console.
- Improve useful page content and internal links using existing public contracts.
- Verify direct retailer actions and affiliate tracking on representative pages.
- Compare outbound engagement before and after bounded page improvements where data permits.

**Measurable outcome:** a small reviewed page-improvement release, verified retailer actions, and page-level search and referral baselines.

### Week 4 — Commercial review and next-month decision

**Actions**

- Review the monthly scorecard across reliability, coverage, accuracy, search, referrals, conversions, and commissions.
- Identify which products, retailers, and page patterns produced useful customer or commercial outcomes.
- Choose the next month's smallest initiatives from observed evidence.
- Reassess Beacon only if existing measurement cannot answer a material product or revenue question.

**Measurable outcome:** a written monthly decision identifying what to continue, stop, improve, and defer, with owners and the next independently reviewable releases.

## Next action

Begin with the next natural scheduled Newegg cycle and the first coverage/QA scorecard. Do not start another engineering program until those measurements identify a concrete product or commercial constraint.
