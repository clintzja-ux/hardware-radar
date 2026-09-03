# Hardware Radar — RAM Launch Catalog and Minimum Useful Coverage

**Program increment:** A-001
**Track:** A — Public Product / Launch
**Status:** ACCEPTED PRODUCT DEFINITION
**Owner:** Hardware Radar product
**Scope:** First useful US RAM discovery/comparison launch

## 1. Purpose and boundary

This document defines the finite public-product target that Tracks B, C, and D support. It does not populate Atlas, acquire or publish evidence, select commercial partners, authorize production operations, or implement later-stage recommendation capability.

The launch is a truthful, useful RAM discovery and monitored-offer comparison product. It is the first product surface in the accepted progression from RAM product to hardware buying assistant; it does not narrow that vision or authorize later stages.

Track A may state what the public product needs. It may not manufacture Atlas identity, Mercury evidence or publication authority, retailer/commercial state, or Compass recommendations.

## 2. Launch audience and problem

The initial audience is US PC builders, gamers, students, professionals, and laptop owners comparing common consumer RAM upgrades. Launch should help a user:

- identify a relevant desktop DDR5, desktop DDR4, or laptop/SODIMM configuration;
- see qualifying monitored listed prices when available;
- compare a bounded set of governed offers without whole-market claims;
- understand price basis, shipping knownness, freshness limitations, and coverage gaps; and
- open a retailer listing safely and make a better-informed next decision.

## 3. Catalog target and launch floor

The deliberate target is **24 consumer RAM products**:

| Category | Target products |
|---|---:|
| DDR5 desktop | 9 |
| DDR4 desktop | 7 |
| Laptop/SODIMM | 8 |
| **Total** | **24** |

The minimum launch floor is **18 publication-ready Atlas products**, with at least **6 in each public category**. This floor permits deliberate research gaps without reducing launch to one token product. The remaining target slots may be completed after launch.

Catalog membership reflects consumer usefulness, stable manufacturer identity, meaningful capacity/configuration/performance differences, and realistic US availability. Cosmetic variants do not count as separate coverage unless they have a materially distinct manufacturer part number and buying consequence.

Server/ECC RAM is outside the first launch catalog.

## 4. Product slots

Exact SKUs must be resolved by Track D from authoritative product evidence and informed by Track B/C market usefulness. A-001 does not invent product records.

### DDR5 desktop — 9 target slots

| Slot | Configuration and intended use | Priority | Desired offer overlap |
|---|---|---|---:|
| `DDR5-DESKTOP-VALUE-32GB` | 2×16 GB, 5600–6000 MT/s, mainstream value | Primary | 2 |
| `DDR5-DESKTOP-MAINSTREAM-32GB` | 2×16 GB, 6000 MT/s, useful mainstream latency | Primary | 2 |
| `DDR5-DESKTOP-AMD-PERFORMANCE-32GB` | 2×16 GB, EXPO-oriented, low-latency 6000-class | Primary | 2 |
| `DDR5-DESKTOP-INTEL-PERFORMANCE-32GB` | 2×16 GB, XMP-oriented, 6400–7200-class | Primary | 2 |
| `DDR5-DESKTOP-LOW-PROFILE-32GB` | 2×16 GB, clearance-sensitive builds | Secondary | 1 |
| `DDR5-DESKTOP-MAINSTREAM-64GB` | 2×32 GB, 5600–6000-class productivity | Primary | 2 |
| `DDR5-DESKTOP-PERFORMANCE-64GB` | 2×32 GB, 6000–6400-class | Secondary | 1 |
| `DDR5-DESKTOP-HIGH-CAPACITY-96GB` | 2×48 GB, creator/workstation-adjacent consumer use | Secondary | 1 |
| `DDR5-DESKTOP-SINGLE-32GB` | 1×32 GB, expansion/repair-oriented JEDEC or mainstream module | Secondary | 1 |

The existing Atlas product `ram_corsair_cmk32gx5m2b6000z30` is repository-supported and fits `DDR5-DESKTOP-MAINSTREAM-32GB`. It is the only exact launch SKU established by current Atlas state. Its existence does not imply current public coverage.

### DDR4 desktop — 7 target slots

