import { validateRepository } from "./ProductValidator.js";

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

function normalizeManifest(manifest) {
    if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
        throw new TypeError("Atlas manifest must be a JSON object.");
    }
    if (!Array.isArray(manifest.products)) {
        throw new TypeError("Atlas manifest must contain a products array.");
    }
    return manifest;
}

function normalizeLookup(value, fieldName) {
    if (typeof value !== "string" || value.trim().length === 0) {
        throw new TypeError(`${fieldName} must be a non-empty string.`);
    }
    return value.trim().toLowerCase();
}

function resolveProductUrl(manifestUrl, productPath) {
    if (typeof productPath !== "string" || productPath.trim().length === 0) {
        throw new TypeError("Atlas manifest product entries require a non-empty path.");
    }
    return new URL(productPath, manifestUrl);
}

export class ProductRepository {
    constructor({ manifestUrl = DEFAULT_MANIFEST_URL, readJson = defaultReadJson } = {}) {
        this.manifestUrl = manifestUrl instanceof URL ? manifestUrl : new URL(manifestUrl, DEFAULT_MANIFEST_URL);
        this.readJson = readJson;
        this.manifestPromise = null;
        this.productPromises = new Map();
        this.allProductsPromise = null;
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

    async listProductEntries({ productType } = {}) {
        const manifest = await this.getManifest();
        const normalizedType = productType === undefined ? null : normalizeLookup(productType, "productType");
        const entries = normalizedType
            ? manifest.products.filter((entry) => entry.productType?.toLowerCase() === normalizedType)
            : manifest.products;
        return deepFreeze(entries.map((entry) => ({ ...entry })));
    }

    async loadProduct(atlasProductId) {
        const cacheKey = normalizeLookup(atlasProductId, "atlasProductId");

        if (!this.productPromises.has(cacheKey)) {
            const productPromise = this.getManifest()
                .then((manifest) => {
                    const entry = manifest.products.find(
                        (candidate) => candidate.atlasProductId?.toLowerCase() === cacheKey
                    );
                    if (!entry) throw new Error(`Atlas product not found: ${atlasProductId}`);
                    return this.readJson(resolveProductUrl(this.manifestUrl, entry.path));
                })
                .then((product) => {
                    if (product?.identity?.atlasProductId?.toLowerCase() !== cacheKey) {
                        throw new Error(`Atlas manifest identity mismatch for ${atlasProductId}.`);
                    }
                    return deepFreeze(product);
                })
                .catch((error) => {
                    this.productPromises.delete(cacheKey);
                    throw error;
                });
            this.productPromises.set(cacheKey, productPromise);
        }

        return this.productPromises.get(cacheKey);
    }

    async load() {
        return this.getAll();
    }

    async getAll({ productType } = {}) {
        if (productType !== undefined) {
            const entries = await this.listProductEntries({ productType });
            return deepFreeze(await Promise.all(entries.map((entry) => this.loadProduct(entry.atlasProductId))));
        }

        if (!this.allProductsPromise) {
            this.allProductsPromise = this.listProductEntries()
                .then((entries) => Promise.all(entries.map((entry) => this.loadProduct(entry.atlasProductId))))
                .then(deepFreeze)
                .catch((error) => {
                    this.allProductsPromise = null;
                    throw error;
                });
        }
        return this.allProductsPromise;
    }

    async loadAllProducts(options = {}) {
        return this.getAll(options);
    }

    async getById(atlasProductId) {
        return this.loadProduct(atlasProductId);
    }

    async getBySlug(slug) {
        const normalized = normalizeLookup(slug, "slug");
        return (await this.getAll()).find((product) => product.identity.slug.toLowerCase() === normalized) ?? null;
    }

    async getByManufacturerPartNumber(manufacturerPartNumber) {
        const normalized = normalizeLookup(manufacturerPartNumber, "manufacturerPartNumber");
        return (await this.getAll()).find(
            (product) => product.identity.manufacturerPartNumber.toLowerCase() === normalized
        ) ?? null;
    }

    async exists(atlasProductId) {
        const normalized = normalizeLookup(atlasProductId, "atlasProductId");
        return (await this.getManifest()).products.some(
            (entry) => entry.atlasProductId?.toLowerCase() === normalized
        );
    }

    async search(query) {
        const normalized = normalizeLookup(query, "query");
        const products = await this.getAll();
        return deepFreeze(products.filter((product) => [
            product.identity.atlasProductId,
            product.identity.brand,
            product.identity.manufacturer,
            product.identity.modelName,
            product.identity.manufacturerPartNumber,
            product.identity.displayName,
            product.identity.slug,
            product.identity.productType
        ].some((value) => typeof value === "string" && value.toLowerCase().includes(normalized))));
    }

    async validate() {
        return validateRepository(await this.getAll());
    }

    reload() {
        this.clearCache();
        return this.getAll();
    }

    clearCache() {
        this.manifestPromise = null;
        this.productPromises.clear();
        this.allProductsPromise = null;
    }
}

const defaultRepository = new ProductRepository();

export function loadProduct(atlasProductId) {
    return defaultRepository.loadProduct(atlasProductId);
}

export function loadAllProducts(options) {
    return defaultRepository.getAll(options);
}

export function listProductEntries(options) {
    return defaultRepository.listProductEntries(options);
}

export default defaultRepository;
