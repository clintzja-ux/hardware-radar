# ADR-026 — Mercury File Persistence Is Single Writer

**Status:** ACCEPTED  
**Scope:** Mercury file-backed repositories and recurring acquisition execution

## Decision

While Mercury persists operational state in JSON files, exactly one acquisition execution context may write Mercury persistence at a time.

A filesystem-backed run lock is required before recurring acquisition enters any write path. Overlapping acquisition runs fail closed with `SKIPPED_LOCKED`; they do not wait indefinitely and they do not write concurrently.

The lock uses atomic directory creation for acquisition, an owner token, periodic heartbeat, owner-checked release, and atomic stale-lock quarantine/recovery. Stale recovery never grants the former owner authority to release a successor's lock.

## Rationale

Per-instance Promise queues serialize calls only inside one JavaScript object. They do not coordinate independent repository instances or separate Node processes targeting the same state file. Node's filesystem Promise APIs are not synchronized for concurrent modification of the same file.

Atomic temp-file replacement protects readers from partial JSON, but does not prevent lost updates when two writers read the same prior state and independently replace it.

## Consequences

- The first recurring DataForSEO acquisition worker must use one process and one shared repository set.
- Every acquisition cycle must acquire the global run lock before mutation.
- A locked cycle is suppressed rather than overlapped.
- Orphaned locks may be reclaimed only after the configured stale interval.
- A heartbeat keeps legitimately long-running cycles from being mistaken for stale work.
- Multi-writer Mercury requires migration to transaction-capable persistence; file-backed JSON is not the multi-worker solution.
