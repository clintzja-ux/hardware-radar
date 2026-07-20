#Atlas Product Model — RAM Extension

**Document ID:** ATLAS-PRODUCT-MODEL-RAM
**Version:** 1.0  
**Status:** Canonical 
**Owner:** Mirabelle Labs  
**Applies To:** Atlas, Forge, Sentinel, Mercury, Hardware Radar  
**Product Extension** Consumer RAM  
**Last Updated:** 2026-07-19

---

## 1. Purpose

This document defines the first Atlas Product Extension.

The Atlas Core Product Model is hardware-agnostic.

RAM-specific engineering rules extend the Atlas Core rather than redefining it.

Atlas answers:

> What is this product?

Atlas does not answer:

> What does it currently cost?
> Where is it sold?
> Is an affiliate link available?
> Is a retailer observation still fresh?

Retailer-specific data belongs in Mercury.

This dictionary establishes:

- field names;
- data types;
- requiredness;
- validation rules;
- enumerated values;
- normalization rules;
- product lifecycle fields;
- source and provenance requirements;
- derived-field rules;
- publication eligibility requirements.

---

Atlas Product Architecture

Atlas separates platform concerns from hardware-specific concerns.

The Atlas Core Product Model contains fields common to every hardware product supported by Hardware Radar.

Hardware-specific attributes are implemented as Product Extensions.

Current Extension

• Consumer RAM

Future Extensions

• SSD
• CPU
• GPU
• Motherboard
• Power Supply
• Storage
• Cooling
• Networking

Every Atlas product consists of:

Core Product Model

↓

One Hardware Extension

↓

Zero or more future optional extensions.

## 2. Atlas Design Principles

### ATLAS-PRINCIPLE-001 — Retailer Independence

Atlas records shall remain valid even if every retailer integration is removed.

### ATLAS-PRINCIPLE-002 — Canonical Identity

Every distinct product variant must have one canonical Atlas record.

### ATLAS-PRINCIPLE-003 — Variant Precision

Products that differ materially in capacity, module count, speed, timings, ECC capability, form factor, color, heat spreader, or manufacturer part number should normally be separate records.

### ATLAS-PRINCIPLE-004 — Verified Specifications

A field may become publication-ready only when its source and verification status are recorded.

### ATLAS-PRINCIPLE-005 — Null Is Better Than Guessing

Unknown values must be represented as `null`, not estimated or copied from a related model.

### ATLAS-PRINCIPLE-006 — Derived Fields Must Be Reproducible

Every derived field must be computable from canonical input fields using a documented rule.

### ATLAS-PRINCIPLE-007 — Stable Internal Identifiers

Atlas product IDs must never depend on retailer IDs, URLs, or mutable product names.

---

## 3. Record Structure

Every Atlas product record consists of a hardware-agnostic Core Product Model together with one Hardware Extension.

```text
Atlas Product

├── Core
│
│   ├── Identity
│   ├── Governance
│   ├── Provenance
│   └── Validation
│
└── RAM Extension
    ├── Classification
    ├── Capacity
    ├── Performance
    ├── Electrical
    ├── Physical
    └── Compatibility
```

Recommended top-level shape:

```json
{
  "atlasProductId": "ram_corsair_cmk32gx5m2b6000c30",
  "productType": "ram",
  "lifecycleStatus": "ACTIVE",
  "identity": {},
  "classification": {},
  "capacity": {},
  "performance": {},
  "electrical": {},
  "physical": {},
  "compatibility": {},
  "provenance": {},
  "governance": {}
}
```

---

## 4. Core Record Fields

| Field | Type | Required | Description |
|---|---|---:|---|
| `atlasProductId` | string | Yes | Stable Mirabelle Labs identifier |
| `schemaVersion` | string | Yes | Atlas schema version used by the record |
| `productType` | enum | Yes | Product category; initially `ram` |
| `lifecycleStatus` | enum | Yes | Product lifecycle state |
| `createdAt` | datetime | Yes | Record creation timestamp |
| `updatedAt` | datetime | Yes | Most recent material update |
| `createdBy` | string | Yes | Human or system actor that created the record |
| `updatedBy` | string | Yes | Human or system actor responsible for latest update |
| `recordRevision` | integer | Yes | Monotonic revision counter |
| `publicationStatus` | enum | Yes | Atlas publication-readiness state |

