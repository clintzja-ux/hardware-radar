# IC-RAKUTEN-SFTP-013 — Documented Line-Oriented Product Catalog Parsing

## Status and scope

RAKUTEN-SFTP-013 fixture-certifies a line-oriented, field-aware parser for Rakuten Product Catalog files. It supersedes only the cross-line logical-record behavior introduced by RAKUTEN-SFTP-012. It changes no gzip, SFTP connection, authentication, discovery, selection, timestamp, sequential transfer, timeout, cancellation, adapter, current-display, Atlas, retailer, history, affiliate, or publication owner.

Certification is offline. It performs no Rakuten connection, download, provider operation, production mutation, or spend.

## Documented format basis

The captured Rakuten Product Catalog documentation establishes `HDR`, Product Data, and terminal `TRL` records; one product per product record; CR/LF record termination; pipe-delimited positional fields including empty positions; double-quoted field values when they contain a pipe; and an added Modification field for delta changes. It does not establish RFC-4180 generally or multiline quoted records.

Therefore CR, LF, and CRLF are canonical physical record boundaries. CRLF counts once. Quotes never suppress a boundary or absorb a later product or trailer. Header and trailer each occupy one physical record.

## Why multiline framing was retired

The RAKUTEN-SFTP-012 framer treated every quotation mark as structural, independent of field position. One quote inside ordinary unquoted data could enter quoted state, suppress every subsequent CR/LF boundary, and concatenate rows until a later quote happened to close the state.

A separately authorized live attempt exposed that mechanism as a synthetic 451-physical-line, 729,492-byte record with 41 fields. The real failed row was not retained, so its exact content is unknown; the code and sanitized regression establish the faulty accumulation mechanism without claiming any real payload value.

## Field-level quote semantics

After a physical record is framed, a quote opens a structurally quoted field only at record start or immediately after a pipe delimiter. A quote appearing after unquoted field content remains literal data. Structural quoting protects an embedded pipe. A structural closing quote is accepted only at field end, immediately before a pipe or physical-record end.

Doubled quotes inside a structurally quoted field remain decoded as one literal quote. This is an implementation compatibility rule retained from the already-certified fixture/parser contract; it is not represented as a separately documented Rakuten contractual guarantee. Other quote characters inside quoted data remain literal unless they form the deterministic closing position.

If a structurally quoted field remains open at the physical record boundary, that record fails as `SFTP_PRODUCT_QUOTE_UNTERMINATED`. The next physical record is never appended. Complete rows with unsupported widths still fail; 41 fields are not accepted.

## Width, delta, and trailer rules

The existing `MAIN` parser profile continues to accept 38-field full rows with no inferred modification and 39-field rows with explicit `I`, `U`, or `D`. The selected live filename establishes that the file was a delta, but current parser composition does not pass a distinct full/delta width policy. Whether all product rows in that provider delta must be 39 fields remains insufficiently established and should be decided separately from record framing.

Trailer count remains the exact number of successfully parsed physical product records. Literal quotes cannot swallow following products or `TRL|<count>`.

## Bounds and diagnostics

One physical record may contain at most 1,048,576 decoded characters. This is a protective implementation ceiling, not a provider-documented maximum.

Safe failures may expose physical-line ordinal, record ordinal, product-row ordinal, physical-record byte length, quote state, delimiters outside quotes, quote-open field ordinal, literal/structural quote counts, record classification, and observed field count. They never expose field values, record text, title, URL, SKU, MPN, UPC, description, or affiliate data. The local validator renders only these diagnostics.

## Separation and safety

Parsing success establishes local Product Catalog structure only. It does not invoke `RakutenNeweggProductFeedAdapter`, write `CurrentDisplaySnapshot`, modify Atlas or retailer destinations, create Mercury history, affect affiliate routing, publish, or grant Current Price, Cheapest, or Pick authority.
