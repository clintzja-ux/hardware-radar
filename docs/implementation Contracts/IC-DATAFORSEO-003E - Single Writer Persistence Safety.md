# IC-DATAFORSEO-003E — Single-Writer Persistence Safety

**Status:** IMPLEMENTED

## Invariant

The current file-backed Mercury implementation has one writer at a time across the acquisition write boundary.

## Run contract

1. Acquire the file run lock using exclusive directory creation.
2. If another live owner exists, return `SKIPPED_LOCKED` and perform no acquisition writes.
3. Maintain a heartbeat while the run owns the lock.
4. Execute the governed acquisition cycle with one shared repository set.
5. Release only when the on-disk owner token still belongs to the current run.
6. Recover an orphaned lock only after its heartbeat exceeds the stale threshold.
7. Recover stale locks by atomically renaming them out of the active lock path before acquiring a replacement.

## Non-goals

This contract does not make individual JSON repositories safe for independent multi-writer use. It prevents that execution model from occurring. A future multi-worker Mercury implementation must use transaction-capable persistence.