### Validation rules

- `atlasProductId` must be globally unique.
- `schemaVersion` must reference a supported Atlas schema.
- `recordRevision` must be greater than or equal to `1`.
- `updatedAt` must not precede `createdAt`.
- Retailer names, prices, affiliate tags, ASINs, and retailer URLs are prohibited in Atlas.

---

## 5. Product Identity

| Field | Type | Required | Description |
|---|---|---:|---|
| `brand` | string | Yes | Consumer-facing brand |
| `manufacturer` | string | Yes | Legal or manufacturing entity |
| `productFamily` | string | No | Family or line, such as `Vengeance` |
| `series` | string | No | Series or sub-line |
| `modelName` | string | Yes | Human-readable product model |
| `manufacturerPartNumber` | string | Yes | Canonical manufacturer SKU/MPN |
| `alternatePartNumbers` | string[] | No | Verified alternative MPNs |
| `gtin` | string | No | Global Trade Item Number where verified |
| `upc` | string | No | UPC where verified |
| `ean` | string | No | EAN where verified |
| `countryOfOrigin` | string | No | Manufacturing origin when reliably documented |
| `displayName` | string | Yes | Normalized public product name |
| `slug` | string | Yes | URL-safe canonical slug |

### Identity rules

- `manufacturerPartNumber` must be unique within a manufacturer unless evidence proves otherwise.
- `displayName` should describe the exact variant, not the family generally.
- Retailer marketing titles must not be copied into `displayName`.
- `slug` must be unique and must not contain retailer identifiers.
- Case-insensitive duplicates of MPNs must be rejected or reviewed.

### Recommended display-name pattern

```text
{Brand} {Product Family} {Memory Type} {Total Capacity} ({Module Configuration}) {Speed} {Primary Timing}
```

Example:

```text
Corsair Vengeance DDR5 32GB (2×16GB) 6000 MT/s CL30
```

---

## 6. Classification

| Field | Type | Required | Description |
|---|---|---:|---|
| `memoryType` | enum | Yes | DDR generation |
| `formFactor` | enum | Yes | DIMM class |
| `applicationClass` | enum | Yes | Desktop, laptop, server, workstation, embedded |
| `moduleType` | enum | Yes | UDIMM, SO-DIMM, RDIMM, LRDIMM, etc. |
| `buffering` | enum | Yes | Unbuffered, registered, load-reduced |
| `eccType` | enum | Yes | None, on-die, side-band, unknown |
| `isKit` | boolean | Yes | Whether product contains multiple modules |
| `gamingPositioning` | boolean | No | Manufacturer markets the product for gaming |
| `workstationPositioning` | boolean | No | Manufacturer markets it for workstation use |
| `serverPositioning` | boolean | No | Manufacturer markets it for server use |

### Enumerations

#### `memoryType`

- `DDR3`
- `DDR4`
- `DDR5`
- `LPDDR4`
- `LPDDR4X`
- `LPDDR5`
- `LPDDR5X`
- `OTHER`

Initial Hardware Radar launch scope should normally accept only `DDR4` and `DDR5`.

#### `formFactor`

- `DIMM`
- `SO_DIMM`
- `CAMM2`
- `SOLDERED`
- `OTHER`

#### `applicationClass`

- `DESKTOP`
- `LAPTOP`
- `WORKSTATION`
- `SERVER`
- `EMBEDDED`
- `OTHER`

#### `moduleType`

- `UDIMM`
- `SO_DIMM`
- `RDIMM`
- `LRDIMM`
- `CUDIMM`
- `CSODIMM`
- `OTHER`

#### `buffering`

