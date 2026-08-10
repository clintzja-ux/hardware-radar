export class ObservationAcceptanceRepository {
  async allocateObservationId() { throw new Error("allocateObservationId() not implemented."); }
  async findByIdempotencyKey(_key) { throw new Error("findByIdempotencyKey() not implemented."); }
  async accept(_observation, _idempotencyKey) { throw new Error("accept() not implemented."); }
  async getById(_observationId) { throw new Error("getById() not implemented."); }
  async getAuditById(_observationId) { throw new Error("getAuditById() not implemented."); }
  async getAll() { throw new Error("getAll() not implemented."); }
  async getByAtlasProductId(_atlasProductId) { throw new Error("getByAtlasProductId() not implemented."); }
  async getByRetailerId(_retailerId) { throw new Error("getByRetailerId() not implemented."); }
  async purgeExpired() { throw new Error("purgeExpired() not implemented."); }
}
export default ObservationAcceptanceRepository;
