# MERCURY-ACTIVATION-002 — Zero-Spend Portfolio PREPARE and Bounded Acquisition-Cycle Orchestration

**Status:** Implemented and fixture-certified
**Owner:** Mercury acquisition orchestration
**Authority:** `ACQUISITION_ORCHESTRATION_AUTHORITY`

## Purpose

Mercury can deterministically prepare and project a bounded DataForSEO acquisition program across the current Atlas acquisition-eligible RAM universe without calling a provider or granting task execution. The portfolio derives products directly from Atlas and includes only `ACTIVE` + `READY` records. All others remain explicitly excluded with their lifecycle and publication state.

The prepared portfolio binds the Atlas inventory, exact-MPN queries, DataForSEO source-rights profile, United States/English market, provider/source, endpoint family, per-product stage envelope, per-task ceiling, program ceiling, UTC-day capacity, and zero-retry rule. Its identifier and binding digest are deterministic for identical explicit input and repository state. The prepared artifact is immutable; later progress is a separate deterministic projection over append-only task events.

## Current certified fixture

The checked-in Atlas state contains 26 RAM products: 11 are acquisition eligible and 15 are excluded as `ATLAS_PRODUCT_NOT_ACTIVE_READY`. Existing governed provider-identity resolution marks two eligible products reusable, so they begin at `SELLERS`; nine begin at `PRODUCTS`.

The computed maximum envelope is nine `PRODUCTS`, nine `PRODUCT_INFO`, and eleven `SELLERS` tasks: 29 paid tasks at `$0.001` each, for a maximum program spend of `$0.029`. The existing `$0.010` UTC-day ceiling provides capacity for at most ten tasks per day and therefore at least three day-capacity envelopes. These are budget envelopes, not a blind schedule: Product Info and Sellers become available only after the preceding result is retrieved and independently validated.

## Progressive state

Each eligible product begins at `READY_FOR_PRODUCTS` or `READY_FOR_SELLERS`. Append-only events may project it through pending, result-dependent ready, review-required, no-result, failed, or acquisition-complete states. An invalid sequence, excluded product, conflicting replay, expired or mismatched task authorization, task-cost overrun, material artifact corruption, rights drift, or program/daily exhaustion fails closed. Exact event replay is idempotent. Failure affects only the bound product and never fabricates complete portfolio coverage. A failed paid task may report `RETRY_REQUIRES_OPERATOR_ACTION`; automatic paid retries remain zero.

The prepared product membership, task maximum, and spend ceiling are immutable PREPARE-time facts. Later Atlas lifecycle changes are informational `ATLAS_DRIFT_SINCE_PREPARE`; they never recompose or expand the stored portfolio. A future portfolio PREPARE may independently include newly eligible products.

## Authority separation

Portfolio acknowledgment is `PORTFOLIO_REVIEWED`; it accepts the scope and ceiling only. It is not provider-spend approval. Every paid task still requires its existing task-specific `PREPARE → explicit single-use authorization → EXECUTE` boundary. The portfolio may identify which task is eligible to prepare next, but contains no transport and cannot post or retrieve provider tasks.

The portfolio does not authorize result acceptance, retention, historical admission, canonical promotion, review, E2S qualification, publication, Current Price, Cheapest, Pick, or `RetailerDestination` admission. After Sellers retrieval it may project a provider `sourceUrl` as an independent destination candidate. Exact canonical URL coverage reports `ALREADY_COVERED`; a different URL reports `CANDIDATE_REVIEW_REQUIRED`; unresolved retailers require identity governance; invalid URLs are rejected. The market URL is never relabeled `destinationUrl`.

## Safety and persistence

PREPARE and operator projection expose no credentials or environment material and perform no network operation. Provider task IDs may appear only in append-only task progress where existing operator doctrine permits them. No second spend ledger or portfolio mutation repository is introduced: task-level execution ledgers remain authoritative for spend and task identity.

MERCURY-ACTIVATION-002 creates no production portfolio artifact, changes no Atlas lifecycle state, and performs no provider operation. Actual spend is `$0.000`.
