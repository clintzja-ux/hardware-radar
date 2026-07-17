import { createAtlasTemplate } from "./ForgeTemplates.js";

export class AtlasProductBuilder {
    build({
        input,
        productId,
        timestamp
    }) {
        this.assertBuildContext({
            input,
            productId,
            timestamp
        });

        const atlasProduct = createAtlasTemplate();

        this.populateIdentity({
            atlasProduct,
            input,
            productId
        });

        this.populateRamSpecifications({
            atlasProduct,
            input
        });

        this.populateMetadata({
            atlasProduct,
            input,
            timestamp
        });

        return atlasProduct;
    }

    populateIdentity({
        atlasProduct,
        input,
        productId
    }) {
        atlasProduct.id = productId;
        atlasProduct.category = input.category;
        atlasProduct.subcategory = input.subcategory;
        atlasProduct.brandId = input.brandId;

        atlasProduct.series =
            input.ram?.memory?.series || null;

        atlasProduct.name = input.productName;
        atlasProduct.model =
            input.manufacturerPartNumber;

        atlasProduct.manufacturerPartNumber =
            input.manufacturerPartNumber;

        atlasProduct.officialProductUrl =
            input.manufacturerUrl;
    }

    populateRamSpecifications({
        atlasProduct,
        input
    }) {
        const ram = input.ram;

        if (!ram) {
            return;
        }

        atlasProduct.specifications = {
            memory: this.buildMemorySpecifications(
                ram.memory
            ),

            performance:
                this.buildPerformanceSpecifications(
                    ram.performance
                ),

            physical: this.buildPhysicalSpecifications(
                ram.physical
            ),

            technology:
                this.buildTechnologySpecifications(
                    ram.technology
                )
        };
    }

    buildMemorySpecifications(memory = {}) {
        return {
            generation: memory.generation || null,
            capacityGB: memory.capacityGB,
            moduleCount: memory.moduleCount,
            capacityPerModuleGB:
                memory.capacityPerModuleGB,
            formFactor: memory.formFactor || null
        };
    }

    buildPerformanceSpecifications(
        performance = {}
    ) {
        return {
            speedMTs: performance.speedMTs,
            casLatency: performance.casLatency,

            timings: {
                tCL: performance.timings?.tCL,
                tRCD: performance.timings?.tRCD,
                tRP: performance.timings?.tRP,
                tRAS: performance.timings?.tRAS
            },

            testedVoltage:
                performance.testedVoltage
        };
    }

    buildPhysicalSpecifications(physical = {}) {
        return {
            moduleHeightMM:
                physical.moduleHeightMM,

            heatSpreader:
                Boolean(physical.heatSpreader),

            color: physical.color || null
        };
    }

    buildTechnologySpecifications(
        technology = {}
    ) {
        const xmpSupported =
            Boolean(technology.xmp?.supported);

        const expoSupported =
            Boolean(technology.expo?.supported);

        return {
            xmp: {
                supported: xmpSupported,

                version: xmpSupported
                    ? technology.xmp?.version || null
                    : null
            },

            expo: {
                supported: expoSupported,

                version: expoSupported
                    ? technology.expo?.version || null
                    : null
            },

            ecc: Boolean(technology.ecc),

            registered:
                Boolean(technology.registered),

            buffered:
                Boolean(technology.buffered),

            onDieEcc:
                Boolean(technology.onDieEcc)
        };
    }

    populateMetadata({
        atlasProduct,
        input,
        timestamp
    }) {
        atlasProduct.metadata.createdAt = timestamp;
        atlasProduct.metadata.updatedAt = timestamp;

        atlasProduct.metadata.sourceReferences =
            this.createSourceReferences(input);
    }

    createSourceReferences(input) {
        return [
            input.manufacturerUrl,
            input.retailerUrl
        ].filter(Boolean);
    }

    assertBuildContext({
        input,
        productId,
        timestamp
    }) {
        if (!input || typeof input !== "object") {
            throw new TypeError(
                "AtlasProductBuilder requires valid Forge input."
            );
        }

        if (!productId) {
            throw new Error(
                "AtlasProductBuilder requires a product ID."
            );
        }

        if (!timestamp) {
            throw new Error(
                "AtlasProductBuilder requires a timestamp."
            );
        }
    }
}