| Slot | Configuration and intended use | Priority | Desired offer overlap |
|---|---|---|---:|
| `DDR4-DESKTOP-VALUE-16GB` | 2×8 GB, 3200-class affordable upgrade | Primary | 2 |
| `DDR4-DESKTOP-MAINSTREAM-32GB` | 2×16 GB, 3200 CL16-class | Primary | 2 |
| `DDR4-DESKTOP-PERFORMANCE-32GB` | 2×16 GB, 3600 low-latency class | Primary | 2 |
| `DDR4-DESKTOP-LOW-PROFILE-32GB` | 2×16 GB, cooler-clearance-sensitive builds | Secondary | 1 |
| `DDR4-DESKTOP-MAINSTREAM-64GB` | 2×32 GB, 3200-class productivity | Primary | 2 |
| `DDR4-DESKTOP-SINGLE-16GB` | 1×16 GB, expansion/repair use | Secondary | 1 |
| `DDR4-DESKTOP-SINGLE-32GB` | 1×32 GB, high-capacity expansion/repair use | Secondary | 1 |

### Laptop/SODIMM — 8 target slots

| Slot | Configuration and intended use | Priority | Desired offer overlap |
|---|---|---|---:|
| `SODIMM-DDR4-SINGLE-8GB` | 1×8 GB, entry/legacy laptop upgrade | Secondary | 1 |
| `SODIMM-DDR4-SINGLE-16GB` | 1×16 GB, common laptop upgrade | Primary | 2 |
| `SODIMM-DDR4-SINGLE-32GB` | 1×32 GB, high-capacity slot upgrade | Primary | 2 |
| `SODIMM-DDR4-KIT-32GB` | 2×16 GB, dual-slot upgrade | Primary | 2 |
| `SODIMM-DDR5-SINGLE-16GB` | 1×16 GB, current mainstream laptop upgrade | Primary | 2 |
| `SODIMM-DDR5-SINGLE-32GB` | 1×32 GB, current high-capacity slot upgrade | Primary | 2 |
| `SODIMM-DDR5-KIT-32GB` | 2×16 GB, dual-slot current-generation upgrade | Primary | 2 |
| `SODIMM-DDR5-KIT-64GB` | 2×32 GB, creator/mobile-workstation upgrade | Secondary | 1 |

Track D must resolve whether a proposed SODIMM product is a single module or kit and preserve the exact generation, speed, capacity, module count, and compatibility evidence. A similarly named listing is not identity proof.

## 5. Four independent coverage dimensions

| Dimension | Meaning | Minimum useful launch target |
|---|---|---|
| **Catalog coverage** | Product is a verified Atlas record and belongs to this launch catalog. | At least 18 products; at least 6 per category. |
| **Market coverage** | Mercury has governed observations for catalog products. | At the readiness cutoff, at least 12 catalog products have structurally usable governed observations, with coverage in every category and at least 3 retailers represented overall. |
| **Public coverage** | Observations currently pass canonical, review, E2S, publication, and projection gates. | Every category is `AVAILABLE` with at least 3 qualifying offers covering at least 2 distinct products and 2 retailers; at least 3 retailers are represented across the complete public snapshot. |
| **Commercial coverage** | Relevant retailer/affiliate/feed opportunities exist. | Not a publication or launch eligibility requirement. At least one credible commercial path is desirable, not required. |

Important primary product slots should preferably have two qualifying offers when the market supports them. A product may legitimately launch with one qualifying offer. Zero qualifying offers means unavailable; it never permits fallback, estimated, stale, or fabricated data.

These targets define a useful middle: launch does not wait for perfect Mercury coverage, but one isolated price is not sufficient to support a credible multi-category comparison product.

## 6. Retailer portfolio requirement

The public launch should represent at least **three active US-relevant retailers overall** and at least **two per public category** at the readiness cutoff. The desired portfolio combines:

- a major or high-recognition retailer;
- a specialist PC/component retailer; and
- another useful major, specialist, or smaller retailer with trustworthy listings.

Track C selects and develops relationships. Track A evaluates public value through recognition/trust, RAM selection, competitive pricing, identity quality, US relevance, listing stability, source accessibility, and offer overlap. Affiliate availability is neither a retailer-trust requirement nor a public eligibility/ranking input.

Keep `OBSERVED`, `PUBLICLY COMPARABLE`, `RECOMMENDABLE`, and `AFFILIATE ENABLED` separate. The launch requires comparable governed offers, not Compass recommendations.

Track C's finite candidates, relationship dimensions, and outreach order are defined in the [RAM launch retailer portfolio and relationship strategy](./RAM-LAUNCH-RETAILER-PORTFOLIO.md). That strategy does not grant Atlas identity, Mercury rights, commercial approval, or public eligibility.

## 7. Minimum useful public experience

On launch day a user must be able to:

