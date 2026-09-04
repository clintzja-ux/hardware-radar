# IC-MERCURY-SIMPLIFY-001 — Default Acquisition Path Simplification and Release Reconciliation

## Purpose

Make Mercury identity comparison follow one operational rule: **normalize representation differences; escalate material identity contradictions**. Atlas remains the canonical product and manufacturer owner. This increment performs no provider operation and grants no acquisition or downstream authority.

## Identity semantics

Manufacturer comparison deterministically ignores case, surrounding whitespace, conventional punctuation, and spacing. Actual naming aliases remain explicit Atlas brand data; product families such as Kingston FURY, FURY Beast, FURY Renegade, and ValueRAM are not manufacturer aliases. Manufacturer-part-number comparison is case-insensitive and trims surrounding whitespace, but preserves punctuation so distinct real part numbers cannot collapse. Missing provider fields remain `UNKNOWN`, never contradictions or manufactured matches.

For RAM, material evidence includes manufacturer, manufacturer part number, DDR generation, total capacity, module count, capacity per module, form factor, and speed or other attributes when they distinguish a real variant. A supplied conflict in those fields fails closed. Ordinary representation differences and explicit aliases canonicalize before comparison; no fuzzy semantic matching is introduced.

## Default and escalation routes

A single non-contradictory provider identity with exact manufacturer-part-number evidence establishes the desired normal route `READY_FOR_SELLERS`. Multiple materially compatible provider documents require the existing manual selection boundary. Missing or insufficient PRODUCTS identity evidence remains unresolved for identity review; Product Info is available only after the current safe-recommendation or governed-selection prerequisite is met. A material contradiction requires identity review. Existing equivalence, selection, Product Info, diagnostics, spend, retention, history, and publication safeguards remain intact.

The DataForSEO Sellers endpoint technically requires only one governed provider identifier. The currently certified Hardware Radar initial-acquisition chain does not yet support direct PRODUCTS → SELLERS execution: Sellers proposal creation, authorization, DF003 retention, governed initial-acquisition identity projection, historical admission composition, and E2P lineage all bind Product Info task/result validation. Therefore this increment records `DIRECT_SELLERS_LINEAGE_NOT_CERTIFIED` and keeps the executable route at `READY_FOR_PRODUCT_INFO`; it does not falsely project `READY_FOR_SELLERS` into the production checkpoint. A later bounded increment must generalize and certify that lineage end to end before Product Info can be skipped.

## Manufacturer intake

Before a new Atlas manufacturer is added, record its canonical public name, ordinary case/punctuation/spacing representations, evidence-backed corporate aliases, product families/series, and MPN conventions relevant to conservative normalization. This is Atlas data-modeling hygiene, not a new approval workflow. Aliases must not be invented from product-family wording.

## Safety

This increment is deterministic and non-mutating. Kingston remains `READY_FOR_SELLERS` through its already-certified 005G path; TEAMGROUP remains `PRODUCTS_PENDING`. No Sellers, Product Info, or provider task is executed. No paid authorization, retention, history, canonical observation, review, publication, Current Price, Cheapest, Pick, destination, affiliate, or public-page state changes. Incremental spend is `$0.000`; cumulative activation spend remains `$0.008`.
