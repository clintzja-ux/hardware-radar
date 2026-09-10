# IC-RAKUTEN-SFTP-012 — Product Catalog Logical Record Framing

## Status and scope

RAKUTEN-SFTP-012 fixture-certifies bounded, quote-aware logical-record framing inside the existing Rakuten Product Catalog parser. It changes no SFTP connection, authentication, discovery, selection, timestamp, sequential transfer, timeout, cancellation, adapter, current-display, Atlas, retailer, history, affiliate, or publication owner.

**Superseded behavior:** RAKUTEN-SFTP-013 retires this contract's cross-line quoted-record continuation after captured Rakuten documentation established CR/LF-terminated Product Catalog records and live diagnostics exposed unsafe multi-row accumulation. RAKUTEN-SFTP-012 remains the historical record of the intermediate correction; RAKUTEN-SFTP-013 owns current production parsing semantics.

Certification is offline. It performs no Rakuten connection, download, provider operation, production mutation, or spend.

## Live diagnostic and root cause

The separately authorized live attempt reached local parsing, parsed the header and 256 product records, then reported `SFTP_PRODUCT_ROW_INVALID` at physical row 258 with no observed field count. The former parser framed records with Node's physical-line reader. It therefore sent the next physical line to `parseRakutenPipeRecord` before knowing whether an open quoted field continued across the line. `observedFieldCount = null` means quote parsing failed before a complete field array existed.

The failed partial was deleted under the certified default lifecycle. The retained diagnostics establish an open quote at the end of a physical line; they do not establish whether the source contained a valid multiline field or a genuinely malformed quote.

## Physical lines and logical records

A physical line is decompressed text separated by CR, LF, or CRLF. A logical record is one complete `HDR`, product, or `TRL` record after quote-aware framing. CR, LF, and CRLF terminate a logical record only outside a quoted field. Inside a quoted field they are preserved exactly as field content. Standalone blank logical records retain the previously certified harmless-blank behavior; blank physical lines inside a quoted field are data and are not skipped.

The framer carries `OUTSIDE_QUOTED_FIELD`, `INSIDE_QUOTED_FIELD`, and `QUOTE_ESCAPE_OR_CLOSE_PENDING` state across arbitrary decoded stream chunks. Pipe delimiters, opening quotes, doubled quote escapes, closing quotes, and CRLF pairs therefore behave identically regardless of chunk boundaries.

## Bounds and failure semantics

One logical record may contain at most 1,048,576 decoded characters. This is a protective implementation ceiling, not a claim about a Rakuten provider maximum. It gives all 38/39 fields substantial space while preventing an unterminated quote from accumulating without bound. Exceeding it fails as `SFTP_PRODUCT_RECORD_TOO_LARGE`.

A quote still open at clean gzip/text EOF fails as `SFTP_PRODUCT_QUOTE_UNTERMINATED`. Because gzip reached EOF in that case, `gzipCompleted` is true. A product/classification failure that aborts parsing before gzip EOF retains `gzipCompleted = false`; neither outcome is reclassified as gzip truncation unless zlib itself reports compressed-stream failure.

A complete unsupported control record fails as `SFTP_PRODUCT_RECORD_UNKNOWN`. Complete product candidates with the wrong quote-aware field count retain `SFTP_PRODUCT_FIELD_COUNT_INVALID`. No unknown logical record is skipped.

## Safe diagnostics

Failure diagnostics may contain physical-line ordinal, logical-record ordinal, product-row ordinal, logical-record physical-line count, logical-record byte length, quote state, delimiter count outside quotes, structural record classification, recognized-control-token state, and observed field count. They never contain record text, title, URL, SKU, MPN, description, affiliate URL, or arbitrary source content.

The local `npm run rakuten:feed:validate -- <local-file>` harness renders these structural diagnostics without SFTP, adapter execution, or state mutation. Failed transport partials continue to be deleted by default; this increment adds no failed-feed preservation mode.

## Field and trailer semantics

The established `MAIN` parser profile accepts 38-field full rows and 39-field delta rows. A 39-field row must retain explicit `I`, `U`, or `D` modification; a 38-field row has no inferred modification. The mixed 38/39 live diagnostic reflects this existing parser behavior and does not by itself prove whether a 38-field row is provider-valid within that particular delta file. Tightening selected-delta profile semantics requires separate provider-supported evidence and is outside this framing correction.

Trailer count remains the number of complete logical product records, never physical lines. A multiline product immediately followed by `TRL|N` is one product for exact trailer-count validation.

## Separation and safety

Successful framing and parsing establish only local file structure. They do not invoke `RakutenNeweggProductFeedAdapter`, write `CurrentDisplaySnapshot`, modify Atlas or retailer destinations, create Mercury history, affect affiliate routing, publish, or grant Current Price, Cheapest, or Pick authority.
