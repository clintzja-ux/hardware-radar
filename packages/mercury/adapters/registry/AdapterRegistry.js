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
        const registrations = this.adapters.get(key) ?? [];
        if (registrations.some((registered) => {
            const current = registered.getMetadata();
            return current.retailerId === metadata.retailerId && current.marketplaces.some((marketplace) => metadata.marketplaces.includes(marketplace));
        })) throw new Error(`Duplicate adapter registration: ${metadata.adapterId}`);
        this.adapters.set(key, [...registrations, adapter]);
        return adapter;
    }

    get(adapterId, { retailerId = null, marketplace = null } = {}) {
        const registrations = this.adapters.get(normalize(adapterId, "adapterId")) ?? [];
        if (!registrations.length) return null;
        if (typeof retailerId === "string" && retailerId.trim()) {
            const retailerRegistrations = registrations.filter((adapter) => adapter.getMetadata().retailerId.toLowerCase() === retailerId.trim().toLowerCase());
            if (retailerRegistrations.length) return retailerRegistrations.find((adapter) => typeof marketplace === "string" && adapter.supportsMarketplace(marketplace)) ?? retailerRegistrations[0];
        }
        if (typeof marketplace === "string" && marketplace.trim()) return registrations.find((adapter) => adapter.supportsMarketplace(marketplace)) ?? registrations[0];
        return registrations[0];
    }

    has(adapterId) {
        return this.adapters.has(normalize(adapterId, "adapterId"));
    }

    getAll() {
        return Object.freeze([...this.adapters.values()].flat());
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
