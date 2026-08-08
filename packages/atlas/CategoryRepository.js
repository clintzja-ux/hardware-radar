import { validateCategoryRepository } from "./CategoryValidator.js";

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

export class CategoryRepository {
    constructor({ manifestUrl = DEFAULT_MANIFEST_URL, readJson = defaultReadJson } = {}) {
        this.manifestUrl = manifestUrl instanceof URL ? manifestUrl : new URL(manifestUrl, DEFAULT_MANIFEST_URL);
        this.readJson = readJson;
        this.manifestPromise = null;
        this.categoryPromises = new Map();
        this.allCategoriesPromise = null;
    }

    async getManifest() {
        if (!this.manifestPromise) {
            this.manifestPromise = Promise.resolve(this.readJson(this.manifestUrl)).then((manifest) => {
                if (!manifest || typeof manifest !== "object" || !Array.isArray(manifest.categories)) throw new TypeError("Atlas manifest must contain a categories array.");
                return deepFreeze(manifest);
            }).catch((error) => { this.manifestPromise = null; throw error; });
        }
        return this.manifestPromise;
    }

    async listCategoryEntries() {
        const manifest = await this.getManifest();
        return deepFreeze(manifest.categories.map((entry) => ({ ...entry })));
    }

    async loadCategory(categoryId) {
        normalizeLookup(categoryId, "categoryId");
        const cacheKey = categoryId.trim().toLowerCase();
        if (!this.categoryPromises.has(cacheKey)) {
            const promise = this.getManifest().then((manifest) => {
                const entry = manifest.categories.find((candidate) => candidate.categoryId?.toLowerCase() === cacheKey);
                if (!entry) throw new Error(`Atlas category not found: ${categoryId}`);
                return this.readJson(new URL(entry.path, this.manifestUrl));
            }).then((category) => {
                if (category?.categoryId?.toLowerCase() !== cacheKey) throw new Error(`Atlas manifest identity mismatch for ${categoryId}.`);
                return deepFreeze(category);
            }).catch((error) => { this.categoryPromises.delete(cacheKey); throw error; });
            this.categoryPromises.set(cacheKey, promise);
        }
        return this.categoryPromises.get(cacheKey);
    }

    async load() { return this.getAll(); }
    async getAll() {
        if (!this.allCategoriesPromise) {
            this.allCategoriesPromise = this.listCategoryEntries().then((entries) => Promise.all(entries.map((entry) => this.loadCategory(entry.categoryId)))).then(deepFreeze).catch((error) => { this.allCategoriesPromise = null; throw error; });
        }
        return this.allCategoriesPromise;
    }
    async getById(categoryId) { return this.loadCategory(categoryId); }
    async getBySlug(slug) {
        const normalized = normalizeLookup(slug, "slug");
        return (await this.getAll()).find((category) => category.slug.toLowerCase() === normalized) ?? null;
    }
    async getByProductType(productType) {
        const normalized = normalizeLookup(productType, "productType");
        return (await this.getAll()).find((category) => category.productTypes.some((value) => value.toLowerCase() === normalized)) ?? null;
    }
    async exists(categoryId) {
        const normalized = normalizeLookup(categoryId, "categoryId");
        return (await this.getManifest()).categories.some((entry) => entry.categoryId?.toLowerCase() === normalized);
    }
    async search(query) {
        const normalized = normalizeLookup(query, "query");
        return deepFreeze((await this.getAll()).filter((category) => [category.categoryId, category.slug, category.displayName, category.shortName, category.description, ...category.aliases, ...category.productTypes].some((value) => value.toLowerCase().includes(normalized))));
    }
    async validate() { return validateCategoryRepository(await this.getAll()); }
    reload() { this.clearCache(); return this.getAll(); }
    clearCache() { this.manifestPromise = null; this.categoryPromises.clear(); this.allCategoriesPromise = null; }
}

const defaultRepository = new CategoryRepository();
export function loadCategory(categoryId) { return defaultRepository.loadCategory(categoryId); }
export function loadAllCategories() { return defaultRepository.getAll(); }
export function listCategoryEntries() { return defaultRepository.listCategoryEntries(); }
export default defaultRepository;
