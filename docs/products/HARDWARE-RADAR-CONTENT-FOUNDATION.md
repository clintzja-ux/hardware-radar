# Hardware Radar Content Foundation

**Program increment:** CONTENT-001  
**Status:** ACCEPTED EDITORIAL DOCTRINE AND INFORMATION ARCHITECTURE  
**Owner:** Hardware Radar public/editorial product  
**Scope:** Durable editorial mission, evidence rules, content structure, and staged implementation direction

## 1. Mission and boundary

Hardware Radar is **hardware buying intelligence with a price engine**. It is not a generic technology blog that happens to contain affiliate links.

Editorial content exists to help people understand hardware purchases, attract qualified discovery traffic, establish legitimate publisher credibility, strengthen usefulness to retailers and commercial partners, lead naturally into governed price intelligence, and support later category expansion. Internal systems support this user and business mission while retaining their established authority boundaries.

An article should exist only when it materially supports at least one of:

- hardware understanding;
- purchasing-decision support;
- compatibility guidance;
- price or value understanding;
- qualified discovery/search value; or
- a legitimate Hardware Radar hardware category.

Commodity news production, generic search-volume articles, doorway pages, and mass near-duplicate publishing are outside this foundation.

## 2. Price-first public contract

The homepage continues to prioritize, in order:

1. the immediate price proposition;
2. a governed current-price answer or an honest fail-closed state; and
3. direct access to hardware price categories.

Editorial content must not displace or precede that answer. Editorial discovery may later appear below the primary price experience. Content is a route into the price product, not a replacement for it.

## 3. Information architecture and URL ownership

The initial editorial taxonomy is one surface named **Guides**:

```text
/guides/
/guides/ram/
/guides/ram/ddr4-vs-ddr5/
/guides/ram/16gb-vs-32gb/
/guides/ram/check-ram-compatibility/
/guides/ram/ram-speed-cas-latency/
```

- `/guides/` owns the cross-category editorial index.
- `/guides/ram/` owns the RAM Buying Guide and acts as the RAM content hub.
- Child routes own focused RAM spoke articles.
- Future approved categories may use `/guides/storage/`, `/guides/gpus/`, `/guides/cpus/`, and similar category paths.

Do not create a separate `Learn` taxonomy yet. One future primary navigation item, `Guides`, is sufficient. `Blog`, `Learn`, `Reviews`, `News`, and `Resources` are not approved navigation surfaces.

## 4. Editorial identity

Initial attribution is:

```text
By Hardware Radar Editorial
Published by Mirabelle Labs
```

This is a transparent publishing identity, not a claim that a newsroom or staff of reviewers exists. Do not invent staff biographies or author personas. Named authors may be introduced only when real contributors accept responsibility for individual work.

Hardware Radar must not imply that it performs in-house hardware benchmarking, hands-on testing, or first-hand product evaluation unless that capability genuinely exists and the applicable article actually used it.

## 5. Editorial evidence classifications

Article claims must remain distinguishable by their authority:

| Classification | Meaning and boundary |
|---|---|
| **FACT** | A verifiable technical, product, or platform fact, preferably aligned with Atlas and authoritative manufacturer or platform documentation. |
| **EXPLANATION** | A plain-language interpretation of established facts. It does not become a separate factual source. |
| **EXTERNAL TEST EVIDENCE** | Findings from professional third-party testing, clearly attributed and never represented as Hardware Radar testing. |
| **PRICE EVIDENCE** | Current or historical price claims supplied only through governed Mercury authority where applicable. |
| **EDITORIAL JUDGMENT** | Transparent interpretation or general buying guidance whose assumptions, uncertainty, and limitations should be clear. |
| **GOVERNED PICK** | A separately authorized recommendation owned by the appropriate recommendation boundary. Ordinary article prose cannot create a Pick. |

## 6. Source hierarchy and evidence rules

- Manufacturer and platform documentation is preferred for specifications, compatibility, and support facts.
- Atlas should become the governed internal specification substrate as its coverage matures; articles must not become an independent contradictory specification silo.
- Retailer claims describe that retailer's product or offer unless independently established as universal facts.
- Customer reviews are anecdotal signals, not specification, compatibility, reliability, or performance authority.
- Professional external testing may support an explanation or judgment only with clear attribution and an honest description of what was tested.
- Hardware Radar calculations must disclose the material inputs and method.
- Mercury owns governed price evidence. Manually copied or editorially estimated prices are not price evidence.
- Ordinary prose creates no Current Price, Cheapest, Pick, publication, or recommendation authority.

## 7. Editorial and affiliate independence