- `UNBUFFERED`
- `REGISTERED`
- `LOAD_REDUCED`
- `CLOCKED_UNBUFFERED`
- `UNKNOWN`

#### `eccType`

- `NONE`
- `ON_DIE_ONLY`
- `SIDEBAND_ECC`
- `CHIPKILL_OR_ADVANCED`
- `UNKNOWN`

### Classification rules

- DDR5 consumer UDIMMs typically include on-die ECC, but this must not be represented as system-addressable side-band ECC.
- `eccType = SIDEBAND_ECC` requires verified support beyond ordinary DDR5 on-die ECC.
- `applicationClass = LAPTOP` normally requires `formFactor = SO_DIMM`, `CAMM2`, or `SOLDERED`.
- `buffering = REGISTERED` requires `moduleType = RDIMM` unless a documented exception exists.

---

## 7. Capacity

| Field | Type | Required | Description |
|---|---|---:|---|
| `capacityGb` | integer | Yes | Total kit capacity in gigabytes |
| `moduleCount` | integer | Yes | Number of physical modules |
| `capacityPerModuleGb` | integer | Yes | Capacity of each module |
| `rankConfiguration` | enum | No | Single-rank, dual-rank, quad-rank, mixed, unknown |
| `chipDensityGb` | number | No | DRAM chip density where verified |
| `organization` | string | No | Organization such as `2Rx8` |

### Canonical invariant

```text
capacityGb = moduleCount × capacityPerModuleGb
```

This rule is mandatory.

### Additional rules

- `capacityGb` must be greater than `0`.
- `moduleCount` must be greater than `0`.
- `capacityPerModuleGb` must be greater than `0`.
- `isKit = true` when `moduleCount > 1`.
- `isKit = false` when `moduleCount = 1`.
- Mixed-capacity kits require `REVIEW`; they are not supported in schema v0.1.

#### `rankConfiguration`

- `SINGLE_RANK`
- `DUAL_RANK`
- `QUAD_RANK`
- `MIXED`
- `UNKNOWN`

---

## 8. Performance

| Field | Type | Required | Description |
|---|---|---:|---|
| `dataRateMtps` | integer | Yes | Rated effective transfer rate |
| `baseJedecDataRateMtps` | integer | No | Base JEDEC profile rate |
| `speedLabel` | string | Yes | Normalized label such as `DDR5-6000` |
| `casLatency` | integer | No | Primary CAS latency |
| `tRcd` | integer | No | RAS-to-CAS delay |
| `tRp` | integer | No | Row precharge time |
| `tRas` | integer | No | Row active time |
| `primaryTimings` | string | No | Human-readable timing tuple |
| `xmpSupport` | enum | Yes | Intel XMP support status |
| `expoSupport` | enum | Yes | AMD EXPO support status |
| `jedecProfiles` | object[] | No | Verified JEDEC profiles |
| `overclockProfiles` | object[] | No | Verified XMP/EXPO profiles |
| `testedSpeedMtps` | integer | No | Manufacturer-tested overclock speed |
| `testedLatencyCl` | integer | No | Manufacturer-tested CAS latency |
| `bandwidthGbps` | number | Derived | Theoretical single-channel bandwidth |

### Derived bandwidth

```text
bandwidthGbps = dataRateMtps × 8 / 1000
```

This represents theoretical bandwidth per 64-bit channel and must be clearly labeled if shown publicly.

### Performance rules

- `speedLabel` must equal `{memoryType}-{dataRateMtps}` for DDR SDRAM.
- `casLatency` must be positive when present.
- `primaryTimings` should be derived from component timing fields where all required values exist.
- XMP and EXPO claims require explicit manufacturer or standards-based evidence.
- Marketing speed and JEDEC base speed must not be conflated.

#### `xmpSupport` and `expoSupport`

- `NONE`
- `SUPPORTED`
- `PROFILE_INCLUDED`
- `UNKNOWN`

---

## 9. Electrical

