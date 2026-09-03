import ObservationAcceptanceRepository from "../persistence/ObservationAcceptanceRepository.js";

function maxSequence(initial) {
  return initial.reduce((m, o) => Math.max(m, Number(String(o.observationId ?? "").match(/^mer_obs_(\d{9})$/)?.[1] ?? 0)), 0);
}

export class InMemoryObservationAcceptanceStore extends ObservationAcceptanceRepository {
  constructor(initial = []) {
    super();
    this.byId = new Map(initial.map(o => [o.observationId, o]));
    this.byKey = new Map();
    this.sequence = maxSequence(initial);
  }
  async allocateObservationId() { this.sequence += 1; return `mer_obs_${String(this.sequence).padStart(9, "0")}`; }
  async findByIdempotencyKey(key) { return this.byKey.get(key) ?? null; }
  async accept(observation, idempotencyKey) {
    const duplicate = this.byKey.get(idempotencyKey);
    if (duplicate) return Object.freeze({ status: "DUPLICATE", observationId: duplicate.observationId });
    if (this.byId.has(observation.observationId)) throw new Error(`Observation already exists: ${observation.observationId}`);
    this.byId.set(observation.observationId, observation);
    this.byKey.set(idempotencyKey, observation);
    return Object.freeze({ status: "ACCEPTED", observationId: observation.observationId });
  }
  async getById(id) { return this.byId.get(id) ?? null; }
  async getAuditById(id) { const o = this.byId.get(id); return o ? Object.freeze({ observationId:o.observationId, atlasProductId:o.atlasProductId, retailerId:o.retailerId }) : null; }
  async getAll() { return Object.freeze([...this.byId.values()]); }
  async getByAtlasProductId(id) { return Object.freeze([...this.byId.values()].filter(o => o.atlasProductId === id)); }
  async getByRetailerId(id) { return Object.freeze([...this.byId.values()].filter(o => o.retailerId === id)); }
  async purgeExpired() { return Object.freeze([]); }
}
export default InMemoryObservationAcceptanceStore;
