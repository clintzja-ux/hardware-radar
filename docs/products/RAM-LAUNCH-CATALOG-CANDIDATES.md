# Hardware Radar — RAM Launch Catalog Candidates

**Program increment:** D-001  
**Status:** D-002B ATLAS ADMISSION COMPLETE / 2 PENDING EVIDENCE
**Owner:** Atlas / Intelligence Foundation (Track D)  
**Scope:** Research resolution of the 24 A-001 RAM launch slots

## 1. Purpose and authority limits

This document maps real, exact manufacturer part numbers to the 24 slots defined by the [RAM launch catalog and minimum useful coverage definition](./RAM-LAUNCH-CATALOG-AND-COVERAGE.md). It is a research artifact, not an Atlas registry, admission request, market observation, retailer-rights determination, publication decision, or recommendation.

`READY_FOR_OPERATOR_REVIEW` means that manufacturer-controlled evidence identifies the exact MPN and reconciles the required configuration. It does **not** mean Atlas admitted, Mercury observable, publicly comparable, affiliate enabled, publication eligible, Current Price eligible, Cheapest eligible, or Pick eligible. A later governed Atlas increment must independently review and admit any approved product.

The existing Atlas product `ram_corsair_cmk32gx5m2b6000z30` / `CMK32GX5M2B6000Z30` is preserved as the authoritative resolution for `DDR5-DESKTOP-MAINSTREAM-32GB`. D-001 neither replaces nor duplicates that record.

## 2. Method

- The canonical A-001 slot definitions were held fixed at 9 DDR5 desktop, 7 DDR4 desktop, and 8 laptop/SODIMM products.
- Exact MPN, capacity, module count, speed, timing, voltage, form factor, and profile facts were taken from manufacturer product pages or manufacturer datasheets.
- Every row was checked against `capacityGb = moduleCount × capacityPerModuleGb`.
- Closely related capacity, kit-size, timing, profile, and form-factor variants were retained only where they deliberately serve different A-001 shopper use cases.
- Retailer relevance is recorded separately from identity. D-001 did not establish exact current stocking across the Track C portfolio and inferred no rights, affiliate state, feed access, or publication authority.

For DDR5, “non-ECC” below means no system-visible ECC module capability; manufacturer-documented DDR5 on-die ECC does not make the module an ECC DIMM.

## 3. D-001 baseline catalog

All products are unbuffered, non-RGB consumer memory unless a row says otherwise. “HS” means a manufacturer-documented heat spreader.

