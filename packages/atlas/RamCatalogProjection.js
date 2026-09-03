import { validateProduct } from "./ProductValidator.js";

export const RAM_CATALOG_SCHEMA_VERSION = "1.0";
export const RAM_CATALOG_ORDER = "BRAND_MODEL_MPN_ID_ASC";

const freeze = (value) => {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
        Object.freeze(value);
        for (const child of Object.values(value)) freeze(child);
    }
    return value;
};

const compareText = (left, right) => {
    const a = String(left).toLowerCase();
    const b = String(right).toLowerCase();
    return a < b ? -1 : a > b ? 1 : 0;
};

const uniqueSorted = (values, compare = compareText) => [...new Set(values)].sort(compare);

function projectProduct(product) {
    const report = validateProduct(product);
    if (!report.valid) {
        throw new Error(`RAM_CATALOG_ATLAS_PRODUCT_INVALID:${product?.identity?.atlasProductId ?? "UNKNOWN"}`);
    }
    if (product.identity.productType !== "ram" || product.extension.extensionType !== "ram") {
        throw new Error(`RAM_CATALOG_PRODUCT_TYPE_UNSUPPORTED:${product.identity.atlasProductId}`);
    }

    const identity = product.identity;
    const data = product.extension.data;
    const item = {
        atlasProductId: identity.atlasProductId,
        brand: identity.brand,
        productFamily: identity.productFamily,
        modelName: identity.modelName,
        manufacturerPartNumber: identity.manufacturerPartNumber,
        memoryType: data.classification.memoryType,
        capacityGb: data.capacity.capacityGb,
        moduleCount: data.capacity.moduleCount,
        capacityPerModuleGb: data.capacity.capacityPerModuleGb,
        formFactor: data.classification.formFactor,
        dataRateMtps: data.performance.dataRateMtps,
        eccType: data.classification.eccType,
        buffering: data.classification.buffering,
        xmpSupport: data.performance.xmpSupport,
        expoSupport: data.performance.expoSupport
    };
    for (const [key, value] of [
        ["casLatency", data.performance.casLatency],
        ["primaryTimings", data.performance.primaryTimings],
        ["ratedVoltage", data.electrical.ratedVoltage]
    ]) if (value !== null && value !== undefined) item[key] = value;
    return item;
}

export function createRamCatalogProjection(products) {
    if (!Array.isArray(products)) throw new TypeError("RAM_CATALOG_PRODUCTS_REQUIRED");
    const projected = products.map(projectProduct).sort((left, right) =>
        compareText(left.brand, right.brand) ||
        compareText(left.modelName, right.modelName) ||
        compareText(left.manufacturerPartNumber, right.manufacturerPartNumber) ||
        compareText(left.atlasProductId, right.atlasProductId)
    );
    if (new Set(projected.map((item) => item.atlasProductId)).size !== projected.length) {
        throw new Error("RAM_CATALOG_DUPLICATE_PRODUCT_ID");
    }
    return freeze({
        schemaVersion: RAM_CATALOG_SCHEMA_VERSION,
        catalogType: "ATLAS_RAM_PRODUCT_CATALOG",
        productCount: projected.length,
        defaultOrder: RAM_CATALOG_ORDER,
        products: projected,
        filters: {
            brands: uniqueSorted(projected.map((item) => item.brand)),
            memoryTypes: uniqueSorted(projected.map((item) => item.memoryType)),
            capacitiesGb: uniqueSorted(projected.map((item) => item.capacityGb), (a, b) => a - b),
            formFactors: uniqueSorted(projected.map((item) => item.formFactor)),
            moduleCounts: uniqueSorted(projected.map((item) => item.moduleCount), (a, b) => a - b),
            dataRatesMtps: uniqueSorted(projected.map((item) => item.dataRateMtps), (a, b) => a - b)
        }
    });
}

export default createRamCatalogProjection;