| Field | Type | Required | Description |
|---|---|---:|---|
| `ratedVoltage` | number | No | Voltage for advertised performance profile |
| `baseVoltage` | number | No | JEDEC/base operating voltage |
| `pmicLocation` | enum | No | Module, motherboard, integrated, unknown |
| `powerManagementNotes` | string | No | Verified electrical notes |

#### `pmicLocation`

- `ON_MODULE`
- `ON_MOTHERBOARD`
- `INTEGRATED`
- `UNKNOWN`

### Electrical rules

- Voltages must be stored in volts.
- `ratedVoltage` must not be inferred solely from memory generation.
- DDR5 PMIC assumptions must not replace product-specific verification.

---

## 10. Physical Attributes

| Field | Type | Required | Description |
|---|---|---:|---|
| `heatSpreader` | boolean | Yes | Whether the module includes a heat spreader |
| `heatSpreaderMaterial` | string | No | Material where verified |
| `heightMm` | number | No | Maximum module height |
| `lengthMm` | number | No | Module length |
| `widthMm` | number | No | Module width or thickness |
| `color` | string | No | Manufacturer-designated color |
| `rgbLighting` | boolean | Yes | Whether integrated RGB is present |
| `lightingEcosystem` | string[] | No | Supported lighting-control ecosystems |
| `lowProfile` | boolean | No | Verified low-profile designation |
| `moduleWeightGrams` | number | No | Weight per module |
| `kitWeightGrams` | number | No | Total packaged module weight where relevant |

### Physical rules

- Dimensions must be stored in millimetres.
- Weights must be stored in grams.
- `rgbLighting = true` requires evidence.
- `lowProfile` must not be inferred only from appearance.

---

## 11. Compatibility and Platform Metadata

| Field | Type | Required | Description |
|---|---|---:|---|
| `platformCompatibility` | string[] | No | Verified compatible platform classes |
| `chipsetCompatibility` | string[] | No | Verified chipset families |
| `cpuGenerationCompatibility` | string[] | No | Verified CPU/platform generations |
| `qvlReferences` | object[] | No | Qualified Vendor List references |
| `requiresBiosSupport` | boolean | No | Whether explicit BIOS support may be required |
| `compatibilityNotes` | string | No | Human-readable verified notes |

### Compatibility rules

- Compatibility claims must be specific and sourced.
- Absence from a QVL does not prove incompatibility.
- `platformCompatibility` should describe validated classes, not broad marketing claims.
- Hardware Radar editorial recommendations must not be stored as Atlas compatibility truth.

---

## 12. Warranty and Lifecycle Metadata

| Field | Type | Required | Description |
|---|---|---:|---|
| `warrantyType` | enum | No | Manufacturer warranty category |
| `warrantyYears` | number | No | Warranty duration where fixed |
| `warrantyNotes` | string | No | Verified qualification or regional caveats |
| `launchDate` | date | No | Official launch or availability date |
| `discontinuedDate` | date | No | Official or verified discontinuation date |
| `manufacturerStatus` | enum | No | Current manufacturer status |
| `replacementAtlasProductId` | string | No | Canonical successor product |
| `predecessorAtlasProductId` | string | No | Canonical predecessor product |

#### `warrantyType`

- `LIMITED_LIFETIME`
- `FIXED_TERM`
- `NONE`
- `UNKNOWN`

#### `manufacturerStatus`

- `ANNOUNCED`
- `CURRENT`
- `DISCONTINUED`
- `LEGACY`
- `UNKNOWN`

### Lifecycle rules

- `discontinuedDate` must not precede `launchDate`.
- Replacement and predecessor IDs must reference valid Atlas products.
- Product lifecycle status and manufacturer status may differ but must not conflict without explanation.

---

## 13. Provenance

Every field that affects publication must be traceable.

Recommended provenance model:

```json
{
  "fieldSources": {
    "capacity.capacityGb": [
      {
        "sourceId": "SRC-MFG-001",
        "sourceType": "MANUFACTURER_PRODUCT_PAGE",
        "sourceLocator": "https://manufacturer.example/product",
        "retrievedAt": "2026-07-18T12:00:00Z",
        "verifiedBy": "human:clinton",
        "verificationStatus": "VERIFIED"
      }
    ]
  }
}
```

