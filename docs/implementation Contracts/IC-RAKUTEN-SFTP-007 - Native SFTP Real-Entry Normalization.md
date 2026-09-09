# IC-RAKUTEN-SFTP-007 — Native SFTP Real-Entry Normalization

## Status

Implemented and fixture-certified. No live Rakuten connection or download was performed by this increment.

## Observed boundary and diagnosis

Operator evidence from the preceding live inspection establishes successful SSH connection, host verification, authentication, `ssh2` ready state, SFTP subsystem creation, root-entry receipt, and graceful cleanup with no local leak. The operation then failed as `SFTP_LIST_ENTRY_INVALID`, isolating the defect to entry normalization rather than transport or path establishment.

The previous normalizer required every entry to have a finite nonnegative size and parseable timestamp. `ssh2` 1.17.0 documents `readdir` results as `{ filename, longname, attrs }`, with attributes optional. Its `Stats` type exposes `mode`, `size`, Unix `mtime`, and type methods derived from POSIX/SFTP mode bits. Consequently a harmless directory, special entry, symlink, or unrelated file without `mtime` could abort the entire listing. The prior safe output did not retain the offending raw entry, so its exact filename and missing field cannot be reconstructed; the exact implementation defect is the unconditional candidate-level metadata requirement applied to every entry.

## Entry normalization

The native session preserves method binding by calling `attrs.isDirectory()` and `attrs.isFile()` on the original object. When those methods are absent and an integer mode exists, the documented SFTP/POSIX `S_IFMT`, `S_IFDIR`, and `S_IFREG` bits provide the fallback. Type is never inferred from filename or extension.

Normalized types are:

- `DIRECTORY` for an explicitly identified directory;
- `REGULAR_FILE` for an explicitly identified regular file;
- `OTHER` for a symlink, special node, unknown mode, or safely absent optional attributes;
- `SPECIAL_IGNORED` for `.` and `..`.

Directories, `OTHER`, dot entries, unrelated safe files, and templates are valid non-candidates and do not abort discovery. A missing/non-string filename, unsafe path-bearing filename, invalid attribute structure, invalid size when supplied, or recognized regular Product Catalog file without a usable timestamp remains malformed and fails closed as `SFTP_LIST_ENTRY_INVALID`.

Only a safely normalized `REGULAR_FILE` at logical root matching `44583_<numeric SID>_mp_delta.txt.gz` may qualify. A directory, symlink, or `OTHER` entry with an identical-looking name remains ineligible. Root semantics from RAKUTEN-SFTP-006 are unchanged.

## Timestamp and diagnostics

Recognized regular feed files continue preserving raw SFTP `mtime`, normalized UTC time, and separate downloaded-feed `HDR` time. Missing timestamps on directories and other non-feed entries remain null and grant no candidate status. Unix epoch zero is valid when supplied by `ssh2`.

Safe inspection diagnostics now include total entries, regular files, directories, other entries, ignored special entries, malformed entries, recognized feed files, and main-delta candidates. Only recognized Product Catalog names and expected root directory names may be rendered. Specific SFTP errors and RAKUTEN-SFTP-005 connection accounting remain attached without exposing raw server internals or credentials.

## Isolation

No remote path, download policy, connection policy, current display, public winner, Atlas record, retailer destination, Mercury history, affiliate route, acquisition portfolio, or Current Price authority changed. External operations and SFTP connections were zero; spend was `$0.000`.
