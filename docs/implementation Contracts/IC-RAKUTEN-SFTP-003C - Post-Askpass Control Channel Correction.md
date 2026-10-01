# IC-RAKUTEN-SFTP-003C — Post-Askpass Control Channel Correction

## Status

Implemented and fixture-certified. A live retry remains an explicit operator action and was not performed by this increment.

## Root cause

The Windows `sftp.exe` child receives a pipe as stdin. OpenSSH may suppress its interactive `sftp>` prompt when stdin is not a terminal, then wait normally for commands. The prior wrapper waited for that prompt before writing any command. The observed live state—process started, streams open, askpass invoked, no exit or signal, followed by `SFTP_HANDSHAKE_TIMEOUT`—is the resulting circular wait.

## Control-channel correction

Immediately after spawn, the wrapper now writes the harmless read-only `pwd` SFTP command. Authentication continues through native askpass; the command remains buffered on stdin until the SFTP subsystem is ready. The session becomes ready only after observing OpenSSH's `Remote working directory:` response. Each later operation is framed by appending another `pwd`, so listing and download completion no longer depend on an interactive prompt. The same single process and connection are reused.

Both stdout and stderr feed a bounded eight-megabyte rolling control buffer. Detection is chunk-independent and newline-independent, so banners, warnings, split tokens, and either output stream do not prevent readiness. The existing 30-second timeout remains unchanged because the defect was a control deadlock, not evidence of an insufficient duration.

The askpass marker now records a non-secret invocation count. Safe diagnostics retain process/stream state, askpass count, prompt observation, byte counts, probe send/response state, and timeout stage without exposing raw output, username, password, or connection target.

## Authentication and security

`BatchMode=no`, `PreferredAuthentications=password,keyboard-interactive`, one password-prompt limit, native askpass, strict host-key verification, isolated `known_hosts`, one default connection, and the five-connection maximum remain unchanged. A future diagnostic may distinguish multiple askpass invocations, but this increment does not infer whether Rakuten uses password or keyboard-interactive authentication.

No batch file is used: OpenSSH `-b` can change authentication behavior and is unnecessary once the piped control channel has deterministic command-response framing. No provider call, download, current-display mutation, or paid operation occurred. Actual spend was `$0.000`.
