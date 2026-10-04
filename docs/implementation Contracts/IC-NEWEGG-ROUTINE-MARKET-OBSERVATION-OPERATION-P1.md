# IC-NEWEGG-ROUTINE-MARKET-OBSERVATION-OPERATION-P1

## Status

Implemented and production-shaped certified on 2026-10-03. The operation remains operator-triggered; external scheduling and Forge controls are not part of this increment.

## Boundary

One governed Newegg routine observation acquires one authoritative Rakuten main FULL, validates and materializes it with the existing disk-bounded catalog owner, then independently prepares and executes qualified Mercury Current and Mercury History mutations through their existing canonical owners. The routine introduces no new canonical subsystem owner and grants no publication, release, deployment, affiliate-maintenance, or provider-history authority.

Current and History retain independent qualification. A source record may qualify for both, either, or neither. FULL absence never creates false freshness or an invented out-of-stock observation. Seller identity is not manufactured. The approximately 24-hour target cadence and 36-hour Current TTL remain unchanged. Weekly affiliate maintenance remains separate.

## Deterministic recovery

Routine identity binds the source family, immutable FULL digest and HDR, source Current and History state, rights profile, and routine version. Ordered stage receipts permit restart at the first incomplete stage. Each canonical execution remains independently idempotent, so a completed Current or History stage is replay-safe if the other stage fails. Immutable provider input and the canonical Current/History repositories remain the authorities; the routine is orchestration only.

## Certified production-shaped observation

- Routine: `mer_neweggroutine_fa43166b12c714c0b9edc7ef`
- Rakuten FULL SHA-256: `db7c3da3d4e6ba7316511a4b549bb855834fce9303f84e16274273e8bb2edb6c`
- Validated HDR: `2026-10-03T18:57:54Z`
- Physical rows / reconstructed SKUs: `1,066,327 / 1,066,327`
- Current: plan `mer_rakutenfullrefresh_5832ec2dd319d38d76947eb4`, preparation `mer_rakutenfullprep_9d7f14a9746e4225ddb053ed`, snapshot `mer_display_627b7b4e35b9854d9d72d41b`; 57 refreshed, 132 unchanged, zero exceptions.
- History: plan `mer_rethistplan_6d00c99c6af2c2c4fefafee6`, preparation `mer_rethistprep_fdebe8ab9cf5064767226b55`; 156 admitted across 84 products, one comparability-blocked row, 59 Sale Price and 97 Retail Price observations.
- Qualification matrix: 57 both Current and History, zero Current-only, 99 History-only, one neither.
- Exact replay: both canonical stages returned `ALREADY_EXECUTED`; no duplicate Current or History mutation occurred.
- SFTP: one leased session, peak concurrency one, sequential download, zero retry, deterministic clean close.
- External paid work/spend: `0 / $0.000`.

## Release isolation

Zero-authority recomposition produced candidate `mer_ramreleasecand_d326fb8aa4ec2bfbfbc83fc4`, artifact `mer_ramreleaseart_d326fb8aa4ec2bfbfbc83fc4`, and Sentinel certification `sent_ramreleasecert_2fff6932c5e5c794835d4f04`. The complete isolated `PRODUCTION` replacement lifecycle passed while replacement state remained active. The temporary release authority and generated drift were removed afterward. No persistent production release authority, merge, or deployment was created.

## Next boundary

The routine is a suitable certified basis for scheduled daily Newegg operation. The next bounded increment is `NEWEGG_ROUTINE_MARKET_OBSERVATION_SCHEDULING_AND_FORGE_P1`: schedule the existing routine at approximately 24 hours, expose run health and governed exceptions in Forge, retain fail-closed and explicit human-review boundaries, and keep weekly affiliate maintenance independent. It must not redesign the acquisition or canonical data path.
