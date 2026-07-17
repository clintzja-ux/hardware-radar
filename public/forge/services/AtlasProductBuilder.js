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

        atlasProduct.id = productId;
        atlasProduct.category = input.category;
        atlasProduct.subcategory = input.subcategory;
        atlasProduct.brandId = input.brandId;
        atlasProduct.name = input.productName;
        atlasProduct.model = input.manufacturerPartNumber;
        atlasProduct.manufacturerPartNumber =
            input.manufacturerPartNumber;
        atlasProduct.officialProductUrl =
            input.manufacturerUrl;

        atlasProduct.metadata.createdAt = timestamp;
        atlasProduct.metadata.updatedAt = timestamp;
        atlasProduct.metadata.sourceReferences =
            this.createSourceReferences(input);

        return atlasProduct;
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