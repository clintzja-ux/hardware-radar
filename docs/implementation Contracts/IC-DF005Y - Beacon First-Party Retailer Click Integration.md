# IC-DF005Y — Beacon First-Party Retailer Click Integration

## Certified boundary

Hardware Radar has one browser adapter for the certified Beacon `OUTBOUND_RETAILER_CLICK` schema `1.1`. It uses delegated click observation and governed metadata already bound to the displayed public offer. It never owns navigation: a failed, rejected, or unavailable analytics request cannot prevent or replace the retailer link.

Catalog cards and homepage/category hero offers carry only `atlasProductId`, `destinationId`, `retailerId`, controlled catalog category, and controlled placement. Current-offer links on generated product-detail pages are hydrated from the same governed public Current projection by exact product and destination match. General retailer-navigation links remain uninstrumented because they do not establish current offer eligibility. Destination URLs and affiliate material are never included in an event.

## Runtime composition

The Cloudflare Worker entrypoint composes the existing governed Beacon HTTP handler, destination validator, collection service, transactional D1 repository, and Gateway transport. It accepts only the same-origin collection route, validates method, JSON content type, and the 2 KiB body limit, rejects missing or stale destination projections, and relies on D1 uniqueness for exact replay and conflict behavior. Per-isolate rate limiting is defense in depth; production Cloudflare abuse controls remain required. Application logs contain neither raw request bodies nor secrets.

`BEACON_PUBLIC_DESTINATION_PROJECTION` owns the read-only public destination projection supplied to the Worker. The projection must retain its canonical `asOf` and `freshness.maxAgeHours` fields. The Worker revalidates this freshness on every request and fails closed when the projection is missing, invalid, future-dated, or stale. Provisioning and refreshing that binding is a separate production operation and has no Atlas or Mercury write authority.

## Activation contract

Browser collection is checked in as `DISABLED`. Runtime environment configuration alone cannot enable it. Activation requires a separately reviewed public release that changes the release-controlled activation record to `ENABLED` and binds a named activation authority and release identity. Before that release, operators must separately approve privacy disclosure changes, provision and migrate D1, provision the projection binding, deploy and verify the Worker route, configure production rate limiting and privacy-safe monitoring, and certify failure-safe live navigation.

This increment creates no Cloudflare resource or route, applies no migration, sends no production event, and changes no Current, History, Cheapest, Pick, scheduler, or publication authority.