| Field | Type | Required | Description |
|---|---|---:|---|
| `sourceId` | string | Yes | Internal source-register ID |
| `sourceType` | enum | Yes | Type of evidence |
| `sourceLocator` | string | Yes | URL, document ID, or file reference |
| `publisher` | string | No | Source publisher |
| `publishedDate` | date | No | Source publication date |
| `retrievedAt` | datetime | Yes | Retrieval timestamp |
| `verifiedBy` | string | Yes | Reviewer or trusted system |
| `verificationStatus` | enum | Yes | Verification state |
| `notes` | string | No | Caveats or interpretation notes |

#### `sourceType`

- `MANUFACTURER_PRODUCT_PAGE`
- `MANUFACTURER_DATASHEET`
- `MANUFACTURER_SUPPORT_DOCUMENT`
- `STANDARDS_DOCUMENT`
- `REGULATORY_DATABASE`
- `AUTHORIZED_DISTRIBUTOR_DOCUMENT`
- `RETAILER_PAGE_REFERENCE_ONLY`
- `INTERNAL_RESEARCH`
- `OTHER`

#### `verificationStatus`

- `UNVERIFIED`
- `PARTIALLY_VERIFIED`
- `VERIFIED`
- `CONFLICTING`
- `DEPRECATED`

### Source-priority guidance

Preferred order:

1. manufacturer datasheet;
2. manufacturer product page;
3. manufacturer support documentation;
4. applicable standards documentation;
5. authorized distributor documentation;
6. retailer page as a discovery aid only.

Retailer pages should not normally be the sole source for canonical technical specifications.

---

## 14. Governance Fields

| Field | Type | Required | Description |
|---|---|---:|---|
| `engineeringValidationStatus` | enum | Yes | Atlas engineering result |
| `validationErrors` | object[] | Yes | Current blocking errors |
| `validationWarnings` | object[] | Yes | Non-blocking concerns |
| `humanReviewRequired` | boolean | Yes | Whether expert review remains necessary |
| `reviewedBy` | string | No | Latest human reviewer |
| `reviewedAt` | datetime | No | Latest human review |
| `changeReason` | string | No | Reason for latest revision |
| `supersedesRevision` | integer | No | Previous record revision |
| `archivalReason` | string | No | Reason for deactivation or archive |

#### `engineeringValidationStatus`

- `PENDING`
- `PASS`
- `WARN`
- `FAIL`

#### `publicationStatus`

- `PENDING`
- `READY`
- `REVIEW`
- `BLOCKED`

### Publication eligibility

An Atlas RAM record may become `READY` only when:

- required identity fields are present;
- manufacturer part number is verified;
- capacity invariant passes;
- memory type and form factor are valid;
- required provenance exists;
- no blocking validation error exists;
- conflicting evidence has been resolved;
- lifecycle status is `VERIFIED` or `ACTIVE`.

---

## 15. Validation Rule Catalog

| Rule ID | Rule | Severity | Failure behavior |
|---|---|---|---|
| ATLAS-RAM-001 | `capacityGb = moduleCount × capacityPerModuleGb` | Critical | BLOCKED |
| ATLAS-RAM-002 | MPN unique within manufacturer | Critical | BLOCKED or REVIEW |
| ATLAS-RAM-003 | `atlasProductId` globally unique | Critical | BLOCKED |
| ATLAS-RAM-004 | `speedLabel` matches memory type and data rate | High | BLOCKED |
| ATLAS-RAM-005 | Multi-module product has `isKit = true` | High | BLOCKED |
| ATLAS-RAM-006 | Single-module product has `isKit = false` | High | BLOCKED |
| ATLAS-RAM-007 | Side-band ECC must be explicitly verified | Critical | BLOCKED |
| ATLAS-RAM-008 | Retailer fields prohibited | Critical | BLOCKED |
| ATLAS-RAM-009 | Required field provenance exists | High | BLOCKED |
| ATLAS-RAM-010 | Unknown values are not guessed | High | REVIEW/BLOCKED |
| ATLAS-RAM-011 | Product lifecycle dates are logically ordered | Medium | REVIEW |
| ATLAS-RAM-012 | Timings are positive integers | High | BLOCKED |
| ATLAS-RAM-013 | Dimensions use millimetres | Medium | BLOCKED |
| ATLAS-RAM-014 | Voltages use volts | Medium | BLOCKED |
| ATLAS-RAM-015 | Duplicate slug prohibited | High | BLOCKED |
| ATLAS-RAM-016 | XMP/EXPO claims require evidence | High | BLOCKED |
| ATLAS-RAM-017 | Retailer title not used as canonical display name | Medium | REVIEW |
| ATLAS-RAM-018 | Conflicting source evidence is unresolved | Critical | BLOCKED |

