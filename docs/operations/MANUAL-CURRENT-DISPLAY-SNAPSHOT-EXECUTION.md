# Manual current-display snapshot execution

Use this workflow only for an existing inspected `mer_manualpriceprep_*` record. PREPARE does not authorize current-state mutation.

## Workflow

1. Inspect the preparation and confirm its product, retailer, price, observation time, destination, rights, and non-authorities.
2. Authorize the exact preparation with `AUTHORIZE-MANUAL-CURRENT-DISPLAY`.
3. Inspect the returned authorization. Confirm the persisted predecessor price/state, proposed price, snapshot and offer fingerprints, expiry, and listed invalidation conditions.
4. Execute only that authorization with `EXECUTE-MANUAL-CURRENT-DISPLAY`.
5. Inspect the execution result and verify one target record changed, zero unrelated records changed, both preparation and authorization are consumed, and downstream authority remains none.

Authorization is valid for at most 15 minutes and does not reserve current state. Execution revalidates the 36-hour observation ceiling, source rights, destination, Atlas state, preparation digest, and predecessor snapshot. Any drift requires a new authorization against current state. For two retailers, authorize and execute the first, inspect it, then authorize the second against the resulting snapshot.

Amazon and Newegg advance independently, and either retailer may use a manual or automated governed source lane. Do not wait for both retailers, convert one source's provenance into another, or prefer manual, automated, affiliate, cheapest, or newest evidence generically. If a same-retailer offer from another source is already present and certified reconciliation cannot resolve the collision, stop at `CURRENT_SOURCE_CONFLICT_REVIEW_REQUIRED`; preserve both source records at their evidence owners and do not create an execution authorization.

This operation writes only ephemeral `CurrentDisplaySnapshot` state and its bounded execution audit. It never creates history, comparison/Cheapest, publication, artifact, release, deployment, provider work, or spend. Publication and release remain separate operator gates.
