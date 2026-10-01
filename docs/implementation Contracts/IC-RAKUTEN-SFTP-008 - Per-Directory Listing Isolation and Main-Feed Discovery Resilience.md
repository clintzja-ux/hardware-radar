# IC-RAKUTEN-SFTP-008 — Per-Directory Listing Isolation and Main-Feed Discovery Resilience

## Status

Implemented and fixture-certified. No live Rakuten connection or download was performed by this increment.

## Required and optional paths

The current Newegg Product Catalog main-feed inspection owns one required listing and three optional diagnostics:

| Logical path | Remote path | Requirement |
|---|---|---|
| `ROOT` | `/` | Required; owns main full/delta/template discovery |
| `CATEGORY` | `/44583/` | Optional category diagnostic |
| `ADDITIONAL` | `/ADDITIONAL/44583/` | Optional additional-feed diagnostic |
| `GLOBAL` | `/GLOBAL/` | Optional cross-locale/currency diagnostic |

The exact main delta is selected only from successfully normalized root entries. Category, additional, and global results cannot add, remove, or substitute the root candidate. Root semantics from RAKUTEN-SFTP-006 and normalization from RAKUTEN-SFTP-007 remain unchanged.

## Per-directory outcomes

Each sequential listing produces a secret-free record containing logical path, sanitized remote path, required status, outcome, safe numeric SFTP status when available, and entry/type/malformed counts. Outcomes are `SUCCESS`, `PATH_NOT_FOUND`, `PERMISSION_DENIED`, `SERVER_FAILURE`, `UNKNOWN_LIST_FAILURE`, or `LIST_FAILED` for an optional malformed listing.

Native SFTP status 2 maps to `PATH_NOT_FOUND`, 3 to `PERMISSION_DENIED`, and 4 to generic `SERVER_FAILURE`. Status 4 is not connection-limit evidence. Unknown raw messages are never retained.

A root listing failure stops immediately as `SFTP_ROOT_LIST_FAILED`, includes the root path outcome, and never invokes selection or optional listings. Root normalization failure remains the more precise `SFTP_LIST_ENTRY_INVALID`.

After a successful root listing, an optional failure is recorded and inspection continues sequentially on the same session. A valid root candidate returns `SFTP_INSPECTION_PARTIAL`, not full health, when any optional path failed. Legitimate absence or denied access to optional additional/global/category content therefore remains visible without invalidating main-feed access.

## Main-feed and lifecycle preservation

Only one root `REGULAR_FILE` matching `44583_<numeric SID>_mp_delta.txt.gz` may qualify. Its raw and normalized remote timestamp, informational size, family, MID, and SID remain available even when optional diagnostics fail. HDR time remains separate and unavailable before download/parser validation.

One inspection uses one reusable SSH/SFTP connection for all sequential directory operations. Optional failure never reconnects. RAKUTEN-SFTP-005 accounting, one-connection routine policy, five-connection external ceiling, graceful cleanup, fallback destruction, and zero automatic retries remain unchanged.

## Isolation

This increment creates no download, last-processed checkpoint, current display, public artifact, Atlas mutation, retailer-destination mutation, Mercury history, affiliate route, acquisition-portfolio change, or Current Price authority. External operations and SFTP connections were zero; spend was `$0.000`.
