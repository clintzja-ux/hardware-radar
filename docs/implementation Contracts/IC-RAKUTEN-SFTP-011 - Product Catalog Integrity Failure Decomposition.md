# IC-RAKUTEN-SFTP-011 — Product Catalog Integrity Failure Decomposition

## Status and scope

RAKUTEN-SFTP-011 fixture-certifies safe, deterministic integrity diagnostics after the existing Rakuten Product Catalog transport has completed a local staged download and closed its SFTP session. It changes no connection, authentication, host-verification, directory discovery, transfer, adapter, current-display, Atlas, retailer, history, affiliate, or publication authority.

Certification is offline. It performs no Rakuten connection, download, provider operation, production mutation, or spend.

## Integrity stages and failure codes

The integrity boundary preserves the stage at which local validation failed without exposing feed payloads:

| Stage | Safe failure codes |
|---|---|
| `GZIP` | `SFTP_GZIP_INVALID`, `SFTP_GZIP_TRUNCATED` |
| `HDR` | `SFTP_HDR_INVALID`, `SFTP_HDR_TIMESTAMP_INVALID` |
| `PRODUCT` | `SFTP_PRODUCT_FIELD_COUNT_INVALID`, `SFTP_PRODUCT_ROW_INVALID` |
| `TRAILER` | `SFTP_TRAILER_MISSING`, `SFTP_TRAILER_INVALID` |
| `COUNT` | `SFTP_TRAILER_COUNT_MISMATCH` |

Unknown parser failures retain the fail-closed fallback `SFTP_INTEGRITY_FAILED`. No failure is converted into success, and informational remote-size disagreement remains distinct from content integrity.

Diagnostics are limited to integrity stage, rows parsed, product rows parsed, observed field counts, safe row ordinal, observed field count, trailer count when available, header-timestamp presence, and gzip-opened/completed state. For an unsupported field-four timestamp, the local buffer validator additionally performs a streaming diagnostic-only pass that reports a sanitized syntax family and independent gzip-EOF/trailer/count results. When the value has the bounded digits-only slash-date/time structure, that same classifier reports only the six component widths, component count, a digit-width pattern such as `M/DD/YYYY HH:mm:ss`, and whether unsupported extra characters prevented structural extraction. These fields are observational only: they do not validate component values, normalize the timestamp, or expand accepted syntax. It never reports the literal timestamp, advertiser name, product row, title, URL, description, credential, environment value, or decompressed payload.

## Observed header contract

The operator-established Product Catalog header is:

`HDR|MID|Advertiser Name|timestamp`

The parser validates exactly four header fields, a numeric MID, a nonblank advertiser name, and the timestamp in field four. Rakuten's documented pipe-delimited FULL and DELTA header contract defines field four as the UTC time the Product Catalog file was deposited in the publisher SFTP account, in exact `MM/DD/YYYY HH:mm:ss` form. The parser validates every calendar/time component and constructs the UTC instant directly; generic JavaScript `Date.parse()` interpretation and host-local timezone behavior are not part of this source contract. It does not treat the advertiser name as immutable identity or strengthen the deposit time into product observation time, filename chronology, or FULL/DELTA ordering authority.

For example, `09/03/2022 00:02:32` normalizes to `2022-09-03T00:02:32.000Z`. Impossible dates, missing leading structure, invalid time components, ISO/RFC/compact alternatives, timezone suffixes, and blank values fail as `SFTP_HDR_TIMESTAMP_INVALID`. FULL/DELTA ordering remains based on the separately certified remote SFTP modification metadata.

An unsupported field-four timestamp remains the primary semantic failure `SFTP_HDR_TIMESTAMP_INVALID`. Diagnostic continuation does not make the file acceptable, create parsed catalog output, invoke the adapter, or broaden the timestamp contract. Its only purpose is to distinguish semantic HDR rejection from later gzip corruption, missing or invalid trailer state, and trailer-count mismatch. A structurally complete gzip with an unsupported timestamp remains rejected.

Ordinary product rows retain the certified 38-field shape and delta rows retain the 39-field shape with modification `I`, `U`, or `D`. Quoted pipe characters, doubled quotes, CRLF input, and a trailing blank line are supported. A valid trailer is terminal, has a numeric product-row count, and must match the parsed product count exactly.

## Local validation and partial lifecycle

`npm run rakuten:feed:validate -- <local-file>` validates one operator-supplied local gzip file without opening SFTP or invoking the Rakuten adapter. Optional `--reported-bytes=<count>` compares the local file size with directory-reported bytes diagnostically only. Output uses the basename and safe counts/status; it does not print feed content.

The production transport keeps the RAKUTEN-SFTP-009 default: a failed attempt partial is deleted. RAKUTEN-SFTP-011 adds no diagnostic-copy or failed-payload retention mode. A successful transfer is still finalized only after gzip, header, product, trailer, and count validation all pass.

Authoritative-sequence validation failures retain the selected lineage, attempted filename/family, transfer summary, and sanitized integrity result before deleting every failed partial. The evidence is bounded metadata; no rejected feed archive is introduced.

## Separation and safety

Integrity success establishes only that the staged Product Catalog file is structurally valid. It does not execute `RakutenNeweggProductFeedAdapter`, write `CurrentDisplaySnapshot`, change Atlas or retailer destinations, create durable Mercury evidence or history, affect affiliate routing, publish, or grant Current Price, Cheapest, or Pick authority.