1. understand immediately that Hardware Radar compares qualifying listed RAM prices from monitored products and retailers;
2. see whether qualifying pricing is currently available without a fake fallback;
3. browse DDR5, DDR4, and laptop/SODIMM categories;
4. see the lowest qualifying listed-price offer and up to four governed alternatives when available;
5. understand that the amount is a listed price and that unknown shipping, tax, or fees are not included or guessed;
6. see current insufficient-data and load-error states accessibly;
7. open retailer listings in a safe external tab;
8. understand methodology, monitored-coverage limitations, affiliate disclosure, privacy terms, and terms of use;
9. find a contact path; outbound human email is demonstrated, while inbound reliability remains separately unverified; and
10. complete the core experience on common mobile widths without clipping or unusable comparison controls.

No Gaming, RGB, Workstation, Upgrade, or Business Pick is required or authorized. Sparse governed comparison is preferable to fabricated richness.

## 8. Current public-product compatibility findings

The current repository already provides:

- a homepage with overall and category status cards;
- DDR5, DDR4, and SODIMM pages backed only by the governed snapshot;
- `AVAILABLE` and `INSUFFICIENT_DATA` scope behavior;
- one cheapest listed-price offer plus up to four alternatives per scope;
- explicit listed-price basis and known-free, known-paid, or unknown shipping presentation;
- fail-closed missing-data and load-error output using live/status semantics;
- safe retailer links using a new tab with `noopener noreferrer`;
- responsive grids at 900/700/600-pixel breakpoints and horizontally scrollable mobile navigation;
- methodology, about, affiliate disclosure, privacy, terms, and contact pages;
- disclosed Google Analytics and Microsoft Clarity use;
- permissive `robots.txt` and a category/content sitemap; and
- fixture coverage preventing placeholder Picks and invented market fallback data.

Current launch gaps are finite:

- the governed snapshot has zero qualifying offers in every scope;
- Atlas contains one launch-relevant product, so 23 target slots and at least 17 launch-floor records remain unresolved;
- homepage/category titles and headings use broader “Cheapest ... Today” or generic wording that needs focused SEO/truth alignment, category pages lack canonical tags, and category Open Graph URLs currently point to the homepage;
- sitemap dates need release-time reconciliation;
- `how-we-choose.html` contains malformed closing markup and some About/methodology/disclosure copy uses recommendation language broader than the implemented price-comparison authority;
- the comparison toggle needs focused keyboard/state semantics review (`aria-expanded`/controlled-region behavior), and comparison rows need real narrow-width QA for flex overflow/readability;
- outbound human email from `support@cheapestram.com` has been demonstrated through retailer outreach and prior correspondence, but inbound reliability, broad deliverability, authentication quality, automation, and long-term health remain unverified; and
- jurisdiction-specific analytics/consent requirements remain an explicit launch legal review item.

These are subsequent Track A readiness tasks, not authority to change runtime in A-001.

## 9. Launch-readiness gates

| Area | Gate | Classification |
|---|---|---|
| Catalog | Meet the 18-product floor and 6-per-category floors with valid Atlas identity/provenance. | **REQUIRED FOR LAUNCH** |
| Catalog | Resolve all 24 target slots. | **DESIRABLE FOR LAUNCH** |
| Market coverage | Meet the governed 12-product, every-category, 3-retailer observation target. | **REQUIRED FOR LAUNCH** |
| Public data | Meet the per-category 3-offer/2-product/2-retailer target; retain fail-closed zero states. | **REQUIRED FOR LAUNCH** |
| UX | Homepage and three category journeys explain monitored listed-price scope and never show unsupported Picks. | **REQUIRED FOR LAUNCH** |
| Mobile | Verify core pages and comparison controls at representative phone/tablet widths with no blocking overflow. | **REQUIRED FOR LAUNCH** |
| Trust/methodology | Align recommendation wording with comparison authority and repair malformed methodology markup. | **REQUIRED FOR LAUNCH** |
| SEO | Use truthful category-specific titles, descriptions, headings, canonical/OG URLs; verify robots and sitemap. | **REQUIRED FOR LAUNCH** |
| Analytics/privacy | Reconcile disclosed scripts and obtain applicable consent/privacy review. | **REQUIRED FOR LAUNCH** |
| Contact | Outbound human sending is demonstrated; separately verify inbound receipt/response capability without inferring broad deliverability or automated-email readiness. | **REQUIRED FOR LAUNCH** |
| Retailer links | Validate representative governed links and preserve safe external-link behavior. | **REQUIRED FOR LAUNCH** |
| Error/empty states | Preserve accessible insufficient-data and snapshot-load-error states. | **REQUIRED FOR LAUNCH** |
| Performance | Confirm static core pages and governed snapshot load without blocking errors on representative mobile/desktop connections. | **REQUIRED FOR LAUNCH** |
| Performance | Formal performance budgets and continuous synthetic monitoring. | **POST-LAUNCH** |
| Accessibility | Preserve main landmarks/live regions and verify comparison toggle name, state, keyboard use, focus, and contrast. | **REQUIRED FOR LAUNCH** |
| Accessibility | Comprehensive independent WCAG audit. | **DESIRABLE FOR LAUNCH** |
| Legal/commercial | Review terms, affiliate disclosure, privacy/analytics consent, retailer-link presentation, and monitored-market claims. | **REQUIRED FOR LAUNCH** |
| Commercial | Have affiliate relationships for every displayed retailer. | **POST-LAUNCH** |

