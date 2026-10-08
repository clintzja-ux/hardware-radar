# IC-NEWEGG-ROUTINE-MARKET-OBSERVATION-SCHEDULING-AND-FORGE-P1

## Status

Implemented and fixture-certified. No unattended scheduler is active.

## Routine ownership and cadence

The existing certified Newegg routine remains the sole orchestration boundary. Scheduling readiness targets approximately 24 hours while preserving the existing 36-hour Current TTL and approximately 12-hour recovery margin. An active routine blocks another acquisition. Exact replay and partial Current/History completion resume through existing deterministic stage and canonical idempotency semantics. Automatic provider retries remain zero.

This increment creates no Current, History, acquisition, rights, publication, release, or affiliate owner. Scheduler activation requires a separate infrastructure/deployment authorization.

## Forge operations

The certified read-only Forge projection may include `NEWEGG_ROUTINE_OPERATIONS`: status, attempts, schedule, provider/FULL/HDR/catalog identity, coverage change, Current expiry, History additions/count/sequence, complete QA identity, recomposition/Sentinel readiness, calls/spend, bounded exceptions, and storage/pruning totals. It is explicitly read-only, has no network operation or mutation authority, and grants no downstream market or release authority.

Normal unchanged prices are not exceptions. Coverage change is displayed without inventing an automatic failure threshold. Daily operation does not trigger weekly affiliate revalidation.

## Retention and pruning

- Successful raw FULL target: approximately seven days.
- Materialized catalogs: current plus immediate predecessor.
- Incident/diagnostic artifacts: `HOLD_FOR_REVIEW`.
- Older artifacts become `SAFE_TO_PRUNE` only after validation, immutable lineage, normalized provenance, applicable Current and History persistence, restart/replay proof, complete QA, recomposition, Sentinel certification, and absence of unresolved source-dependent exceptions.
- P1 produces deterministic, operator-approved pruning plans only. Automatic deletion is false.

The 2026-10-04 deterministic plan `mer_neweggprune_cc76883aa853ff8403b47aa0` inventories four raw FULLs (631,905,899 bytes), one DELTA (6,093,159 bytes), one diagnostic partial (156,857,061 bytes), seven SQLite catalog states (7,370,264,576 bytes), two QA files (47,338 bytes), and 14 other operational files (666,854 bytes). Five superseded catalog states plus the no-longer-required DELTA total 5,265,144,167 bytes classified `SAFE_TO_PRUNE`; 2,743,833,659 bytes are retained and 156,857,061 bytes are held for review. Nothing was deleted.

## Scale readiness

The policy and projection use counts and repository data, not a 103-product constant. Fixtures cover 200 destination products and 150 represented products. Larger Atlas, destination, History, and QA populations remain data-driven; the existing disk-bounded catalog path avoids full-corpus memory ownership. No blocker was identified before 150–200 RAM products.
