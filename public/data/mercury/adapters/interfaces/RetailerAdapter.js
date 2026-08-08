/**
 * Canonical Mercury retailer-adapter contract.
 *
 * Adapters translate retailer-specific representations into canonical Mercury
 * observation candidates. They MUST NOT decide whether market data is trusted,
 * publishable, fresh, or high-confidence; those decisions belong downstream.
 */
export class RetailerAdapter {
    getMetadata() {
        throw new Error("RetailerAdapter.getMetadata() must be implemented.");
    }

    supportsMarketplace(_marketplace) {
        throw new Error("RetailerAdapter.supportsMarketplace() must be implemented.");
    }

    supportsSourceMethod(_sourceMethod) {
        throw new Error("RetailerAdapter.supportsSourceMethod() must be implemented.");
    }

    normalize(_input, _context = {}) {
        throw new Error("RetailerAdapter.normalize() must be implemented.");
    }
}

export const RETAILER_ADAPTER_REQUIRED_METHODS = Object.freeze([
    "getMetadata",
    "supportsMarketplace",
    "supportsSourceMethod",
    "normalize"
]);

export default RetailerAdapter;
