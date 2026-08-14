# ADR-023 — External Product Identity Requires Atlas Resolution

Status: ACCEPTED

## Decision
External commerce/search identifiers are evidence, not canonical Hardware Radar product identity. DataForSEO Google Shopping products must be resolved against Atlas before their offers may become Mercury observations.

Resolution outcomes are `CONFIRMED`, `PROBABLE`, `AMBIGUOUS`, and `REJECTED`. Only `CONFIRMED` is automatically eligible to continue toward Mercury in the initial production policy.

Deterministic identifiers such as manufacturer part number, GTIN, UPC, or EAN have priority over descriptive text. Structured hardware attributes may support a probable match when deterministic identifiers are unavailable. Titles and descriptions are supporting evidence only and cannot override conflicting identifiers or structured attributes.

For RAM, the canonical Atlas invariant `capacityGb = moduleCount × capacityPerModuleGb` remains authoritative. Conflicting external evidence fails closed.

## Consequences
Product resolution is explainable and preserves its evidence. Ambiguous or probable results require review rather than silently becoming market observations. DataForSEO product IDs remain external identifiers and never replace Atlas product IDs.
