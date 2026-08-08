import { validateAdapter } from "../AdapterValidator.js";

function normalize(value, field) {
    if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${field} must be a non-empty string.`);
    return value.trim().toLowerCase();
}

export class AdapterRegistry {
    constructor(adapters = []) {
        this.adapters = new Map();
        for (const adapter of adapters) this.register(adapter);
    }

    register(adapter) {
        const report = validateAdapter(adapter);
        if (!report.valid) throw new TypeError(`Invalid retailer adapter: ${report.errors.map((error) => error.code).join(", ")}`);
        const metadata = adapter.getMetadata();
        const key = normalize(metadata.adapterId, "adapterId");
        if (this.adapters.has(key)) throw new Error(`Duplicate adapter registration: ${metadata.adapterId}`);
        this.adapters.set(key, adapter);
        return adapter;
    }

    get(adapterId) {
        return this.adapters.get(normalize(adapterId, "adapterId")) ?? null;
    }

    has(adapterId) {
        return this.adapters.has(normalize(adapterId, "adapterId"));
    }

    getAll() {
        return Object.freeze([...this.adapters.values()]);
    }

    getByRetailerId(retailerId) {
        const target = normalize(retailerId, "retailerId");
        return Object.freeze(this.getAll().filter((adapter) => adapter.getMetadata().retailerId.toLowerCase() === target));
    }

    getByMarketplace(marketplace) {
        return Object.freeze(this.getAll().filter((adapter) => adapter.supportsMarketplace(marketplace)));
    }

    getByCapability(capability) {
        const target = normalize(capability, "capability").toUpperCase();
        return Object.freeze(this.getAll().filter((adapter) => adapter.getMetadata().capabilities.includes(target)));
    }

    getByVersion(version) {
        const target = normalize(version, "version");
        return Object.freeze(this.getAll().filter((adapter) => adapter.getMetadata().version.toLowerCase() === target));
    }
}

export default AdapterRegistry;
