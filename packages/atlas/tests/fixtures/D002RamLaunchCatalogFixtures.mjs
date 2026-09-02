const CERTIFIED_AT = "2026-09-01T00:00:00Z";
const CERTIFIER = "system:d002-fixture-certification";

const candidates = [
    ["DDR5-DESKTOP-VALUE-32GB", "Crucial", "Crucial Pro", "CP2K16G56C46U5", "https://eu.crucial.com/memory/ddr5/cp2k16g56c46u5/ct24233221", "DDR5", "DIMM", "DESKTOP", 32, 2, 16, 5600, null, 1.1, false, false, "UNKNOWN", "UNKNOWN"],
    ["DDR5-DESKTOP-AMD-PERFORMANCE-32GB", "G.SKILL", "Flare X5", "F5-6000J3038F16GX2-FX5", "https://www.gskill.com/product/165/396/1673491242/F5-6000J3038F16GX2-FX5", "DDR5", "DIMM", "DESKTOP", 32, 2, 16, 6000, null, null, true, true, "UNKNOWN", "PROFILE_INCLUDED"],
    ["DDR5-DESKTOP-INTEL-PERFORMANCE-32GB", "Kingston", "FURY Renegade", "KF572C38RSK2-32", "https://www.kingston.com/datasheets/KF572C38RSK2-32.pdf", "DDR5", "DIMM", "DESKTOP", 32, 2, 16, 7200, null, 1.45, true, false, "PROFILE_INCLUDED", "UNKNOWN"],
    ["DDR5-DESKTOP-LOW-PROFILE-32GB", "TeamGroup", "T-CREATE EXPERT", "CTCED532G6000HC30DC01", "https://www.teamgroupinc.com/en/product-detail/memory/T-CREATE/expert-u-dimm-ddr5-black/expert-u-dimm-ddr5-black-CTCED532G6000HC38GDC01/", "DDR5", "DIMM", "DESKTOP", 32, 2, 16, 6000, null, 1.35, true, true, "UNKNOWN", "UNKNOWN"],
    ["DDR5-DESKTOP-MAINSTREAM-64GB", "Crucial", "Crucial Pro", "CP2K32G56C46U5", "https://eu.crucial.com/content/crucial/en-eu/home/memory.html/ddr5/cp2k32g56c46u5.html", "DDR5", "DIMM", "DESKTOP", 64, 2, 32, 5600, null, 1.1, false, false, "UNKNOWN", "UNKNOWN"],
    ["DDR5-DESKTOP-PERFORMANCE-64GB", "G.SKILL", "Trident Z5 Neo", "F5-6000J3040G32GX2-TZ5N", "https://www.gskill.com/specification/165/393/1665020366/F5-6000J3040G32GX2-TZ5N-Specification", "DDR5", "DIMM", "DESKTOP", 64, 2, 32, 6000, null, null, true, false, "PROFILE_INCLUDED", "PROFILE_INCLUDED"],
    ["DDR5-DESKTOP-HIGH-CAPACITY-96GB", "Corsair", "Vengeance", "CMK96GX5M2B6000C30", "https://www.corsair.com/de/de/p/memory/CMK96GX5M2B6000C30/vengeance-96gb-2x48gb-ddr5-dram-6000mt-s-cl30-memory-kit-black-cmk96gx5m2b6000c30", "DDR5", "DIMM", "DESKTOP", 96, 2, 48, 6000, [30, 36, 36, 76], 1.4, true, false, "UNKNOWN", "UNKNOWN"],
    ["DDR5-DESKTOP-SINGLE-32GB", "Crucial", "Crucial", "CT32G56C46U5", "https://eu.crucial.com/memory/ddr5/ct32g56c46u5/ct24929039", "DDR5", "DIMM", "DESKTOP", 32, 1, 32, 5600, null, 1.1, false, false, "UNKNOWN", "UNKNOWN"],
    ["DDR4-DESKTOP-VALUE-16GB", "Kingston", "FURY Beast", "KF432C16BBK2/16", "https://www.kingston.com/en/memory/search?partid=KF432C16BBK2%2F16", "DDR4", "DIMM", "DESKTOP", 16, 2, 8, 3200, null, 1.35, true, false, "PROFILE_INCLUDED", "NONE"],
    ["DDR4-DESKTOP-MAINSTREAM-32GB", "G.SKILL", "Ripjaws V", "F4-3200C16D-32GVK", "https://www.gskill.com/tw/specification/203/217/1536110922/F4-3200C16D-32GVK-Specification", "DDR4", "DIMM", "DESKTOP", 32, 2, 16, 3200, [16, 18, 18, 38], null, true, false, "UNKNOWN", "NONE"],
    ["DDR4-DESKTOP-PERFORMANCE-32GB", "Kingston", "FURY Renegade", "KF436C16RB12K2/32", "https://www.kingston.com/datasheets/KF436C16RB12K2_32.pdf", "DDR4", "DIMM", "DESKTOP", 32, 2, 16, 3600, null, 1.35, true, false, "PROFILE_INCLUDED", "NONE"],
    ["DDR4-DESKTOP-LOW-PROFILE-32GB", "Corsair", "Vengeance LPX", "CMK32GX4M2E3200C16", "https://www.corsair.com/us/en/p/memory/cmk32gx4m2e3200c16/vengeance-lpx-32gb-2-x-16gb-ddr4-dram-3200mhz-c16-memory-kit-black-cmk32gx4m2e3200c16", "DDR4", "DIMM", "DESKTOP", 32, 2, 16, 3200, null, 1.35, true, true, "PROFILE_INCLUDED", "NONE"],
    ["DDR4-DESKTOP-SINGLE-16GB", "Crucial", "Crucial", "CT16G4DFRA32A", "https://www.crucial.com/memory/ddr4/ct16g4dfra32a", "DDR4", "DIMM", "DESKTOP", 16, 1, 16, 3200, null, 1.2, false, false, "UNKNOWN", "NONE"],
    ["DDR4-DESKTOP-SINGLE-32GB", "Kingston", "ValueRAM", "KVR32N22D8/32", "https://www.kingston.com/en/memory/search?partId=KVR32N22D8%2F32", "DDR4", "DIMM", "DESKTOP", 32, 1, 32, 3200, null, 1.2, false, false, "NONE", "NONE"],
    ["SODIMM-DDR4-SINGLE-8GB", "Crucial", "Crucial", "CT8G4SFRA32A", "https://eu.crucial.com/memory/ddr4/ct8g4sfra32a/ct26084342", "DDR4", "SO_DIMM", "LAPTOP", 8, 1, 8, 3200, null, 1.2, false, false, "UNKNOWN", "NONE"],
    ["SODIMM-DDR4-SINGLE-16GB", "Kingston", "ValueRAM", "KVR32S22S8/16", "https://www.kingston.com/en/memory/search?partid=KVR32S22S8%2F16", "DDR4", "SO_DIMM", "LAPTOP", 16, 1, 16, 3200, null, 1.2, false, false, "NONE", "NONE"],
    ["SODIMM-DDR4-KIT-32GB", "G.SKILL", "Ripjaws", "F4-3200C22D-32GRS", "https://www.gskill.com/specification/2/197/1594019162/F4-3200C22D-32GRS-Specification", "DDR4", "SO_DIMM", "LAPTOP", 32, 2, 16, 3200, null, 1.2, false, false, "UNKNOWN", "NONE"],
    ["SODIMM-DDR5-SINGLE-16GB", "Crucial", "Crucial", "CT16G56C46S5", "https://www.crucial.com/memory/ddr5/ct16g56c46s5", "DDR5", "SO_DIMM", "LAPTOP", 16, 1, 16, 5600, null, null, false, false, "UNKNOWN", "UNKNOWN"],
    ["SODIMM-DDR5-SINGLE-32GB", "Corsair", "Vengeance", "CMSX32GX5M1A5600C48", "https://www.corsair.com/es/es/p/memory/cmsx32gx5m1a5600c48/vengeance-ddr5-sodimm-32gb-1x32gb-ddr5-5600mts-cl48-cmsx32gx5m1a5600c48", "DDR5", "SO_DIMM", "LAPTOP", 32, 1, 32, 5600, [48, 48, 48, 90], null, false, false, "UNKNOWN", "UNKNOWN"],
    ["SODIMM-DDR5-KIT-32GB", "G.SKILL", "Ripjaws", "F5-5600S4040A16GX2-RS", "https://www.gskill.com/tw/specification/57/385/1683883142/F5-5600S4040A16GX2-RS-Specification", "DDR5", "SO_DIMM", "LAPTOP", 32, 2, 16, 5600, [40, 40, 40, 89], null, false, false, "UNKNOWN", "UNKNOWN"],
    ["SODIMM-DDR5-KIT-64GB", "Kingston", "FURY Impact", "KF556S40IBK2-64", "https://www.kingston.com/datasheets/KF556S40IBK2-64.pdf", "DDR5", "SO_DIMM", "LAPTOP", 64, 2, 32, 5600, null, 1.1, false, false, "UNKNOWN", "UNKNOWN"]
];

