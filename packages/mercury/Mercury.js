import defaultObservationRepository, { ObservationRepository } from "./ObservationRepository.js";
import defaultAdapterRegistry from "./adapters/index.js";

class Mercury {
    constructor({ observations = defaultObservationRepository, adapters = defaultAdapterRegistry } = {}) {
        this.observations = observations;
        this.adapters = adapters;
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

    async validate() {
        return this.observations.validate();
    }

    clearCaches() {
        this.observations.clearCache();
    }
}

export { Mercury, ObservationRepository };
export default new Mercury();
