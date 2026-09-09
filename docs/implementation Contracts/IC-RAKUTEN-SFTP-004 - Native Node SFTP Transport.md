# IC-RAKUTEN-SFTP-004 — Native Node SFTP Transport

## Status

Implemented and fixture-certified. Ready for one operator-executed live inspection; no live Rakuten connection or feed download was performed by this increment.

## Replacement boundary

`RakutenProductCatalogSftpTransport` remains the Mercury-owned file transport boundary. RAKUTEN-SFTP-004 replaces only its Windows `sftp.exe`/SSH_ASKPASS/control-channel session with `NativeSftpSession`, implemented on pinned `ssh2` 1.17.0. The MIT-licensed dependency supports Node 24, native password authentication, host-key verification, one reusable SSH/SFTP connection, directory listing, metadata, and binary transfer without terminal emulation. The parser, Rakuten Newegg adapter, current-refresh orchestrator, current-display snapshot, public projection, rights, and ADR-060 remain unchanged.

## Credentials and connection

The external `RAKUTEN_SFTP_USERNAME` and `RAKUTEN_SFTP_PASSWORD` contract is unchanged. Credentials exist only in the in-memory `ssh2` connection options; they are never placed in argv, URLs, files, summaries, or repository state. Host, port, and connection-limit configuration remain external. One connection is the default and the first certification configuration; more than five fails closed. A single connection performs connect, list, exact selection, optional download, and disconnect.

## Host trust

The native trust reader consumes the isolated OpenSSH `.forge-review/rakuten-sftp/known_hosts` file directly. It supports literal and OpenSSH-hashed host tokens, validates the encoded host-key blob, and binds trusted keys to the configured host and port. During connection, the SHA-256 digest of the server-presented raw host key must equal one of those trusted values. Mismatch is `SFTP_HOST_VERIFICATION_FAILED`; there is no accept-all path.

When trust is absent, connection requires the existing `TRUST-RAKUTEN-HOST-ON-FIRST-USE` acknowledgement. The presented key may be accepted for that connection and is persisted atomically in OpenSSH format only after the SSH ready event. Existing trust is never replaced automatically. The previously trusted production file was parsed locally as one valid host-bound key; its content was neither printed nor rewritten.

## File and integrity semantics

The transport still lists only `/`, `/44583/`, `/ADDITIONAL/44583/`, and `/GLOBAL/`, then deterministically requires exactly one MID `44583` main `*_mp_delta.txt.gz` file. Full, template, delta-template, additional, global, and category feeds remain excluded. Remote path, filename, size, modification time, family, and MID are preserved.

Binary download uses the library SFTP fast-transfer operation into ignored `.forge-review/rakuten-sftp/staging` temporary state. Existing gzip, HDR, field-count, TRL, exact-count, and header-time validation runs before atomic rename. Partial files are removed. Transport and parser failures remain distinct, and no feed enters Git, public output, Atlas, Mercury history, current-display production state, or affiliate routing.

## Legacy disposition and safety

Production no longer imports or uses `OpenSshSftpSession`, `WindowsOpenSshAskpass`, `sftp.exe`, SSH_ASKPASS, prompt recognition, or `pwd` framing. The obsolete source modules are removed; ignored operator-local askpass artifacts and the trusted `known_hosts` file are left untouched. Historical 003A–003C contracts remain audit context only.

No live provider operation, current-display mutation, public-price mutation, Atlas or retailer mutation, history creation, affiliate action, deployment, or paid operation occurred. Actual spend was `$0.000`.
