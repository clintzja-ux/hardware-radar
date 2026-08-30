import AdapterRegistry from "./registry/AdapterRegistry.js";
import amazonAdapter, { AmazonAdapter } from "./amazon/AmazonAdapter.js";
import dataForSeoGoogleShoppingAdapter, { DataForSeoGoogleShoppingAdapter } from "./dataforseo/DataForSeoGoogleShoppingAdapter.js";

export { RetailerAdapter, RETAILER_ADAPTER_REQUIRED_METHODS } from "./interfaces/RetailerAdapter.js";
export { AdapterRegistry } from "./registry/AdapterRegistry.js";
export { AmazonAdapter, amazonAdapter };
export { normalizeAmazonOffer } from "./amazon/AmazonNormalizer.js";
export { AMAZON_ADAPTER_MANIFEST } from "./amazon/manifest.js";
export { ADAPTER_MANIFEST } from "./adapter-manifest.js";
export {
    ADAPTER_VALIDATOR_VERSION,
    ADAPTER_STATUSES,
    ADAPTER_CAPABILITIES,
    validateAdapter,
    validateAdapterManifest,
    validateAdapterManifestEntry
} from "./AdapterValidator.js";

export const adapterRegistry = new AdapterRegistry([amazonAdapter, dataForSeoGoogleShoppingAdapter]);
export default adapterRegistry;
export { normalizeDataForSeoSellerEvidence } from "./dataforseo/DataForSeoSellerNormalizer.js";
export { DataForSeoGoogleShoppingAdapter, dataForSeoGoogleShoppingAdapter };
export { DATAFORSEO_GOOGLE_SHOPPING_ADAPTER_MANIFEST } from "./dataforseo/manifest.js";
