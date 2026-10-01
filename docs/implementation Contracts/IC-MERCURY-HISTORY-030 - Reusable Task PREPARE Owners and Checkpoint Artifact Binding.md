# IC-MERCURY-HISTORY-030 — Reusable Task PREPARE Owners and Checkpoint Artifact Binding

## Status

`MERCURY_HISTORY_PREPARE_OWNERS_CERTIFIED`.

## Ownership correction

PRODUCTS, PRODUCT_INFO, and SELLERS zero-spend PREPARE composition is owned by reusable Mercury production owners. The existing standalone scripts are thin shells over those owners, so ordinary acquisition and future historical-bootstrap composition share one plan, proposal, spend, authorization-request, confirmation, and persistence path. Policy ownership did not move.

Ordinary calls carry no bootstrap metadata. A trusted internal call may carry exactly `paidActionIntentId`, `bootstrapCheckpointId`, and `bootstrapArtifactId`; unknown, incomplete, or malformed metadata fails closed. These fields bind Mercury governance records and are never sent in provider payloads. The generic CLIs reject all such arguments.

## Ordering and durable lineage

The certified ordering is continuation-first:

```text
artifact → checkpoint → continuation authorization / paidActionIntentId
         → task-specific PREPARE artifact and authorization request
         → checkpoint PREPARE_BOUND reference
```

Continuation creates the existing canonical intent without duplicating its algorithm. Trusted PREPARE then binds that intent. The append-only checkpoint event stores only operation, product/index, intent, continuation ID, PREPARE artifact/proposal ID, authorization-request ID, proposal digest, binding digest, preparation time, and source event sequence. It does not copy provider payloads, proposals, rights snapshots, products, or authorization bodies.

The projected state becomes `PREPARED_FOR_AUTHORIZATION`; provider execution remains unavailable until later Stage A composition validates the exact task authorization against this reference. This increment deliberately does not expose INIT, INSPECT, AUTHORIZE-NEXT, EXECUTE-NEXT, RETRIEVE, PROCESS, CANCEL, or a run-all command.

## Replay and invalidation

The same canonical inputs, timestamp, checkpoint stage, and intent deterministically reproduce the same PREPARE and reference. The checkpoint repository's event ID makes exact replay idempotent and conflicting replay fail closed. Product, operation, intent, checkpoint, artifact, proposal, authorization, or digest substitution fails closed. Advancing the checkpoint changes its event sequence, so an older PREPARE cannot authorize later state.

PREPARE is neither a rights lease nor a spend reservation. Execution must re-evaluate current rights and durable spend. Existing ordinary authorization records require no migration, and HISTORY-026 execution, HISTORY-027 retrieval, and HISTORY-028 local governance semantics remain unchanged.

## Isolation

Atlas remains canonical product owner. Mercury owns acquisition-governance artifacts and historical market knowledge. Fixture certification made no provider call or production mutation and created no Current Display, Current Price, Cheapest, Pick, review, publication, affiliate, or Rakuten authority. Actual spend was `$0.000`.
