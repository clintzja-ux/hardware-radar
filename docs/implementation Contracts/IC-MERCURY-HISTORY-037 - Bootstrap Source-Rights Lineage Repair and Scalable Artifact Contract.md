# IC-MERCURY-HISTORY-037 — Bootstrap Source-Rights Lineage Repair and Scalable Artifact Contract

## Status

PARTIAL — artifact provenance boundary certified; final H022–H034 propagation and production command composition remain unavailable.

## Decision

The original H019 acquisition portfolio cannot be resolved from durable repository state. The immutable H019 artifact `mer_histbootstrap_71c280422c057da3b248a43b` therefore remains readable but is explicitly `EXECUTION_INELIGIBLE_MISSING_ORIGINATING_RIGHTS_LINEAGE`. It is never rewritten, revived, or supplemented from current rights.

A successor bootstrap artifact uses schema `1.1` and policy `MERCURY-HISTORY-037-1.0`. It must bind the originating portfolio cycle and binding digest, the exact originating `sourceRightsProfileDigest`, and an optional predecessor artifact ID. Preparation rejects any mismatch between the supplied rights profile and the portfolio-bound digest. The successor receives a new content-derived artifact identity; the predecessor remains immutable audit history.

## Invariants

- Originating rights provenance and current executable rights are separate checks. A valid originating digest cannot override later revocation.
- H019 artifacts remain validator-readable but cannot create a new H022 checkpoint.
- H037 artifacts are content-bound, immutable, deterministic, and product-generic.
- Missing, malformed, substituted, or ambiguous portfolio/rights lineage fails closed.
- Durable PRODUCTS reviews require a nonblank source-rights digest; omission cannot create review or direct-SELLERS authority.
- Certification applies to lifecycle invariants and supported semantic classes, not individual Atlas products.
- No artifact, checkpoint, or review grants Current Price, Cheapest, Pick, publication, or affiliate authority.

## Scope boundary

This increment does not reconstruct the unavailable original portfolio, mutate the H019 artifact, create a real successor artifact, expose lifecycle commands, run Stage A, or call a provider. Final propagation of the digest through continuation, PREPARE, canonical result, progression, and PRODUCTS-review composition remains required before production command readiness.

## Safety

DataForSEO tasks and retrievals: zero. Rakuten and other provider operations: zero. Production mutation: none. Spend: `$0.000`.
