import { createAtlasTemplate } from "./ForgeTemplates.js";

const BRAND_NAMES = Object.freeze({
    "BRAND-CORSAIR": "Corsair",
    "BRAND-GSKILL": "G.SKILL",
    "BRAND-KINGSTON": "Kingston"
});

export class AtlasProductBuilder {
    build({ input, productId, timestamp, validation, publication }) {
        this.assertBuildContext({ input, productId, timestamp });

        const atlasProduct = createAtlasTemplate();
        const brand = BRAND_NAMES[input.brandId] || input.brandId;
        const slug = this.createSlug(input.productName);
        const memory = input.ram?.memory ?? {};
        const performance = input.ram?.performance ?? {};
        const physical = input.ram?.physical ?? {};
        const technology = input.ram?.technology ?? {};

        atlasProduct.identity = {
            ...atlasProduct.identity,
            atlasProductId: this.createAtlasProductId(productId),
            createdAt: timestamp,
            updatedAt: timestamp,
            brand,
            manufacturer: brand,
            productFamily: memory.series || null,
            series: memory.series || null,
            modelName: input.productName,
            manufacturerPartNumber: input.manufacturerPartNumber,
            displayName: input.productName,
            slug
        };

        atlasProduct.provenance.fieldSources =
            this.createFieldSources(input, timestamp);

        this.populateWorkflowState({
            atlasProduct,
            validation,
            publication,
            timestamp
        });

        atlasProduct.extension.data = {
            classification: this.buildClassification(memory, technology),
            capacity: this.buildCapacity(memory),
            performance: this.buildPerformance(memory, performance, technology),
            electrical: this.buildElectrical(performance, memory),
            physical: this.buildPhysical(physical),
            compatibility: this.buildCompatibility(memory)
        };

        return atlasProduct;
    }

    populateWorkflowState({
        atlasProduct,
        validation = {},
        publication = {},
        timestamp
    }) {
        const publicationStatus = publication.status || "PENDING";
        const engineeringWarnings = validation.engineering?.warnings ?? [];
        const engineeringStatus = validation.valid !== true
            ? "FAIL"
            : engineeringWarnings.length > 0
                ? "WARN"
                : "PASS";

        atlasProduct.governance.publicationStatus = publicationStatus;
        atlasProduct.governance.lifecycleStatus =
            publicationStatus === "READY" ? "ACTIVE" : "DRAFT";
        atlasProduct.governance.engineeringValidationStatus = engineeringStatus;
        atlasProduct.governance.humanReviewRequired = publicationStatus !== "READY";

        atlasProduct.validation.errors = (validation.errors ?? []).map(
            message => ({ code: "FORGE_REQUIRED", message })
        );
        atlasProduct.validation.warnings = (validation.warnings ?? []).map(
            message => ({ code: "FORGE_WARNING", message })
        );
        atlasProduct.validation.validatedAt = timestamp;
    }

    buildClassification(memory, technology) {
        const moduleType = this.normalizeModuleType(memory.formFactor);
        const applicationClass = moduleType === "SO_DIMM" ? "LAPTOP" :
            ["RDIMM", "LRDIMM"].includes(moduleType) ? "SERVER" : "DESKTOP";

        return {
            memoryType: memory.generation || "OTHER",
            formFactor: moduleType === "SO_DIMM" ? "SO_DIMM" : "DIMM",
            applicationClass,
            moduleType,
            buffering: this.normalizeBuffering(moduleType, technology),
            eccType: this.normalizeEccType(technology),
            isKit: Number(memory.moduleCount) > 1,
            gamingPositioning: null,
            workstationPositioning: null,
            serverPositioning: applicationClass === "SERVER"
        };
    }

    buildCapacity(memory) {
        return {
            capacityGb: memory.capacityGB,
            moduleCount: memory.moduleCount,
            capacityPerModuleGb: memory.capacityPerModuleGB,
            rankConfiguration: "UNKNOWN",
            chipDensityGb: null,
            organization: null
        };
    }

