# IC-MERCURY-HISTORY-025 — Trusted Historical Bootstrap Lifecycle Composition

## Status

`MERCURY_HISTORY_TRUSTED_LIFECYCLE_PARTIAL`.

`HistoricalBootstrapLifecycleService` fixture-certifies the trusted service boundary for INIT, INSPECT, AUTHORIZE-NEXT, EXECUTE-NEXT, RETRIEVE, PROCESS, and CANCEL semantics. Production commands remain unexposed because the repository's operation-specific production PREPARE/retrieval/process owners are scripts rather than injectable service compositions; duplicating their request construction here would violate the increment.

## Trust boundary

External calls accept only durable IDs, operator attribution, reasons, and exact confirmations. The service rejects any extra property, including caller-supplied `paidActionIntentId`, product, operation, source, provider task, or spend override. Artifact, current product, operation, DataForSEO source, limits, and intent derive exclusively from validated artifact/checkpoint/continuation state.

The canonical lifecycle is INIT → INSPECT → AUTHORIZE-NEXT → EXECUTE-NEXT → RETRIEVE → PROCESS → INSPECT. No step invokes the next. EXECUTE-NEXT delegates at most one paid task through the HISTORY-023 handoff. RETRIEVE uses only the task derived from checkpoint state and leaves pending state unchanged. PROCESS runs governed identity for PRODUCTS/PRODUCT_INFO or local DF003/comparability/E2J processing after SELLERS; it never creates paid work. ADMITTED/DUPLICATE alone expose the next product's PRODUCTS readiness, still without authorization.

Exact checkpoint creation replay is deterministic. Crash recovery uses HISTORY-023/024 ledger-first intent lineage and existing DF003/E2J idempotency. Cancellation is durable and preserves all prior audit state. No run-all, resume-all, or execute-cohort behavior is permitted.

## Remaining composition seam

Production command exposure requires extracting or wrapping the existing PRODUCTS, PRODUCT_INFO, SELLERS, retrieval, and local-processing script composition as injectable owners without changing their policies or rebuilding provider requests. Until those owners are callable through the trusted lifecycle, exposing scripts would either duplicate production wiring or accept trusted metadata from the caller. The production Stage A checkpoint is not initialized.

Atlas remains canonical product-knowledge owner; Mercury owns orchestration and governed market history. No current/public, recommendation, affiliate, or Rakuten authority is created.
