import RetailerAdapter from "../interfaces/RetailerAdapter.js";
import { normalizeAmazonOffer } from "./AmazonNormalizer.js";
import AMAZON_ADAPTER_MANIFEST from "./manifest.js";

export class AmazonAdapter extends RetailerAdapter {
    getMetadata() {
        return AMAZON_ADAPTER_MANIFEST;
    }

    supportsMarketplace(marketplace) {
        if (typeof marketplace !== "string") return false;
        return AMAZON_ADAPTER_MANIFEST.marketplaces.includes(marketplace.trim().toLowerCase());
    }

    supportsSourceMethod(sourceMethod) {
        if (typeof sourceMethod !== "string") return false;
        return AMAZON_ADAPTER_MANIFEST.sourceMethods.includes(sourceMethod.trim().toUpperCase());
    }

    normalize(input, context = {}) {
        if (context.marketplace && !this.supportsMarketplace(context.marketplace)) {
            throw new Error(`Amazon adapter does not support marketplace: ${context.marketplace}`);
        }
        if (!this.supportsSourceMethod(context.sourceMethod)) {
            throw new Error(`Amazon adapter does not support source method: ${context.sourceMethod}`);
        }
        return normalizeAmazonOffer(input, context);
    }
}

export default new AmazonAdapter();
