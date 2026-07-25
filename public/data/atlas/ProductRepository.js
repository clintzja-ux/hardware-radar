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

    if (!Array.isArray(manifest.products)) {
        throw new TypeError("Atlas manifest must contain a products array.");
    }

    return manifest;
}

function resolveProductUrl(manifestUrl, productPath) {
    if (typeof productPath !== "string" || productPath.length === 0) {
        throw new TypeError("Atlas manifest product entries require a non-empty path.");
    }

    return new URL(productPath, manifestUrl);
}

export class ProductRepository {
    constructor({ manifestUrl = DEFAULT_MANIFEST_URL, readJson = defaultReadJson } = {}) {
        this.manifestUrl = manifestUrl instanceof URL
            ? manifestUrl
            : new URL(manifestUrl, DEFAULT_MANIFEST_URL);
        this.readJson = readJson;
        this.manifestPromise = null;
        this.productPromises = new Map();
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
        const entries = productType
            ? manifest.products.filter((entry) => entry.productType === productType)
            : manifest.products;

        return deepFreeze(entries.map((entry) => ({ ...entry })));
    }

    async loadProduct(atlasProductId) {
        if (typeof atlasProductId !== "string" || atlasProductId.trim().length === 0) {
            throw new TypeError("atlasProductId must be a non-empty string.");
        }

        if (!this.productPromises.has(atlasProductId)) {
            const productPromise = this.getManifest()
                .then((manifest) => {
                    const entry = manifest.products.find(
                        (candidate) => candidate.atlasProductId === atlasProductId
                    );

                    if (!entry) {
                        throw new Error(`Atlas product not found: ${atlasProductId}`);
                    }

                    const productUrl = resolveProductUrl(this.manifestUrl, entry.path);
                    return this.readJson(productUrl);
                })
                .then((product) => {
                    if (product?.identity?.atlasProductId !== atlasProductId) {
                        throw new Error(
                            `Atlas manifest identity mismatch for ${atlasProductId}.`
                        );
                    }

                    return deepFreeze(product);
                })
                .catch((error) => {
                    this.productPromises.delete(atlasProductId);
                    throw error;
                });

            this.productPromises.set(atlasProductId, productPromise);
        }

        return this.productPromises.get(atlasProductId);
    }

    async loadAllProducts({ productType } = {}) {
        const entries = await this.listProductEntries({ productType });
        return Promise.all(entries.map((entry) => this.loadProduct(entry.atlasProductId)));
    }

    clearCache() {
        this.manifestPromise = null;
        this.productPromises.clear();
    }
}

const defaultRepository = new ProductRepository();

export function loadProduct(atlasProductId) {
    return defaultRepository.loadProduct(atlasProductId);
}

export function loadAllProducts(options) {
    return defaultRepository.loadAllProducts(options);
}

export function listProductEntries(options) {
    return defaultRepository.listProductEntries(options);
}

export default defaultRepository;
