# ADR-063 — Historical Facts Precede Stronger Merchant and Comparability Authority

## Status

Accepted.

## Decision

Mercury admits an immutable historical fact once its Atlas product, factual market fields, provenance, acquisition lineage, and source rights are valid. Canonical retailer registration and standalone-offer comparability remain independent, stronger authorities. Their absence is recorded explicitly and prevents canonical, Current Price, Cheapest, Pick, recommendation, affiliate, and publication use; it no longer erases a valid historical fact.

The existing E2J service and historical repository remain the sole admission and persistence owners. Additive schema `1.1` preserves observed merchant identity, optional canonical retailer identity, comparability metadata, rights lineage, and exact unknown values. Existing schema `1.0` observations remain valid without migration.

## Consequences

Historical analytics may retain unresolved or non-standalone facts, but standalone price calculations must filter them. Retailer-dependent consumers fail closed until a current governed retailer projection exists. Observation identity remains evidence-derived and immutable; later identity decisions project authority without rewriting the original fact.