---

## 16. Example Canonical RAM Record

```json
{
  "atlasProductId": "ram_corsair_cmk32gx5m2b6000c30",
  "schemaVersion": "0.1",
  "productType": "ram",
  "lifecycleStatus": "ACTIVE",
  "publicationStatus": "READY",
  "createdAt": "2026-07-18T12:00:00Z",
  "updatedAt": "2026-07-18T12:00:00Z",
  "createdBy": "human:clinton",
  "updatedBy": "human:clinton",
  "recordRevision": 1,
  "identity": {
    "brand": "Corsair",
    "manufacturer": "Corsair",
    "productFamily": "Vengeance",
    "series": null,
    "modelName": "Vengeance DDR5",
    "manufacturerPartNumber": "CMK32GX5M2B6000C30",
    "alternatePartNumbers": [],
    "gtin": null,
    "upc": null,
    "ean": null,
    "countryOfOrigin": null,
    "displayName": "Corsair Vengeance DDR5 32GB (2×16GB) 6000 MT/s CL30",
    "slug": "corsair-vengeance-ddr5-32gb-2x16gb-6000-cl30"
  },
  "classification": {
    "memoryType": "DDR5",
    "formFactor": "DIMM",
    "applicationClass": "DESKTOP",
    "moduleType": "UDIMM",
    "buffering": "UNBUFFERED",
    "eccType": "ON_DIE_ONLY",
    "isKit": true,
    "gamingPositioning": true,
    "workstationPositioning": false,
    "serverPositioning": false
  },
  "capacity": {
    "capacityGb": 32,
    "moduleCount": 2,
    "capacityPerModuleGb": 16,
    "rankConfiguration": "UNKNOWN",
    "chipDensityGb": null,
    "organization": null
  },
  "performance": {
    "dataRateMtps": 6000,
    "baseJedecDataRateMtps": null,
    "speedLabel": "DDR5-6000",
    "casLatency": 30,
    "tRcd": 36,
    "tRp": 36,
    "tRas": 76,
    "primaryTimings": "30-36-36-76",
    "xmpSupport": "PROFILE_INCLUDED",
    "expoSupport": "NONE",
    "jedecProfiles": [],
    "overclockProfiles": [],
    "testedSpeedMtps": 6000,
    "testedLatencyCl": 30,
    "bandwidthGbps": 48.0
  },
  "electrical": {
    "ratedVoltage": 1.4,
    "baseVoltage": null,
    "pmicLocation": "ON_MODULE",
    "powerManagementNotes": null
  },
  "physical": {
    "heatSpreader": true,
    "heatSpreaderMaterial": "Aluminium",
    "heightMm": null,
    "lengthMm": null,
    "widthMm": null,
    "color": "Black",
    "rgbLighting": false,
    "lightingEcosystem": [],
    "lowProfile": true,
    "moduleWeightGrams": null,
    "kitWeightGrams": null
  },
  "compatibility": {
    "platformCompatibility": ["DESKTOP_DDR5"],
    "chipsetCompatibility": [],
    "cpuGenerationCompatibility": [],
    "qvlReferences": [],
    "requiresBiosSupport": null,
    "compatibilityNotes": null
  },
  "provenance": {
    "fieldSources": {}
  },
  "governance": {
    "engineeringValidationStatus": "PASS",
    "validationErrors": [],
    "validationWarnings": [],
    "humanReviewRequired": false,
    "reviewedBy": "human:clinton",
    "reviewedAt": "2026-07-18T12:00:00Z",
    "changeReason": "Initial canonical record",
    "supersedesRevision": null,
    "archivalReason": null
  }
}
```

