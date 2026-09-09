# IC-RAKUTEN-SFTP-006 — Native SFTP File Discovery and Diagnostic Preservation

## Status

Implemented and fixture-certified. This increment performed no live Rakuten connection or download.

## Observed production boundary

Operator-provided evidence from the immediately preceding live inspection establishes that TCP/SSH connection, host verification, authentication, the `ssh2` ready event, the SFTP subsystem, and graceful cleanup succeeded. Local accounting was `1 opened / 1 ready / 1 graceful close / 0 fallback destroys / 0 active at end / peak 1`. The prior `SFTP_LIST_FAILED` was not reproduced. The current failure occurred after listing, when file selection returned `SFTP_FILE_NOT_FOUND`.

The observed root contained directories `44583`, `ADDITIONAL`, and `GLOBAL`, plus the Newegg Product Catalog files `44583_<SID>_mp.txt.gz`, `44583_<SID>_mp_delta.txt.gz`, `44583_<SID>_mp_deltatemplate.txt.gz`, and `44583_<SID>_mp_template.txt.gz`. Rakuten documentation and operator WinSCP evidence both place these main files in the account root. The root path remains `/`; this increment does not speculate about or rewrite remote path semantics.

Rakuten Support has confirmed that the account is active, in good standing, and not locked. Earlier transient server behavior remains unattributed. Neither SFTP status 4 nor current evidence establishes connection-limit exhaustion.

## Root cause and correction

`NativeSftpSession.list()` already consumed the real `ssh2` `readdir` shape (`filename`, `longname`, and `attrs`) and the live root listing succeeded. The defect was downstream: `selectRakutenNeweggMainDelta()` required the selected path to begin `/44583/`, excluding a valid main delta located at root as `/44583_<SID>_mp_delta.txt.gz`.

Selection now requires exactly one regular root file matching the configured MID, a generic numeric SID, and the exact suffix `_mp_delta.txt.gz`. Full, template, delta-template, directory, additional, and global entries cannot qualify. The SID is extracted and preserved but is not hard-coded.

File-type normalization derives `DIRECTORY` and `REGULAR_FILE` from `ssh2` attribute semantics. Unknown non-directory/non-regular types remain `OTHER` and cannot qualify.

## Safe diagnostics and errors

Inspection results and selection failures carry a bounded discovery summary: logical directory, entry/directory/regular-file counts, recognized feed-file count, main-delta candidate count, target MID, and recognized root entry names. It contains no feed records, tracking URLs, username, password, credential URI, environment values, or host-key material.

Every recognized Product Catalog entry preserves its filename, remote path, raw SFTP timestamp in epoch seconds when supplied, normalized UTC timestamp, informational remote size, feed family, MID, parsed SID, `TXT` format, and `GZIP` compression. Malformed timestamps fail entry normalization closed. Remote size is never an integrity or change signal.

The deterministic timestamp comparator supports `NEWER`, `UNCHANGED`, `OLDER_OR_REGRESSED`, and `UNKNOWN` using normalized UTC instants only. Filename equality cannot establish `UNCHANGED`, size differences cannot override timestamp semantics, and regressions are not safe-to-skip results. The remote directory timestamp is Rakuten's governed discovery/change signal, not a content hash. It remains distinct from the Product Catalog `HDR` timestamp inside a downloaded file; diagnostic comparison does not require equality.

This metadata prepares—but does not activate—the future sequence of inspecting the selected delta timestamp, comparing it with a separately governed last-successful checkpoint, skipping an unchanged delta, or downloading and validating a changed delta. No durable last-processed repository or production skip/download policy is introduced. Routine changed-delta processing must not replace separately governed periodic full-catalog reconciliation.

Safe exact SFTP codes survive redaction whether supplied as an error code or as the complete error message. `SFTP_FILE_NOT_FOUND`, `SFTP_FILE_AMBIGUOUS`, and `SFTP_LIST_FAILED` therefore remain primary. Unknown or unsafe raw exceptions become `SFTP_OPERATION_FAILED`. RAKUTEN-SFTP-005 connection accounting remains attached to both success and failure output and cleanup cannot replace the primary error.

## Isolation

Inspection output exposes the selected delta's filename, family, MID, SID, normalized UTC remote timestamp, and informational byte size without downloading it.

This correction changes no download authorization, root directory, connection limit, retry rule, current display, public artifact, Atlas record, retailer destination, Mercury history, affiliate route, acquisition portfolio, or production checkpoint. External operations and SFTP connections were zero; actual spend was `$0.000`.
