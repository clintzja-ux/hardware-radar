export class PublicationDecisionRepository {
  async recordDecision(_decision) { throw new Error("recordDecision() not implemented."); }
  async getById(_publicationDecisionId) { throw new Error("getById() not implemented."); }
  async getHistoryForObservation(_observationId) { throw new Error("getHistoryForObservation() not implemented."); }
  async getEffectiveDecision(_observationId) { throw new Error("getEffectiveDecision() not implemented."); }
}
export default PublicationDecisionRepository;
