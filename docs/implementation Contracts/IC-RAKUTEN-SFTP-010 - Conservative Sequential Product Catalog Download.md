# IC-RAKUTEN-SFTP-010 — Conservative Sequential Product Catalog Download

## Status and scope

RAKUTEN-SFTP-010 fixture-certifies a conservative sequential binary-transfer implementation beneath the existing Rakuten Product Catalog transport. It changes no connection, authentication, host-verification, discovery, path, selection, timestamp, parser, adapter, current-display, Atlas, retailer, history, affiliate, or publication owner.

Certification is offline. It performs no Rakuten connection, live download, provider operation, production mutation, or spend.

## Why Rakuten no longer uses `fastGet`

Two independent live attempts using `ssh2` 1.17.0 `fastGet` stopped at exactly 3,535,822 transferred bytes for a root delta whose listed size was 3,598,708 bytes. The certified RAKUTEN-SFTP-009 lifecycle correctly classified the later attempt as `SFTP_DOWNLOAD_STALLED`, closed its one connection gracefully, removed the attempt partial, and ended with zero active local connections.

That repeatable offset does not establish the precise provider or library cause. It is sufficient evidence to remove production reliance on the more highly pipelined `fastGet` helper for this Rakuten path. Routine delta files are modest, future full feeds may be much larger, and correctness is more important than maximum throughput.

## Sequential stream and backpressure

The established SFTP session now opens one `ssh2` `createReadStream` with a 32 KiB high-water mark and pipes it through Node's promise-based stream pipeline into an exclusive binary local write stream with the same high-water mark. Node stream backpressure controls remote reads when the local writer cannot accept more data. Bytes are never text-decoded, newline-normalized, decompressed, or accumulated into one in-memory transfer buffer.

The inspected ssh2 `ReadStream` issues its SFTP read through `_read` and advances only as Node requests additional data. RAKUTEN-SFTP-010 exposes no high-concurrency read configuration and opens no second SSH or SFTP session.

## Completion and size semantics

Transfer state distinguishes:

- `remoteEofObserved`: the remote readable emitted its successful `end` event;
- `localWriteFinished`: the local writable emitted `finish`;
- `completionObserved`: the pipeline resolved after both preceding events and without an error or cancellation.

All three conditions are required for transfer success. Session close before remote EOF is `SFTP_DOWNLOAD_SESSION_CLOSED`. Remote stream failure is `SFTP_DOWNLOAD_READ_FAILED`; local staging failure is `SFTP_LOCAL_WRITE_FAILED`.

The directory-reported remote size remains informational. Transfer diagnostics preserve actual bytes, reported bytes, percentage estimate, and `reportedSizeDifferenceBytes`. Clean remote EOF at a different byte count proceeds to gzip/HDR/product/TRL validation. Size difference alone is never `SFTP_SIZE_MISMATCH` and never establishes corruption or success.

## Bounds, cancellation, and settlement

Each binary data chunk that increases transferred bytes resets the established 60-second no-progress timer. Unrelated socket/session activity does not. The independent 15-minute absolute timeout remains unchanged. Slow throughput is permitted while byte progress continues.

`SIGINT` and `SIGTERM` abort the stream pipeline through the existing CLI signal boundary. Cancellation, stall, timeout, read failure, write failure, or premature session closure destroys the pending streams, settles the transfer exactly once, delegates connection release to RAKUTEN-SFTP-005, and removes only the attempt's UUID partial through the transport boundary. There is no automatic retry.

## Finalization and isolation

Successful stream completion does not finalize the feed. The transport closes SFTP/SSH first, then locally requires valid gzip, HDR, recognized product rows and field counts, terminal TRL, and an exact trailer/product count. Only then does it atomically rename the unique `.partial-<uuid>` path to the final staged filename.

Remote SFTP timestamp and HDR timestamp remain separate. The result retains both plus filename, MID, SID, integrity counts, digest, and transfer diagnostics for future separately governed change detection.

No successful transfer invokes `RakutenNeweggProductFeedAdapter`, `CurrentRetailRefreshOrchestrator`, or `CurrentDisplaySnapshot`; creates Mercury history; changes Atlas or retailer destinations; affects affiliate routing; or grants public-price authority.