---

## 17. Forge Form Implications

Forge should present the Atlas editor in these sections:

1. Product Identity
2. Classification
3. Capacity
4. Performance
5. Electrical
6. Physical
7. Compatibility
8. Warranty and Lifecycle
9. Provenance
10. Validation Summary

### Form behavior

- Derived fields should be read-only.
- Enum fields should use controlled selections.
- Unknown values should support explicit `Unknown` or blank states.
- Capacity validation should run immediately.
- Retailer-specific fields should not exist in the Atlas editor.
- A change to a verified field should return the record to `PENDING`.
- Conflicting source evidence should force `REVIEW`.
- Forge should show field-level provenance alongside each verified field.

---

## 18. Sentinel Integration

Sentinel should validate:

- Atlas schema version;
- canonical ownership;
- required provenance;
- product-state eligibility;
- engineering invariants;
- conflicting evidence;
- prohibited retailer-specific fields.

Sentinel does not verify current Amazon price or availability in Atlas. Those checks belong to Mercury and Amazon-specific compliance rules.

---

## 19. Migration Considerations

Existing RAM JSON records should be mapped as follows:

| Existing concept | Atlas target |
|---|---|
| `id` | `atlasProductId` |
| `name` | `identity.displayName` |
| `brand` | `identity.brand` |
| `type` | `classification.memoryType` |
| `capacity` | `capacity.capacityGb` |
| `modules` | `capacity.moduleCount` |
| `speed` | `performance.dataRateMtps` |
| `latency` | `performance.casLatency` |
| `formFactor` | `classification.formFactor` |
| `price` | Remove from Atlas; move to Mercury |
| `retailer` | Remove from Atlas; move to Mercury |
| `affiliateUrl` | Remove from Atlas; move to Mercury |
| `lastVerified` | Split into field provenance and Mercury observation timestamp |

Migration must preserve original source files until the transformed records pass validation.

---

## 20. Open Questions

The following remain unresolved:

1. Whether `color` should be normalized to a controlled vocabulary.
2. Whether visual variants with the same MPN can exist.
3. Whether separate records are required for regional MPN suffixes.
4. How deeply QVL relationships should be normalized.
5. Whether packaging-only variants deserve distinct Atlas records.
6. Whether warranty terms should support region-specific structures.
7. Whether product-family and series require separate canonical entities.
8. Whether memory chips and die revisions should become first-class child entities.
9. Whether server/ECC attributes should be included before the public RAM MVP.
10. Whether Atlas should support confidence scores or only explicit verification states.

Until resolved, these fields should not become blocking launch dependencies unless needed for a specific published product.

---

## 21. Definition of Done

Atlas Data Dictionary v1.0 is complete when:

- the required RAM fields are accepted;
- all enums are approved;
- the existing JSON schema is mapped;
- Forge form sections are aligned;
- every critical invariant has a validator;
- sample records validate;
- Mercury ownership boundaries are enforced;
- provenance requirements are operational;
- schema versioning and migration rules are documented.

---

## 22. Canonical Platform Summary
Atlas Core stores hardware-agnostic product truth.

Product Extensions store hardware-specific truth.

Mercury stores market observations.

Forge authors and publishes Atlas records.

Sentinel enforces engineering integrity.

Atlas never stores retailer pricing.

Atlas never stores affiliate metadata.

Every field is sourced.

Every variant is uniquely identifiable.

Unknown is preferable to guessed.

Derived values must always be reproducible.

Only validated Atlas records become publishable.
```