    buildPerformance(memory, performance, technology) {
        const timings = performance.timings ?? {};
        const primaryTimings = [timings.tCL, timings.tRCD, timings.tRP, timings.tRAS]
            .every(value => Number(value) > 0)
            ? `${timings.tCL}-${timings.tRCD}-${timings.tRP}-${timings.tRAS}`
            : null;

        return {
            dataRateMtps: performance.speedMTs,
            baseJedecDataRateMtps: null,
            speedLabel: `${memory.generation}-${performance.speedMTs}`,
            casLatency: performance.casLatency || null,
            tRcd: timings.tRCD || null,
            tRp: timings.tRP || null,
            tRas: timings.tRAS || null,
            primaryTimings,
            xmpSupport: technology.xmp?.supported ? "PROFILE_INCLUDED" : "NONE",
            expoSupport: technology.expo?.supported ? "PROFILE_INCLUDED" : "NONE",
            jedecProfiles: [],
            overclockProfiles: [],
            testedSpeedMtps: performance.speedMTs || null,
            testedLatencyCl: performance.casLatency || null,
            bandwidthGbps: Number.isFinite(performance.speedMTs)
                ? performance.speedMTs * 8 / 1000
                : null
        };
    }

    buildElectrical(performance, memory) {
        return {
            ratedVoltage: performance.testedVoltage || null,
            baseVoltage: null,
            pmicLocation: "UNKNOWN",
            powerManagementNotes: null
        };
    }

    buildPhysical(physical) {
        return {
            heatSpreader: Boolean(physical.heatSpreader),
            heatSpreaderMaterial: null,
            heightMm: physical.moduleHeightMM,
            lengthMm: null,
            widthMm: null,
            color: physical.color || null,
            rgbLighting: false,
            lightingEcosystem: [],
            lowProfile: null,
            moduleWeightGrams: null,
            kitWeightGrams: null
        };
    }

    buildCompatibility(memory) {
        const platform = memory.formFactor === "SODIMM"
            ? `LAPTOP_${memory.generation}`
            : `DESKTOP_${memory.generation}`;

        return {
            platformCompatibility: [platform],
            chipsetCompatibility: [],
            cpuGenerationCompatibility: [],
            qvlReferences: [],
            requiresBiosSupport: null,
            compatibilityNotes: null
        };
    }

    createFieldSources(input, timestamp) {
        if (!input.manufacturerUrl) {
            return {};
        }

        const source = {
            sourceId: `SRC-MFG-${input.manufacturerPartNumber}`,
            sourceType: "MANUFACTURER_PRODUCT_PAGE",
            sourceLocator: input.manufacturerUrl,
            publisher: BRAND_NAMES[input.brandId] || input.brandId || null,
            publishedDate: null,
            retrievedAt: timestamp,
            verifiedBy: "human:clinton",
            verificationStatus: "VERIFIED",
            notes: null
        };

        return {
            "identity.manufacturerPartNumber": [source],
            "identity.displayName": [{ ...source }],
            "extension.data": [{ ...source }]
        };
    }

    createAtlasProductId(productId) {
        return `ram_${String(productId).toLowerCase().replaceAll(/[^a-z0-9]+/g, "_")}`;
    }

    createSlug(value) {
        return String(value)
            .trim()
            .toLowerCase()
            .replaceAll(/[^a-z0-9]+/g, "-")
            .replaceAll(/^-+|-+$/g, "");
    }

    normalizeModuleType(formFactor) {
        const value = String(formFactor || "").toUpperCase().replace("SODIMM", "SO_DIMM");
        return ["UDIMM", "SO_DIMM", "RDIMM", "LRDIMM", "CUDIMM", "CSODIMM"].includes(value)
            ? value
            : "OTHER";
    }

    normalizeBuffering(moduleType, technology) {
        if (moduleType === "LRDIMM") return "LOAD_REDUCED";
        if (moduleType === "RDIMM" || technology.registered) return "REGISTERED";
        if (technology.buffered) return "UNKNOWN";
        return "UNBUFFERED";
    }

    normalizeEccType(technology) {
        if (technology.ecc) return "SIDEBAND_ECC";
        if (technology.onDieEcc) return "ON_DIE_ONLY";
        return "NONE";
    }

    assertBuildContext({ input, productId, timestamp }) {
        if (!input || typeof input !== "object") {
            throw new TypeError("AtlasProductBuilder requires valid Forge input.");
        }
        if (!productId) {
            throw new Error("AtlasProductBuilder requires a product ID.");
        }
        if (!timestamp) {
            throw new Error("AtlasProductBuilder requires a timestamp.");
        }
    }
}
