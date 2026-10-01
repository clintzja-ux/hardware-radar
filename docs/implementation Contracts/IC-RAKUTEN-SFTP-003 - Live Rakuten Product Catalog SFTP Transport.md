# IC-RAKUTEN-SFTP-003 — Live Rakuten Product Catalog SFTP Transport

**Status:** IMPLEMENTED / FIXTURE-CERTIFIED / LIVE CERTIFICATION PENDING CONFIGURATION
**Owner:** Mercury current-display transport boundary
**Date:** 2026-09-09

## Purpose

Provide a separate file-level SFTP transport beneath the certified Rakuten Newegg Product Catalog parser and adapter. Transport authority is limited to secure connectivity, read-only remote listing, deterministic bounded file selection, binary-safe staging, remote metadata capture, and parser/trailer integrity validation.

Transport success grants no product identity, price, condition, availability, marketplace, public display/comparison, historical retention, Current Price, Cheapest/Pick, or affiliate-routing authority.

## Secret and connection boundary

Credentials are loaded only from external `RAKUTEN_SFTP_USERNAME` and `RAKUTEN_SFTP_PASSWORD` environment configuration. Host defaults to the documented `aftp.linksynergy.com`; port defaults to 22. The loader accepts no alternative host, serializes username/password as `REDACTED`, and controlled errors suppress secret values.

The OpenSSH implementation uses SFTP only. It requires the explicit operator acknowledgement `TRUST-RAKUTEN-HOST-ON-FIRST-USE`, persists the accepted host key in ignored `.forge-review/rakuten-sftp/known_hosts`, and uses `StrictHostKeyChecking=accept-new`. It never disables host verification globally. A changed known host key therefore fails closed.

Operational connection concurrency defaults to one. Configuration above five fails closed. Certification commands use exactly one reusable session; processing concurrency is never mapped to SFTP connections. Retry attempts are bounded to at most two, with production commands configured to one.

## Remote discovery and selection

Read-only inspection supports root, `/44583/`, `/ADDITIONAL/44583/`, and `/GLOBAL/` listings. Metadata records the remote path, filename, modification timestamp, reported size, inferred advertiser MID, and classified family: `FULL`, `DELTA`, `TEMPLATE`, `DELTA_TEMPLATE`, `CATEGORY`, `ADDITIONAL`, `GLOBAL`, or `UNKNOWN`.

The main Newegg delta selector requires exactly one non-directory file under `/44583/`, advertiser MID `44583`, family `DELTA`, and `_mp_delta.txt.gz` suffix. Full, template, delta-template, additional, and global files are excluded. Zero or multiple candidates fail closed.

MID is remote namespace metadata only and establishes no identity or rights.

## Staging and integrity

Downloads are permitted only beneath ignored `.forge-review` staging and never beneath `public/` or a production repository. Remote gzip bytes are written to a `.partial-*` file and atomically renamed only after successful transfer and parser validation. Failures remove the partial file.

Remote reported size is diagnostic only. Authoritative success requires gzip extraction, valid `HDR`, supported product-row shapes, terminal `TRL`, and exact trailer/product count through the existing Rakuten parser. Remote modification time and feed-header time remain distinct; local completion time is not source freshness.

## Operator commands

```text
npm run rakuten:sftp:inspect -- --confirm-host-key=TRUST-RAKUTEN-HOST-ON-FIRST-USE
npm run rakuten:sftp:download:delta -- --confirm-host-key=TRUST-RAKUTEN-HOST-ON-FIRST-USE
```

Inspection connects, lists, classifies, and selects without download. Download retrieves exactly the selected main delta, parses it locally, and reports filename, remote/header timestamps, byte count, product/trailer counts, field counts, and I/U/D totals. Neither command runs the retail adapter or current-retail orchestrator.

## Explicit non-authority

No command in this increment mutates Atlas, `RetailerDestination`, production `CurrentDisplaySnapshot`, public artifacts/winners, retained or historical Mercury evidence, canonical/review/E2S/publication state, Current Price, Cheapest/Picks, affiliate state, or acquisition portfolios. No Amazon, Newegg-direct, or DataForSEO operation exists.

## Future handoff

After live transport certification, a separate increment must govern production source rights, TTL, adapter registration, refresh authorization, and the transition from staged parser-valid input into `CurrentRetailRefreshOrchestrator`. Transport certification alone must not expose `retail:current:refresh`.
