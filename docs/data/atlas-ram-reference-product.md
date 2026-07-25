# Atlas RAM Canonical Reference Product

**Document ID:** ATLAS-RAM-REFERENCE-PRODUCT  
**Version:** 1.0  
**Status:** Canonical  
**Owner:** Mirabelle Labs  
**Reference record:** `ram_corsair_cmk32gx5m2b6000z30`  
**Reference file:** `public/data/atlas/products/ram/ddr5/HR-RAM-DDR5-000001-corsair-vengeance-32gb-6000-cl30.json`

## 1. Purpose

This document defines the repository conventions demonstrated by the first canonical Atlas RAM product. Future RAM records should be specialized from this reference rather than copied from legacy prototype records.

The JSON Schema remains the machine-readable contract. This document explains the authoring and repository conventions that are not obvious from schema syntax alone.

## 2. Canonical top-level order

Every Atlas product must contain exactly these top-level sections in this order:

1. `identity`
2. `governance`
3. `provenance`
4. `validation`
5. `extension`

Hardware-specific facts belong only under `extension.data`. Retail prices, stock status, seller names, affiliate parameters and market observations belong to Mercury, not Atlas.

## 3. Identity conventions

### 3.1 Atlas product ID

`identity.atlasProductId` is the immutable machine identity. It uses lowercase snake case and is independent of filenames, retailers, URLs, prices and mutable product names.

Pattern:

```text
{product_type}_{brand}_{manufacturer_part_number_normalized}
```

Reference:

```text
ram_corsair_cmk32gx5m2b6000z30
```

### 3.2 Repository filename

The filename is a stable human-operational locator and is not the Atlas product ID.

Pattern:

```text
HR-RAM-{MEMORY_TYPE}-{SEQUENCE}-{brand}-{family}-{capacity}-{speed}-{primary_timing}.json
```

Reference:

```text
HR-RAM-DDR5-000001-corsair-vengeance-32gb-6000-cl30.json
```

Once committed, a filename should not change merely because marketing copy changes. A rename requires an explicit repository migration.

### 3.3 Slug

`identity.slug` is the canonical public-facing URL key. It must identify the exact variant and contain no retailer identifier.

Reference:

```text
corsair-vengeance-ddr5-32gb-6000-cl30-grey
```

### 3.4 Display name

Use a normalized product name rather than a retailer title.

Recommended pattern:

```text
{Brand} {Family} {Memory Type} {Total Capacity} ({Module Count}×{Capacity Per Module}) {Data Rate} MT/s CL{CAS}
```

## 4. Field ordering inside sections

Authors should preserve the ordering used by the reference product:

- identity metadata first, followed by commercial identity and human-readable identity;
- governance publication state first, followed by review, lifecycle and warranty data;
- provenance grouped by canonical field path;
- validation observations before validator metadata;
- extension envelope before RAM extension data;
- RAM data ordered as classification, capacity, performance, electrical, physical and compatibility.

Field order is not semantic JSON, but stable ordering improves review quality and diffs.

## 5. Null and unknown-value policy

Use `null` only for an optional value that is genuinely unknown or not verified.

Do not use placeholders such as:

- `N/A`
- `TBD`
- `?`
- `unspecified`
- free-text `unknown`

Use a canonical `UNKNOWN` enum only when the schema explicitly permits it. Do not infer rank, chip density, physical dimensions, country of origin, GTIN, UPC or EAN from related products.

Arrays should normally be present and empty when the schema models a known collection with no verified entries, such as `qvlReferences` or `lightingEcosystem`.

## 6. Provenance requirements

Every publishable field or coherent field group must have at least one source reference under `provenance.fieldSources`.

Source priority:

1. manufacturer datasheet;
2. manufacturer product page;
3. manufacturer support documentation;
4. standards or regulatory documentation;
5. authorized distributor documentation;
6. retailer page for corroboration or discovery only.

Each source reference must include:

- `sourceId`
- `sourceType`
- `sourceLocator`
- `retrievedAt`
- `verifiedBy`
- `verificationStatus`

A retailer source may corroborate identity or visible product attributes but must not override explicit manufacturer technical specifications.

## 7. Derived values

Derived values must be reproducible from canonical inputs.

For the reference product:

```text
capacityGb = moduleCount × capacityPerModuleGb
32 = 2 × 16
```

```text
bandwidthGbps = dataRateMtps × 8 / 1000
48 = 6000 × 8 / 1000
```

```text
primaryTimings = casLatency-tRcd-tRp-tRas
30-36-36-76
```

Derived fields must never silently override source-backed inputs.

## 8. Governance and lifecycle

A new record begins at revision `1`. Every material change increments `recordRevision`, updates `updatedAt` and `updatedBy`, and records a concise `changeReason`.

A product may be `READY` only after:

- schema and repository validation pass;
- applicable Sentinel rules pass or approved warnings are documented;
- required provenance exists;
- human review is complete when required.

The reference product is marked `ACTIVE`, `READY` and `PASS` because it is the initial reviewed canonical fixture.

## 9. Source-specific adjudication for the reference product

The manufacturer page explicitly identifies the SKU, capacity, tested speed, tested timings, voltages, package format, weight, heat-spreader material, platform compatibility and limited lifetime warranty.

The source URL contains the word `black`, while the explicit manufacturer technical specification and the supplied retailer listing describe SKU `CMK32GX5M2B6000Z30` as grey. Atlas records `GREY` because explicit specification data takes precedence over a mutable URL slug. The provenance note preserves this adjudication.

## 10. Repository admission checklist

Before adding a future RAM record:

1. Confirm the exact MPN and variant.
2. Create a new immutable Atlas product ID and sequence filename.
3. Populate only verified facts; use `null` for unknown optional values.
4. Add field-level or grouped provenance.
5. Run Atlas product validation.
6. Run repository uniqueness validation.
7. Run the Sentinel RAM rule set.
8. Review the generated errors and warnings.
9. Update the Atlas manifest only after the record passes admission checks.
10. Commit the product, manifest and any evidence-related documentation together.

## 11. Canonical role

This product is a living specification and regression fixture. Changes to its structure must be treated as product-model changes, not ordinary catalog edits. Any structural modification should be accompanied by schema, validator, test and documentation updates.