function slugify(value) {
    return value.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/^-+|-+$/g, "");
}

function idPart(value) {
    return value.toLowerCase().replaceAll(/[^a-z0-9]+/g, "_").replaceAll(/^_+|_+$/g, "");
}

function sourceFor(brand, mpn, sourceLocator) {
    return {
        sourceId: `SRC-MFG-${brand.toUpperCase().replaceAll(/[^A-Z0-9]+/g, "-")}-${mpn.toUpperCase().replaceAll(/[^A-Z0-9]+/g, "-")}-D002`,
        sourceType: sourceLocator.endsWith(".pdf") ? "MANUFACTURER_DATASHEET" : "MANUFACTURER_PRODUCT_PAGE",
        sourceLocator,
        publisher: brand,
        publishedDate: null,
        retrievedAt: CERTIFIED_AT,
        verifiedBy: CERTIFIER,
        verificationStatus: "VERIFIED",
        notes: "Manufacturer-controlled identity and specification evidence carried forward from D-001/D-001A research."
    };
}

function buildCandidate([slotId, brand, family, mpn, sourceLocator, memoryType, formFactor, applicationClass, capacityGb, moduleCount, capacityPerModuleGb, dataRateMtps, timings, ratedVoltage, heatSpreader, lowProfile, xmpSupport, expoSupport]) {
    const source = sourceFor(brand, mpn, sourceLocator);
    const moduleType = formFactor === "SO_DIMM" ? "SO_DIMM" : "UDIMM";
    const timingValues = timings ?? [null, null, null, null];
    const displayName = `${brand} ${family} ${memoryType} ${capacityGb}GB (${moduleCount}×${capacityPerModuleGb}GB) ${dataRateMtps} MT/s`;

    return {
        slotId,
        record: {
            identity: {
                atlasProductId: `ram_${idPart(brand)}_${idPart(mpn)}`,
                schemaVersion: "1.0",
                productType: "ram",
                recordRevision: 1,
                createdAt: CERTIFIED_AT,
                updatedAt: CERTIFIED_AT,
                createdBy: CERTIFIER,
                updatedBy: CERTIFIER,
                brand,
                manufacturer: brand,
                productFamily: family,
                series: null,
                modelName: `${family} ${mpn}`,
                manufacturerPartNumber: mpn,
                alternatePartNumbers: [],
                gtin: null,
                upc: null,
                ean: null,
                countryOfOrigin: null,
                displayName,
                slug: slugify(`${brand}-${family}-${mpn}`)
            },
            governance: {
                publicationStatus: "PENDING",
                lifecycleStatus: "DRAFT",
                manufacturerStatus: "UNKNOWN",
                engineeringValidationStatus: "PASS",
                humanReviewRequired: true,
                reviewedBy: null,
                reviewedAt: null,
                changeReason: "D-002 fixture candidate; production Atlas admission requires separate operator review.",
                supersedesRevision: null,
                archivalReason: null,
                launchDate: null,
                discontinuedDate: null,
                replacementAtlasProductId: null,
                predecessorAtlasProductId: null,
                warranty: null
            },
            provenance: {
                fieldSources: {
                    "identity.manufacturerPartNumber": [source],
                    "extension.data.classification": [{ ...source }],
                    "extension.data.capacity": [{ ...source }],
                    "extension.data.performance": [{ ...source }]
                }
            },
            validation: {
                errors: [],
                warnings: [],
                validatedAt: CERTIFIED_AT,
                validatorVersion: "atlas-product-validator/1.0.0+sentinel-ram/1.0.0"
            },
            extension: {
                extensionType: "ram",
                schemaVersion: "1.0",
                data: {
                    classification: {
                        memoryType,
                        formFactor,
                        applicationClass,
                        moduleType,
                        buffering: "UNBUFFERED",
                        eccType: memoryType === "DDR5" ? "ON_DIE_ONLY" : "NONE",
                        isKit: moduleCount > 1,
                        gamingPositioning: null,
                        workstationPositioning: false,
                        serverPositioning: false
                    },
                    capacity: {
                        capacityGb,
                        moduleCount,
                        capacityPerModuleGb,
                        rankConfiguration: "UNKNOWN",
                        chipDensityGb: null,
                        organization: null
                    },
                    performance: {
                        dataRateMtps,
                        baseJedecDataRateMtps: null,
                        speedLabel: `${memoryType}-${dataRateMtps}`,
                        casLatency: timingValues[0],
                        tRcd: timingValues[1],
                        tRp: timingValues[2],
                        tRas: timingValues[3],
                        primaryTimings: timings ? timings.join("-") : null,
                        xmpSupport,
                        expoSupport,
                        jedecProfiles: [],
                        overclockProfiles: [],
                        testedSpeedMtps: null,
                        testedLatencyCl: null,
                        bandwidthGbps: dataRateMtps * 8 / 1000
                    },
                    electrical: {
                        ratedVoltage,
                        baseVoltage: null,
                        pmicLocation: "UNKNOWN",
                        powerManagementNotes: null
                    },
                    physical: {
                        heatSpreader,
                        heatSpreaderMaterial: null,
                        heightMm: null,
                        lengthMm: null,
                        widthMm: null,
                        color: null,
                        rgbLighting: false,
                        lightingEcosystem: [],
                        lowProfile,
                        moduleWeightGrams: null,
                        kitWeightGrams: null
                    },
                    compatibility: {
                        platformCompatibility: [],
                        chipsetCompatibility: [],
                        cpuGenerationCompatibility: [],
                        qvlReferences: [],
                        requiresBiosSupport: null,
                        compatibilityNotes: null
                    }
                }
            }
        }
    };
}

export const D002_BLOCKED_MPNS = Object.freeze(["F4-3200C16D-64GVK", "CT32G4SFD832A"]);
export const D002_EXISTING_ANCHOR_MPN = "CMK32GX5M2B6000Z30";
export const D002_RAM_LAUNCH_CANDIDATES = Object.freeze(candidates.map(buildCandidate));
