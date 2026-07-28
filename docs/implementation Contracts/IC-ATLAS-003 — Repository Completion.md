# IC-ATLAS-003 — Repository Completion

## Status

Implemented for Sprint 8.

## Objective

Complete and standardize the Atlas repository layer without introducing cross-repository referential-integrity rules or legacy migration work.

## Scope

- Standardize the public repository contract across Brand, Product, Category, and Retailer repositories.
- Complete ProductRepository so it matches the mature repository capabilities already available elsewhere in Atlas.
- Add deterministic manifest validation for required collections, counts, identities, and paths.
- Expand the Atlas facade so consumers can access every canonical repository through one subsystem entry point.
- Preserve Forge, Sentinel, and Hardware Radar compatibility.

## Standard Repository Contract

Every first-class Atlas repository exposes:

- `getManifest()`
- `load()`
- `getAll()`
- `getById()`
- `exists()`
- `search()`
- `validate()`
- `reload()`
- `clearCache()`

Entity-specific lookup methods remain permitted.

## Deliverables

- ProductRepository API completion and case-insensitive identity lookup.
- Product lookup by slug and manufacturer part number.
- Product repository search, validation, caching, and reload support.
- ManifestValidator with collection, count, duplicate ID, and duplicate path checks.
- Atlas facade access for brands, categories, products, retailers, manifest validation, and repository loading.
- Repository contract, manifest, facade, and expanded product repository tests.

## Deferred

The following remain outside this contract and belong to later Atlas work:

- Product-to-brand and product-to-category referential integrity.
- Mercury observation-to-product and observation-to-retailer integrity.
- Legacy record migration and duplicate canonical-record cleanup.
- Repository-wide canonical identity verification.

## Acceptance Criteria

- Sentinel test suite passes.
- Atlas test suite passes.
- All four repositories satisfy the standard contract.
- Manifest counts match registered collections.
- Atlas facade loads all four canonical collections.
- Forge and the public Hardware Radar application remain operational.
