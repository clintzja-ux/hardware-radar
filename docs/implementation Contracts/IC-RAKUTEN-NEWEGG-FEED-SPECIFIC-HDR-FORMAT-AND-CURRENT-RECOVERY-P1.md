# IC-RAKUTEN-NEWEGG-FEED-SPECIFIC-HDR-FORMAT-AND-CURRENT-RECOVERY-P1

## Status and scope

`RAKUTEN_NEWEGG_FEED_SPECIFIC_HDR_FORMAT_AND_CURRENT_RECOVERY_P1` certifies a narrow provider-format override for exact feed family `RAKUTEN_MAIN:44583:4746097`. Rakuten's generic documented Product Catalog HDR contract remains `MM/DD/YYYY HH:mm:ss`; only this operator-confirmed Newegg MID/SID family uses observed `DD/MM/YYYY` semantics. Selection is by exact feed-family identity, never locale, machine configuration, value guessing, SFTP mtime, or retrieval time.

## Evidence and parsing

Retained immutable artifacts establish raw family values `01/10/2026 12:25:49`, `29/09/2026 12:23:23`, and `01/10/2026 20:20:32`. The non-ambiguous `29/09/2026` value cannot satisfy the documented month-first grammar. The family-specific deterministic parser therefore derives `2026-10-01T12:25:49Z`, `2026-09-29T12:23:23Z`, and `2026-10-01T20:20:32Z`. Default/unrelated feeds retain month-first behavior. Both paths validate component ranges and UTC calendar identity without `Date.parse()` or host locale. Raw gzip bytes, SHA-256 digests, record counts, and modification counts remain unchanged.

## Catalog lineage and Current boundary

The existing disk-bounded SQLite owner rebuilt baseline `rakuten_catalog_5d797b22b64ed65e00c92932` from immutable FULL digest `7c42bab…bcbbe3`, then applied immutable DELTA digest `14cc8d1a…e08ef` as child `rakuten_catalog_e30fe8923168a3413af6a4fb`. The direct FULL-to-DELTA chronology is valid; the unavailable raw prior DELTA is not guessed or reused. Reapplication returns `REPLAY_NO_CHANGE`. The child contains 1,058,231 records and remains History-ineligible.

At evaluation `2026-10-02T15:02:17.784Z`, the DELTA evidence was 18.696 hours old and fresh under the existing 36-hour policy. Its 12,080 last-record-wins rows are 3,157 insert, 4,979 update, and 3,944 delete. Exact destination assessment found 13 matched rows, zero review-required bindings, and 12,067 unbound rows; the matches contain 11 I/U and two D records. Common Current orchestration reduced the 11 I/U records to seven unique governed destinations: five remained `CONDITION_UNKNOWN` and two entered `CURRENT_SOURCE_CONFLICT_REVIEW_REQUIRED`. No canonical Current mutation, refresh authorization, public recomposition, release, or deployment followed.

## Durable boundaries

- SFTP mtime remains discovery/change-detection metadata and never substitutes for HDR evidence time.
- Canonical RetailerDestination and existing Newegg affiliate precedence remain unchanged.
- Rakuten remains prohibited from Mercury History and chronological intelligence.
- A later mutable October 2 DELTA requires a separately authorized, single-session DELTA-only acquisition if pursued; it requires no FULL download, retry, or spend.
