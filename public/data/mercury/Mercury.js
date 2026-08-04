import defaultObservationRepository, { ObservationRepository } from "./ObservationRepository.js";

class Mercury {
    constructor({ observations = defaultObservationRepository } = {}) {
        this.observations = observations;
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

    async validate() {
        return this.observations.validate();
    }

    clearCaches() {
        this.observations.clearCache();
    }
}

export { Mercury, ObservationRepository };
export default new Mercury();
