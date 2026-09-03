# IC-GROWTH-006 — GA4 Retailer Referral Observability and Beacon Readiness

## Status

Fixture-certified on 2026-09-03. No deployment, live click verification, provider call, or paid operation was performed.

## Responsibility boundary

GA4 owns near-term third-party operational web analytics for ordinary retailer referrals. Beacon remains the future Hardware Radar-governed first-party product/business-intelligence owner. Atlas owns canonical product and retailer identity, while Mercury `RetailerDestination` owns canonical navigation identity. Analytics data is not identity, market evidence, publication authority, or recommendation authority.

Operator inspection of the GA4 dashboard on 2026-09-03 confirmed that the `https://cheapestram.com` web stream is active, Enhanced Measurement and outbound clicks are enabled, and collection was active during the preceding 48 hours. This is external operator evidence; the repository does not independently establish the dashboard configuration or live receipt of an outbound event.

## Current measurement contract

Every generated RAM product page loads the same existing GA4 tag used by the public site. An effective retailer destination renders as an ordinary external HTTPS anchor with `target="_blank"` and `rel="noopener noreferrer"`. Navigation requires neither JavaScript nor successful analytics collection. No custom `gtag` event, click handler, redirect, `sendBeacon`, analytics endpoint, or Beacon transport participates.

With externally enabled Enhanced Measurement, the three current `amazon.com` links are structurally eligible for GA4's automatic outbound `click` event. Standard link domain/URL and page context support counts by period, retailer domain, originating persistent product route, and individual product route. This is sufficient for current operational referral reporting. The repository does not claim live event receipt before post-deployment verification.

Safe reporting describes **outbound retailer clicks** or **referrals**. It must not call clicks customers, buyers, purchases, orders, sales, conversions, or revenue.

## Beacon readiness and deferral

Beacon already validates replay-safe `OUTBOUND_RETAILER_CLICK` fixture events against Atlas and supports durable repository adapters, summaries, and governed retention. Its production transport remains `NOT_CONNECTED`, browser collection is absent, and repository signal count is zero. The current schema accepts browser-asserted `atlasProductId`, `retailerId`, and a controlled source surface; it does not yet model `destinationId`, `marketplace`, or `PRODUCT_DETAIL`.

A future canonical contract should accept an interaction event ID and occurrence time plus the minimum navigation reference, preferably `destinationId`; trusted collection should derive Atlas product, retailer, marketplace, and `PRODUCT_DETAIL` from the canonical destination. It should store no name, email, account, persistent visitor or advertising ID, fingerprint, precise location, affiliate identity, price, purchase value, or raw IP as analytics evidence. A raw destination URL is unnecessary when a canonical destination ID suffices.

Future aggregation may count by day, destination, Atlas product, retailer, marketplace, and source surface. Raw events should be bounded and aggregates deterministic, but this increment establishes no new retention duration. Connecting a browser, Gateway endpoint, Worker, D1 database, or second analytics backend requires a later governed increment based on a demonstrated first-party need.

## Reporting and verification

For a GA4 Exploration, import `Page path and screen class` (or `Page location`), `Link domain`, `Link URL`, and `Outbound`; use `Event count` as the metric; filter `Event name` exactly `click` and `Outbound` exactly `true`. The date range supplies daily or selected-period trends. Filter `Link domain` to `amazon.com` for retailer totals and a persistent `/ram/<slug>/` path for a specific product.

After deployment, an operator may open one live product route containing an Amazon destination, activate **Visit retailer**, confirm navigation, inspect GA4 Realtime or DebugView when appropriate, and later confirm the standard dimensions in Explore. This verification is not part of GROWTH-006.

## Safety invariants

- GA collection and affiliate state are independent.
- Analytics failure or suppression never blocks retailer navigation.
- Click volume grants no offer, availability, condition, shipping, Current Price, Cheapest, Pick, ranking, recommendation, publication, or acquisition authority.
- No production Beacon collection, custom duplicate analytics, retailer/provider operation, market mutation, or paid task is authorized.
