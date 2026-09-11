# IC-MERCURY-HISTORY-019 — Atlas Historical Bootstrap Preparation

## Status

Fixture-certified zero-spend PREPARE boundary.

## Ownership

`HistoricalBootstrapPreparation` is a pure composition over the existing Atlas product repository, `AcquisitionPortfolioPrepareService`, `GovernedProviderIdentityResolver`, DataForSEO source-rights profile, retained-evidence repository, immutable historical repository, and effective `RetailerDestination` records. It creates neither a queue nor a scheduler and owns no provider execution or historical persistence.

The generated artifact is a review projection only. Its authorization state is `NOT_AUTHORIZED`; it grants no provider spend, acquisition, retention, historical admission, canonical, review, E2S, publication, Current Price, Cheapest, Pick, destination, or affiliate authority.

## Deterministic first cohort

At an explicit `asOf`, candidates must be Atlas `ACTIVE/READY`, have an effective retailer destination, have no existing historical observation, and have a currently available acquisition-portfolio path without provider-identity review. Products are classified from Atlas-owned `memoryType` and `formFactor`, never their display title. Candidates are sorted by Atlas product ID, then the first eligible product is selected for each of:

1. `DDR5_DIMM`
2. `DDR4_DIMM`
3. `SODIMM`

The prepared cohort is bound immutably to the source acquisition-portfolio cycle/digest, source-rights profile, product identity/specification, destinations, history/evidence counts, task paths, policy version, explicit time, stop conditions, and spend envelope.

## Provider work and cost

Existing governed provider identity is reused when available, producing a SELLERS-first path. An absent identity uses the existing acquisition path: PRODUCTS, conditional PRODUCT_INFO escalation when PRODUCTS cannot certify strong unique identity, then SELLERS. Existing completed result retrieval is considered before new paid work; the certified first cohort has no reusable result.

DataForSEO's existing ceilings remain authoritative: `$0.001` per paid task and `$0.010` per UTC day. The artifact records the exact maximum task count and spend; it does not authorize either. Automatic paid retries remain zero.

## Future sequential execution

Future execution must process one product at a time through existing task-specific PREPARE/authorization/EXECUTE owners. Per-product failure remains visible and does not silently authorize the next task. Whole-cohort processing stops when the governing portfolio owner requires it or when budget, rights, binding, or repository integrity can no longer be established. No batch EXECUTE command is introduced by this increment.

After retrieval, DF003 retention, identity and E2G/E2H promotion, `MERCURY-HISTORY-018-1.0` comparability, and E2J admission all remain mandatory. `BUNDLE`, `CONDITIONAL`, and `UNKNOWN_COMPARABILITY` stop before historical persistence. Exact retained/admitted replay may report `DUPLICATE` and never creates a second observation.

First admission is `INITIAL_BOOTSTRAP`; no permanent cadence is invented. Once history exists, existing E2O cadence governance owns later refresh eligibility.

## Staged scale-up

Only Stage A—three products—is prepared. A successful, reviewed Stage A may support separate authorization for Stage B (up to ten products), then one category, then remaining eligible Atlas coverage. Each stage requires observed cost/data-quality review and new operator authority. Progress is measured as products with history divided by currently eligible Atlas products, with blockers retained explicitly; immediate 103-product acquisition is not a success criterion.

## Safety

PREPARE performs no provider retrieval or task creation and spends `$0.000`. The artifact contains no raw provider payload or secret. Existing history, retained evidence, Atlas, destinations, canonical/review/publication state, Current Display, public artifacts, and affiliate state remain unchanged.
