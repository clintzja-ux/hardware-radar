import RetailerAdapter from "../interfaces/RetailerAdapter.js";
import { normalizeDataForSeoSellerEvidence } from "./DataForSeoSellerNormalizer.js";
import DATAFORSEO_GOOGLE_SHOPPING_ADAPTER_MANIFEST from "./manifest.js";

export class DataForSeoGoogleShoppingAdapter extends RetailerAdapter {
    getMetadata() {
        return DATAFORSEO_GOOGLE_SHOPPING_ADAPTER_MANIFEST;
    }

    supportsMarketplace(marketplace) {
        return typeof marketplace === "string" && DATAFORSEO_GOOGLE_SHOPPING_ADAPTER_MANIFEST.marketplaces.includes(marketplace.trim().toLowerCase());
    }

    supportsSourceMethod(sourceMethod) {
        return typeof sourceMethod === "string" && DATAFORSEO_GOOGLE_SHOPPING_ADAPTER_MANIFEST.sourceMethods.includes(sourceMethod.trim().toUpperCase());
    }

    normalize(input, context = {}) {
        if (!this.supportsMarketplace(context.marketplace)) throw new Error(`DataForSEO adapter does not support marketplace: ${context.marketplace ?? "missing"}`);
        if (!this.supportsSourceMethod(context.sourceMethod)) throw new Error(`DataForSEO adapter does not support source method: ${context.sourceMethod ?? "missing"}`);
        return normalizeDataForSeoSellerEvidence(input, context);
    }
}

export default new DataForSeoGoogleShoppingAdapter();
