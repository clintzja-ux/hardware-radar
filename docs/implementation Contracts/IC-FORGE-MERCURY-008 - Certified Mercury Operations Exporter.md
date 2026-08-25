# IC-FORGE-MERCURY-008 — Certified Mercury Operations Exporter

Status: IMPLEMENTED — OPERATOR CERTIFIED

## Purpose

Materialize the FM007 `CERTIFIED_MERCURY_OPERATIONS_PROJECTION` from current certified Atlas/Mercury state for local Forge consumption. FM008 is an integration/export boundary only; it adds no business or publication policy.

## Owner boundaries and source loading

The exporter loads canonical product and retailer identity through Atlas repositories; retained evidence, historical observations, identity decisions/remediations, canonical observations, effective review/publication decisions, and cadence policy through their Mercury repositories; identity semantics through E2I; promotion semantics through E2G/E2H; and portfolio/cycle semantics through `HistoricalObservationPortfolio`. Operational refresh envelopes use the established local CLI context-loading convention only where no aggregate repository API exists.

Each owner is snapshotted once before derivation. FM008 does not read raw persistence when an owning repository API exists and does not select effective durable decisions itself.

Refresh identity reuse is normalized through `resolveGovernedHistoricalRefreshContext`, which delegates applicable reuse to the existing historical-admission governance owner. The same governed refresh envelope is consumed by `HistoricalObservationPortfolio` and FM008; raw refresh-result identity values cannot bypass or replace the Atlas-bound assessment.

## Artifact and command

The explicit local command is:

```text
npm run forge:mercury:operations:export -- --as-of=<ISO_TIMESTAMP>
```

The default artifact is `.forge-review/forge/certified-mercury-operations.json`. It is an internal operational artifact, is not committed under `public/`, and is selected through the existing FM007 Forge file input. The artifact is exactly FM007 schema version `1.0`; there is no wrapper containing operational authorizations, raw provider payloads, credentials, private recipients/senders, or secret digests.

## `asOf` and determinism

`--as-of` is mandatory. The exporter performs no ambient `Date.now()` business evaluation. Identical owner state plus identical `asOf` produces byte-equivalent formatted JSON, independent of input ordering, locale, or timezone. Repository snapshots prevent mid-export rereads from producing a mixed view.

## Atomicity and failure behavior

The complete FM007 projection is validated and serialized before writing. Output uses a sibling temporary file followed by atomic rename. A failed write/rename removes the temporary file and preserves an existing artifact. Missing owners, malformed or conflicting source state, unsupported schemas, invalid context, invalid projection, and write failures fail closed; no partial certified artifact is emitted.

## Historical-price safeguards

FM008 preserves FM007 fields without convenience-price aliases: `valueSemantics=HISTORICAL_OBSERVATION`, `currentPrice=false`, `livePrice=false`, `publicPrice=false`, and `publicationAuthority=false`. Export does not grant canonical/publication eligibility or public price-history authority.

## Forge consumption

The FM007 panel consumes the generated JSON through its local file selector. Valid, empty, missing, and malformed artifacts retain existing safe rendering. The UI does not evaluate policy, and the legacy preview remains explicitly `Noncanonical`.

## Non-scope and external status

FM008 performs no acquisition, historical admission, Atlas/Mercury mutation, identity/promotion/review/publication decision, public-build state ingestion, Cloudflare operation, browser connection, deployment, email, credential access, or paid task. DF005-X is unchanged and fail closed. Network/provider operations: none. Actual spend: `$0.000`.

## Tests, validation, and exit criteria

Fixture-only exporter/service/CLI/panel coverage verifies successful and deterministic export, explicit time, owner use, source isolation, ordering, historical semantics, empty/malformed/conflicting/missing state, invalid projection/context, atomic write recovery, privacy, Forge consumption, legacy isolation, and zero-operation status. Exit requires focused FM007/FM008 coverage, Mercury and root suites, public build/verification, repository layout, diff validation, and privacy scan to pass.

## Certification evidence

At `asOf=2026-08-24T23:00:00Z`, the canonical portfolio and FM008 both produced cadence `NOT_DUE`, cycle `COMPLETE`, no cycle blockers, and next action `PREPARE_NEW_REFRESH`. Two independent exports were byte-identical with SHA-256 `32d0a29e35ebb101ac8d4f764a266b7912a3068c227968a2de6e559cb87d0f1a`; Forge loaded the artifact as `CERTIFIED READ-ONLY`. Governed source state was unchanged, network/provider operations were `NONE`, and actual spend was `$0.000`.
