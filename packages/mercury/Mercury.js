import defaultObservationRepository, { ObservationRepository } from "./ObservationRepository.js";
import defaultAdapterRegistry from "./adapters/index.js";
import defaultFreshnessEngine from "./FreshnessEngine.js";
import defaultConfidenceEngine from "./ConfidenceEngine.js";
import { deriveConfidenceEvidence } from "./ConfidenceEvidence.js";
import defaultHistoricalIntelligence from "./HistoricalIntelligence.js";

class Mercury {
    constructor({ observations = defaultObservationRepository, adapters = defaultAdapterRegistry, freshness = defaultFreshnessEngine, confidence = defaultConfidenceEngine, history = defaultHistoricalIntelligence } = {}) {
        this.observations = observations;
        this.adapters = adapters;
        this.freshness = freshness;
        this.confidence = confidence;
        this.history = history;
    }

    async getObservation(observationId) {
        return this.observations.getById(observationId);
    }

    async getObservations() {
        return this.observations.getAll();
    }

    async getObservationsByProduct(atlasProductId) {
        return this.observations.getByAtlasProductId(atlasProductId);
    }

    async getObservationsByRetailer(retailerId) {
        return this.observations.getByRetailerId(retailerId);
    }

    async getManifest() {
        return this.observations.getManifest();
    }

    getAdapter(adapterId) {
        return this.adapters.get(adapterId);
    }

    getAdapters() {
        return this.adapters.getAll();
    }

    evaluateFreshness(observation, options) {
        return this.freshness.evaluate(observation, options);
    }

    async evaluateObservationFreshness(observationId, options) {
        const observation = await this.getObservation(observationId);
        if (!observation) return null;
        return this.evaluateFreshness(observation, options);
    }

    evaluateConfidence(observation, { evaluatedAt, freshnessPolicy, confidencePolicy, adapterRegistry = this.adapters } = {}) {
        const freshnessResult = this.evaluateFreshness(observation, { evaluatedAt, policy: freshnessPolicy });
        const evidence = deriveConfidenceEvidence(observation, { freshnessResult, adapterRegistry });
        return this.confidence.evaluate(evidence, { policy: confidencePolicy });
    }

    async evaluateObservationConfidence(observationId, options) {
        const observation = await this.getObservation(observationId);
        if (!observation) return null;
        return this.evaluateConfidence(observation, options);
    }

    async getPriceTimeline(query) { return this.history.getTimeline(await this.getObservations(), query); }
    async getHistoricalPriceRange(query) { return this.history.getPriceRange(await this.getObservations(), query); }
    async getHistoricalAveragePrice(query) { return this.history.getAveragePrice(await this.getObservations(), query); }
    async getPriceMovement(query) { return this.history.getPriceMovement(await this.getObservations(), query); }
    async getHistoricalSummary(query) { return this.history.getSummary(await this.getObservations(), query); }

    async validate() {
        return this.observations.validate();
    }

    clearCaches() {
        this.observations.clearCache();
    }
}

export { Mercury, ObservationRepository };
export default new Mercury();
