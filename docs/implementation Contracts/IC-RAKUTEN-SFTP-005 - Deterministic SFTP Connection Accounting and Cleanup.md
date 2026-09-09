# IC-RAKUTEN-SFTP-005 — Deterministic SFTP Connection Accounting and Cleanup

## Status

Implemented and fixture-certified. No live Rakuten connection or feed download was performed by this increment.

## Ownership and connection policy

`RakutenProductCatalogSftpTransport` remains Mercury's file-transport owner and `NativeSftpSession` remains the native `ssh2` session boundary. A compact transport-owned `RakutenSftpConnectionAccounting` records local lifecycle state for one operator operation. It is not a general metrics service and does not represent Rakuten's server-side session count.

Rakuten permits no more than five concurrent publisher SFTP connections. Hardware Radar uses one connection by default and treats five strictly as an external safety ceiling, not a target. Routine operations reject a new connection while another locally tracked Rakuten connection is active; an attempted sixth connection is rejected before `ssh2` starts it. Mercury processing concurrency is independent of SFTP connection concurrency and cannot create one remote connection per product, destination, or worker.

One reusable connection performs authentication, obtains one SFTP subsystem, lists/stats/selects, optionally downloads authorized files sequentially, and then closes. Automatic live retries are zero. Any later retry requires a new operator decision and must remain bounded, sequential, backoff-controlled, and cleanup-aware.

## Accounting semantics

The operation report contains only secret-free local counters:

- `connectionsOpened`: SSH connection attempts reserved immediately before `client.connect()` starts;
- `connectionsReady`: sessions that reached the authenticated `ssh2` ready event;
- `connectionsClosedGracefully`: owned sessions whose SFTP subsystem and SSH client were ended and whose close/end event was observed;
- `connectionsDestroyedAsFallback`: owned sessions force-destroyed after graceful cleanup failed or timed out;
- `connectionsFailedBeforeReady`: allocated attempts cleaned up before reaching ready;
- `cleanupAttempts` and `cleanupFailures`: effective cleanup lifecycle and fallback failure counts;
- `activeConnectionsAtStart` and `activeConnectionsAtEnd`: locally tracked owned sessions at operation boundaries;
- `peakLocalConcurrentConnections`: maximum locally tracked sessions during the operation.

`activeConnectionsAtEnd = 0` means Hardware Radar retains no locally active connection. It does not prove that Rakuten reports zero server-side sessions.

## Cleanup and failure behavior

Every allocated connection enters the same idempotent cleanup path after success, authentication or host-verification failure, SFTP-subsystem failure, list/stat/select/download/integrity failure, timeout, cancellation, exception, or early return. Cleanup ends the SFTP subsystem where available, calls `client.end()`, and waits for the SSH close/end event. A dedicated two-second timeout bounds cleanup without reusing a longer network/download timeout. If graceful completion is not observed, the client is destroyed once and fallback accounting is recorded. Repeated cleanup calls return the same completed result; active accounting cannot become negative.

Local feed parsing and integrity validation occur after the remote session is closed. Cleanup diagnostics never replace the primary operation error: for example, a list failure remains `SFTP_LIST_FAILED` even if cleanup requires forced destruction. SFTP status 4 remains a generic server failure and is not classified as connection-limit exhaustion without explicit provider evidence.

## Operator safety

Safe success and failure output includes connection accounting but never username, password, credential URI, environment values, or host-key material. After an abnormal timeout, session/server failure, or forced destroy, the operator must stop and decide when to retry rather than immediately repeating live attempts. WinSCP and the Hardware Radar transport must not use the Rakuten publisher account concurrently; this is an operator rule, not automated process detection.

This increment changes no current-display snapshot, public projection, Atlas record, retailer destination, Mercury history, affiliate route, acquisition portfolio, or remote path semantics. Provider operations and SFTP connections were zero; actual spend was `$0.000`.
