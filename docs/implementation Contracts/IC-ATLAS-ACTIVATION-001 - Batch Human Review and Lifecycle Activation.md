# ATLAS-ACTIVATION-001 — Batch Human Review and Lifecycle Activation

**Status:** Implemented; production batch review completed locally
**Owner:** Atlas product lifecycle governance
**Policy:** `ATLAS-ACTIVATION-001-1.0`

## Boundary

Atlas owns the human-reviewed transition of the 77 records admitted by `ATLAS-RAM-EXPANSION-002` from repository-native `DRAFT/PENDING` to `ACTIVE/READY`. The authorized set is derived only from canonical products whose immutable creation marker is `system:atlas-ram-expansion-002`; unrelated draft products are excluded.

Each candidate must remain canonical, use a registered brand, retain a non-empty manufacturer part number, have engineering validation `PASS`, satisfy the capacity invariant, validate under the Atlas schema, and remain in the exact review-eligible lifecycle. Failures are isolated per product. A deterministic batch audit record identifies the policy, operator, timestamp, reason, prior/resulting revisions, per-product outcome, and blockers. Successful records increment their revision and preserve all specification and provenance facts.

## Authority separation

`ACTIVE/READY` means the canonical product may participate in ordinary Hardware Radar flows. It does not grant provider acquisition, retained evidence, history, canonical observation, review, publication, Current Price, delivered-cost Cheapest, Pick, recommendation, retailer, rights, or affiliate authority.

A prepared Mercury acquisition portfolio is an immutable operational artifact bound to its PREPARE-time Atlas inventory and eligible membership. Later Atlas lifecycle changes may be reported as `ATLAS_DRIFT_SINCE_PREPARE`, but they do not add products, tasks, spend, or authority to that portfolio. Newly eligible products require a future independent portfolio PREPARE.

## Retail and display consequence

The increment may reassess only the already-researched RETAIL-DISPLAY-001/002 Amazon and Newegg rows. Exact product-page destinations that were blocked solely by Atlas lifecycle may enter the existing `RetailerDestination` boundary. Search URLs and other blockers remain excluded. Existing ephemeral offers may then expose a qualifying current item price where exact destination, condition, and availability requirements pass. Unknown shipping and fees remain null and block formal delivered-cost Cheapest.

No provider or retailer request, paid task, historical observation, canonical observation, publication decision, or deployment is part of this increment. Actual spend is `$0.000`.
