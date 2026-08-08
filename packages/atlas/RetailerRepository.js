import { validateRetailerRepository } from "./RetailerValidator.js";

const DEFAULT_MANIFEST_URL = new URL("./atlas-manifest.json", import.meta.url);

function deepFreeze(value) {
    if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
    return value;
}

async function defaultReadJson(resource) {
    const response = await fetch(resource);
    if (!response.ok) throw new Error(`Atlas resource request failed (${response.status}): ${resource}`);
    return response.json();
}

function normalizeLookup(value, fieldName) {
    if (typeof value !== "string" || value.trim().length === 0) throw new TypeError(`${fieldName} must be a non-empty string.`);
    return value.trim().toLowerCase();
}

export class RetailerRepository {
    constructor({ manifestUrl = DEFAULT_MANIFEST_URL, readJson = defaultReadJson } = {}) {
        this.manifestUrl = manifestUrl instanceof URL ? manifestUrl : new URL(manifestUrl, DEFAULT_MANIFEST_URL);
        this.readJson = readJson;
        this.manifestPromise = null;
        this.retailerPromises = new Map();
        this.allRetailersPromise = null;
    }

    async getManifest() {
        if (!this.manifestPromise) {
            this.manifestPromise = Promise.resolve(this.readJson(this.manifestUrl)).then((manifest) => {
                if (!manifest || typeof manifest !== "object" || !Array.isArray(manifest.retailers)) throw new TypeError("Atlas manifest must contain a retailers array.");
                return deepFreeze(manifest);
            }).catch((error) => { this.manifestPromise = null; throw error; });
        }
        return this.manifestPromise;
    }

    async listRetailerEntries() {
        const manifest = await this.getManifest();
        return deepFreeze(manifest.retailers.map((entry) => ({ ...entry })));
    }

    async loadRetailer(retailerId) {
        normalizeLookup(retailerId, "retailerId");
        const cacheKey = retailerId.trim().toLowerCase();
        if (!this.retailerPromises.has(cacheKey)) {
            const promise = this.getManifest().then((manifest) => {
                const entry = manifest.retailers.find((candidate) => candidate.retailerId?.toLowerCase() === cacheKey);
                if (!entry) throw new Error(`Atlas retailer not found: ${retailerId}`);
                return this.readJson(new URL(entry.path, this.manifestUrl));
            }).then((retailer) => {
                if (retailer?.id?.toLowerCase() !== cacheKey) throw new Error(`Atlas manifest identity mismatch for ${retailerId}.`);
                return deepFreeze(retailer);
            }).catch((error) => { this.retailerPromises.delete(cacheKey); throw error; });
            this.retailerPromises.set(cacheKey, promise);
        }
        return this.retailerPromises.get(cacheKey);
    }

    async load() { return this.getAll(); }
    async getAll() {
        if (!this.allRetailersPromise) {
            this.allRetailersPromise = this.listRetailerEntries().then((entries) => Promise.all(entries.map((entry) => this.loadRetailer(entry.retailerId)))).then(deepFreeze).catch((error) => { this.allRetailersPromise = null; throw error; });
        }
        return this.allRetailersPromise;
    }
    async getById(retailerId) { return this.loadRetailer(retailerId); }
    async getBySlug(slug) {
        const normalized = normalizeLookup(slug, "slug");
        return (await this.getAll()).find((retailer) => retailer.slug.toLowerCase() === normalized) ?? null;
    }
    async getByName(name) {
        const normalized = normalizeLookup(name, "name");
        return (await this.getAll()).find((retailer) => retailer.name.toLowerCase() === normalized) ?? null;
    }
    async exists(retailerId) {
        const normalized = normalizeLookup(retailerId, "retailerId");
        return (await this.getManifest()).retailers.some((entry) => entry.retailerId?.toLowerCase() === normalized);
    }
    async search(query) {
        const normalized = normalizeLookup(query, "query");
        return deepFreeze((await this.getAll()).filter((retailer) => [retailer.id, retailer.slug, retailer.name, retailer.websiteUrl, ...retailer.regions, ...retailer.supportedCurrencies].some((value) => value.toLowerCase().includes(normalized))));
    }
    async validate() { return validateRetailerRepository(await this.getAll()); }
    reload() { this.clearCache(); return this.getAll(); }
    clearCache() { this.manifestPromise = null; this.retailerPromises.clear(); this.allRetailersPromise = null; }
}

const defaultRepository = new RetailerRepository();
export function loadRetailer(retailerId) { return defaultRepository.loadRetailer(retailerId); }
export function loadAllRetailers() { return defaultRepository.getAll(); }
export function listRetailerEntries() { return defaultRepository.listRetailerEntries(); }
export default defaultRepository;
