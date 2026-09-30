# IC-RAM-PRODUCT-PRICE-INTELLIGENCE-STATIC-INTEGRATION-P1

Status: IMPLEMENTED / FIXTURE-CERTIFIED / REAL-STATE-DEVELOPMENT-PREVIEW-CERTIFIED

## Purpose

Enhance the existing 103 canonical `/ram/<atlas-slug>/` pages with product-level current and historical price intelligence. This increment reuses the static product-page generator and creates no new route, data owner, history engine, API, database, acquisition path, or recommendation authority.

## Owners and static join

- Atlas supplies canonical product identity, specifications, slug, category membership, and indexable product substance.
- the governed public Mercury Current projection supplies qualified current item-price offers and existing canonical retailer destinations;
- `RamTerminalPublicIntelligence` supplies the already-sanitized All RAM product summaries derived from Mercury History;
- RetailerDestination continues to own governed navigation destinations;
- `ram-product-publishing.mjs` joins the Terminal summary by exact `atlasProductId` and verifies that its canonical public path agrees with Atlas before rendering.

Both ordinary and development-preview builds create the Terminal projection first and pass its All RAM product rows into the existing 103-page generator. Product templates do not independently calculate historical movement, range, span, or observed-low state, and no second product-intelligence artifact is created.

## Page contract

Each page preserves its canonical identity/specification surface and may progressively render:

1. product identity and key specifications;
2. qualified Current offers, when present;
3. Hardware Radar-observed comparable History;
4. governed retailer actions;
5. methodology and navigation to the RAM Market Terminal and relevant category.

Current and History are visibly separate. Current is qualified item-price evidence and excludes applicable shipping, taxes, and fees. Historical movement is the latest comparable historical observation minus the previous distinct-time comparable historical observation; it never means Current minus previous History.

## Evidence progression

- zero comparable History renders an explicit no-comparable-history state and no chart;
- admitted but noncomparable History is acknowledged without exposing it as a price series;
- one distinct comparable timestamp renders the latest observation, human-readable date, evidence counts, and `Insufficient history for movement`;
- two or more distinct comparable timestamps render latest, previous, historical movement, comparable observed range, evidence counts, and human-readable span;
- three or more timestamps use the same summary without a chart or raw chronological table;
- Current-only and History-only products remain independently useful.

Observed-low language is limited to `Latest at observed low`. It describes the comparable Hardware Radar-observed series and is not an all-time, internet-wide, deal, recommendation, or purchase-timing claim.

## Public and SEO boundaries

All 103 existing product routes, slugs, canonical URLs, sitemap membership, unique metadata, Product identity data, and BreadcrumbList data remain intact and indexable independently of volatile price availability. No Offer, AggregateOffer, availability, shipping, return-policy, review, rating, or historical-price structured data is added.

The pages expose no provider task/result/evidence IDs, authorization state, raw payload, private operator state, workbook data, research-only Rakuten material, credentials, or private URLs. Retailer destinations and affiliate links are consumed unchanged; affiliate state does not affect ranking.

## Presentation and performance

The history module uses compact server-rendered metric cards, textual movement symbols with accessible labels, a textual observed-low badge, and responsive one-/two-/three-column layouts. It adds no chart, chart library, runtime API, browser data request, or product-specific JSON fetch.

## Release boundary

The ordinary public build remains governed by the existing static release control. With release OFF, product pages retain specifications, destinations, and explicit sparse History states without exposing operational Current or History. The ignored development-preview build may render canonical local Current and History for operator review and grants no publication, release, or deployment authority.

## Certification

Focused tests cover all 103 routes, exact Atlas/Terminal binding, sparse and noncomparable states, one/two/three-plus timestamp progression, Current-only and History-only compositions, distinct-time arithmetic, UP/DOWN/FLAT wording, observed range/low, human-readable date/span formatting, Current/History separation, claim safety, private-field and structured-data restraint, destination preservation, Terminal/category navigation, responsive layout, and deterministic build output.
