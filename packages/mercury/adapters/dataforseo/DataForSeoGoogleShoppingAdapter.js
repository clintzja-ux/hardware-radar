import RetailerAdapter from "../interfaces/RetailerAdapter.js";
import { normalizeDataForSeoSellerEvidence } from "./DataForSeoSellerNormalizer.js";
import DATAFORSEO_GOOGLE_SHOPPING_ADAPTER_MANIFEST, { DATAFORSEO_GOOGLE_SHOPPING_MEMORYC_ADAPTER_MANIFEST } from "./manifest.js";

export class DataForSeoGoogleShoppingAdapter extends RetailerAdapter {
    constructor({ manifest = DATAFORSEO_GOOGLE_SHOPPING_ADAPTER_MANIFEST } = {}) {
        super();
        this.manifest = manifest;
    }

    getMetadata() {
        return this.manifest;
    }

    supportsMarketplace(marketplace) {
        return typeof marketplace === "string" && this.manifest.marketplaces.includes(marketplace.trim().toLowerCase());
    }

    supportsSourceMethod(sourceMethod) {
        return typeof sourceMethod === "string" && this.manifest.sourceMethods.includes(sourceMethod.trim().toUpperCase());
    }

    normalize(input, context = {}) {
        if (!this.supportsMarketplace(context.marketplace)) throw new Error(`DataForSEO adapter does not support marketplace: ${context.marketplace ?? "missing"}`);
        if (!this.supportsSourceMethod(context.sourceMethod)) throw new Error(`DataForSEO adapter does not support source method: ${context.sourceMethod ?? "missing"}`);
        return normalizeDataForSeoSellerEvidence(input, context);
    }
}

export const dataForSeoGoogleShoppingAdapter = new DataForSeoGoogleShoppingAdapter();
export const memoryCDataForSeoGoogleShoppingAdapter = new DataForSeoGoogleShoppingAdapter({ manifest: DATAFORSEO_GOOGLE_SHOPPING_MEMORYC_ADAPTER_MANIFEST });
export default dataForSeoGoogleShoppingAdapter;
