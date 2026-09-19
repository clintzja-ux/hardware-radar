# IC-MANUAL-CURRENT-DISPLAY-SNAPSHOT-EXECUTION-COMPOSITION-P1

**Status:** IMPLEMENTED / FIXTURE-CERTIFIED
**Policy:** `MANUAL-CURRENT-DISPLAY-SNAPSHOT-EXECUTION-P1-1.0`

## Boundary

This increment composes the existing manual preparation, Atlas, retailer destination, source-rights, current-display eligibility, snapshot, and public-projection owners. It creates no new current-display subsystem or truth owner. A preparation remains a reviewed immutable fact, not mutation authority. One short-lived human authorization permits one attempt to replace or insert exactly one product-and-retailer offer against one exact predecessor snapshot and offer state.

Authorization binds the preparation ID/digest; product; retailer; source; current rights digest; destination/digest; predecessor snapshot ID/digest; predecessor offer state, full protected material, and fingerprint; a one-offer mutation ceiling; operator/reason; creation/expiry; single-use state; and explicit false history, comparison, Cheapest, Pick, publication, and release authorities. Authorization expires within 15 minutes and never extends the observation's 36-hour freshness window. Creating it neither reserves nor mutates current state and does not consume the preparation.

## Execution

Execution accepts only an authorization ID, execution operator, and explicit confirmation. It reloads and validates the exact preparation, current Atlas/retailer/destination/rights state, observation freshness, authorization expiry, and complete predecessor snapshot/offer binding. Missing legacy `sourceIdentity` is represented as an exact predecessor fact, never guessed or treated as permission to overwrite. Predecessor drift fails closed. Whole-snapshot compare-and-replace protects the simple sequence `authorize S0 → execute S1 → authorize S1 → execute S2`; an authorization against S0 cannot silently execute after another mutation.

The existing snapshot owner rotates `current` to `previous`. The resulting offer carries explicit manual source identity plus private preparation, authorization, rights, and destination lineage. Public projection sanitizes that lineage. Successful execution records one immutable consumption/result; replay returns the existing result without another snapshot mutation. Failed preconditions record no successful execution. Previous state remains operational recovery state and never becomes Mercury history.

## Operator surface

```text
npm run retail-current:manual:authorize -- --preparation-id=<id> --authorized-by=<operator> --reason=<reason> --confirm=AUTHORIZE-MANUAL-CURRENT-DISPLAY
npm run retail-current:manual:authorization:inspect -- --authorization-id=<id>
npm run retail-current:manual:execute -- --execution-authorization-id=<id> --executed-by=<operator> --confirm=EXECUTE-MANUAL-CURRENT-DISPLAY
npm run retail-current:manual:execution:inspect -- --authorization-id=<id>
```

Commands derive all price, product, retailer, source, destination, rights, and predecessor facts. They accept no arbitrary overrides. Authorization and execution inspection provide human-readable change, non-change, binding, invalidation, before/after, consumption, and authority summaries. The services remain suitable for a future Forge surface without changing ownership.

## Isolation and certification

Manual execution is local and provider-independent. It does not call Rakuten, Amazon APIs, DataForSEO, or any network. Affiliate routing remains downstream. Fixture certification covers Amazon and Newegg legacy predecessor replacement, missing-source preservation, predecessor absence, sequential execution and stale authorization rejection, freshness/rights/destination/Atlas/predecessor drift, unrelated-offer preservation, single-use replay, current/previous rotation, dual weak-offer projection, zero winners/comparison/history/publication/release, and failure isolation.

Hardware Radar remains a hybrid acquisition system. Manual and automated acquisition are independently governed source lanes that share the downstream current-offer contract without merging provenance. Amazon and Newegg may independently be manual, automated, current, stale, or absent. Neither acquisition mode receives generic precedence, and affiliate status, lowest price, or newest timestamp alone cannot select market truth. A same-retailer manual/automated collision without a certified reconciliation outcome preserves both evidence chains at their owners and enters `CURRENT_SOURCE_CONFLICT_REVIEW_REQUIRED`; it does not overwrite current state. Future automation therefore plugs into the existing snapshot and projection architecture rather than replacing a "manual snapshot" architecture.

Production-shaped fixtures certify manual/manual, manual/automated, automated/manual, and automated/automated Amazon/Newegg combinations; one-retailer current with the other stale or absent; and fail-closed same-retailer source conflict. Each accepted offer retains its own `sourceIdentity`. No provider work is required by these fixtures.

The two real preparations were assessed read-only only. No real authorization, execution, consumption, snapshot mutation, public artifact, publication, release, deployment, provider call, or spend occurred during this increment.
