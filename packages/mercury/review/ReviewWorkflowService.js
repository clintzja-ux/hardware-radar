import { createReviewDecision } from "./ObservationReviewDecision.js";

function freeze(value) { return Object.freeze(value); }

export class ReviewWorkflowService {
  constructor({ reviewRepository, reviewService } = {}) {
    if (!reviewRepository) throw new TypeError("reviewRepository is required.");
    if (!reviewService) throw new TypeError("reviewService is required.");
    this.reviewRepository = reviewRepository;
    this.reviewService = reviewService;
  }

  async record({ observationId, decision, reviewedBy, reviewedAt, reasonCodes = [], notes = "" } = {}) {
    const reviewItem = await this.reviewService.getReviewItem(observationId, { asOf: reviewedAt });
    if (!reviewItem.reviewable) {
      throw new Error(`Observation is not reviewable: ${reviewItem.reasons?.join(", ") || reviewItem.status}`);
    }

    const draft = createReviewDecision({ observationId, decision, reviewedBy, reviewedAt, reasonCodes, notes });
    return this.reviewRepository.recordDecision(draft);
  }

  async getState(observationId) {
    const history = await this.reviewRepository.getHistoryForObservation(observationId);
    const effectiveDecision = history.length ? history[history.length - 1] : null;
    return freeze({
      observationId,
      effectiveDecision,
      history
    });
  }
}

export default ReviewWorkflowService;
