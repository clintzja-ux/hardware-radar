# RAM public-intelligence release portfolio

## Status

`RAM_PUBLIC_INTELLIGENCE_RELEASE_P1` is implemented, fixture-certified, and prepared as a local exact release preview. It creates no publication, release, merge, deployment, or provider authority.

## Ownership and composition

The portfolio is a derived release composition, not a market-data owner. Atlas remains authoritative for product identity/specifications; qualified Mercury Current remains authoritative for current offers; effective Mercury History remains authoritative for temporal observations; and canonical RetailerDestination records remain authoritative for shopper destinations. Existing Terminal, chronology, product-page, category, catalog, comparison, editorial, sitemap, and structured-data owners render those inputs.

The portfolio artifact set binds sanitized projections and SHA-256 input/file digests for reproducibility and rollback. It contains:

- the 103-product public Atlas RAM catalog;
- fresh qualified Current and an explicit empty-Current fallback;
- fresh and stale-Current Terminal variants sharing the same effective History;
- grouped public chronology for every product;
- governed public retailer destinations;
- a route manifest covering 122 canonical routes: 14 static routes, five editorial article routes, and 103 product routes.

The September 30 RAM Market Snapshot is excluded: zero snapshot routes, no snapshot data artifact, no sitemap entry, and no production navigation link.

## Lifecycle

The repository exposes four zero-provider commands:

```text
npm run publication:ram-intelligence:prepare -- --as-of=<ISO-8601> --prepared-by=<operator>
npm run publication:ram-intelligence:inspect -- --candidate-id=<candidate> --evaluated-at=<ISO-8601>
npm run publication:ram-intelligence:certify -- --candidate-id=<candidate> --evaluated-at=<ISO-8601> --certified-by=<operator>
npm run publication:ram-intelligence:preview -- --candidate-id=<candidate> --evaluated-at=<ISO-8601>
```

PREPARE reads the existing governed operational repositories and writes an immutable ignored artifact set below `.forge-review/publication/ram-intelligence/`. INSPECT verifies all bindings and public contracts. CERTIFY records Sentinel-style certification of the exact candidate, but keeps `releaseAuthority=false` and `deploymentAuthority=false`. PREVIEW materializes `.forge-review/public-release-preview/` using production routes, sanitization, SEO, renderers, and navigation without creating a release manifest.

## Freshness and fail-closed behavior

The artifact records the earliest expiration among included Current offers. Preview/release evaluation uses the fresh variant only through that boundary. Afterward it selects the empty-Current variant: Current offers, Cheapest/current claims, and Offer data disappear while durable effective History, Terminal History metrics, and product chronologies remain. History never manufactures a Current price. A production release attempted after the bound Current expires requires fresh Current and a new PREPARE/INSPECT/CERTIFY cycle if current prices are to appear.

## Reproducibility

A clean checkout requires only repository-controlled source plus the existing governed operational inputs:

- `.forge-review/retail-display/current-display-snapshots.json`;
- `.forge-review/mercury/historical-observations.json`;
- `.forge-review/mercury/historical-comparability-reassessments.json`.

Atlas and destination records are checked in. The candidate binds digests for all five source inputs (including the Atlas manifest and destination source) and every sanitized output. Developer preview output, browser state, research workbooks, raw provider payloads, and scratch files are not inputs.

## Release and rollback boundary

The checked-in production release remains OFF because `config/publication-release.json` is absent. The exact preview is not consumed by `npm run build:public`, Cloudflare, or deployment automation. A later operator-approved production increment must explicitly bind the certified portfolio into the existing static release control, review the exact preview, authorize merge/update to `main`, and observe deployment. Removing/omitting the release manifest remains the safe OFF rollback and does not delete canonical Current or History.

## Current refresh procedure

Before a future production release, the operator must run the governed current-retail refresh lanes, confirm source rights/destination/identity/comparability, and rerun PREPARE at the actual evaluation time. INSPECT reports fresh product/offer counts and the earliest Current expiration. If refresh is missed, Current fails closed after 36 hours; catalog, specifications, effective History, chronology, and History-only Terminal intelligence remain available. No public request triggers acquisition.
