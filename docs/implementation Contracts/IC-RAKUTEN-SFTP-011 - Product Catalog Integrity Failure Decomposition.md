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

Diagnostics are limited to integrity stage, rows parsed, product rows parsed, observed field counts, safe row ordinal, observed field count, trailer count when available, header-timestamp presence, and gzip-opened/completed state. They never contain a product row, title, URL, description, credential, environment value, or decompressed payload.

## Observed header contract

The operator-established Product Catalog header is:

`HDR|MID|Advertiser Name|timestamp`

The parser now validates exactly four header fields, a numeric MID, a nonblank advertiser name, and the timestamp in field four. It does not treat the advertiser name as immutable identity. This corrects the sanitized fixture and parser contract; it does not claim that header shape was conclusively the cause of an earlier live failure because the failed partial was correctly deleted.

Ordinary product rows retain the certified 38-field shape and delta rows retain the 39-field shape with modification `I`, `U`, or `D`. Quoted pipe characters, doubled quotes, CRLF input, and a trailing blank line are supported. A valid trailer is terminal, has a numeric product-row count, and must match the parsed product count exactly.

## Local validation and partial lifecycle

`npm run rakuten:feed:validate -- <local-file>` validates one operator-supplied local gzip file without opening SFTP or invoking the Rakuten adapter. Optional `--reported-bytes=<count>` compares the local file size with directory-reported bytes diagnostically only. Output uses the basename and safe counts/status; it does not print feed content.

The production transport keeps the RAKUTEN-SFTP-009 default: a failed attempt partial is deleted. RAKUTEN-SFTP-011 adds no diagnostic-copy or failed-payload retention mode. A successful transfer is still finalized only after gzip, header, product, trailer, and count validation all pass.

## Separation and safety

Integrity success establishes only that the staged Product Catalog file is structurally valid. It does not execute `RakutenNeweggProductFeedAdapter`, write `CurrentDisplaySnapshot`, change Atlas or retailer destinations, create durable Mercury evidence or history, affect affiliate routing, publish, or grant Current Price, Cheapest, or Pick authority.