| # | A-001 slot | Manufacturer / family | Exact MPN | Configuration | Rated specification | Profile / physical distinction | Status |
|---:|---|---|---|---|---|---|---|
| 1 | `DDR5-DESKTOP-VALUE-32GB` | Kingston FURY Beast | `KF556C40BBK2-32` | DDR5 UDIMM; 32GB; 2×16GB | 5600 MT/s; 40-40-40; 1.25V; non-ECC | XMP 3.0; HS; 34.9mm | `READY_FOR_OPERATOR_REVIEW` |
| 2 | `DDR5-DESKTOP-MAINSTREAM-32GB` | Corsair Vengeance | `CMK32GX5M2B6000Z30` | DDR5 UDIMM; 32GB; 2×16GB | 6000 MT/s; 30-36-36-76; 1.40V; non-ECC | EXPO + XMP; aluminum HS; non-RGB; existing Atlas product | `READY_FOR_OPERATOR_REVIEW` |
| 3 | `DDR5-DESKTOP-AMD-PERFORMANCE-32GB` | G.SKILL Flare X5 | `F5-6000J3038F16GX2-FX5` | DDR5 UDIMM; 32GB; 2×16GB | 6000 MT/s; 30-38-38-96; 1.35V; non-ECC | AMD EXPO + XMP; HS; 33mm low profile | `READY_FOR_OPERATOR_REVIEW` |
| 4 | `DDR5-DESKTOP-INTEL-PERFORMANCE-32GB` | Kingston FURY Renegade | `KF572C38RSK2-32` | DDR5 UDIMM; 32GB; 2×16GB | 7200 MT/s; 38-44-44; 1.45V; non-ECC | Intel XMP 3.0; HS; 39.2mm | `READY_FOR_OPERATOR_REVIEW` |
| 5 | `DDR5-DESKTOP-LOW-PROFILE-32GB` | Kingston FURY Beast | `KF560C30BBEK2-32` | DDR5 UDIMM; 32GB; 2×16GB | 6000 MT/s; 30-36-36; 1.40V; non-ECC | EXPO + XMP; HS; 34.9mm | `READY_FOR_OPERATOR_REVIEW` |
| 6 | `DDR5-DESKTOP-MAINSTREAM-64GB` | Kingston FURY Beast | `KF556C40BBK2-64` | DDR5 UDIMM; 64GB; 2×32GB | 5600 MT/s; 40-40-40; 1.25V; non-ECC | Intel XMP 3.0; HS; 34.9mm | `READY_FOR_OPERATOR_REVIEW` |
| 7 | `DDR5-DESKTOP-PERFORMANCE-64GB` | Kingston FURY Beast | `KF560C30BBEK2-64` | DDR5 UDIMM; 64GB; 2×32GB | 6000 MT/s; 30-36-36; 1.40V; non-ECC | EXPO + XMP; HS; 34.9mm | `READY_FOR_OPERATOR_REVIEW` |
| 8 | `DDR5-DESKTOP-HIGH-CAPACITY-96GB` | Kingston FURY Renegade | `KF560C32RSK2-96` | DDR5 UDIMM; 96GB; 2×48GB | 6000 MT/s; 32-38-38; 1.35V; non-ECC | Intel XMP 3.0; HS; 39.2mm | `READY_FOR_OPERATOR_REVIEW` |
| 9 | `DDR5-DESKTOP-SINGLE-32GB` | Kingston ValueRAM | `KVR56U46BD8-32` | DDR5 UDIMM; 32GB; 1×32GB | 5600 MT/s; CL46; 1.10V; non-ECC | JEDEC-oriented; no HS; 31.25mm | `READY_FOR_OPERATOR_REVIEW` |
| 10 | `DDR4-DESKTOP-VALUE-16GB` | Kingston FURY Beast | `KF432C16BBK2/16` | DDR4 UDIMM; 16GB; 2×8GB | 3200 MT/s; 16-18-18; 1.35V; non-ECC | XMP 2.0; HS | `READY_FOR_OPERATOR_REVIEW` |
| 11 | `DDR4-DESKTOP-MAINSTREAM-32GB` | Kingston FURY Beast | `KF432C16BBK2/32` | DDR4 UDIMM; 32GB; 2×16GB | 3200 MT/s; 16-20-20; 1.35V; non-ECC | XMP 2.0; HS | `READY_FOR_OPERATOR_REVIEW` |
| 12 | `DDR4-DESKTOP-PERFORMANCE-32GB` | Kingston FURY Renegade | `KF436C16RB12K2/32` | DDR4 UDIMM; 32GB; 2×16GB | 3600 MT/s; 16-20-20; 1.35V; non-ECC | XMP 2.0; HS | `READY_FOR_OPERATOR_REVIEW` |
| 13 | `DDR4-DESKTOP-LOW-PROFILE-32GB` | Corsair Vengeance LPX | `CMK32GX4M2E3200C16` | DDR4 UDIMM; 32GB; 2×16GB | 3200 MT/s; 16-20-20-38; 1.35V; non-ECC | XMP 2.0; aluminum low-profile HS; non-RGB | `READY_FOR_OPERATOR_REVIEW` |
| 14 | `DDR4-DESKTOP-MAINSTREAM-64GB` | Kingston FURY Beast | `KF432C16BBK2/64` | DDR4 UDIMM; 64GB; 2×32GB | 3200 MT/s; 16-20-20; 1.35V; non-ECC | XMP 2.0; HS; 34mm | `READY_FOR_OPERATOR_REVIEW` |
| 15 | `DDR4-DESKTOP-SINGLE-16GB` | Kingston ValueRAM | `KVR32N22S8/16` | DDR4 UDIMM; 16GB; 1×16GB | 3200 MT/s; 22-22-22; 1.20V; non-ECC | JEDEC-oriented; no HS; 31.25mm | `READY_FOR_OPERATOR_REVIEW` |
| 16 | `DDR4-DESKTOP-SINGLE-32GB` | Kingston ValueRAM | `KVR32N22D8/32` | DDR4 UDIMM; 32GB; 1×32GB | 3200 MT/s; CL22; 1.20V; non-ECC | JEDEC-oriented; no HS | `READY_FOR_OPERATOR_REVIEW` |
| 17 | `SODIMM-DDR4-SINGLE-8GB` | Kingston ValueRAM | `KVR32S22S8/8` | DDR4 SODIMM; 8GB; 1×8GB | 3200 MT/s; CL22; 1.20V; non-ECC | 260-pin; JEDEC-oriented | `READY_FOR_OPERATOR_REVIEW` |
| 18 | `SODIMM-DDR4-SINGLE-16GB` | Kingston ValueRAM | `KVR32S22S8/16` | DDR4 SODIMM; 16GB; 1×16GB | 3200 MT/s; CL22; 1.20V; non-ECC | 260-pin; JEDEC-oriented | `READY_FOR_OPERATOR_REVIEW` |
| 19 | `SODIMM-DDR4-SINGLE-32GB` | Kingston ValueRAM | `KVR32S22D8/32` | DDR4 SODIMM; 32GB; 1×32GB | 3200 MT/s; CL22; 1.20V; non-ECC | 260-pin; JEDEC-oriented | `READY_FOR_OPERATOR_REVIEW` |
| 20 | `SODIMM-DDR4-KIT-32GB` | Kingston FURY Impact | `KF432S20IBK2/32` | DDR4 SODIMM; 32GB; 2×16GB | 3200 MT/s; 20-22-22; 1.20V; non-ECC | 260-pin; PnP + XMP 2.0 | `READY_FOR_OPERATOR_REVIEW` |
| 21 | `SODIMM-DDR5-SINGLE-16GB` | Kingston ValueRAM | `KVR56S46BS8-16` | DDR5 SODIMM; 16GB; 1×16GB | 5600 MT/s; 46-45-45; 1.10V; non-ECC | 262-pin; JEDEC-oriented | `READY_FOR_OPERATOR_REVIEW` |
| 22 | `SODIMM-DDR5-SINGLE-32GB` | Kingston ValueRAM | `KVR56S46BD8-32` | DDR5 SODIMM; 32GB; 1×32GB | 5600 MT/s; CL46; 1.10V; non-ECC | 262-pin; JEDEC-oriented | `READY_FOR_OPERATOR_REVIEW` |
| 23 | `SODIMM-DDR5-KIT-32GB` | Kingston FURY Impact | `KF556S40IBK2-32` | DDR5 SODIMM; 32GB; 2×16GB | 5600 MT/s; 40-40-40; 1.10V; non-ECC | 262-pin; PnP | `READY_FOR_OPERATOR_REVIEW` |
| 24 | `SODIMM-DDR5-KIT-64GB` | Kingston FURY Impact | `KF556S40IBK2-64` | DDR5 SODIMM; 64GB; 2×32GB | 5600 MT/s; 40-40-40; 1.10V; non-ECC | 262-pin; PnP | `READY_FOR_OPERATOR_REVIEW` |

