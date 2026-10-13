# IC-NEWEGG-ROUTINE-SOURCE-STAGE-OWNERS-P1A

Status: production owner interfaces and retained-evidence certification complete; final routine command and scheduling remain OFF.

## Ownership

`RakutenProductCatalogSftpTransport` remains the sole live acquisition and transport owner. `validateRakutenProductCatalogGzip` remains the feed integrity owner. `RakutenDiskBoundedCatalogStateProjection` remains the source-local catalog-state owner. The routine adapters add no acquisition, parsing, lineage, or catalog policy.

`FileNeweggSourceStageReceiptRepository` stores digest-addressed operational receipts using same-directory atomic replacement. A receipt is never sufficient by itself: acquisition and validation recovery revalidate the finalized FULL bytes, SHA-256, HDR and trailer; catalog recovery revalidates the current catalog state, state digest and originating artifact digest.

## Modes and authority

Production acquisition invokes the established transport only after the factory receives explicit live-acquisition authority. Retained-evidence certification accepts a caller-bound immutable local FULL and performs zero network operations. Validation and catalog reconstruction create no Current, History, publication, release, or deployment authority.

## Factory composition

`bindProductionNeweggRoutineSourceOwners` binds `ACQUISITION`, `VALIDATION`, and `CATALOG` to concrete owners. Exact completion replays; missing evidence executes; corrupt, partial, or conflicting evidence fails closed. Existing CLIs remain compatible and continue to use the same underlying transport, parser, and projector.