## 10. Explicit post-launch scope

The first useful launch does not require:

- categories beyond consumer RAM or complete coverage of every RAM SKU;
- Server/ECC coverage;
- Compass, governed Picks, personalized recommendations, or basket/bundle optimization;
- Aurora or a conversational assistant;
- user accounts, alerts, forums, social features, or mobile applications;
- advanced price-history visualization or prediction;
- perfect shipping, tax, or mandatory-fee determination;
- complete automation or coverage for every retailer;
- sophisticated retailer-partnership tooling;
- a large-scale public/B2B API or broad enterprise intelligence; or
- later hardware-intelligence and buying-assistant capabilities.

These remain deferred, not rejected from the long-term vision.

## 11. Cross-track requirements

### Track B — Mercury / Market Data

- Establish governed observation coverage for the resolved launch catalog, prioritizing primary slots.
- Work toward the launch minimum of 12 observed products, every category represented, and at least 3 retailers overall.
- Prefer two qualifying offers for primary slots while preserving legitimate one-offer and unavailable states.
- Preserve explicit condition; do not infer `NEW` from missing data.
- Preserve shipping knownness and mandatory price components without converting unknown to zero.
- Preserve availability, currency, source URL, retailer/product identity, bundle/conditional-offer state, rights, provenance, and replay/idempotency.
- Apply repository-owned source-specific freshness and recurrence policy; A-001 selects no acquisition threshold or cadence.
- Produce candidates compatible with historical, canonical, review, E2S, publication, and bounded comparison projection.
- Use curated bootstrap only for explicitly approved launch paths and progressively retire overlap after automated governed parity.

### Track C — Retailer & Commercial

- Seek a portfolio capable of at least 3 publicly represented US retailers overall and 2 per category.
- Balance major-recognition retailers with specialist/smaller retailers that improve selection, identity, communication, or data access.
- Prioritize stable listings, useful RAM breadth, consumer trust, competitive pricing, rights clarity, and feed/API or data-quality cooperation.
- Pursue affiliate opportunities independently; never make affiliation an eligibility or Cheapest-ordering condition.
- Treat direct-retailer silence as a commercial/data constraint, not a veto over separately lawful governed acquisition.

### Track D — Atlas / Intelligence Foundation

- Resolve the 23 unfilled target slots into exact authoritative manufacturer products; at least 17 are required to meet the launch floor.
- Preserve exact MPN/variant identity and avoid cosmetic SKU inflation.
- Record memory generation, form factor, application class, module type, total capacity, module count, capacity per module, data rate, latency where known, kit status, relevant profile support, and provenance.
- Enforce `capacityGb = moduleCount × capacityPerModuleGb`.
- Establish any missing launch retailer records only from approved authoritative evidence.
- Do not make Atlas catalog presence imply market or publication eligibility.

### Track E — Governance / Platform Evolution

No new governance increment is required by A-001. Existing Atlas, Mercury, E2S, publication, snapshot, and fail-closed boundaries are sufficient. Reopen Track E only for a demonstrated defect. Launch legal/privacy review is an external/product-readiness gate, not authority to invent another governance subsystem.

## 12. Definition of launch ready

Hardware Radar RAM is launch ready when all **REQUIRED FOR LAUNCH** gates above are evidenced at one explicit readiness cutoff; the catalog, market, and public coverage floors are met; every public offer comes through existing governed publication composition; unavailable data remains unavailable; and public copy accurately describes monitored listed-price coverage.

Launch readiness does not mean perfect coverage. It means enough governed, current, real utility across all three RAM categories to justify use without misleading users. The launch decision itself remains an explicit operator/product decision and does not follow automatically from meeting these targets.
