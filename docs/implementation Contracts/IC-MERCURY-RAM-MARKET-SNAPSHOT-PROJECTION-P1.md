# IC-MERCURY-RAM-MARKET-SNAPSHOT-PROJECTION-P1

Status: IMPLEMENTED / FIXTURE-CERTIFIED / DEVELOPMENT ONLY

## Purpose

Create one immutable derived RAM market research projection titled **RAM Market Snapshot — September 30, 2026**. P1 supports only `POINT_IN_TIME_MARKET_SNAPSHOT`. It is not a monthly performance report, historical Current reconstruction, market index, forecast, or recommendation product.

## Ownership

- Atlas owns the canonical RAM catalog, product identity, specifications, and lens membership.
- Mercury Current owns the exact qualified current-market snapshot.
- Mercury effective History owns comparable historical observations, including append-only reassessment.
- `RamMarketSnapshotProjection` derives the frozen snapshot. It creates no canonical evidence, market database, runtime API, publication authority, or release authority.

The Terminal projection supplies certified calculation semantics but is recomputed from the snapshot's frozen canonical inputs. Neither the public Terminal artifact nor public chronological artifact becomes snapshot authority.

## Frozen inputs and identity

The frozen manifest binds snapshot type, `asOf`, methodology versions, Atlas catalog digest, exact Current snapshot ID/digest/observation time, qualified Current projection digest, History knowledge cutoff, exact History observation-ID/input digests, effective-comparability digest, and comparability-reassessment digest. `generatedAt` remains operational metadata and does not affect deterministic snapshot identity.

History must satisfy both `observationTime <= asOf` and `admittedAt <= historyKnowledgeCutoff`. Later-admitted evidence with an older observation time is excluded from replay. The projector consumes the already-effective comparability state frozen in its inputs; it does not reassess canonical History.

Identical frozen semantic inputs and methodology produce the same `mer_ramsnapshot_*` identity and semantic result. Current, Atlas, History, and reassessment digest mismatches fail closed.

## Public semantics

Current and History remain separate. Current metrics are qualified USD item-price facts from the exact bound Current snapshot. Historical Market Pulse compares latest and previous distinct-time standalone-comparable observations. “Latest at Hardware Radar-observed low” is bounded to comparable observations frozen for the snapshot and is not an all-time or internet-wide claim.

The existing five-current-product threshold controls median and aggregate range. Sparse cohorts are suppressed, not extrapolated. Source-private operational lineage, sellers, provider/task/evidence IDs, rights digests, operator identities, raw payloads, private URLs, and affiliate state are excluded.

## Correction doctrine

Published snapshot revisions are immutable. Late evidence, reassessment, methodology correction, or invalidated evidence must create an explicit successor revision or retraction; an old published result is never silently regenerated. P1 includes only schema fields needed for future revision, supersession, and retraction. It does not implement those operator workflows.

## Development route

The governed development-preview build creates exactly one route:

`/ram/market-snapshots/2026-09-30/`

It is marked `noindex, nofollow`, includes no fabricated publication date or structured `Article` data, and grants no publication, release, or deployment authority. An archive route is intentionally deferred until more than one substantive snapshot exists.

## Certification

Focused fixtures cover deterministic identity, `asOf` versus `generatedAt`, Atlas/Current/History/comparability binding, late-evidence exclusion, reassessment isolation, later-Current isolation, sparse suppression, public-field safety, and the production-shaped development preview. The first preview derives 103 tracked products, 40 currently priced products, 64 qualified Current offers, 329 comparable observations across 54 products, and 124 distinct product timestamp groups without hard-coded metric values.

Subsequent development-preview rebuilds validate and reuse the existing frozen snapshot artifact before clearing generated output. They do not recompute the September 30 snapshot from newer Current or History. First creation remains possible only when no frozen artifact exists and the original time/binding invariants pass. The P3 regression proves newer Current/History rebuilds Terminal, chronology, and product intelligence while the frozen snapshot remains byte-semantically identical.
