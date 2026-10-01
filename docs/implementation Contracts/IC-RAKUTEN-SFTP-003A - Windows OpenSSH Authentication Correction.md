# IC-RAKUTEN-SFTP-003A — Windows OpenSSH Authentication Correction

## Status

Implemented and fixture-certified. A live retry remains an explicit operator action and was not performed by this increment.

## Boundary

RAKUTEN-SFTP-003A corrects only the Windows OpenSSH authentication launch boundary used by `RakutenProductCatalogSftpTransport`. It does not change feed selection, download validation, current-display policy, rights, publication, historical retention, or acquisition authority.

## Decision

Windows OpenSSH `SSH_ASKPASS` must name a native executable. The prior `.cmd` helper could run through a command shell but was not a deterministic executable subprocess target; direct process invocation reproduced the failure locally. The operator CLI now builds a minimal ignored local executable under `.forge-review/rakuten-sftp/askpass` from repository-owned C# source text. The helper reads `RAKUTEN_SFTP_PASSWORD` only from its inherited environment and writes it only to the requesting OpenSSH process. The password is never placed in argv, a URI, a file, output, serialized configuration, or repository state.

The runtime resolves Windows OpenSSH from `%SystemRoot%/System32/OpenSSH`, validates both `ssh.exe` and `sftp.exe`, validates the askpass executable, preserves the inherited environment, and sets `SSH_ASKPASS_REQUIRE=force` plus a non-empty `DISPLAY`. Password and keyboard-interactive authentication remain enabled explicitly; public-key probing is disabled for this password-governed boundary and only one password prompt is allowed.

Host verification remains fail closed. The isolated ignored `known_hosts` parent is created before connection, `StrictHostKeyChecking=accept-new` remains gated by `TRUST-RAKUTEN-HOST-ON-FIRST-USE`, and a changed host key is never accepted.

## Failure classification

Configuration absence remains `SFTP_CONFIG_MISSING` before connection. Missing executables report `SFTP_SSH_EXECUTABLE_MISSING` or `SFTP_SFTP_EXECUTABLE_MISSING`. Sanitized OpenSSH diagnostics distinguish `SFTP_AUTH_FAILED`, `SFTP_HOST_VERIFICATION_FAILED`, `SFTP_CONNECT_TIMEOUT`, `SFTP_CONNECT_REFUSED`, `SFTP_DNS_FAILED`, `SFTP_SESSION_START_FAILED`, and the residual `SFTP_CONNECT_FAILED`. Raw stderr and secrets are not returned.

## Safety

This increment performed no SFTP retry, feed download, provider mutation, current-display mutation, historical mutation, deployment, or paid operation. Actual spend was `$0.000`.
