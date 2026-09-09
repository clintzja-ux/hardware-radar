# IC-RAKUTEN-SFTP-009 — Bounded Transfer Progress and Partial Cleanup

## Status and scope

RAKUTEN-SFTP-009 fixture-certifies the offline binary-transfer lifecycle beneath the existing Rakuten Product Catalog SFTP discovery boundary. It adds no adapter execution, current-display authority, production scheduling, historical retention, affiliate routing, provider task, or deployment authority. Certification performs no SFTP connection or download.

The motivating live observation was an incomplete transfer of `44583_4746097_mp_delta.txt.gz`: the selected remote entry reported 3,598,708 informational bytes and the abandoned local `.partial-*` file reached 3,535,822 bytes without a completion callback, parser validation, or atomic rename. Proximity to the reported size is not success. The real partial remains operator-held diagnostic evidence and is not read, renamed, or deleted by this increment.

## Transfer completion and progress

`ssh2` 1.17.0 `fastGet` completion is authoritative only through its final callback. Its `step(total, chunk, fileSize)` callback updates secret-free progress but never completes the operation. The transfer tracks:

- bytes transferred;
- reported remote bytes, informational only;
- transfer start and last-progress instants;
- increasing progress-event count;
- optional bounded percentage estimate;
- whether the completion callback was observed.

Duplicate completion callbacks and non-increasing progress reports are ignored after the first effective settlement. Remote size is never an integrity or completion predicate.

## Bounded failure policy

The default no-progress interval is 60 seconds. Any transfer with no increase in byte count for that interval fails as `SFTP_DOWNLOAD_STALLED`. A separate 15-minute absolute backstop fails as `SFTP_DOWNLOAD_TIMEOUT`, even if small progress continues. These limits measure absence of progress and total wall time respectively; there is no throughput threshold.

An abort signal fails as `SFTP_DOWNLOAD_CANCELLED`. Premature SSH or SFTP `close`/`end` fails as `SFTP_DOWNLOAD_SESSION_CLOSED`. Other transfer errors remain `SFTP_DOWNLOAD_FAILED`, while known local filesystem failures remain `SFTP_LOCAL_WRITE_FAILED`. The first failure remains primary; cleanup cannot replace it. No failure is retried automatically.

## Partial and connection lifecycle

Each attempt uses a uniquely named `<feed>.partial-<uuid>` beneath the existing ignored `.forge-review` staging root. Transfer error, stall, timeout, cancellation, early session close, local exception, or parser/integrity failure removes that exact attempt's partial. Nothing performs broad staging deletion.

After `fastGet` reports completion, Mercury closes the SFTP/SSH session before reading or parsing the local file. It then requires a nonempty local file, valid gzip, valid HDR, valid product rows, valid TRL, and exact trailer/product count before atomically renaming the partial to the final staged filename. The selected remote timestamp and parser HDR timestamp remain separate.

RAKUTEN-SFTP-005 connection accounting remains authoritative: one attempt opens at most one connection, the routine limit remains one, the external hard ceiling remains five, cleanup is idempotent, graceful close is bounded, forced destroy remains the fallback, and locally active connections must end at zero.

## Cancellation and crash limits

The operator CLI maps `SIGINT` and `SIGTERM` to the transfer abort signal. Graceful cancellation settles the pending transfer, closes the session, and removes the attempt partial. A hard process kill, operating-system crash, or power loss cannot guarantee application cleanup. Consequently:

- `.partial-*` files are never trusted as completed feeds;
- the read-only staging helper may report partial filename, size, modification time, and age;
- it never deletes a partial;
- a future bounded hygiene policy may address stale partial removal separately.

After implementation review, the operator may remove the known real orphan only by first confirming that no Hardware Radar transport process or local SFTP connection remains, resolving the exact staging path, and deleting that one literal `.partial-*` file. This increment does not perform that action.

## Isolation and downstream authority

RAKUTEN-SFTP-006–008 discovery, required-root, optional-directory, selection, and remote-timestamp semantics are unchanged. A successful staged and validated feed still does not invoke `RakutenNeweggProductFeedAdapter` or `CurrentRetailRefreshOrchestrator`, write `CurrentDisplaySnapshot`, mutate Atlas or retailer destinations, enter Mercury history, alter affiliate routing, publish, or spend money.

The successful result exposes filename, MID, SID, remote timestamp, informational remote size, transfer metrics, local digest, HDR timestamp, product/trailer counts, modification counts, and field counts for future separately governed change-detection policy. RAKUTEN-SFTP-009 does not implement checkpoint or skip behavior.