## 4. Manufacturer evidence

Each reference is manufacturer-controlled and identifies the exact MPN. Exact product pages and specification PDFs are both first-party evidence types.

| MPN(s) | Evidence type | Manufacturer evidence |
|---|---|---|
| `CMK32GX5M2B6000Z30` | Product page; existing Atlas provenance | [Corsair product page](https://www.corsair.com/us/en/p/memory/cmk32gx5m2b6000z30/vengeance-32gb-2x16gb-ddr5-dram-6000mt-s-cl30-amd-expo-memory-black-cmk32gx5m2b6000z30) |
| `F5-6000J3038F16GX2-FX5` | Product page + EXPO self-certification | [G.SKILL product page](https://www.gskill.com/product/165/396/1673491242/F5-6000J3038F16GX2-FX5); [G.SKILL EXPO report](https://www.gskill.com/_upload/files/F5-6000J3038F16GX2-FX5.pdf) |
| `KF556C40BBK2-32` | Datasheet | [Kingston datasheet](https://www.kingston.com/datasheets/KF556C40BBK2-32.pdf) |
| `KF572C38RSK2-32` | Datasheet | [Kingston datasheet](https://www.kingston.com/datasheets/KF572C38RSK2-32.pdf) |
| `KF560C30BBEK2-32` | Datasheet | [Kingston datasheet](https://www.kingston.com/datasheets/KF560C30BBEK2-32.pdf) |
| `KF556C40BBK2-64` | Datasheet | [Kingston datasheet](https://www.kingston.com/datasheets/KF556C40BBK2-64.pdf) |
| `KF560C30BBEK2-64` | Exact-part product page | [Kingston part page](https://www.kingston.com/en/memory/search?partid=KF560C30BBEK2-64) |
| `KF560C32RSK2-96` | Datasheet | [Kingston datasheet](https://www.kingston.com/datasheets/KF560C32RSK2-96.pdf) |
| `KVR56U46BD8-32` | Datasheet | [Kingston datasheet](https://www.kingston.com/datasheets/KVR56U46BD8-32.pdf) |
| `KF432C16BBK2/16` | Exact-part product page | [Kingston part page](https://www.kingston.com/en/memory/search?partid=KF432C16BBK2%2F16) |
| `KF432C16BBK2/32` | Exact-part product page | [Kingston part page](https://www.kingston.com/en/memory/search?partid=KF432C16BBK2%2F32) |
| `KF436C16RB12K2/32` | Datasheet | [Kingston datasheet](https://www.kingston.com/datasheets/KF436C16RB12K2_32.pdf) |
| `CMK32GX4M2E3200C16` | Product page | [Corsair product page](https://www.corsair.com/us/en/p/memory/cmk32gx4m2e3200c16/vengeance-lpx-32gb-2-x-16gb-ddr4-dram-3200mhz-c16-memory-kit-black-cmk32gx4m2e3200c16) |
| `KF432C16BBK2/64` | Datasheet | [Kingston datasheet](https://www.kingston.com/datasheets/KF432C16BBK2_64.pdf) |
| `KVR32N22S8/16` | Datasheet | [Kingston datasheet](https://www.kingston.com/datasheets/KVR32N22S8_16.pdf) |
| `KVR32N22D8/32` | Exact-part product page | [Kingston part page](https://www.kingston.com/en/memory/search?partId=KVR32N22D8%2F32) |
| `KVR32S22S8/8` | Datasheet | [Kingston datasheet](https://www.kingston.com/datasheets/KVR32S22S8_8.pdf) |
| `KVR32S22S8/16` | Datasheet | [Kingston datasheet](https://www.kingston.com/datasheets/KVR32S22S8_16.pdf) |
| `KVR32S22D8/32` | Datasheet | [Kingston datasheet](https://www.kingston.com/datasheets/KVR32S22D8_32.pdf) |
| `KF432S20IBK2/32` | Datasheet | [Kingston datasheet](https://www.kingston.com/datasheets/KF432S20IBK2_32.pdf) |
| `KVR56S46BS8-16` | Datasheet | [Kingston datasheet](https://www.kingston.com/datasheets/KVR56S46BS8-16.pdf) |
| `KVR56S46BD8-32` | Datasheet | [Kingston datasheet](https://www.kingston.com/datasheets/KVR56S46BD8-32.pdf) |
| `KF556S40IBK2-32` | Datasheet | [Kingston datasheet](https://www.kingston.com/datasheets/KF556S40IBK2-32.pdf) |
| `KF556S40IBK2-64` | Datasheet | [Kingston datasheet](https://www.kingston.com/datasheets/KF556S40IBK2-64.pdf) |

## 5. Retailer-overlap observations

The approved planning portfolio is Newegg, MemoryC, B&H Photo Video, Best Buy, Adorama, Micro Center, and Provantage. D-001 found no repository-owned, authoritative cross-retailer inventory source and did not perform retailer acquisition. Exact current stocking for the proposed MPNs is therefore `UNVERIFIED / REQUIRES TRACK C OR GOVERNED TRACK B EVIDENCE`.

Kingston, Corsair, and G.SKILL are plausible launch brands for the US PC-memory portfolio, but brand familiarity is not exact-MPN overlap. Manufacturer “buy” surfaces and retailer search visibility are mutable corroboration only. Before Atlas admission or observation planning, the operator should separately verify which exact MPNs overlap at least three portfolio retailers; that verification grants no data or publication rights.

## 6. Duplicate and variant analysis

- There are 24 unique exact MPNs. Slash-delimited Kingston part numbers are preserved exactly and are not alternate spellings of the hyphenated DDR5 numbers.
- The Kingston FURY Beast DDR5 candidates intentionally differ by capacity, module density, speed/timing, and profile. They are not color-only duplicates.
- `F5-6000J3038F16GX2-FX5` is selected for the AMD-performance slot because its exact record includes EXPO and a 33mm low-profile design. `KF560C30BBEK2-32` separately fills the general clearance-oriented slot with a different manufacturer, timings, voltage, and MPN.
- `KF432C16BBK2/32` and `CMK32GX4M2E3200C16` share 32GB/3200/CL16 headline specifications, but the latter is deliberately the Corsair LPX low-profile physical option; the former is the mainstream FURY kit.
- ValueRAM single modules are deliberately distinct from matched kits. A pair of single modules must not be represented as the corresponding kit MPN.
- DDR4 and DDR5 SODIMMs use different pin counts and are not interchangeable despite similar capacity labels.
- RGB variants were not selected. No color-only variant occupies a second slot.

## 7. Ambiguities and operator checks

No identity/specification contradiction prevents operator review. The remaining checks are governance and launch-relevance checks, not silent corrections:

1. Confirm current lifecycle/availability for each exact MPN before Atlas admission; manufacturer documentation proves identity but not portfolio stocking.
2. Confirm whether the launch wants the G.SKILL Flare X5 candidate in both its AMD-performance and low-profile narratives. It occupies only one slot here; the Kingston candidate occupies the other.
3. Preserve profile nuance: XMP/EXPO rated speeds require compatible hardware and BIOS configuration and are not universal JEDEC guarantees.
4. Preserve DDR5 on-die ECC separately from system ECC capability.
5. Atlas admission must create independent field-level provenance and validation; this matrix is not a substitute for the Atlas product schema.

## 8. D-001A balance and retailer-relevance review

The D-001 baseline was technically valid but unnecessarily concentrated: Kingston occupied 21 of 24 slots and every SODIMM slot. D-001A does not impose brand quotas. It recommends a replacement only when an equally specific manufacturer record improves brand representation, retailer visibility, or comparison value without weakening the slot or capacity invariant.

Retailer evidence below was checked by exact MPN against the seven Track C candidates on 2026-09-01. `VERIFIED_CURRENT_LISTING` means a public exact-MPN listing exposed an available purchase path at inspection; marketplace seller identity is noted where material. `RECENT_OR_INDEXED_LISTING` includes unavailable, used, refurbished, closeout, or otherwise indexed exact-MPN pages. `NOT_FOUND` means this search found no exact-MPN listing; it is not proof that none exists.

### Revised 24-slot matrix

| # | Slot | D-001 candidate | Review | Final proposed candidate | Key configuration | Manufacturer evidence | Target-retailer overlap | Rationale / status |
|---:|---|---|---|---|---|---|---|---|
| 1 | `DDR5-DESKTOP-VALUE-32GB` | `KF556C40BBK2-32` | `REPLACEMENT_CANDIDATE_RECOMMENDED` | Crucial `CP2K16G56C46U5` | 32GB 2×16GB DDR5-5600 CL46, 1.1V, UDIMM | [Crucial](https://eu.crucial.com/memory/ddr5/cp2k16g56c46u5/ct24233221) | Best Buy: `RECENT_OR_INDEXED_LISTING` | Broader value-brand relevance; exact current stocking needs confirmation. `ATLAS_ADMITTED` |
| 2 | `DDR5-DESKTOP-MAINSTREAM-32GB` | `CMK32GX5M2B6000Z30` | `KEEP` | Corsair `CMK32GX5M2B6000Z30` | 32GB 2×16GB DDR5-6000 CL30 | [Corsair](https://www.corsair.com/us/en/p/memory/cmk32gx5m2b6000z30/vengeance-32gb-2x16gb-ddr5-dram-6000mt-s-cl30-amd-expo-memory-black-cmk32gx5m2b6000z30) | Best Buy marketplace: `VERIFIED_CURRENT_LISTING` | Immutable Atlas anchor and strong mainstream relevance. `ATLAS_ADMITTED` |
| 3 | `DDR5-DESKTOP-AMD-PERFORMANCE-32GB` | `F5-6000J3038F16GX2-FX5` | `KEEP` | G.SKILL `F5-6000J3038F16GX2-FX5` | 32GB 2×16GB DDR5-6000 CL30 EXPO | [G.SKILL](https://www.gskill.com/product/165/396/1673491242/F5-6000J3038F16GX2-FX5) | Best Buy marketplace: `VERIFIED_CURRENT_LISTING` | Distinct AMD/EXPO and 33mm use case. `ATLAS_ADMITTED` |
| 4 | `DDR5-DESKTOP-INTEL-PERFORMANCE-32GB` | `KF572C38RSK2-32` | `KEEP` | Kingston `KF572C38RSK2-32` | 32GB 2×16GB DDR5-7200 CL38 XMP | [Kingston](https://www.kingston.com/datasheets/KF572C38RSK2-32.pdf) | `NOT_FOUND` | Unique high-speed Intel slot; no equally evidenced replacement justified solely by diversity. `ATLAS_ADMITTED` |
| 5 | `DDR5-DESKTOP-LOW-PROFILE-32GB` | `KF560C30BBEK2-32` | `REPLACEMENT_CANDIDATE_RECOMMENDED` | TeamGroup `CTCED532G6000HC30DC01` | 32GB 2×16GB DDR5-6000 CL30, 1.35V, low-profile heat spreader | [TeamGroup](https://www.teamgroupinc.com/en/product-detail/memory/T-CREATE/expert-u-dimm-ddr5-black/expert-u-dimm-ddr5-black-CTCED532G6000HC38GDC01/) | Best Buy marketplace: `VERIFIED_CURRENT_LISTING`; B&H exact-MPN literature: `RECENT_OR_INDEXED_LISTING` | Adds a credible low-profile creator-oriented product and a fifth DDR5 brand. `ATLAS_ADMITTED` |
| 6 | `DDR5-DESKTOP-MAINSTREAM-64GB` | `KF556C40BBK2-64` | `REPLACEMENT_CANDIDATE_RECOMMENDED` | Crucial `CP2K32G56C46U5` | 64GB 2×32GB DDR5-5600 CL46, 1.1V, UDIMM | [Crucial](https://eu.crucial.com/content/crucial/en-eu/home/memory.html/ddr5/cp2k32g56c46u5.html) | Best Buy: `VERIFIED_CURRENT_LISTING`; Micro Center: `VERIFIED_CURRENT_LISTING`; B&H: `RECENT_OR_INDEXED_LISTING` | Strong multi-retailer overlap and mainstream high-capacity positioning. `ATLAS_ADMITTED` |
| 7 | `DDR5-DESKTOP-PERFORMANCE-64GB` | `KF560C30BBEK2-64` | `REPLACEMENT_CANDIDATE_RECOMMENDED` | G.SKILL `F5-6000J3040G32GX2-TZ5N` | 64GB 2×32GB DDR5-6000 CL30, EXPO + XMP | [G.SKILL](https://www.gskill.com/specification/165/393/1665020366/F5-6000J3040G32GX2-TZ5N-Specification) | Best Buy marketplace: `VERIFIED_CURRENT_LISTING` | More differentiated AMD-performance comparison at 64GB. `ATLAS_ADMITTED` |
| 8 | `DDR5-DESKTOP-HIGH-CAPACITY-96GB` | `KF560C32RSK2-96` | `REPLACEMENT_CANDIDATE_RECOMMENDED` | Corsair `CMK96GX5M2B6000C30` | 96GB 2×48GB DDR5-6000 30-36-36-76, 1.4V | [Corsair](https://www.corsair.com/de/de/p/memory/CMK96GX5M2B6000C30/vengeance-96gb-2x48gb-ddr5-dram-6000mt-s-cl30-memory-kit-black-cmk96gx5m2b6000c30) | Best Buy marketplace: `VERIFIED_CURRENT_LISTING` | More recognizable high-capacity launch comparison with exact evidence. `ATLAS_ADMITTED` |
| 9 | `DDR5-DESKTOP-SINGLE-32GB` | `KVR56U46BD8-32` | `REPLACEMENT_CANDIDATE_RECOMMENDED` | Crucial `CT32G56C46U5` | 32GB 1×32GB DDR5-5600 CL46, 1.1V, UDIMM | [Crucial](https://eu.crucial.com/memory/ddr5/ct32g56c46u5/ct24929039) | Best Buy marketplace: `VERIFIED_CURRENT_LISTING`; Adorama index: `RECENT_OR_INDEXED_LISTING` | Consumer-recognizable JEDEC single-module alternative with observed overlap. `ATLAS_ADMITTED` |
| 10 | `DDR4-DESKTOP-VALUE-16GB` | `KF432C16BBK2/16` | `KEEP` | Kingston `KF432C16BBK2/16` | 16GB 2×8GB DDR4-3200 CL16 | [Kingston](https://www.kingston.com/en/memory/search?partid=KF432C16BBK2%2F16) | Best Buy marketplace: `RECENT_OR_INDEXED_LISTING` | Suitable finite value kit; replacement would add little distinct value. `ATLAS_ADMITTED` |
| 11 | `DDR4-DESKTOP-MAINSTREAM-32GB` | `KF432C16BBK2/32` | `REPLACEMENT_CANDIDATE_RECOMMENDED` | G.SKILL `F4-3200C16D-32GVK` | 32GB 2×16GB DDR4-3200 16-18-18-38 | [G.SKILL](https://www.gskill.com/tw/specification/203/217/1536110922/F4-3200C16D-32GVK-Specification) | Best Buy marketplace: `VERIFIED_CURRENT_LISTING`; B&H compatibility literature: `RECENT_OR_INDEXED_LISTING` | Widely recognized DDR4 family and stronger brand balance. `ATLAS_ADMITTED` |
| 12 | `DDR4-DESKTOP-PERFORMANCE-32GB` | `KF436C16RB12K2/32` | `KEEP` | Kingston `KF436C16RB12K2/32` | 32GB 2×16GB DDR4-3600 CL16 | [Kingston](https://www.kingston.com/datasheets/KF436C16RB12K2_32.pdf) | `NOT_FOUND` | Exact current manufacturer replacement SKU; preserves low-latency performance distinction. `ATLAS_ADMITTED` |
| 13 | `DDR4-DESKTOP-LOW-PROFILE-32GB` | `CMK32GX4M2E3200C16` | `KEEP` | Corsair `CMK32GX4M2E3200C16` | 32GB 2×16GB DDR4-3200 CL16, 34mm | [Corsair](https://www.corsair.com/us/en/p/memory/cmk32gx4m2e3200c16/vengeance-lpx-32gb-2-x-16gb-ddr4-dram-3200mhz-c16-memory-kit-black-cmk32gx4m2e3200c16) | Best Buy: `VERIFIED_CURRENT_LISTING` | Strong consumer relevance, thousands of indexed reviews, and explicit low-profile design. `ATLAS_ADMITTED` |
| 14 | `DDR4-DESKTOP-MAINSTREAM-64GB` | `KF432C16BBK2/64` | `REPLACEMENT_CANDIDATE_RECOMMENDED` | G.SKILL `F4-3200C16D-64GVK` | 64GB 2×32GB DDR4-3200 CL16 | [G.SKILL QVL/identity](https://www.gskill.com/tw/qvl/203/217/1571733948/F4-3200C16D-64GVK-QVL) | Best Buy: `RECENT_OR_INDEXED_LISTING` | Adds useful 64GB Ripjaws comparison; current new-condition stocking needs confirmation. `NEEDS_MORE_EVIDENCE` |
| 15 | `DDR4-DESKTOP-SINGLE-16GB` | `KVR32N22S8/16` | `REPLACEMENT_CANDIDATE_RECOMMENDED` | Crucial `CT16G4DFRA32A` | 16GB 1×16GB DDR4-3200 CL22, 1.2V | [Crucial](https://www.crucial.com/memory/ddr4/ct16g4dfra32a) | Best Buy: `VERIFIED_CURRENT_LISTING`; Adorama: `VERIFIED_CURRENT_LISTING` | Strong two-retailer overlap for a mainstream upgrade module. `ATLAS_ADMITTED` |
| 16 | `DDR4-DESKTOP-SINGLE-32GB` | `KVR32N22D8/32` | `KEEP` | Kingston `KVR32N22D8/32` | 32GB 1×32GB DDR4-3200 CL22 | [Kingston](https://www.kingston.com/en/memory/search?partId=KVR32N22D8%2F32) | Best Buy index: `VERIFIED_CURRENT_LISTING` | Crucial alternative is explicitly under an EOL path; current Kingston record is safer. `ATLAS_ADMITTED` |
| 17 | `SODIMM-DDR4-SINGLE-8GB` | `KVR32S22S8/8` | `REPLACEMENT_CANDIDATE_RECOMMENDED` | Crucial `CT8G4SFRA32A` | 8GB 1×8GB DDR4-3200 CL22 SODIMM | [Crucial](https://eu.crucial.com/memory/ddr4/ct8g4sfra32a/ct26084342) | Best Buy: `VERIFIED_CURRENT_LISTING`; Adorama: `RECENT_OR_INDEXED_LISTING` | Better observed portfolio overlap for an entry laptop upgrade. `ATLAS_ADMITTED` |
| 18 | `SODIMM-DDR4-SINGLE-16GB` | `KVR32S22S8/16` | `KEEP` | Kingston `KVR32S22S8/16` | 16GB 1×16GB DDR4-3200 CL22 SODIMM | [Kingston](https://www.kingston.com/en/memory/search?partid=KVR32S22S8%2F16) | `NOT_FOUND` | Preserves manufacturer diversity within SODIMM and exact current identity. `ATLAS_ADMITTED` |
| 19 | `SODIMM-DDR4-SINGLE-32GB` | `KVR32S22D8/32` | `REPLACEMENT_CANDIDATE_RECOMMENDED` | Crucial `CT32G4SFD832A` | 32GB 1×32GB DDR4-3200 CL22 SODIMM | [Crucial](https://www.crucial.com/memory/ddr4/ct32g4sfd832a/ct20417901) | B&H: `RECENT_OR_INDEXED_LISTING` | Recognizable laptop-upgrade candidate; current stocking needs confirmation. `NEEDS_MORE_EVIDENCE` |
| 20 | `SODIMM-DDR4-KIT-32GB` | `KF432S20IBK2/32` | `REPLACEMENT_CANDIDATE_RECOMMENDED` | G.SKILL `F4-3200C22D-32GRS` | 32GB 2×16GB DDR4-3200 CL22 SODIMM | [G.SKILL](https://www.gskill.com/specification/2/197/1594019162/F4-3200C22D-32GRS-Specification) | Best Buy marketplace: `VERIFIED_CURRENT_LISTING` | Adds a distinct laptop-focused brand with a current exact listing. `ATLAS_ADMITTED` |
| 21 | `SODIMM-DDR5-SINGLE-16GB` | `KVR56S46BS8-16` | `REPLACEMENT_CANDIDATE_RECOMMENDED` | Crucial `CT16G56C46S5` | 16GB 1×16GB DDR5-5600 46-45-45 SODIMM | [Crucial](https://www.crucial.com/memory/ddr5/ct16g56c46s5) | Best Buy marketplace: `VERIFIED_CURRENT_LISTING`; Adorama: `VERIFIED_CURRENT_LISTING` | Two-retailer overlap and a mainstream laptop-upgrade identity. `ATLAS_ADMITTED` |
| 22 | `SODIMM-DDR5-SINGLE-32GB` | `KVR56S46BD8-32` | `REPLACEMENT_CANDIDATE_RECOMMENDED` | Corsair `CMSX32GX5M1A5600C48` | 32GB 1×32GB DDR5-5600 48-48-48-90 SODIMM | [Corsair](https://www.corsair.com/es/es/p/memory/cmsx32gx5m1a5600c48/vengeance-ddr5-sodimm-32gb-1x32gb-ddr5-5600mts-cl48-cmsx32gx5m1a5600c48) | Best Buy: `VERIFIED_CURRENT_LISTING` | Adds a recognizable fourth SODIMM manufacturer with local pickup visibility. `ATLAS_ADMITTED` |
| 23 | `SODIMM-DDR5-KIT-32GB` | `KF556S40IBK2-32` | `REPLACEMENT_CANDIDATE_RECOMMENDED` | G.SKILL `F5-5600S4040A16GX2-RS` | 32GB 2×16GB DDR5-5600 40-40-40-89 SODIMM | [G.SKILL](https://www.gskill.com/tw/specification/57/385/1683883142/F5-5600S4040A16GX2-RS-Specification) | Best Buy marketplace: `VERIFIED_CURRENT_LISTING` | Distinct 32GB performance-laptop kit and improved category diversity. `ATLAS_ADMITTED` |
| 24 | `SODIMM-DDR5-KIT-64GB` | `KF556S40IBK2-64` | `KEEP` | Kingston `KF556S40IBK2-64` | 64GB 2×32GB DDR5-5600 CL40 SODIMM | [Kingston](https://www.kingston.com/datasheets/KF556S40IBK2-64.pdf) | Best Buy: `VERIFIED_CURRENT_LISTING` | Strong high-capacity kit visibility and useful Kingston representation. `ATLAS_ADMITTED` |

### Distribution and retailer findings

| Measure | D-001 baseline | D-001A proposal |
|---|---:|---:|
| Kingston | 21 | 6 |
| Corsair | 2 | 4 |
| G.SKILL | 1 | 6 |
| Crucial | 0 | 7 |
| TeamGroup | 0 | 1 |

Category diversity becomes five manufacturers in DDR5 desktop (Crucial, Corsair, G.SKILL, Kingston, TeamGroup), four in DDR4 desktop (Kingston, G.SKILL, Corsair, Crucial), and four in SODIMM (Crucial, Kingston, G.SKILL, Corsair).

Three final candidates have no exact target-retailer listing found: `KF572C38RSK2-32`, `KF436C16RB12K2/32`, and `KVR32S22S8/16`. Seven have evidence across at least two target-retailer surfaces: `CTCED532G6000HC30DC01`, `CP2K32G56C46U5`, `CT32G56C46U5`, `F4-3200C16D-32GVK`, `CT16G4DFRA32A`, `CT8G4SFRA32A`, and `CT16G56C46S5` (literature/index evidence is included only as `RECENT_OR_INDEXED_LISTING`). Retailer pages syndicated from another retailer remain one target-retailer surface, not two independent sellers.

Lifecycle concerns remain for `F4-3200C16D-64GVK` and `CT32G4SFD832A`, whose observed target-retailer pages are unavailable/refurbished rather than clearly current new stock; both remain `NEEDS_MORE_EVIDENCE`. The Crucial `CT32G4DFD832A` desktop alternative was rejected because Crucial places it under an EOL path, so `KVR32N22D8/32` is retained. Absence from a manufacturer page is not otherwise treated as lifecycle evidence.

## 9. Revised coverage and disposition summary

| Category | Slots represented | `ATLAS_ADMITTED` | `NEEDS_MORE_EVIDENCE` | `REJECTED` | Unresolved |
|---|---:|---:|---:|---:|---:|
| DDR5 desktop | 9 | 9 | 0 | 0 | 0 |
| DDR4 desktop | 7 | 6 | 1 | 0 | 0 |
| Laptop/SODIMM | 8 | 7 | 1 | 0 | 0 |
| **Total** | **24** | **22** | **2** | **0** | **0** |

The matrix covers value, mainstream, AMD and Intel performance, low-profile, high-capacity, single-module, multi-module kit, desktop DDR4/DDR5, and SODIMM DDR4/DDR5 use cases. All 24 capacity equations reconcile. Catalog resolution does not satisfy A-001’s separate publication-ready or public-offer coverage floors.

## 10. Explicit non-authority

D-001 creates no Atlas product, retailer identity, Mercury evidence, acquisition plan, rights profile, historical/canonical observation, review decision, current-market qualification, publication state, Current Price, Cheapest, Pick, or affiliate authority. The proposed catalog stops at operator review.

## 11. D-002 Atlas fixture certification

D-002 fixture certification validated the 21 new candidates as one proposed Atlas batch. D-002B subsequently admitted that exact authorized batch through the repository-native source-controlled Atlas model. The existing Corsair anchor was excluded from creation, and `F4-3200C16D-64GVK` plus `CT32G4SFD832A` remain excluded pending evidence. The canonical batch passes the current Atlas product validator and all active Sentinel RAM rules, including capacity, kit-state, unknown-value, timing, and unit normalization checks. Exact MPN punctuation is preserved, deterministic candidate IDs are unique, DDR5 consumer records use `ON_DIE_ONLY` rather than system-level ECC, and no retailer or market-authority fields are present.

D-002A established reviewed canonical brand records for Crucial, G.SKILL, Kingston, and TeamGroup alongside the unchanged Corsair record. D-002B used explicit operator authorization to register the 21 fixture-identical products. Atlas now represents 22 of 24 launch slots, exceeding A-001's 18-product Atlas floor. This is hardware-knowledge coverage only; it creates no market observation, public offer, publication, Current Price, Cheapest, or Pick authority.

| State | Count |
|---|---:|
| Existing Atlas launch anchor | 1 |
| Canonical launch brands registered | 5 |
| New product records fixture-certified and admitted | 21 |
| Production Atlas launch products after D-002B | 22 |
| Candidates still pending evidence | 2 |
| Launch-slot Atlas coverage | 22 of 24 |
