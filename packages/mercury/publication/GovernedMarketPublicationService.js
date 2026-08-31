import MarketPublicationService from "./MarketPublicationService.js";

export class GovernedMarketPublicationService {
  constructor({ workflowService, marketPublicationService, requireCurrentMarketQualification = false } = {}) {
    if (!workflowService || typeof workflowService.getGovernedPublishedObservations !== "function") throw new TypeError("workflowService is required.");
    if (!marketPublicationService || typeof marketPublicationService.createSnapshot !== "function") throw new TypeError("marketPublicationService is required.");
    this.workflowService = workflowService;
    this.marketPublicationService = marketPublicationService;
    this.requireCurrentMarketQualification = requireCurrentMarketQualification === true;
  }

  async createSnapshot({ products, retailers, generatedAt }) {
    if (this.requireCurrentMarketQualification) {
      const usesOwner = typeof this.workflowService.usesCurrentMarketQualification === "function" && this.workflowService.usesCurrentMarketQualification();
      const qualifiedCandidates = usesOwner && typeof this.workflowService.getGovernedPublishedCandidates === "function"
        ? await this.workflowService.getGovernedPublishedCandidates({ asOf: generatedAt })
        : [];
      return this.marketPublicationService.createSnapshot({ observations: [], qualifiedCandidates, products, retailers, generatedAt });
    }
    const observations = await this.workflowService.getGovernedPublishedObservations({ asOf: generatedAt });
    return this.marketPublicationService.createSnapshot({ observations, products, retailers, generatedAt });
  }
}

export function createGovernedMarketPublicationService({ workflowService, mercury, policy, requireCurrentMarketQualification = false } = {}) {
  return new GovernedMarketPublicationService({ workflowService, marketPublicationService: new MarketPublicationService({ mercury, policy }), requireCurrentMarketQualification });
}
export default GovernedMarketPublicationService;
