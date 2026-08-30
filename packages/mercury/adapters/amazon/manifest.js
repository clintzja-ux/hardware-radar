export const AMAZON_ADAPTER_MANIFEST = Object.freeze({
    adapterId: "mer_adapter_amazon_us",
    version: "1.1.0",
    retailerId: "RETAILER-0001",
    retailerName: "Amazon",
    marketplaces: Object.freeze(["amazon.com"]),
    sourceMethods: Object.freeze(["MANUAL", "IMPORT", "API"]),
    compatibleNormalizationVersions: Object.freeze(["1.1.0", "1.0.0", "manual-1.0"]),
    capabilities: Object.freeze(["NORMALIZE_OFFER"]),
    status: "ACTIVE"
});

export default AMAZON_ADAPTER_MANIFEST;
