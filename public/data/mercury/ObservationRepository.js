import { validateMercuryManifest } from "./ManifestValidator.js";
import { validateObservationRepository } from "./ObservationValidator.js";

const DEFAULT_MANIFEST_URL = new URL("./mercury-manifest.json", import.meta.url);

function deepFreeze(value) {
    if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
    return value;
}

async function defaultReadJson(resource) {
    const response = await fetch(resource);
    if (!response.ok) throw new Error(`Mercury resource request failed (${response.status}): ${resource}`);
    return response.json();
}

function normalizeLookup(value, fieldName) {
    if (typeof value !== "string" || value.trim().length === 0) throw new TypeError(`${fieldName} must be a non-empty string.`);
    return value.trim().toLowerCase();
}

function normalizeManifest(manifest) {
    const report = validateMercuryManifest(manifest);
    if (!report.valid) throw new TypeError(`Invalid Mercury manifest: ${report.errors.map((entry) => entry.code).join(", ")}`);
    return manifest;
}

export class ObservationRepository {
    constructor({
        manifestUrl = DEFAULT_MANIFEST_URL,
        readJson = defaultReadJson,
        atlas = null
    } = {}) {
        this.manifestUrl = manifestUrl instanceof URL ? manifestUrl : new URL(manifestUrl, DEFAULT_MANIFEST_URL);
        this.readJson = readJson;
        this.atlas = atlas;
        this.manifestPromise = null;
        this.observationPromises = new Map();
        this.allObservationsPromise = null;
    }

    async getManifest() {
        if (!this.manifestPromise) {
            this.manifestPromise = Promise.resolve(this.readJson(this.manifestUrl))
                .then(normalizeManifest)
                .then(deepFreeze)
                .catch((error) => { this.manifestPromise = null; throw error; });
        }
        return this.manifestPromise;
    }

    async listObservationEntries() {
        const manifest = await this.getManifest();
        return deepFreeze(manifest.observations.map((entry) => ({ ...entry })));
    }

    async loadObservation(observationId) {
        const cacheKey = normalizeLookup(observationId, "observationId");
        if (!this.observationPromises.has(cacheKey)) {
            const promise = this.getManifest()
                .then((manifest) => {
                    const entry = manifest.observations.find((candidate) => candidate.observationId?.toLowerCase() === cacheKey);
                    if (!entry) throw new Error(`Mercury observation not found: ${observationId}`);
                    return this.readJson(new URL(entry.path, this.manifestUrl));
                })
                .then((observation) => {
                    if (observation?.observationId?.toLowerCase() !== cacheKey) throw new Error(`Mercury manifest identity mismatch for ${observationId}.`);
                    return deepFreeze(observation);
                })
                .catch((error) => { this.observationPromises.delete(cacheKey); throw error; });
            this.observationPromises.set(cacheKey, promise);
        }
        return this.observationPromises.get(cacheKey);
    }

    async load() { return this.getAll(); }

    async getAll() {
        if (!this.allObservationsPromise) {
            this.allObservationsPromise = this.listObservationEntries()
                .then((entries) => Promise.all(entries.map((entry) => this.loadObservation(entry.observationId))))
                .then(deepFreeze)
                .catch((error) => { this.allObservationsPromise = null; throw error; });
        }
        return this.allObservationsPromise;
    }

    async getById(observationId) { return this.loadObservation(observationId); }

    async exists(observationId) {
        const normalized = normalizeLookup(observationId, "observationId");
        return (await this.getManifest()).observations.some((entry) => entry.observationId?.toLowerCase() === normalized);
    }

    async getByAtlasProductId(atlasProductId) {
        const normalized = normalizeLookup(atlasProductId, "atlasProductId");
        return deepFreeze((await this.getAll()).filter((observation) => observation.atlasProductId.toLowerCase() === normalized));
    }

    async getByRetailerId(retailerId) {
        const normalized = normalizeLookup(retailerId, "retailerId");
        return deepFreeze((await this.getAll()).filter((observation) => observation.retailerId.toLowerCase() === normalized));
    }

    async search(query) {
        const normalized = normalizeLookup(query, "query");
        return deepFreeze((await this.getAll()).filter((observation) => [
            observation.observationId,
            observation.atlasProductId,
            observation.retailerId,
            observation.marketplace,
            observation.sourceMethod,
            observation.offer.currency,
            observation.offer.availability,
            observation.offer.sourceUrl
        ].some((value) => String(value).toLowerCase().includes(normalized))));
    }

    async validate() {
        let atlasProductIds = null;
        let retailerIds = null;
        if (this.atlas?.loadRepositories) {
            const repositories = await this.atlas.loadRepositories();
            atlasProductIds = new Set(repositories.products.map((product) => product.identity.atlasProductId.toLowerCase()));
            retailerIds = new Set(repositories.retailers.map((retailer) => retailer.id.toLowerCase()));
        }
        return validateObservationRepository(await this.getAll(), { atlasProductIds, retailerIds });
    }

    reload() { this.clearCache(); return this.getAll(); }

    clearCache() {
        this.manifestPromise = null;
        this.observationPromises.clear();
        this.allObservationsPromise = null;
    }
}

const defaultRepository = new ObservationRepository();
export function loadObservation(observationId) { return defaultRepository.loadObservation(observationId); }
export function loadAllObservations() { return defaultRepository.getAll(); }
export function listObservationEntries() { return defaultRepository.listObservationEntries(); }
export default defaultRepository;
