# IC-RAKUTEN-SFTP-003B — Windows SFTP Session Diagnostics

## Status

Implemented and fixture-certified. No live retry or feed download was performed.

## Correction

The 003A session retained sanitized stderr for classification but stopped feeding stderr into the interactive SFTP control buffer. Because OpenSSH control/session output may arrive on either stdout or stderr, an authenticated or partially established process could fail to satisfy the wrapper's `sftp>` handshake and fall through after 30 seconds to generic `SFTP_CONNECT_FAILED`. Empty or unmatched stderr, spawn failure, process termination, and pre-handshake exit also shared that generic fallback.

The session now consumes both stdout and stderr for control-prompt recognition while retaining stderr separately for safe classification. It records only non-secret process facts: spawn/exit/timeout stage, exit code, signal, whether streams opened, and whether askpass was invoked. The native askpass executable writes a content-free invocation marker under ignored `.forge-review`; it never writes the credential. The marker distinguishes `SFTP_ASKPASS_NOT_INVOKED` from a post-askpass process exit or handshake timeout.

Executable and helper validation fail closed as `SFTP_SSH_EXECUTABLE_MISSING`, `SFTP_SFTP_EXECUTABLE_MISSING`, `SFTP_ASKPASS_HELPER_MISSING`, `SFTP_ASKPASS_HELPER_INVALID`, `SFTP_ASKPASS_COMPILER_MISSING`, or `SFTP_ASKPASS_BUILD_FAILED`. Spawn, termination, exit, and handshake failures are separately classified. Recognized authentication, host-verification, DNS, refusal, timeout, and subsystem messages retain the 003A safe categories. Raw stderr and secrets are never exposed.

## Preserved security and scope

The transport still launches Windows `sftp.exe`, uses one interactive stdin pipe, forces native askpass, keeps the password out of argv and files, and retains `StrictHostKeyChecking=accept-new` with explicit operator trust acknowledgement and isolated `known_hosts`. Feed selection, staging, integrity validation, downstream authority, and connection limits are unchanged. Actual spend was `$0.000`.