The [Commercial-First, Capability-Separated Partnership Doctrine](./HARDWARE-RADAR-PRODUCT-EVOLUTION.md#commercial-first-capability-separated-partnership-doctrine) remains in force. Commercial relationships may support Hardware Radar without controlling editorial or market truth.

Affiliate status, expected commission, payout health, or relationship strength must not determine:

- factual or editorial conclusions;
- product or retailer inclusion in an article;
- Cheapest;
- Picks; or
- recommendation ordering.

Articles must remain useful without an affiliate relationship. A legitimately relevant product or retailer must not be excluded merely because expected commission is zero. Affiliate links may be attached only when independently permitted and appropriately disclosed.

## 8. AI-assistance policy

AI may assist outlining, organization, drafting, editing, and summarization of properly supplied evidence.

AI must not invent facts, specifications, tests, first-hand experience, citations, sources, authorship, prices, or recommendations. It must not transform uncertain evidence into certainty. Human editorial responsibility remains with the publisher, including source review, factual verification, conclusions, corrections, and final publication.

Do not claim content is human-written when that would be false. Do not create fake author personas or simulate hands-on experience.

## 9. Corrections and updates

- `publishedAt` represents original publication.
- `updatedAt` changes only for a substantive editorial update, not routine rebuilds or search freshness.
- Factual errors should be corrected promptly once verified.
- Materially changed guidance must be reviewed against current evidence.
- Major corrections should be identified transparently where appropriate.
- Maintenance is risk-based: compatibility, platform-support, and time-sensitive buying guidance generally require more frequent review than stable terminology.
- Old advice must not receive a new date without substantive review.

## 10. Article contract

CONTENT-002 should implement a reusable article contract containing:

- canonical URL;
- unique title and meta description;
- Open Graph and Twitter metadata;
- visible breadcrumbs;
- one H1 and a concise dek;
- author and publisher identity;
- `publishedAt` and honest `updatedAt`;
- optional deterministically calculated reading time;
- optional table of contents for sufficiently long articles;
- semantic article body with stable heading IDs;
- terminology, warning, compatibility, and evidence callouts;
- accessible comparison tables;
- source attribution and references;
- contextual price CTA;
- related guides and relevant price-category links;
- concise affiliate disclosure where affiliate links appear; and
- the standard site footer.

Article content must remain readable without JavaScript. JavaScript may enhance navigation or interaction but must not be required to access the article's meaning.

## 11. SEO doctrine

The editorial implementation should provide:

- unique metadata generated from validated article metadata;
- canonical URLs;
- `Article` JSON-LD;
- visible breadcrumbs and matching `BreadcrumbList` JSON-LD;
- future sitemap entries generated from content metadata;
- FAQ schema only when a page contains genuine visible FAQ content;
- one H1 and logical heading hierarchy;
- descriptive image alt text, with empty alt text for decorative images;
- bidirectional hub/spoke internal linking; and
- truthful publication and update dates.

Keyword stuffing, doorway pages, fake freshness, hidden content, and mass-generated near-duplicates are prohibited. Search value must follow genuine user value.

## 12. Internal linking and conversion model

```text
search or external discovery
→ useful editorial explanation
→ relevant Hardware Radar price surface
→ governed current offer
→ affiliate link only when independently permitted
```

Contextual price CTAs should normally appear after the core decision question has been answered, optionally beside a directly relevant comparison, and near the conclusion. They must describe the actual governed price surface and must not make the article feel like an affiliate-button farm.

## 13. Subsystem ownership

- **Atlas** may provide governed hardware and specification facts. It is not an article CMS and does not author prose.
- **Mercury** may provide governed current and historical price evidence. It is not an editorial author.
- **Compass** remains the intended owner of governed recommendations and Picks. Articles cannot emulate Compass authority.
- **Aurora** may later assist explanations but has no autonomous editorial authority.
- **Forge** may later support editorial administration only when the static/manual workflow becomes burdensome enough to justify it.
- **Hardware Radar public/editorial layer** owns article composition, explanation, accessibility, metadata, internal linking, and presentation.

The first editorial phase requires no dynamic Atlas, Mercury, Compass, Aurora, or Forge integration.

## 14. Accepted authoring direction for CONTENT-002

The approved direction is:

```text
Markdown article source
+ validated front matter
→ small repository-owned static generator
→ reusable article template
→ plain static HTML
+ generated metadata, breadcrumbs, structured data, and sitemap entries
```

CONTENT-002 must not introduce a CMS, general site-framework migration, Forge editorial workflow, dynamic article API, autonomous Aurora writing, or Atlas-generated prose.

This direction is recorded here as product architecture intent. The repository's ADR convention should be evaluated immediately before CONTENT-002 implementation, when the generator contract, input schema, and build integration are concrete. CONTENT-001 does not create an ADR for an unimplemented runtime design.

## 15. Initial RAM content cluster

### Hub — RAM Buying Guide: Everything You Need to Know Before You Buy

**Intent:** “What should I know before buying RAM?”

Cover memory generation/type, capacity, form factor, compatibility, speed, timings, kit/module configuration, and upgrade planning. Link naturally to DDR5, DDR4, and Laptop RAM price surfaces. Do not create specific product Picks.

### Spoke — DDR4 vs DDR5: Which Should You Buy?

Cover platform and generation choice, compatibility, cost, performance context, and upgrade constraints. Attribute external testing where performance evidence is needed. Link to DDR4 and DDR5 price surfaces.

### Spoke — 16GB vs 32GB RAM: How Much Do You Actually Need?

Cover workload and capacity decisions, gaming/multitasking context, upgrade headroom, and laptop constraints. Avoid universal sufficiency claims. Link to relevant RAM price categories.

### Spoke — How to Check What RAM Is Compatible With Your PC

Cover DDR generation, DIMM/SODIMM, motherboard or system documentation, capacity limits, slot configuration, kit considerations, and XMP/EXPO caveats. Do not imply an automated compatibility tool exists.

### Spoke — RAM Speed and CAS Latency Explained

Cover MT/s, timings, the latency relationship, platform memory profiles, and why headline speed is incomplete. Disclose calculations and avoid unsupported performance rankings.

## 16. Future topics

Potential later topics include DDR5-5600 vs DDR5-6000, 1×32GB vs 2×16GB, DIMM vs SODIMM, XMP vs EXPO, ECC vs non-ECC, laptop RAM upgrades, deeper compatibility guidance, when RAM is actually a good deal, and AM5 memory guidance.

These are examples, not a schedule. Expansion requires a distinct user intent, evidence plan, category fit, and sustainable maintenance value; article-count targets are not a reason to publish.

## 17. Editorial lifecycle

```text
PROPOSED
→ EVIDENCE_READY
→ DRAFT
→ EDITORIAL_REVIEW
→ READY
→ PUBLISHED
→ NEEDS_REFRESH
→ UPDATED or ARCHIVED
```

This is product workflow vocabulary, not a new runtime subsystem. A draft is not published evidence, and publication of prose creates no market or recommendation authority.

## 18. Staged roadmap

| Increment | Objective | Explicit non-goals |
|---|---|---|
| **CONTENT-001** | Editorial doctrine and information architecture | No public page, generator, navigation, or sitemap change |
| **CONTENT-002** | Reusable static article shell, Markdown/front-matter validation, metadata, structured data, breadcrumbs, sitemap generation, and tests | No article prose, CMS, or broad framework migration |
| **CONTENT-003** | Guides hub and one navigation entry | No homepage hero displacement or taxonomy expansion |
| **CONTENT-004** | RAM Buying Guide hub article | No product Picks or unsupported testing claims |
| **CONTENT-005** | Remaining four cornerstone RAM articles | No mass publishing or generic news |
| **CONTENT-006** | Internal-linking, accessibility, responsive, SEO, and launch QA | No authority changes or affiliate-driven ordering |

## 19. CONTENT-002 concrete publishing contract

CONTENT-002 implements the accepted direction through:

- production Markdown source under `content/guides/`, never under `public/`;
- schema version `1.0` front matter with required route, identity, description, category/type, author/publisher, truthful dates, internal-link, and reference metadata;
- the supported identities `Hardware Radar Editorial` and `Mirabelle Labs`;
- a narrow Markdown contract for paragraphs, H2–H6 headings, emphasis, strong text, lists, safe links, inline code, blockquotes, tables, horizontal rules, explicit callouts, and governed price-surface CTAs;
- rejection of raw HTML, scriptable URLs, invalid heading order, unknown callouts, and unsupported internal destinations;
- one deterministic static article template with visible/structured breadcrumbs, Article JSON-LD, shared header/footer enhancement, references, optional disclosure/TOC/related links, and a body that needs no JavaScript;
- deterministic sitemap generation from `content/site-routes.json` plus validated production articles; and
- fixture-only generation outside `public/` for certification.

`dek` and `tableOfContents` are optional v1 fields because they directly support the accepted article shell. `affiliateDisclosure` is optional and displayed only when explicitly supplied. Reading time, robots overrides, and article/social images are deferred: they are not required for the first useful guides and must not be fabricated. References carry a supported evidence classification, label, and HTTPS source URL.

The RAM Buying Guide can act as both article and cluster hub by using `articleType: HUB`, the same template, related-guide metadata, and relevant price-page metadata. No RAM-specific renderer exists.

ADR-056 owns the durable static-generation decision. CONTENT-002 publishes no real article and adds no Guides navigation.

## 20. CONTENT-003 Guides discovery surfaces

CONTENT-003 publishes exactly two static discovery routes through the CONTENT-002 build:

- `/guides/` is a narrow, non-Article cross-category index with visible and structured breadcrumbs. It initially exposes only RAM and makes no claim about article count, popularity, news, reviews, or publication volume.
- `/guides/ram/` is a generated `HUB` article shell that owns the durable RAM cluster route. It provides limited orientation around generation, capacity, compatibility, speed/timings, and links to the three governed RAM price surfaces. CONTENT-004 may replace its concise Markdown body and metadata with the complete RAM Buying Guide without changing route, template, sitemap ownership, or navigation.

The shared header and Browse footer group each expose one `Guides` link. No spoke route, homepage editorial module, product recommendation, Pick, or price authority is introduced. The homepage remains price-first.

## 21. CONTENT-001 safety outcome

CONTENT-001 establishes documentation only. It creates no public article, navigation item, sitemap entry, runtime, CMS, Atlas fact, Mercury evidence, recommendation, publication decision, affiliate authority, provider operation, or spend.

## 22. CONTENT-004 cornerstone RAM Buying Guide

CONTENT-004 replaces the concise `/guides/ram/` launch shell with the complete cornerstone article **RAM Buying Guide: Everything You Need to Know Before You Buy**. It preserves the route, `ram-guides-hub` identity, `HUB` article type, CONTENT-002 template, navigation, and sitemap ownership established by CONTENT-003.

The guide is purchase-oriented and covers compatibility, DDR4 versus DDR5, capacity, DIMM versus SODIMM, module configuration, MT/s, timings and latency, XMP/EXPO, system limits, common mistakes, governed price comparison, and a final checklist. Material compatibility and profile claims reference primary manufacturer documentation. Capacity guidance is explicitly contextual rather than a universal performance claim.

The guide makes no product Pick, ranking, retailer endorsement, first-party test claim, live-price claim, or hard-coded market-price claim. It does not create the four planned spoke routes. Price CTAs point only to the existing governed DDR5, DDR4, and Laptop RAM surfaces, whose fail-closed market behavior remains unchanged. CONTENT-004 changes editorial content only; it grants no Atlas, Mercury, review, recommendation, publication, or Current Price authority.

## 23. CONTENT-005 five-article RAM cluster

CONTENT-005 publishes the four approved focused guides beneath the cornerstone hub: DDR4 versus DDR5, 16GB versus 32GB, system compatibility, and RAM speed/CAS latency. The RAM Buying Guide links to every spoke only after all four routes validate, and each spoke returns naturally to the hub. Limited cross-links connect only directly relevant questions.

The five-article cluster remains educational. It contains no product Pick, retailer ranking, first-party benchmark claim, static live price, or new recommendation authority. Classified primary references support non-obvious technical claims, while contextual capacity and performance guidance remains qualified. Existing governed price pages retain exclusive authority over current price presentation.

CONTENT-005 reuses ADR-056 and the CONTENT-002 generator without a new taxonomy, publishing framework, or runtime subsystem. The public editorial inventory is six routes: `/guides/`, the RAM hub, and exactly four RAM spokes.

## 24. CONTENT-006 launch QA and CONTENT-006A homepage correction

CONTENT-006 completes the initial editorial rollout through link, metadata, schema, sitemap, accessibility, responsive, factual-consistency, duplication, performance, and public-surface QA. The Guides index derives a compact list of the five validated RAM articles from their canonical metadata. CONTENT-006A removes the optional homepage editorial-discovery section after operator visual review. Editorial discovery is intentionally owned by the primary `Guides` navigation link, the footer link, `/guides/`, and article internal linking; the homepage retains its focused price-first sequence of proposition, governed answer, category access, trust, and footer.

Editorial source parsing is text-semantic: repository-supported LF and CRLF line endings produce the same validated metadata and deterministic output, while missing or malformed front-matter delimiters remain fail closed. Canonical Atlas and policy byte hashes remain a separate byte-identity concern.

The certified launch inventory remains six editorial routes and five substantive RAM articles. No new article, taxonomy, schema authority, recommendation, product Pick, price claim, third-party widget, image payload, or market-system behavior was added. The cluster remains static, readable without JavaScript, and governed by ADR-056.
