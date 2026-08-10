export class InMemoryObservationAcceptanceStore {
  constructor(initial = []) { this.byId = new Map(initial.map(o => [o.observationId, o])); this.byKey = new Map(); }
  async findByIdempotencyKey(key) { return this.byKey.get(key) ?? null; }
  async accept(observation, idempotencyKey) {
    if (this.byId.has(observation.observationId)) throw new Error(`Observation already exists: ${observation.observationId}`);
    this.byId.set(observation.observationId, observation); this.byKey.set(idempotencyKey, observation); return observation;
  }
  async getById(id) { return this.byId.get(id) ?? null; }
  async getAll() { return Object.freeze([...this.byId.values()]); }
}
export default InMemoryObservationAcceptanceStore;
