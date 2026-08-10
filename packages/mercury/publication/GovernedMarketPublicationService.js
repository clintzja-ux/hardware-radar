import MarketPublicationService from "./MarketPublicationService.js";

export class GovernedMarketPublicationService {
  constructor({ workflowService, marketPublicationService } = {}) {
    if (!workflowService || typeof workflowService.getGovernedPublishedObservations !== "function") throw new TypeError("workflowService is required.");
    if (!marketPublicationService || typeof marketPublicationService.createSnapshot !== "function") throw new TypeError("marketPublicationService is required.");
    this.workflowService = workflowService;
    this.marketPublicationService = marketPublicationService;
  }

  async createSnapshot({ products, retailers, generatedAt }) {
    const observations = await this.workflowService.getGovernedPublishedObservations({ asOf: generatedAt });
    return this.marketPublicationService.createSnapshot({ observations, products, retailers, generatedAt });
  }
}

export function createGovernedMarketPublicationService({ workflowService, mercury, policy } = {}) {
  return new GovernedMarketPublicationService({ workflowService, marketPublicationService: new MarketPublicationService({ mercury, policy }) });
}
export default GovernedMarketPublicationService;
