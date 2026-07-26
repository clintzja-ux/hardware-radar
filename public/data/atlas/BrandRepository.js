import { validateBrandRepository } from "./BrandValidator.js";

const DEFAULT_MANIFEST_URL = new URL("./atlas-manifest.json", import.meta.url);

function deepFreeze(value) {
    if (value === null || typeof value !== "object" || Object.isFrozen(value)) {
        return value;
    }

    Object.freeze(value);

    for (const child of Object.values(value)) {
        deepFreeze(child);
    }

    return value;
}

async function defaultReadJson(resource) {
    const response = await fetch(resource);

    if (!response.ok) {
        throw new Error(`Atlas resource request failed (${response.status}): ${resource}`);
    }

    return response.json();
}

function normalizeManifest(manifest) {
    if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
        throw new TypeError("Atlas manifest must be a JSON object.");
    }

    if (!Array.isArray(manifest.brands)) {
        throw new TypeError("Atlas manifest must contain a brands array.");
    }

    return manifest;
}

function resolveBrandUrl(manifestUrl, brandPath) {
    if (typeof brandPath !== "string" || brandPath.length === 0) {
        throw new TypeError("Atlas manifest brand entries require a non-empty path.");
    }

    return new URL(brandPath, manifestUrl);
}

function normalizeLookup(value, fieldName) {
    if (typeof value !== "string" || value.trim().length === 0) {
        throw new TypeError(`${fieldName} must be a non-empty string.`);
    }

    return value.trim().toLowerCase();
}

export class BrandRepository {
    constructor({ manifestUrl = DEFAULT_MANIFEST_URL, readJson = defaultReadJson } = {}) {
        this.manifestUrl = manifestUrl instanceof URL
            ? manifestUrl
            : new URL(manifestUrl, DEFAULT_MANIFEST_URL);
        this.readJson = readJson;
        this.manifestPromise = null;
        this.brandPromises = new Map();
        this.allBrandsPromise = null;
    }

    async getManifest() {
        if (!this.manifestPromise) {
            this.manifestPromise = Promise.resolve(this.readJson(this.manifestUrl))
                .then(normalizeManifest)
                .then(deepFreeze)
                .catch((error) => {
                    this.manifestPromise = null;
                    throw error;
                });
        }

        return this.manifestPromise;
    }

    async listBrandEntries() {
        const manifest = await this.getManifest();
        return deepFreeze(manifest.brands.map((entry) => ({ ...entry })));
    }

    async loadBrand(brandId) {
        normalizeLookup(brandId, "brandId");

        if (!this.brandPromises.has(brandId)) {
            const brandPromise = this.getManifest()
                .then((manifest) => {
                    const normalizedId = brandId.toLowerCase();
                    const entry = manifest.brands.find(
                        (candidate) => candidate.brandId?.toLowerCase() === normalizedId
                    );

                    if (!entry) {
                        throw new Error(`Atlas brand not found: ${brandId}`);
                    }

                    return this.readJson(resolveBrandUrl(this.manifestUrl, entry.path));
                })
                .then((brand) => {
                    if (brand?.brandId?.toLowerCase() !== brandId.toLowerCase()) {
                        throw new Error(`Atlas manifest identity mismatch for ${brandId}.`);
                    }

                    return deepFreeze(brand);
                })
                .catch((error) => {
                    this.brandPromises.delete(brandId);
                    throw error;
                });

            this.brandPromises.set(brandId, brandPromise);
        }

        return this.brandPromises.get(brandId);
    }

    async load() {
        return this.getAll();
    }

    async getAll() {
        if (!this.allBrandsPromise) {
            this.allBrandsPromise = this.listBrandEntries()
                .then((entries) => Promise.all(entries.map((entry) => this.loadBrand(entry.brandId))))
                .then(deepFreeze)
                .catch((error) => {
                    this.allBrandsPromise = null;
                    throw error;
                });
        }

        return this.allBrandsPromise;
    }

    async getById(brandId) {
        return this.loadBrand(brandId);
    }

    async getBySlug(slug) {
        const normalized = normalizeLookup(slug, "slug");
        const brands = await this.getAll();
        return brands.find((brand) => brand.slug.toLowerCase() === normalized) ?? null;
    }

    async getByDisplayName(displayName) {
        const normalized = normalizeLookup(displayName, "displayName");
        const brands = await this.getAll();
        return brands.find((brand) => brand.displayName.toLowerCase() === normalized) ?? null;
    }

    async exists(brandId) {
        normalizeLookup(brandId, "brandId");
        const manifest = await this.getManifest();
        const normalized = brandId.trim().toLowerCase();
        return manifest.brands.some((entry) => entry.brandId?.toLowerCase() === normalized);
    }

    async search(query) {
        const normalized = normalizeLookup(query, "query");
        const brands = await this.getAll();

        return deepFreeze(brands.filter((brand) => {
            const searchableValues = [
                brand.brandId,
                brand.slug,
                brand.displayName,
                brand.legalName,
                ...brand.aliases
            ];

            return searchableValues.some((value) => value.toLowerCase().includes(normalized));
        }));
    }

    async validate() {
        return validateBrandRepository(await this.getAll());
    }

    reload() {
        this.clearCache();
        return this.getAll();
    }

    clearCache() {
        this.manifestPromise = null;
        this.brandPromises.clear();
        this.allBrandsPromise = null;
    }
}

const defaultRepository = new BrandRepository();

export function loadBrand(brandId) {
    return defaultRepository.loadBrand(brandId);
}

export function loadAllBrands() {
    return defaultRepository.getAll();
}

export function listBrandEntries() {
    return defaultRepository.listBrandEntries();
}

export default defaultRepository;
